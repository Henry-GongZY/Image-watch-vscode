import * as vscode from 'vscode';
import * as path from 'path';
import { getWebviewHtml } from './webviewTemplate';

export interface ImageEntry {
    id: string;
    name: string;
    width: number;
    height: number;
    channels: number;
    isFile: boolean;
    mimeType?: string;
    base64Data: string;
    timestamp: number;
    source: 'file' | 'scan' | 'watch';
    typeInfo?: string;
}

export class ImageWatchPanel {
    public static currentPanel: ImageWatchPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private readonly extensionUri: vscode.Uri;
    private images: Map<string, ImageEntry> = new Map();
    private watchList: string[] = [];
    private idCounter = 0;

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this.panel = panel;
        this.extensionUri = extensionUri;

        this.panel.webview.html = getWebviewHtml();

        this.panel.webview.onDidReceiveMessage(async (msg) => {
            try {
                await this.handleMessage(msg);
            } catch (err) {
                vscode.window.showErrorMessage(`Image Watch: ${err}`);
            }
        });

        this.panel.onDidDispose(() => {
            ImageWatchPanel.currentPanel = undefined;
        });
    }

    private async handleMessage(msg: { type: string; [key: string]: unknown }) {
        switch (msg.type) {
            case 'loadImage':
                await this.loadImageFromFile();
                break;
            case 'addFromDebug':
                await this.addFromDebug();
                break;
            case 'addWatchExpression':
                await this.addToWatchList(msg.expression as string);
                break;
            case 'removeWatchExpression':
                this.removeFromWatchList(msg.expression as string);
                break;
            case 'removeImage':
                this.images.delete(msg.id as string);
                this.postImages();
                break;
            case 'clear':
                this.clearImages();
                break;
            case 'refresh':
                await this.refreshWatchList();
                break;
        }
    }

    public static createOrShow(extensionUri: vscode.Uri) {
        if (ImageWatchPanel.currentPanel) {
            ImageWatchPanel.currentPanel.panel.reveal(vscode.ViewColumn.Two);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'image-watch',
            'Image Watch',
            vscode.ViewColumn.Two,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        ImageWatchPanel.currentPanel = new ImageWatchPanel(panel, extensionUri);
    }

    public hasWatchItems(): boolean { return this.watchList.length > 0; }

    public onDebugStop() {
        for (const [id, entry] of this.images) {
            if (!entry.isFile) { this.images.delete(id); }
        }
        this.postImages();
    }

    public clearImages() {
        this.images.clear();
        this.postImages();
    }

    private postImages() {
        this.panel.webview.postMessage({ type: 'updateImages', images: Array.from(this.images.values()) });
    }

    private postWatchList() {
        this.panel.webview.postMessage({ type: 'updateWatchList', names: this.watchList });
    }

    private postStatus(message: string) {
        this.panel.webview.postMessage({ type: 'status', message });
    }

    public async refreshWatchList() {
        if (this.watchList.length === 0) { return; }
        const session = vscode.debug.activeDebugSession;
        if (!session) { return; }

        this.postStatus('Refreshing...');
        let changed = false;
        for (const expr of this.watchList) {
            const entry = await this.extractImageByExpression(expr, session);
            if (entry) { entry.source = 'watch'; this.images.set(expr, entry); changed = true; }
        }
        if (changed) { this.postImages(); }
        this.postStatus('');
    }

    private async addToWatchList(expression: string) {
        if (!expression) { return; }
        if (!this.watchList.includes(expression)) { this.watchList.push(expression); }
        this.postWatchList();

        const session = vscode.debug.activeDebugSession;
        if (session) {
            this.postStatus(`Fetching ${expression}...`);
            const entry = await this.extractImageByExpression(expression, session);
            if (entry) { entry.source = 'watch'; this.images.set(expression, entry); this.postImages(); }
            this.postStatus('');
        }
    }

    private removeFromWatchList(expression: string) {
        this.watchList = this.watchList.filter(e => e !== expression);
        this.images.delete(expression);
        this.postWatchList();
        this.postImages();
    }

    private async loadImageFromFile() {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            filters: { 'Images': ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'tif', 'webp'] }
        });
        if (!uris || uris.length === 0) { return; }

        for (const uri of uris) {
            try {
                const buffer = await vscode.workspace.fs.readFile(uri);
                const ext = path.extname(uri.fsPath).toLowerCase().slice(1);
                const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
                const base64Data = Buffer.from(buffer).toString('base64');
                const name = path.basename(uri.fsPath);
                const id = `file_${this.idCounter++}`;
                this.images.set(id, { id, name, width: 0, height: 0, channels: 0, isFile: true, mimeType, base64Data, timestamp: Date.now(), source: 'file' });
            } catch (err) {
                vscode.window.showErrorMessage(`Failed to load ${uri.fsPath}: ${err}`);
            }
        }
        this.postImages();
    }

    public async addFromDebug() {
        const session = vscode.debug.activeDebugSession;
        if (!session) { vscode.window.showWarningMessage('No active debug session.'); return; }

        this.postStatus('Scanning variables...');
        try {
            const threadId = await this.getFirstThreadId(session);
            const stackTrace = await session.customRequest('stackTrace', { threadId });
            const frames: { id: number }[] = stackTrace.stackFrames ?? [];

            if (frames.length === 0) {
                vscode.window.showWarningMessage('No stack frames available. Make sure the debugger is paused.');
                this.postStatus('');
                return;
            }

            const frameId = frames[0].id;
            const scopesResp = await session.customRequest('scopes', { frameId });
            let found = 0;

            for (const scope of (scopesResp.scopes ?? [])) {
                if (!scope.variablesReference || scope.expensive) { continue; }
                const varsResp = await session.customRequest('variables', { variablesReference: scope.variablesReference });
                for (const variable of (varsResp.variables ?? [])) {
                    if (this.isImageLikeVariable(variable)) {
                        const entry = await this.tryExtractFromVariable(variable, session, frameId);
                        if (entry) { this.images.set(entry.id, entry); found++; }
                    }
                }
            }

            this.postImages();
            this.postStatus('');
            if (found === 0) {
                vscode.window.showInformationMessage('No image variables found. Try adding a watch expression in the Watch tab.');
            } else {
                vscode.window.showInformationMessage(`Found ${found} image variable(s).`);
            }
        } catch (err) {
            this.postStatus('');
            vscode.window.showErrorMessage(`Failed to scan debug variables: ${err}`);
        }
    }

    private async getFirstThreadId(session: vscode.DebugSession): Promise<number> {
        try {
            const threads = await session.customRequest('threads');
            return (threads.threads?.[0]?.id) ?? 1;
        } catch { return 1; }
    }

    private isImageLikeVariable(variable: { name: string; type?: string }): boolean {
        const n = variable.name.toLowerCase();
        const t = (variable.type ?? '').toLowerCase();
        return (
            n === 'img' || n === 'image' || n === 'mat' || n === 'frame' || n === 'mask' ||
            n === 'gray' || n === 'rgb' || n === 'bgr' || n === 'depth' ||
            n.startsWith('img_') || n.startsWith('image_') || n.startsWith('frame_') ||
            n.endsWith('_img') || n.endsWith('_image') || n.endsWith('_mat') || n.endsWith('_frame') ||
            t.includes('cv::mat') || t.includes('mat') ||
            t.includes('ndarray') || t.includes('pil.image') || t.includes('image')
        );
    }

    private async extractImageByExpression(expression: string, session: vscode.DebugSession): Promise<ImageEntry | null> {
        const numpyEntry = await this.tryExtractNumpyImage(expression, session);
        if (numpyEntry) { return numpyEntry; }

        try {
            const threadId = await this.getFirstThreadId(session);
            const stackTrace = await session.customRequest('stackTrace', { threadId });
            const frames: { id: number }[] = stackTrace.stackFrames ?? [];
            if (frames.length === 0) { return null; }

            const frameId = frames[0].id;
            const evalResult = await session.customRequest('evaluate', { expression, frameId, context: 'hover' });
            if (evalResult.variablesReference > 0) {
                return await this.tryExtractFromVariable(
                    { name: expression, type: evalResult.type, variablesReference: evalResult.variablesReference, value: evalResult.result },
                    session, frameId
                );
            }
        } catch (e) { console.error('extractImageByExpression failed:', e); }
        return null;
    }

    private async tryExtractNumpyImage(name: string, session: vscode.DebugSession): Promise<ImageEntry | null> {
        try {
            const shapeRes = await session.customRequest('evaluate', { expression: `str(${name}.shape)`, context: 'repl' });
            const shapeStr = (shapeRes.result ?? '').replace(/^'|'$/g, '').trim();
            const m = shapeStr.match(/^\((\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
            if (!m) { return null; }

            const height = parseInt(m[1]), width = parseInt(m[2]), channels = m[3] ? parseInt(m[3]) : 1;
            if (height <= 0 || width <= 0 || height > 8192 || width > 8192) { return null; }
            if (channels < 1 || channels > 4) { return null; }

            const dataRes = await session.customRequest('evaluate', {
                expression: `__import__('base64').b64encode(${name}.astype('uint8').tobytes()).decode()`,
                context: 'repl'
            });
            const base64Data = (dataRes.result ?? '').replace(/^'|'$/g, '').trim();
            if (!base64Data || base64Data.length < 4) { return null; }

            const expectedBytes = width * height * channels;
            if (Math.abs(Math.floor(base64Data.length * 3 / 4) - expectedBytes) > 4) { return null; }

            const id = `np_${name}_${this.idCounter++}`;
            return { id, name, width, height, channels, isFile: false, base64Data, timestamp: Date.now(), source: 'scan' as const };
        } catch { return null; }
    }

    private async tryExtractFromVariable(
        variable: { name: string; type?: string; variablesReference: number; value?: string },
        session: vscode.DebugSession,
        _frameId: number
    ): Promise<ImageEntry | null> {
        if (!variable.variablesReference) { return null; }

        try {
            const varsResp = await session.customRequest('variables', { variablesReference: variable.variablesReference });
            const children: { name: string; value: string; variablesReference: number }[] = varsResp.variables ?? [];

            let width = 0, height = 0, channels = 1, dataRef = 0;
            for (const child of children) {
                const cn = child.name.toLowerCase();
                if (cn === 'rows') { height = parseInt(child.value) || 0; }
                else if (cn === 'cols') { width = parseInt(child.value) || 0; }
                else if (cn === 'channels' || cn === 'channels()') { channels = parseInt(child.value) || 1; }
                else if ((cn === 'data' || cn === 'data.ptr') && child.variablesReference > 0) { dataRef = child.variablesReference; }
            }

            if (width <= 0 || height <= 0 || width > 8192 || height > 8192) { return null; }

            const pixelCount = width * height * channels;
            if (dataRef > 0 && pixelCount <= 4_000_000) {
                const pixVarsResp = await session.customRequest('variables', { variablesReference: dataRef, count: pixelCount });
                const pixVars: { value: string }[] = pixVarsResp.variables ?? [];
                if (pixVars.length > 0) {
                    const raw = new Uint8Array(pixVars.length);
                    for (let i = 0; i < pixVars.length; i++) {
                        const val = pixVars[i].value ?? '0';
                        const n = val.startsWith('0x') ? parseInt(val, 16) : parseInt(val);
                        raw[i] = Math.max(0, Math.min(255, isNaN(n) ? 0 : n));
                    }
                    const base64Data = Buffer.from(raw).toString('base64');
                    const id = `var_${variable.name}_${this.idCounter++}`;
                    return { id, name: variable.name, width, height, channels, isFile: false, base64Data, timestamp: Date.now(), source: 'scan' as const, typeInfo: variable.type };
                }
            }
            return await this.tryExtractNumpyImage(variable.name, session);
        } catch (e) {
            console.error('tryExtractFromVariable failed:', e);
            return null;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private getHtmlForWebview(): string { return getWebviewHtml(); }
}

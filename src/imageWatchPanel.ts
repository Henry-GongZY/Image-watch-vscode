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

    /** Log and send a DAP customRequest; logs all debugger interactions for tracing (int)img.cols etc. */
    private async dapRequest<T = unknown>(session: vscode.DebugSession, command: string, args: Record<string, unknown>, logLabel: string): Promise<T> {
        const safeArgs = command === 'evaluate' && typeof args.expression === 'string'
            ? { ...args, expression: args.expression }
            : args;
        console.log(`[Image Watch] DAP REQUEST ${logLabel} | command=${command}`, JSON.stringify(safeArgs, null, 0).slice(0, 500));
        try {
            const out = await session.customRequest(command, args as Record<string, unknown>) as T;
            const outStr = typeof out === 'object' && out !== null && 'result' in out
                ? `result=${String((out as { result?: unknown }).result).slice(0, 200)}`
                : 'ok';
            console.log(`[Image Watch] DAP RESPONSE ${logLabel} | ${outStr}`);
            return out;
        } catch (err) {
            console.log(`[Image Watch] DAP ERROR ${logLabel}`, err);
            throw err;
        }
    }

    public async refreshWatchList() {
        if (this.watchList.length === 0) { return; }
        const session = vscode.debug.activeDebugSession;
        if (!session) { return; }
        console.log('[Image Watch] refreshWatchList ENTRY | session.type=', session.type, 'expressions=', this.watchList);

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
            console.log('[Image Watch] addToWatchList ENTRY | expression=', expression, 'session.type=', session.type);
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
        if (!session) { vscode.window.showWarningMessage( 'No active debug session.'); return; }
        console.log('[Image Watch] addFromDebug ENTRY | session.type=', session.type, 'session.id=', session.id);

        this.postStatus('Scanning variables...');
        try {
            if (this.isPythonSession(session)) {
                console.log('[Image Watch] addFromDebug BRANCH: Python path (no variables request)');
                await this.addFromDebugPython(session);
            } else {
                console.log('[Image Watch] addFromDebug BRANCH: Generic path (stackTrace -> scopes -> variables)');
                await this.addFromDebugGeneric(session);
            }
        } catch (err) {
            this.postStatus('');
            vscode.window.showErrorMessage(`Failed to scan debug variables: ${err}`);
        }
    }

    private async addFromDebugPython(session: vscode.DebugSession) {
        const frame = await this.getActiveFrame(session);
        if (!frame) {
            this.postStatus('');
            vscode.window.showWarningMessage('No stack frame available. Pause the debugger before scanning.');
            return;
        }

        const scopesResp = await this.dapRequest<{ scopes?: { variablesReference: number; expensive?: boolean }[] }>(
            session,
            'scopes',
            { frameId: frame.frameId },
            'addFromDebugPython.scopes'
        );
        const candidates = new Map<string, { name: string; type?: string }>();

        for (const scope of (scopesResp.scopes ?? [])) {
            if (!scope.variablesReference || scope.expensive) { continue; }
            const varsResp = await this.dapRequest<{ variables?: { name: string; type?: string }[] }>(
                session,
                'variables',
                { variablesReference: scope.variablesReference },
                'addFromDebugPython.variables(scope)'
            );
            for (const variable of (varsResp.variables ?? [])) {
                if (this.isImageLikeVariable(variable)) {
                    candidates.set(variable.name, variable);
                }
            }
        }

        let found = 0;
        for (const { name } of candidates.values()) {
            const entry = await this.tryExtractNumpyImage(name, session, frame.frameId);
            if (entry) { this.images.set(entry.id, entry); found++; }
        }

        this.postImages();
        this.postStatus('');
        if (found === 0) {
            vscode.window.showInformationMessage('No image variables found. Try adding a watch expression in the Watch tab.');
        } else {
            vscode.window.showInformationMessage(`Found ${found} image variable(s).`);
        }
    }

    /** C++ and other languages: use DAP variables request to discover image variables. */
    private async addFromDebugGeneric(session: vscode.DebugSession) {
        const frame = await this.getActiveFrame(session);
        if (!frame) {
            vscode.window.showWarningMessage('No stack frames available. Make sure the debugger is paused.');
            this.postStatus('');
            return;
        }

        const scopesResp = await this.dapRequest<{ scopes?: { variablesReference: number; expensive?: boolean }[] }>(session, 'scopes', { frameId: frame.frameId }, 'addFromDebugGeneric.scopes');
        let found = 0;

        for (const scope of (scopesResp.scopes ?? [])) {
            if (!scope.variablesReference || scope.expensive) { continue; }
            const varsResp = await this.dapRequest<{ variables?: { name: string; type?: string; value?: string; variablesReference: number }[] }>(session, 'variables', { variablesReference: scope.variablesReference }, 'addFromDebugGeneric.variables(scope)');
            for (const variable of (varsResp.variables ?? [])) {
                if (this.isImageLikeVariable(variable)) {
                    const entry = await this.tryExtractFromVariable(variable, session, frame.frameId);
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
    }

    private async getFirstThreadId(session: vscode.DebugSession): Promise<number> {
        try {
            const threads = await this.dapRequest<{ threads?: { id: number }[] }>(session, 'threads', {}, 'getFirstThreadId');
            return (threads.threads?.[0]?.id) ?? 1;
        } catch { return 1; }
    }

    private async getActiveFrame(session: vscode.DebugSession): Promise<{ threadId: number; frameId: number } | null> {
        const activeItem = vscode.debug.activeStackItem;
        let threadId: number;

        if (activeItem?.session.id === session.id) {
            threadId = activeItem.threadId;
            if ('frameId' in activeItem) {
                return { threadId, frameId: activeItem.frameId };
            }
        } else {
            threadId = await this.getFirstThreadId(session);
        }

        try {
            const stackTrace = await this.dapRequest<{ stackFrames?: { id: number }[] }>(
                session,
                'stackTrace',
                { threadId, startFrame: 0, levels: 1 },
                'getActiveFrame.stackTrace'
            );
            const frameId = stackTrace.stackFrames?.[0]?.id;
            return frameId === undefined ? null : { threadId, frameId };
        } catch {
            return null;
        }
    }

    private isPythonSession(session: vscode.DebugSession): boolean {
        const t = (session.type ?? '').toLowerCase();
        return t === 'python' || t === 'debugpy' || t.includes('python');
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
        console.log('[Image Watch] extractImageByExpression ENTRY | expression=', expression);
        const frame = await this.getActiveFrame(session);
        if (!frame) { return null; }

        const numpyEntry = await this.tryExtractNumpyImage(expression, session, frame.frameId);
        if (numpyEntry) { return numpyEntry; }

        if (this.isPythonSession(session)) {
            return await this.tryExtractOpenCVMatByEvaluate(expression, session, frame.frameId);
        }

        try {
            const evalResult = await this.dapRequest<{ variablesReference: number; type?: string; result?: string }>(session, 'evaluate', { expression, frameId: frame.frameId, context: 'watch' }, 'extractImageByExpression.evaluate(watch)');
            if (evalResult.variablesReference > 0) {
                return await this.tryExtractFromVariable(
                    { name: expression, type: evalResult.type, variablesReference: evalResult.variablesReference, value: evalResult.result },
                    session, frame.frameId
                );
            }
        } catch (e) { console.error('extractImageByExpression failed:', e); }
        return null;
    }

    private async tryExtractNumpyImage(name: string, session: vscode.DebugSession, frameId: number): Promise<ImageEntry | null> {
        try {
            const shapeExpr = `str(${name}.shape)`;
            const shapeRes = await this.dapRequest<{ result?: string }>(session, 'evaluate', { expression: shapeExpr, frameId, context: 'watch' }, `tryExtractNumpyImage.shape(${name})`);
            const shapeStr = (shapeRes.result ?? '').replace(/^'|'$/g, '').trim();
            const m = shapeStr.match(/^\((\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
            if (!m) { return null; }

            const height = parseInt(m[1]), width = parseInt(m[2]), channels = m[3] ? parseInt(m[3]) : 1;
            if (height <= 0 || width <= 0 || height > 8192 || width > 8192) { return null; }
            if (channels < 1 || channels > 4) { return null; }

            const dataExpr = `__import__('base64').b64encode(${name}.astype('uint8').tobytes()).decode()`;
            // debugpy truncates long watch/hover results. Clipboard context preserves the full Base64 payload.
            const dataRes = await this.dapRequest<{ result?: string }>(session, 'evaluate', { expression: dataExpr, frameId, context: 'clipboard' }, `tryExtractNumpyImage.data(${name})`);
            const base64Data = (dataRes.result ?? '').replace(/^'|'$/g, '').trim();
            if (!base64Data || base64Data.length < 4) { return null; }

            const expectedBytes = width * height * channels;
            if (Math.abs(Math.floor(base64Data.length * 3 / 4) - expectedBytes) > 4) { return null; }

            const id = `np_${name}_${this.idCounter++}`;
            return { id, name, width, height, channels, isFile: false, base64Data, timestamp: Date.now(), source: 'scan' as const };
        } catch { return null; }
    }

    private async tryExtractOpenCVMatByEvaluate(name: string, session: vscode.DebugSession, frameId: number): Promise<ImageEntry | null> {
        const isPython = this.isPythonSession(session);

        const hExpr = isPython ? `${name}.shape[0]` : `${name}.rows`;
        const wExpr = isPython ? `${name}.shape[1]` : `${name}.cols`;
        const cExpr = isPython ? `(${name}.shape[2] if len(${name}.shape) > 2 else 1)` : `${name}.channels()`;

        try {
            const rowsRes = await this.dapRequest<{ result?: unknown }>(session, 'evaluate', { expression: hExpr, frameId, context: 'watch' }, `tryExtractOpenCV.rows(${name})`);
            const colsRes = await this.dapRequest<{ result?: unknown }>(session, 'evaluate', { expression: wExpr, frameId, context: 'watch' }, `tryExtractOpenCV.cols(${name})`);
            const chRes = await this.dapRequest<{ result?: unknown }>(session, 'evaluate', { expression: cExpr, frameId, context: 'watch' }, `tryExtractOpenCV.ch(${name})`);
            const height = parseInt(String(rowsRes.result ?? '0'), 10);
            const width = parseInt(String(colsRes.result ?? '0'), 10);
            const channels = parseInt(String(chRes.result ?? '1'), 10);
            if (height <= 0 || width <= 0 || height > 8192 || width > 8192 || channels < 1 || channels > 4) { return null; }

            const dataExpr = `__import__('base64').b64encode(__import__('numpy').asarray(${name}).astype('uint8').tobytes()).decode()`;
            const dataRes = await this.dapRequest<{ result?: string }>(session, 'evaluate', { expression: dataExpr, frameId, context: 'clipboard' }, `tryExtractOpenCV.data(${name})`);
            const base64Data = (String(dataRes.result ?? '')).replace(/^'|'$/g, '').trim();
            if (!base64Data || base64Data.length < 4) { return null; }

            const expectedBytes = width * height * channels;
            if (Math.abs(Math.floor(base64Data.length * 3 / 4) - expectedBytes) > 4) { return null; }

            const id = `cv_${name}_${this.idCounter++}`;
            return { id, name, width, height, channels, isFile: false, base64Data, timestamp: Date.now(), source: 'scan' as const };
        } catch { return null; }
    }

    private async tryExtractFromVariable(
        variable: { name: string; type?: string; variablesReference: number; value?: string },
        session: vscode.DebugSession,
        frameId: number
    ): Promise<ImageEntry | null> {
        const isPython = this.isPythonSession(session);
        const numpyEntry = await this.tryExtractNumpyImage(variable.name, session, frameId);
        if (numpyEntry) { return numpyEntry; }
        if (isPython) {
            const openCvEntry = await this.tryExtractOpenCVMatByEvaluate(variable.name, session, frameId);
            if (openCvEntry) { return openCvEntry; }
            return null;
        }

        if (!variable.variablesReference) { return null; }

        try {
            const varsResp = await this.dapRequest<{ variables?: { name: string; value: string; variablesReference: number }[] }>(session, 'variables', { variablesReference: variable.variablesReference }, `tryExtractFromVariable.variables(${variable.name})`);
            const children: { name: string; value: string; variablesReference: number }[] = varsResp.variables ?? [];

            let width = 0, height = 0, channels = 1, dataRef = 0;
            for (const child of children) {
                const cn = child.name.toLowerCase();
                // Parse numeric values only; skip if value is an expression (e.g. debugger sends (int)img.cols; we use int() form in our evaluate calls)
                const val = (child.value ?? '').trim();
                const num = /^\d+$/.test(val) ? parseInt(val, 10) : NaN;
                if (cn === 'rows' && !isNaN(num)) { height = num; }
                else if (cn === 'cols' && !isNaN(num)) { width = num; }
                else if ((cn === 'channels' || cn === 'channels()') && !isNaN(num)) { channels = num; }
                else if ((cn === 'data' || cn === 'data.ptr') && child.variablesReference > 0) { dataRef = child.variablesReference; }
            }

            if (width <= 0 || height <= 0 || width > 8192 || height > 8192) { return null; }

            const pixelCount = width * height * channels;
            if (dataRef > 0 && pixelCount <= 4_000_000) {
                const pixVarsResp = await this.dapRequest<{ variables?: { value: string }[] }>(session, 'variables', { variablesReference: dataRef, count: pixelCount }, `tryExtractFromVariable.pixels(${variable.name})`);
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
            return null;
        } catch (e) {
            console.error('tryExtractFromVariable failed:', e);
            return null;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private getHtmlForWebview(): string { return getWebviewHtml(); }
}

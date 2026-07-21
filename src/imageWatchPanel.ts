import * as path from 'path';
import * as vscode from 'vscode';
import { ImageVisualization } from './core/visualization';
import { VisualizationStore } from './core/visualizationStore';
import { NoActiveFrameError, UnsupportedDebugSessionError, VisualizationService } from './services/visualizationService';
import { getWebviewHtml } from './webviewTemplate';

interface WebviewMessage {
    type: string;
    expression?: unknown;
    id?: unknown;
    orderedIds?: unknown;
}

export class ImageWatchPanel {
    public static currentPanel: ImageWatchPanel | undefined;

    private readonly store = new VisualizationStore();
    private readonly visualizationService = new VisualizationService();
    private fileIdCounter = 0;

    private constructor(private readonly panel: vscode.WebviewPanel) {
        this.panel.webview.html = getWebviewHtml();
        this.panel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
            try {
                await this.handleMessage(message);
            } catch (error) {
                vscode.window.showErrorMessage(`Image Watch: ${String(error)}`);
            }
        });
        this.panel.onDidDispose(() => { ImageWatchPanel.currentPanel = undefined; });
    }

    public static createOrShow(): void {
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
        ImageWatchPanel.currentPanel = new ImageWatchPanel(panel);
    }

    public hasWatchItems(): boolean {
        return this.store.hasWatchExpressions();
    }

    public onDebugStop(): void {
        this.store.clearDebugItems();
        this.postItems();
    }

    public clearImages(): void {
        this.store.clearItems();
        this.postItems();
    }

    public async addFromDebug(): Promise<void> {
        const session = vscode.debug.activeDebugSession;
        if (!session) {
            vscode.window.showWarningMessage('No active debug session.');
            return;
        }

        this.postStatus('Scanning variables...');
        try {
            const items = await this.visualizationService.scan(session);
            for (const item of items) { this.store.upsert(item, `scan:${item.name}`); }
            this.postItems();
            vscode.window.showInformationMessage(
                items.length === 0
                    ? 'No supported visualizations found. Try adding a watch expression.'
                    : `Found ${items.length} visualization(s).`
            );
        } catch (error) {
            this.showDebugError(error);
        } finally {
            this.postStatus('');
        }
    }

    public async refreshWatchList(): Promise<void> {
        const expressions = this.store.getWatchExpressions();
        if (expressions.length === 0) { return; }
        const session = vscode.debug.activeDebugSession;
        if (!session) { return; }

        this.postStatus('Refreshing...');
        try {
            let changed = false;
            for (const expression of expressions) {
                const item = await this.visualizationService.extractExpression(expression, session);
                if (!item) { continue; }
                this.store.upsert(item, `watch:${expression}`);
                changed = true;
            }
            if (changed) { this.postItems(); }
        } catch (error) {
            this.showDebugError(error);
        } finally {
            this.postStatus('');
        }
    }

    private async handleMessage(message: WebviewMessage): Promise<void> {
        switch (message.type) {
            case 'loadImage':
                await this.loadImageFromFile();
                break;
            case 'addFromDebug':
                await this.addFromDebug();
                break;
            case 'addWatchExpression':
                if (typeof message.expression === 'string') {
                    await this.addToWatchList(message.expression);
                }
                break;
            case 'removeImage':
                if (typeof message.id === 'string') {
                    this.store.removeById(message.id);
                    this.postItems();
                }
                break;
            case 'reorderVisualizations':
                if (Array.isArray(message.orderedIds) && message.orderedIds.every(id => typeof id === 'string')) {
                    this.store.reorder(message.orderedIds);
                    this.postItems();
                }
                break;
            case 'clear':
                this.clearImages();
                break;
            case 'refresh':
                await this.refreshWatchList();
                break;
        }
    }

    private async addToWatchList(expression: string): Promise<void> {
        const normalized = expression.trim();
        if (!normalized) { return; }
        this.store.addWatchExpression(normalized);

        const session = vscode.debug.activeDebugSession;
        if (!session) { return; }
        this.postStatus(`Fetching ${normalized}...`);
        try {
            const item = await this.visualizationService.extractExpression(normalized, session);
            if (item) {
                this.store.upsert(item, `watch:${normalized}`);
                this.postItems();
            }
        } catch (error) {
            this.showDebugError(error);
        } finally {
            this.postStatus('');
        }
    }

    private async loadImageFromFile(): Promise<void> {
        const uris = await vscode.window.showOpenDialog({
            canSelectMany: true,
            filters: { Images: ['png', 'jpg', 'jpeg', 'bmp', 'gif', 'tiff', 'tif', 'webp'] }
        });
        if (!uris?.length) { return; }

        for (const uri of uris) {
            try {
                const buffer = await vscode.workspace.fs.readFile(uri);
                const extension = path.extname(uri.fsPath).toLowerCase().slice(1);
                const mimeType = extension === 'jpg' ? 'image/jpeg' : `image/${extension}`;
                const name = path.basename(uri.fsPath);
                const item: ImageVisualization = {
                    id: `file_${this.fileIdCounter++}`,
                    kind: 'image',
                    name,
                    width: 0,
                    height: 0,
                    channels: 0,
                    dtype: 'uint8',
                    channelOrder: 'unknown',
                    encoding: 'base64',
                    base64Data: Buffer.from(buffer).toString('base64'),
                    isFile: true,
                    mimeType,
                    source: 'file',
                    origin: { providerId: 'file', extractorId: 'encoded-image' }
                };
                this.store.addFile(item);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to load ${uri.fsPath}: ${String(error)}`);
            }
        }
        this.postItems();
    }

    private postItems(): void {
        this.panel.webview.postMessage({ type: 'updateImages', images: this.store.list() });
    }

    private postStatus(message: string): void {
        this.panel.webview.postMessage({ type: 'status', message });
    }

    private showDebugError(error: unknown): void {
        if (error instanceof NoActiveFrameError) {
            vscode.window.showWarningMessage(error.message);
        } else if (error instanceof UnsupportedDebugSessionError) {
            vscode.window.showInformationMessage(error.message);
        } else {
            vscode.window.showErrorMessage(`Image Watch: ${String(error)}`);
        }
    }
}

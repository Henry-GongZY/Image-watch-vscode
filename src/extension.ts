import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const openPanelCommand = vscode.commands.registerCommand('image-watch-vscode.openPanel', () => {
        ImageWatchPanel.createOrShow(context.extensionUri);
    });

    const clearImagesCommand = vscode.commands.registerCommand('image-watch-vscode.clearImages', () => {
        ImageWatchPanel.currentPanel?.clearImages();
    });

    const addToWatchCommand = vscode.commands.registerCommand('image-watch-vscode.addToWatch', async () => {
        ImageWatchPanel.createOrShow(context.extensionUri);
        await ImageWatchPanel.currentPanel?.addFromDebug();
    });

    const refreshCommand = vscode.commands.registerCommand('image-watch-vscode.refresh', async () => {
        await ImageWatchPanel.currentPanel?.refreshWatchList();
    });

    context.subscriptions.push(openPanelCommand, clearImagesCommand, addToWatchCommand, refreshCommand);

    context.subscriptions.push(
        vscode.debug.registerDebugAdapterTrackerFactory('*', new ImageWatchDebugAdapterTrackerFactory())
    );

    context.subscriptions.push(
        vscode.debug.onDidChangeActiveStackItem(async () => {
            if (ImageWatchPanel.currentPanel?.hasWatchItems() && vscode.debug.activeDebugSession) {
                await ImageWatchPanel.currentPanel.refreshWatchList();
            }
        })
    );
}

export function deactivate() { }

// ---------------------------------------------------------------------------
// Debug adapter tracker
// ---------------------------------------------------------------------------

class ImageWatchDebugAdapterTrackerFactory implements vscode.DebugAdapterTrackerFactory {
    createDebugAdapterTracker(_session: vscode.DebugSession): vscode.DebugAdapterTracker {
        return {
            onWillStopSession() {
                ImageWatchPanel.currentPanel?.onDebugStop();
            }
        };
    }
}

// ---------------------------------------------------------------------------
// Data model
// ---------------------------------------------------------------------------

interface ImageEntry {
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

// ---------------------------------------------------------------------------
// Main panel class
// ---------------------------------------------------------------------------

class ImageWatchPanel {
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

        this.postStatus('Refreshing…');
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
            this.postStatus(`Fetching ${expression}…`);
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

        this.postStatus('Scanning variables…');
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

// ---------------------------------------------------------------------------
// WebView HTML / CSS / JS  — two-pane layout (list sidebar + large preview)
// ---------------------------------------------------------------------------

function getWebviewHtml(): string {
    return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:;">
<title>Image Watch</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:var(--vscode-font-family,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif);
  font-size:var(--vscode-font-size,13px);
  background:var(--vscode-editor-background,#1e1e1e);
  color:var(--vscode-editor-foreground,#d4d4d4);
  height:100vh;display:flex;flex-direction:column;overflow:hidden;
}

/* ── Toolbar ──────────────────────────────────────────── */
.topbar{
  display:flex;align-items:center;gap:4px;padding:4px 8px;flex-shrink:0;
  background:var(--vscode-titleBar-activeBackground,#2d2d2d);
  border-bottom:1px solid var(--vscode-panel-border,#3c3c3c);
}
.btn{
  display:inline-flex;align-items:center;gap:3px;
  background:var(--vscode-button-background,#0e639c);
  color:var(--vscode-button-foreground,#fff);
  border:none;padding:3px 8px;cursor:pointer;border-radius:2px;font-size:12px;
}
.btn:hover{background:var(--vscode-button-hoverBackground,#1177bb)}
.btn.sec{background:var(--vscode-button-secondaryBackground,#3c3c3c);color:var(--vscode-button-secondaryForeground,#ccc);}
.btn.sec:hover{background:var(--vscode-button-secondaryHoverBackground,#4c4c4c)}
.spacer{flex:1}
.status-txt{font-size:11px;color:var(--vscode-descriptionForeground,#858585);font-style:italic}

/* ── Two-pane split ───────────────────────────────────── */
.split{flex:1;display:flex;overflow:hidden}

/* ── Left sidebar ─────────────────────────────────────── */
.sidebar{
  width:260px;min-width:150px;max-width:500px;
  display:flex;flex-direction:column;flex-shrink:0;
  border-right:1px solid var(--vscode-panel-border,#3c3c3c);
  background:var(--vscode-sideBar-background,#252526);
  position:relative;overflow:hidden;
}
.resize-handle{
  position:absolute;right:-3px;top:0;bottom:0;width:6px;
  cursor:col-resize;z-index:10;
}
.resize-handle:hover,.resize-handle.active{background:var(--vscode-focusBorder,#007fd4);opacity:.5}

/* Tabs */
.tab-bar{
  display:flex;flex-shrink:0;
  background:var(--vscode-tab-inactiveBackground,#2d2d2d);
  border-bottom:1px solid var(--vscode-panel-border,#3c3c3c);
}
.tab{
  flex:1;padding:6px 4px;font-size:12px;font-weight:500;
  border:none;background:none;cursor:pointer;user-select:none;
  color:var(--vscode-tab-inactiveForeground,#999);
  border-bottom:2px solid transparent;
}
.tab:hover{color:var(--vscode-tab-activeForeground,#d4d4d4)}
.tab.active{
  color:var(--vscode-tab-activeForeground,#d4d4d4);
  border-bottom-color:var(--vscode-focusBorder,#007fd4);
  background:var(--vscode-tab-activeBackground,#1e1e1e);
}

/* Watch input row (Watch tab) */
.watch-input-area{
  padding:6px 8px;flex-shrink:0;
  border-bottom:1px solid var(--vscode-panel-border,#3c3c3c);
}
.watch-row{display:flex;gap:4px}
.watch-inp{
  flex:1;padding:3px 6px;font-size:12px;border-radius:2px;outline:none;
  background:var(--vscode-input-background,#3c3c3c);
  color:var(--vscode-input-foreground,#d4d4d4);
  border:1px solid var(--vscode-input-border,#555);
}
.watch-inp:focus{border-color:var(--vscode-focusBorder,#007fd4)}
.watch-add{
  padding:3px 8px;border:none;border-radius:2px;cursor:pointer;font-size:12px;
  background:var(--vscode-button-background,#0e639c);color:var(--vscode-button-foreground,#fff);
}
.watch-add:hover{background:var(--vscode-button-hoverBackground,#1177bb)}

/* Image list */
.img-list{flex:1;overflow-y:auto;overflow-x:hidden}
.list-empty{padding:32px 12px;text-align:center;font-size:12px;line-height:1.7;color:var(--vscode-descriptionForeground,#858585)}

/* List row */
.list-item{
  display:flex;align-items:center;gap:8px;padding:6px 8px 6px 10px;
  cursor:pointer;border-bottom:1px solid var(--vscode-list-inactiveSelectionBackground,#2a2d2e);
  user-select:none;position:relative;
}
.list-item:hover{background:var(--vscode-list-hoverBackground,#2a2d2e)}
.list-item.selected{
  background:var(--vscode-list-activeSelectionBackground,#094771);
  color:var(--vscode-list-activeSelectionForeground,#fff);
}
.list-item.selected .item-meta{color:rgba(255,255,255,.65)}

/* Thumbnail */
.thumb-wrap{
  flex-shrink:0;width:64px;height:48px;
  background:repeating-conic-gradient(#333 0% 25%,#2a2a2a 0% 50%) 0 0/8px 8px;
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.thumb-cv{display:block;image-rendering:pixelated}

/* Text info */
.item-info{flex:1;min-width:0}
.item-name{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.item-meta{font-size:11px;color:var(--vscode-descriptionForeground,#858585);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Delete button */
.item-del{
  display:none;flex-shrink:0;border:none;background:none;cursor:pointer;
  color:var(--vscode-icon-foreground,#ccc);font-size:16px;padding:2px 4px;
  opacity:.6;border-radius:2px;line-height:1;
}
.item-del:hover{opacity:1;background:rgba(255,255,255,.1)}
.list-item:hover .item-del{display:block}

/* ── Right preview pane ───────────────────────────────── */
.preview-pane{
  flex:1;position:relative;overflow:hidden;cursor:crosshair;
  background:repeating-conic-gradient(#282828 0% 25%,#1e1e1e 0% 50%) 0 0/18px 18px;
}
.preview-empty{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:100%;gap:10px;pointer-events:none;
  color:var(--vscode-descriptionForeground,#858585);font-size:13px;
}
.preview-empty-icon{font-size:42px}

/* Canvas transform wrapper */
.canvas-wrap{position:absolute;top:0;left:0;transform-origin:0 0;will-change:transform}
canvas.preview-cv{display:block;image-rendering:pixelated;image-rendering:-moz-crisp-edges}

/* Zoom label */
.zoom-lbl{
  position:absolute;top:8px;right:10px;
  background:rgba(0,0,0,.65);color:#fff;
  font-size:11px;font-family:monospace;padding:2px 8px;border-radius:3px;
  pointer-events:none;
}

/* Bottom pixel info bar */
.pixel-bar{
  position:absolute;bottom:0;left:0;right:0;
  background:rgba(0,0,0,.7);color:#d4d4d4;
  font-size:11px;font-family:monospace;padding:3px 10px;
  pointer-events:none;min-height:22px;
}

/* Floating tooltip */
#tooltip{
  position:fixed;background:rgba(0,0,0,.88);color:#fff;
  padding:3px 8px;border-radius:3px;font-size:11px;font-family:monospace;
  pointer-events:none;z-index:9999;white-space:nowrap;display:none;
  border:1px solid rgba(255,255,255,.18);
}
</style>
</head>
<body>

<!-- Toolbar -->
<div class="topbar">
  <button class="btn"     id="btnLoad"    title="Load image from file (PNG/JPG/BMP…)">📂 Load</button>
  <button class="btn"     id="btnScan"    title="Scan current debug frame for image variables">🔍 Scan</button>
  <button class="btn sec" id="btnRefresh" title="Refresh all watch expressions">↺ Refresh</button>
  <button class="btn sec" id="btnClear"   title="Clear all images">🗑 Clear</button>
  <span class="spacer"></span>
  <span id="statusTxt" class="status-txt"></span>
</div>

<!-- Split layout -->
<div class="split">

  <!-- Left: list sidebar -->
  <div class="sidebar" id="sidebar">
    <div class="tab-bar">
      <button class="tab active" id="tabLocals" onclick="switchTab('locals')">Locals</button>
      <button class="tab"        id="tabWatch"  onclick="switchTab('watch')">Watch</button>
    </div>

    <div class="watch-input-area" id="watchInputArea" style="display:none">
      <div class="watch-row">
        <input class="watch-inp" id="watchInp" type="text"
               placeholder="Variable or expression…"
               onkeydown="if(event.key==='Enter')addWatch()">
        <button class="watch-add" onclick="addWatch()">+ Add</button>
      </div>
    </div>

    <div class="img-list" id="imgList">
      <div class="list-empty">No images yet.<br>Load a file or click Scan.</div>
    </div>

    <div class="resize-handle" id="resizeHandle"></div>
  </div>

  <!-- Right: large preview -->
  <div class="preview-pane" id="previewPane">
    <div class="preview-empty" id="previewEmpty">
      <div class="preview-empty-icon">🔭</div>
      <span>Select an image from the list</span>
    </div>
    <div class="canvas-wrap" id="canvasWrap" style="display:none">
      <canvas class="preview-cv" id="previewCv"></canvas>
    </div>
    <div class="zoom-lbl"  id="zoomLbl"  style="display:none"></div>
    <div class="pixel-bar" id="pixelBar" style="display:none"></div>
  </div>
</div>

<div id="tooltip"></div>

<script>
(function() {
'use strict';

const vscode = acquireVsCodeApi();

// ── State ──────────────────────────────────────────────────────────────────
let images     = [];
let watchList  = [];
let activeTab  = 'locals';
let selectedId = null;

// Decode cache: id -> {src, w, h}  (src = HTMLImageElement or <canvas>)
const decoded = new Map();

// Preview pan/zoom state
const pv = { scale:1, ox:0, oy:0, dragging:false, lx:0, ly:0, loaded:false };

// ── DOM refs ───────────────────────────────────────────────────────────────
const sidebar      = document.getElementById('sidebar');
const imgList      = document.getElementById('imgList');
const previewPane  = document.getElementById('previewPane');
const previewEmpty = document.getElementById('previewEmpty');
const canvasWrap   = document.getElementById('canvasWrap');
const previewCv    = document.getElementById('previewCv');
const zoomLbl      = document.getElementById('zoomLbl');
const pixelBar     = document.getElementById('pixelBar');
const statusTxt    = document.getElementById('statusTxt');
const tooltip      = document.getElementById('tooltip');

// ── Message bus ────────────────────────────────────────────────────────────
window.addEventListener('message', ev => {
  const m = ev.data;
  if (m.type === 'updateImages')    { applyImageUpdate(m.images); }
  if (m.type === 'updateWatchList') { watchList = m.names; renderList(); }
  if (m.type === 'status')          { statusTxt.textContent = m.message; }
});

function applyImageUpdate(newImages) {
  const newIds = new Set(newImages.map(i => i.id));
  for (const id of decoded.keys()) { if (!newIds.has(id)) decoded.delete(id); }
  images = newImages;
  if (selectedId && !newIds.has(selectedId)) { selectedId = null; }
  renderList();
  const sel = images.find(i => i.id === selectedId);
  if (sel) { renderPreview(sel); } else { clearPreview(); }
}

// ── Tab switching ──────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tabLocals').classList.toggle('active', tab === 'locals');
  document.getElementById('tabWatch').classList.toggle('active',  tab === 'watch');
  document.getElementById('watchInputArea').style.display = tab === 'watch' ? 'block' : 'none';
  renderList();
}

function visibleImages() {
  return activeTab === 'locals'
    ? images.filter(i => i.source === 'file' || i.source === 'scan')
    : images.filter(i => i.source === 'watch');
}

// ── List rendering ─────────────────────────────────────────────────────────
function renderList() {
  const list = visibleImages();
  imgList.innerHTML = '';

  if (list.length === 0) {
    const el = document.createElement('div');
    el.className = 'list-empty';
    el.textContent = activeTab === 'locals'
      ? 'No images. Load a file or click Scan.'
      : 'No watch images. Add an expression above.';
    imgList.appendChild(el);
    return;
  }

  list.forEach(img => imgList.appendChild(buildListItem(img)));

  if (!selectedId || !list.find(i => i.id === selectedId)) {
    selectImage(list[0].id);
  }
}

function buildListItem(imgData) {
  const item = document.createElement('div');
  item.className = 'list-item' + (imgData.id === selectedId ? ' selected' : '');
  item.dataset.id = imgData.id;
  item.addEventListener('click', () => selectImage(imgData.id));

  // Thumbnail
  const tw = document.createElement('div');
  tw.className = 'thumb-wrap';
  const cv = document.createElement('canvas');
  cv.className = 'thumb-cv';
  tw.appendChild(cv);
  item.appendChild(tw);

  // Info
  const info = document.createElement('div');
  info.className = 'item-info';

  const nameEl = document.createElement('div');
  nameEl.className = 'item-name';
  nameEl.textContent = imgData.name;
  nameEl.title = imgData.name;
  info.appendChild(nameEl);

  const meta1 = document.createElement('div');
  meta1.className = 'item-meta';
  meta1.id = 'dims_' + imgData.id;
  if (imgData.width > 0 && imgData.height > 0) {
    meta1.textContent = imgData.width + ' x ' + imgData.height;
  }
  info.appendChild(meta1);

  const meta2 = document.createElement('div');
  meta2.className = 'item-meta';
  if (imgData.isFile) {
    meta2.textContent = (imgData.mimeType || 'image').replace('image/', '').toUpperCase();
  } else if (imgData.channels > 0) {
    const t = {1:'Gray · UINT8', 3:'BGR · UINT8', 4:'BGRA · UINT8'}[imgData.channels] || (imgData.channels + ' ch');
    meta2.textContent = t;
  }
  if (imgData.typeInfo) {
    const t = imgData.typeInfo.length > 28 ? imgData.typeInfo.slice(0,26) + '…' : imgData.typeInfo;
    meta2.textContent += ' · ' + t;
    meta2.title = imgData.typeInfo;
  }
  info.appendChild(meta2);

  item.appendChild(info);

  // Remove button
  const del = document.createElement('button');
  del.className = 'item-del';
  del.textContent = '×';
  del.title = 'Remove';
  del.addEventListener('click', e => {
    e.stopPropagation();
    vscode.postMessage({ type: 'removeImage', id: imgData.id });
  });
  item.appendChild(del);

  // Decode + draw thumbnail
  drawThumb(cv, imgData);

  return item;
}

// ── Thumbnail drawing ──────────────────────────────────────────────────────
const TW = 64, TH = 48;

function drawThumb(canvas, imgData) {
  if (decoded.has(imgData.id)) {
    const d = decoded.get(imgData.id);
    if (d) { blitTo(canvas, d.src, d.w, d.h, TW, TH); }
    return;
  }

  if (imgData.isFile) {
    const img = new Image();
    img.onload = () => {
      imgData.width = img.naturalWidth; imgData.height = img.naturalHeight; imgData.channels = 4;
      decoded.set(imgData.id, { src: img, w: img.naturalWidth, h: img.naturalHeight });
      blitTo(canvas, img, img.naturalWidth, img.naturalHeight, TW, TH);
      updateDimsLabel(imgData);
      if (selectedId === imgData.id) renderPreview(imgData);
    };
    img.onerror = () => decoded.set(imgData.id, null);
    img.src = 'data:' + imgData.mimeType + ';base64,' + imgData.base64Data;
  } else {
    const oc = makeRawCanvas(imgData);
    decoded.set(imgData.id, { src: oc, w: imgData.width, h: imgData.height });
    blitTo(canvas, oc, imgData.width, imgData.height, TW, TH);
  }
}

function blitTo(dst, src, sw, sh, tw, th) {
  const s = Math.min(tw / sw, th / sh);
  const dw = Math.round(sw * s), dh = Math.round(sh * s);
  dst.width = dw; dst.height = dh;
  dst.getContext('2d').drawImage(src, 0, 0, dw, dh);
}

function makeRawCanvas(imgData) {
  const oc = document.createElement('canvas');
  oc.width = imgData.width; oc.height = imgData.height;
  const ctx = oc.getContext('2d');
  const id2 = ctx.createImageData(imgData.width, imgData.height);
  fillRgba(id2.data, b64ToU8(imgData.base64Data), imgData.channels);
  ctx.putImageData(id2, 0, 0);
  return oc;
}

function updateDimsLabel(imgData) {
  const el = document.getElementById('dims_' + imgData.id);
  if (el && imgData.width > 0) el.textContent = imgData.width + ' x ' + imgData.height;
}

// ── Selection & preview ────────────────────────────────────────────────────
function selectImage(id) {
  selectedId = id;
  imgList.querySelectorAll('.list-item').forEach(el =>
    el.classList.toggle('selected', el.dataset.id === id));
  const imgData = images.find(i => i.id === id);
  if (imgData) renderPreview(imgData);
}

function clearPreview() {
  previewEmpty.style.display = 'flex';
  canvasWrap.style.display   = 'none';
  zoomLbl.style.display      = 'none';
  pixelBar.style.display     = 'none';
  pv.loaded = false;
}

function renderPreview(imgData) {
  if (!imgData) { clearPreview(); return; }
  previewEmpty.style.display = 'none';
  canvasWrap.style.display   = 'block';
  zoomLbl.style.display      = 'block';
  pixelBar.style.display     = 'block';
  pixelBar.textContent = '';
  pv.loaded = false;

  function finalize(src, w, h) {
    previewCv.width = w; previewCv.height = h;
    const ctx = previewCv.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(src, 0, 0);
    pv.loaded = true;
    fitPreview(w, h);
    updateZoomLabel();
  }

  if (decoded.has(imgData.id)) {
    const d = decoded.get(imgData.id);
    if (d) finalize(d.src, d.w, d.h);
    return;
  }

  if (imgData.isFile) {
    const img = new Image();
    img.onload = () => {
      imgData.width = img.naturalWidth; imgData.height = img.naturalHeight; imgData.channels = 4;
      decoded.set(imgData.id, { src: img, w: img.naturalWidth, h: img.naturalHeight });
      updateDimsLabel(imgData);
      finalize(img, img.naturalWidth, img.naturalHeight);
    };
    img.onerror = () => { pixelBar.textContent = 'Failed to decode image.'; };
    img.src = 'data:' + imgData.mimeType + ';base64,' + imgData.base64Data;
  } else {
    const oc = makeRawCanvas(imgData);
    decoded.set(imgData.id, { src: oc, w: imgData.width, h: imgData.height });
    finalize(oc, imgData.width, imgData.height);
  }
}

function fitPreview(iw, ih) {
  const pw = previewPane.clientWidth  || 400;
  const ph = previewPane.clientHeight || 300;
  pv.scale = Math.min(pw / iw, ph / ih);
  pv.ox    = Math.round((pw - iw * pv.scale) / 2);
  pv.oy    = Math.round((ph - ih * pv.scale) / 2);
  applyPv();
}

function applyPv() {
  canvasWrap.style.transform =
    'translate(' + pv.ox + 'px,' + pv.oy + 'px) scale(' + pv.scale + ')';
}

function updateZoomLabel() {
  zoomLbl.textContent = pv.scale.toFixed(2) + 'x';
}

// ── Preview interactions ───────────────────────────────────────────────────
previewPane.addEventListener('wheel', e => {
  if (!pv.loaded) return;
  e.preventDefault();
  const rect = previewPane.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const ix = (mx - pv.ox) / pv.scale, iy = (my - pv.oy) / pv.scale;
  pv.scale = Math.max(0.01, Math.min(128, pv.scale * (e.deltaY < 0 ? 1.18 : 1/1.18)));
  pv.ox = mx - ix * pv.scale; pv.oy = my - iy * pv.scale;
  applyPv(); updateZoomLabel();
}, { passive: false });

previewPane.addEventListener('mousedown', e => {
  if (e.button !== 0 || !pv.loaded) return;
  pv.dragging = true; pv.lx = e.clientX; pv.ly = e.clientY;
  previewPane.style.cursor = 'grabbing'; e.preventDefault();
});
window.addEventListener('mousemove', e => {
  if (!pv.dragging) return;
  pv.ox += e.clientX - pv.lx; pv.oy += e.clientY - pv.ly;
  pv.lx = e.clientX; pv.ly = e.clientY; applyPv();
});
window.addEventListener('mouseup', () => {
  if (pv.dragging) { pv.dragging = false; previewPane.style.cursor = 'crosshair'; }
});

previewPane.addEventListener('dblclick', () => {
  if (!pv.loaded) return;
  fitPreview(previewCv.width, previewCv.height); updateZoomLabel();
});

previewPane.addEventListener('mousemove', e => {
  if (!pv.loaded) { tooltip.style.display = 'none'; return; }
  const rect = previewPane.getBoundingClientRect();
  const ix = Math.floor((e.clientX - rect.left - pv.ox) / pv.scale);
  const iy = Math.floor((e.clientY - rect.top  - pv.oy) / pv.scale);
  const w  = previewCv.width, h = previewCv.height;
  const img = images.find(i => i.id === selectedId);

  if (img && ix >= 0 && ix < w && iy >= 0 && iy < h) {
    const p = previewCv.getContext('2d').getImageData(ix, iy, 1, 1).data;
    let info;
    if (!img.isFile && img.channels === 1) {
      info = '(' + ix + ', ' + iy + ')   val = ' + p[0];
    } else {
      info = '(' + ix + ', ' + iy + ')   B:' + p[2] + '  G:' + p[1] + '  R:' + p[0];
      if (!img.isFile && img.channels === 4) info += '  A:' + p[3];
    }
    pixelBar.textContent  = info;
    tooltip.textContent   = info;
    tooltip.style.display = 'block';
    tooltip.style.left    = (e.clientX + 14) + 'px';
    tooltip.style.top     = (e.clientY - 28) + 'px';
  } else {
    pixelBar.textContent  = '';
    tooltip.style.display = 'none';
  }
});
previewPane.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none'; pixelBar.textContent = '';
});

// ── Sidebar resize ─────────────────────────────────────────────────────────
(function() {
  const handle = document.getElementById('resizeHandle');
  let resizing = false, startX = 0, startW = 0;
  handle.addEventListener('mousedown', e => {
    resizing = true; startX = e.clientX; startW = sidebar.offsetWidth;
    handle.classList.add('active'); e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!resizing) return;
    sidebar.style.width = Math.max(150, Math.min(500, startW + e.clientX - startX)) + 'px';
  });
  window.addEventListener('mouseup', () => {
    if (resizing) { resizing = false; handle.classList.remove('active'); }
  });
})();

// ── Watch management ───────────────────────────────────────────────────────
function addWatch() {
  const inp = document.getElementById('watchInp');
  const expr = inp.value.trim();
  if (!expr) return;
  vscode.postMessage({ type: 'addWatchExpression', expression: expr });
  inp.value = '';
}

// ── Toolbar ────────────────────────────────────────────────────────────────
document.getElementById('btnLoad').addEventListener('click',    () => vscode.postMessage({ type: 'loadImage' }));
document.getElementById('btnScan').addEventListener('click',    () => vscode.postMessage({ type: 'addFromDebug' }));
document.getElementById('btnRefresh').addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
document.getElementById('btnClear').addEventListener('click',   () => vscode.postMessage({ type: 'clear' }));

// ── Pixel fill helper ──────────────────────────────────────────────────────
function fillRgba(px, raw, ch) {
  const n = px.length >>> 2;
  for (let i = 0; i < n; i++) {
    if (ch === 1) { px[i*4]=px[i*4+1]=px[i*4+2]=raw[i]; px[i*4+3]=255; }
    else if (ch === 3) { px[i*4]=raw[i*3+2]; px[i*4+1]=raw[i*3+1]; px[i*4+2]=raw[i*3]; px[i*4+3]=255; }
    else if (ch === 4) { px[i*4]=raw[i*4+2]; px[i*4+1]=raw[i*4+1]; px[i*4+2]=raw[i*4]; px[i*4+3]=raw[i*4+3]; }
  }
}

function b64ToU8(b64) {
  const bin = atob(b64), out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

window.switchTab = switchTab;
window.addWatch  = addWatch;
})();
</script>
</body>
</html>`;
}

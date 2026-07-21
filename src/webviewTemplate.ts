

function getStyles(): string {
  return /* css */`
*{box-sizing:border-box;margin:0;padding:0}
body{
  font-family:var(--vscode-font-family,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif);
  font-size:var(--vscode-font-size,13px);
  background:var(--vscode-editor-background,#1e1e1e);
  color:var(--vscode-editor-foreground,#d4d4d4);
  height:100vh;display:flex;flex-direction:column;overflow:hidden;
}

/* ���� Toolbar ���������������������������������������������������������������������������������������� */
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

/* ���� Two-pane split �������������������������������������������������������������������������� */
.split{flex:1;display:flex;overflow:hidden}

/* ���� Left sidebar ������������������������������������������������������������������������������ */
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

/* ���� Right preview pane ������������������������������������������������������������������ */
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
canvas.pixel-overlay-cv{
  position:absolute;top:0;left:0;pointer-events:none;
}

/* Zoom label */
.zoom-lbl{
  position:absolute;top:8px;right:10px;
  background:rgba(0,0,0,.65);color:#fff;
  font-size:11px;font-family:monospace;padding:2px 8px;border-radius:3px;
  pointer-events:none;
}

/* Histogram overlay (single-channel images) */
.hist-panel{
  position:absolute;top:36px;right:10px;z-index:5;
  width:clamp(220px,32vw,340px);max-width:calc(100% - 20px);
  padding:9px 10px 8px;border-radius:4px;
  background:var(--vscode-editorWidget-background,#252526);
  background:color-mix(in srgb,var(--vscode-editorWidget-background,#252526) 94%,transparent);
  border:1px solid var(--vscode-editorWidget-border,rgba(255,255,255,.18));
  box-shadow:0 4px 16px rgba(0,0,0,.32);cursor:default;user-select:none;
}
.hist-header{height:24px;display:flex;align-items:flex-start;gap:8px}
.hist-title{flex-shrink:0;font-size:12px;font-weight:600;line-height:20px;color:var(--vscode-editorWidget-foreground,#d4d4d4)}
.hist-total{
  min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  font:10px/20px var(--vscode-editor-font-family,monospace);color:var(--vscode-descriptionForeground,#999)
}
.hist-scale{
  display:flex;flex-shrink:0;margin-left:auto;border:1px solid var(--vscode-input-border,#555);border-radius:3px;overflow:hidden;
}
.hist-scale-btn{
  height:20px;padding:0 7px;border:0;border-right:1px solid var(--vscode-input-border,#555);
  background:var(--vscode-button-secondaryBackground,#3c3c3c);color:var(--vscode-button-secondaryForeground,#ccc);
  font-size:10px;line-height:20px;cursor:pointer;
}
.hist-scale-btn:last-child{border-right:0}
.hist-scale-btn:hover{background:var(--vscode-button-secondaryHoverBackground,#4c4c4c)}
.hist-scale-btn.active{background:var(--vscode-button-background,#0e639c);color:var(--vscode-button-foreground,#fff)}
.hist-cv{display:block;width:100%;height:148px;cursor:crosshair}
.hist-readout{
  height:20px;display:flex;align-items:flex-end;justify-content:space-between;gap:8px;
  color:var(--vscode-descriptionForeground,#aaa);font:10px/16px var(--vscode-editor-font-family,monospace);
  white-space:nowrap;
}
.hist-readout.hover{color:var(--vscode-editorWidget-foreground,#ddd);justify-content:flex-start}
.hist-readout span{min-width:0;overflow:hidden;text-overflow:ellipsis}

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

/* Context menu (right-click) */
.ctx-menu{
  position:fixed;z-index:10000;min-width:160px;
  background:var(--vscode-menu-background,#252526);
  color:var(--vscode-menu-foreground,#ccc);
  border:1px solid var(--vscode-menu-border,#454545);
  border-radius:4px;padding:4px 0;box-shadow:0 4px 12px rgba(0,0,0,.4);
  display:none;
}
.ctx-menu.show{display:block}
.ctx-item{
  display:flex;align-items:center;gap:8px;
  padding:4px 12px;cursor:pointer;font-size:12px;user-select:none;
}
.ctx-item:hover{background:var(--vscode-menu-selectionBackground,#094771);color:var(--vscode-menu-selectionForeground,#fff)}
.ctx-item .check{width:14px;text-align:center;visibility:hidden}
.ctx-item.checked .check{visibility:visible}
`;
}

function getBody(): string {
  return /* html */`

<!-- Toolbar -->
<div class="topbar">
  <button class="btn"     id="btnLoad"    title="Load image from file (PNG/JPG/BMP...)">Load</button>
  <button class="btn"     id="btnScan"    title="Scan current debug frame for image variables">Scan</button>
  <button class="btn sec" id="btnRefresh" title="Refresh all watch expressions">Refresh</button>
  <button class="btn sec" id="btnClear"   title="Clear all images">Clear</button>
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
               placeholder="Variable or expression..."
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
    <!-- Pixel overlay is NOT inside canvas-wrap: it renders in screen space, not scaled -->
    <canvas class="pixel-overlay-cv" id="pixelOverlayCv" style="display:none"></canvas>
    <div class="zoom-lbl"  id="zoomLbl"  style="display:none"></div>
    <div class="hist-panel" id="histPanel" style="display:none">
      <div class="hist-header">
        <span class="hist-title">Histogram</span>
        <span class="hist-total" id="histTotal"></span>
        <div class="hist-scale" aria-label="Histogram scale">
          <button class="hist-scale-btn active" id="histLinear" type="button" aria-pressed="true">Linear</button>
          <button class="hist-scale-btn" id="histLog" type="button" aria-pressed="false">Log</button>
        </div>
      </div>
      <canvas class="hist-cv" id="histCv"></canvas>
      <div class="hist-readout" id="histReadout"></div>
    </div>
    <div class="pixel-bar" id="pixelBar" style="display:none"></div>
  </div>
</div>

<div id="contextMenu" class="ctx-menu">
  <div id="ctxLinkView" class="ctx-item" title="Same-resolution images share zoom and pan">
    <span class="check">&#10003;</span><span>LinkView</span>
  </div>
  <div id="ctxHistogram" class="ctx-item" style="display:none" title="Show/hide histogram for single-channel image">
    <span class="check">&#10003;</span><span>Histogram</span>
  </div>
  <div id="ctxHeatmap" class="ctx-item" style="display:none" title="Toggle between grayscale and heatmap (jet colormap)">
    <span class="check">&#10003;</span><span>Heatmap</span>
  </div>
</div>
<div id="tooltip"></div>
`;
}

function getScript(): string {
  return /* js */`
(function() {
'use strict';

const vscode = acquireVsCodeApi();

// ���� State ������������������������������������������������������������������������������������������������������������������������������������
let images     = [];
let activeTab  = 'locals';
let selectedId = null;

// Decode cache: id -> {src, w, h}  (src = HTMLImageElement or <canvas>)
const decoded = new Map();

// Preview pan/zoom state
const pv = { scale:1, ox:0, oy:0, dragging:false, lx:0, ly:0, loaded:false };

// LinkView: same-resolution images share zoom and ROI
let linkViewEnabled = false;
const viewStateByResolution = {}; // key = "WxH" -> { scale, ox, oy }

// Histogram & Heatmap (single-channel only)
let histogramEnabled = false;
let heatmapEnabled = false;
const histCache = new Map(); // id -> Uint32Array(256)
let histogramScale = 'linear';
let histogramView = null;

// Show the pixel grid before values; value labels have a separate fit-based threshold.
const PIXEL_GRID_THRESHOLD = 10;

function resolutionKeyFromSize(w, h) {
  return (w > 0 && h > 0) ? (w + 'x' + h) : '';
}
function saveViewStateForCurrentResolution() {
  const w = previewCv.width, h = previewCv.height;
  const key = resolutionKeyFromSize(w, h);
  if (!key) return;
  viewStateByResolution[key] = { scale: pv.scale, ox: pv.ox, oy: pv.oy };
}

// ���� DOM refs ������������������������������������������������������������������������������������������������������������������������������
const sidebar        = document.getElementById('sidebar');
const imgList        = document.getElementById('imgList');
const previewPane    = document.getElementById('previewPane');
const previewEmpty   = document.getElementById('previewEmpty');
const canvasWrap     = document.getElementById('canvasWrap');
const previewCv      = document.getElementById('previewCv');
const pixelOverlayCv = document.getElementById('pixelOverlayCv');
const zoomLbl        = document.getElementById('zoomLbl');
const pixelBar     = document.getElementById('pixelBar');
const statusTxt    = document.getElementById('statusTxt');
const tooltip      = document.getElementById('tooltip');
const contextMenu  = document.getElementById('contextMenu');
const ctxLinkView  = document.getElementById('ctxLinkView');
const ctxHistogram = document.getElementById('ctxHistogram');
const ctxHeatmap   = document.getElementById('ctxHeatmap');
const histPanel    = document.getElementById('histPanel');
const histCv       = document.getElementById('histCv');
const histTotal    = document.getElementById('histTotal');
const histReadout  = document.getElementById('histReadout');
const histLinear   = document.getElementById('histLinear');
const histLog      = document.getElementById('histLog');

// ���� Message bus ������������������������������������������������������������������������������������������������������������������������
window.addEventListener('message', ev => {
  const m = ev.data;
  if (m.type === 'updateImages')    { applyImageUpdate(m.images); }
  if (m.type === 'status')          { statusTxt.textContent = m.message; }
});

function applyImageUpdate(newImages) {
  const newIds = new Set(newImages.map(i => i.id));
  for (const id of decoded.keys()) { if (!newIds.has(id)) decoded.delete(id); }
  for (const id of histCache.keys()) { if (!newIds.has(id)) histCache.delete(id); }
  images = newImages;
  if (selectedId && !newIds.has(selectedId)) { selectedId = null; }
  renderList();
  const sel = images.find(i => i.id === selectedId);
  if (sel) { renderPreview(sel); } else { clearPreview(); }
}

// ���� Tab switching ��������������������������������������������������������������������������������������������������������������������
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

// ���� List rendering ������������������������������������������������������������������������������������������������������������������
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
    meta2.textContent = imgData.channels + ' * UINT8';
  }
  if (imgData.typeInfo) {
    const t = imgData.typeInfo.length > 28 ? imgData.typeInfo.slice(0,26) + '...' : imgData.typeInfo;
    meta2.textContent += ' - ' + t;
    meta2.title = imgData.typeInfo;
  }
  info.appendChild(meta2);

  item.appendChild(info);

  // Remove button
  const del = document.createElement('button');
  del.className = 'item-del';
  del.textContent = '\\u00d7';
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

// ���� Thumbnail drawing ������������������������������������������������������������������������������������������������������������
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

// ���� Selection & preview ��������������������������������������������������������������������������������������������������������
function selectImage(id) {
  selectedId = id;
  imgList.querySelectorAll('.list-item').forEach(el =>
    el.classList.toggle('selected', el.dataset.id === id));
  const imgData = images.find(i => i.id === id);
  if (imgData) renderPreview(imgData);
}

function clearPreview() {
  previewEmpty.style.display    = 'flex';
  canvasWrap.style.display      = 'none';
  zoomLbl.style.display         = 'none';
  pixelBar.style.display        = 'none';
  pixelOverlayCv.style.display  = 'none';
  histPanel.style.display       = 'none';
  histogramView                = null;
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
    const isSingleCh = !imgData.isFile && imgData.channels === 1;
    if (heatmapEnabled && isSingleCh) {
      ctx.drawImage(applyHeatmap(src, w, h), 0, 0);
    } else {
      ctx.drawImage(src, 0, 0);
    }
    pv.loaded = true;
    updateHistogram();
    const key = resolutionKeyFromSize(w, h);
    if (linkViewEnabled && key && viewStateByResolution[key]) {
      const vs = viewStateByResolution[key];
      pv.scale = vs.scale; pv.ox = vs.ox; pv.oy = vs.oy;
      applyPv(); updateZoomLabel(); updatePixelOverlay();
    } else {
      fitPreview(w, h);
      if (linkViewEnabled && key) viewStateByResolution[key] = { scale: pv.scale, ox: pv.ox, oy: pv.oy };
      updateZoomLabel();
      updatePixelOverlay();
    }
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

// ���� Pixel-level overlay (grid + multi-channel values per cell) ����������������������������
function updatePixelOverlay() {
  if (!pixelOverlayCv || !pv.loaded || previewCv.width === 0 || previewCv.height === 0) return;

  const pw = previewPane.clientWidth || 400, ph = previewPane.clientHeight || 300;

  if (pv.scale < PIXEL_GRID_THRESHOLD) {
    pixelOverlayCv.style.display = 'none';
    return;
  }

  // Overlay canvas lives in preview-pane coordinates (screen space), NOT inside canvas-wrap.
  // This means we draw full-integer pixel cells and avoid any CSS-scale blending artifacts.
  pixelOverlayCv.width  = pw;
  pixelOverlayCv.height = ph;
  pixelOverlayCv.style.display = 'block';

  const ctx = pixelOverlayCv.getContext('2d');
  ctx.clearRect(0, 0, pw, ph);

  const iw = previewCv.width, ih = previewCv.height;
  const imgCtx = previewCv.getContext('2d');

  // Visible pixel range in image coordinates
  const x0 = Math.max(0, Math.floor(-pv.ox / pv.scale));
  const y0 = Math.max(0, Math.floor(-pv.oy / pv.scale));
  const x1 = Math.min(iw, Math.ceil((pw - pv.ox) / pv.scale));
  const y1 = Math.min(ih, Math.ceil((ph - pv.oy) / pv.scale));

  const img = images.find(i => i.id === selectedId);
  const channels = img && !img.isFile ? img.channels : 3;

  // Read image data once for the visible region
  const regionW = x1 - x0, regionH = y1 - y0;
  if (regionW <= 0 || regionH <= 0) return;
  const imageData = imgCtx.getImageData(x0, y0, regionW, regionH);
  const data = imageData.data;

  const cellSize = pv.scale;
  const valueCount = channels === 1 ? 1 : (channels === 4 ? 4 : 3);
  const fontSize = Math.max(9, Math.min(12, Math.floor(cellSize / 5)));
  const lineHeight = fontSize + 1;
  const labelHeight = valueCount * lineHeight + 4;
  const showValues = cellSize >= Math.max(42, labelHeight + 6);
  const valueCells = [];

  for (let iy = 0; iy < regionH; iy++) {
    for (let ix = 0; ix < regionW; ix++) {
      const srcIdx = (iy * regionW + ix) << 2;
      // Canvas stores RGB (BGR->RGB already done by fillRgba)
      const r = data[srcIdx], g = data[srcIdx + 1], b = data[srcIdx + 2], a = data[srcIdx + 3];

      // Integer screen-space edges avoid seams at fractional zoom levels.
      const sx = Math.round((x0 + ix) * pv.scale + pv.ox);
      const sy = Math.round((y0 + iy) * pv.scale + pv.oy);
      const ex = Math.round((x0 + ix + 1) * pv.scale + pv.ox);
      const ey = Math.round((y0 + iy + 1) * pv.scale + pv.oy);
      const sw = ex - sx;
      const sh = ey - sy;

      // Skip cells outside screen
      if (sx + sw < 0 || sy + sh < 0 || sx > pw || sy > ph) continue;

      // Solid background with true pixel color
      ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      ctx.fillRect(sx, sy, sw, sh);

      if (!showValues) continue;
      const values = channels === 1 ? [r] : (channels === 4 ? [b, g, r, a] : [b, g, r]);
      valueCells.push({ sx, sy, sw, sh, values });
    }
  }

  // Draw grid lines once so shared edges stay crisp and have uniform weight.
  ctx.beginPath();
  for (let ix = 0; ix <= regionW; ix++) {
    const x = Math.round((x0 + ix) * pv.scale + pv.ox) + 0.5;
    ctx.moveTo(x, Math.round(y0 * pv.scale + pv.oy));
    ctx.lineTo(x, Math.round(y1 * pv.scale + pv.oy));
  }
  for (let iy = 0; iy <= regionH; iy++) {
    const y = Math.round((y0 + iy) * pv.scale + pv.oy) + 0.5;
    ctx.moveTo(Math.round(x0 * pv.scale + pv.ox), y);
    ctx.lineTo(Math.round(x1 * pv.scale + pv.ox), y);
  }
  ctx.strokeStyle = 'rgba(232,232,232,0.58)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (!showValues) return;

  ctx.font = fontSize + 'px Consolas, "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const labelWidth = Math.ceil(ctx.measureText('255').width) + 8;

  for (const cell of valueCells) {
    if (labelWidth + 6 > cell.sw || labelHeight + 6 > cell.sh) continue;

    const labelX = Math.round(cell.sx + (cell.sw - labelWidth) / 2);
    const labelY = Math.round(cell.sy + (cell.sh - labelHeight) / 2);
    ctx.fillStyle = 'rgba(238,238,238,0.72)';
    ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
    ctx.strokeStyle = 'rgba(20,20,20,0.32)';
    ctx.strokeRect(labelX + 0.5, labelY + 0.5, labelWidth - 1, labelHeight - 1);

    ctx.fillStyle = 'rgba(12,12,12,0.96)';
    for (let i = 0; i < cell.values.length; i++) {
      const textY = labelY + 2 + lineHeight * (i + 0.5);
      ctx.fillText(String(cell.values[i]), labelX + labelWidth / 2, textY);
    }
  }
}

// ���� Preview interactions ������������������������������������������������������������������������������������������������������
previewPane.addEventListener('wheel', e => {
  if (!pv.loaded) return;
  e.preventDefault();
  const rect = previewPane.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const ix = (mx - pv.ox) / pv.scale, iy = (my - pv.oy) / pv.scale;
  pv.scale = Math.max(0.01, Math.min(128, pv.scale * (e.deltaY < 0 ? 1.18 : 1/1.18)));
  pv.ox = mx - ix * pv.scale; pv.oy = my - iy * pv.scale;
  applyPv(); updateZoomLabel(); updatePixelOverlay();
  if (linkViewEnabled) saveViewStateForCurrentResolution();
}, { passive: false });

previewPane.addEventListener('mousedown', e => {
  if (e.button !== 0 || !pv.loaded) return;
  pv.dragging = true; pv.lx = e.clientX; pv.ly = e.clientY;
  previewPane.style.cursor = 'grabbing'; e.preventDefault();
});
window.addEventListener('mousemove', e => {
  if (!pv.dragging) return;
  pv.ox += e.clientX - pv.lx; pv.oy += e.clientY - pv.ly;
  pv.lx = e.clientX; pv.ly = e.clientY;
  applyPv(); updatePixelOverlay();
  if (linkViewEnabled) saveViewStateForCurrentResolution();
});
window.addEventListener('mouseup', () => {
  if (pv.dragging) { pv.dragging = false; previewPane.style.cursor = 'crosshair'; }
});

previewPane.addEventListener('dblclick', () => {
  if (!pv.loaded) return;
  fitPreview(previewCv.width, previewCv.height); updateZoomLabel(); updatePixelOverlay();
  if (linkViewEnabled) saveViewStateForCurrentResolution();
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

// Context menu: right-click to show options
function isSelectedSingleChannel() {
  const img = images.find(i => i.id === selectedId);
  return !!(img && !img.isFile && img.channels === 1);
}
function showContextMenu(x, y) {
  const singleCh = isSelectedSingleChannel();
  ctxHistogram.style.display = singleCh ? 'flex' : 'none';
  ctxHeatmap.style.display   = singleCh ? 'flex' : 'none';
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
  contextMenu.classList.add('show');
  ctxLinkView.classList.toggle('checked', linkViewEnabled);
  ctxHistogram.classList.toggle('checked', histogramEnabled);
  ctxHeatmap.classList.toggle('checked', heatmapEnabled);
}
function hideContextMenu() {
  contextMenu.classList.remove('show');
}
previewPane.addEventListener('contextmenu', e => {
  e.preventDefault();
  showContextMenu(e.clientX, e.clientY);
});
sidebar.addEventListener('contextmenu', e => {
  e.preventDefault();
  showContextMenu(e.clientX, e.clientY);
});
ctxLinkView.addEventListener('click', () => {
  linkViewEnabled = !linkViewEnabled;
  ctxLinkView.classList.toggle('checked', linkViewEnabled);
  if (linkViewEnabled && pv.loaded) saveViewStateForCurrentResolution();
  hideContextMenu();
});
ctxHistogram.addEventListener('click', () => {
  histogramEnabled = !histogramEnabled;
  ctxHistogram.classList.toggle('checked', histogramEnabled);
  updateHistogram();
  hideContextMenu();
});
ctxHeatmap.addEventListener('click', () => {
  heatmapEnabled = !heatmapEnabled;
  ctxHeatmap.classList.toggle('checked', heatmapEnabled);
  const img = images.find(i => i.id === selectedId);
  if (img) renderPreview(img);
  hideContextMenu();
});
window.addEventListener('click', () => hideContextMenu());
window.addEventListener('scroll', () => hideContextMenu(), true);

// ���� Sidebar resize ��������������������������������────────────────────────────────────────────────────────────────
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

// ���� Watch management ��������������������������������������������������������������������������������������������������������������
function addWatch() {
  const inp = document.getElementById('watchInp');
  const expr = inp.value.trim();
  if (!expr) return;
  vscode.postMessage({ type: 'addWatchExpression', expression: expr });
  inp.value = '';
}

// ���� Toolbar ��������������������������������������������������������������������������������������������������������������������������������
document.getElementById('btnLoad').addEventListener('click',    () => vscode.postMessage({ type: 'loadImage' }));
document.getElementById('btnScan').addEventListener('click', () => {
  switchTab('locals');
  vscode.postMessage({ type: 'addFromDebug' });
});
document.getElementById('btnRefresh').addEventListener('click', () => vscode.postMessage({ type: 'refresh' }));
document.getElementById('btnClear').addEventListener('click',   () => vscode.postMessage({ type: 'clear' }));

// ──── Histogram (single-channel) ────────────────────────────────────────────────────────────────────────────────
function updateHistogram() {
  const img = images.find(i => i.id === selectedId);
  const singleCh = img && !img.isFile && img.channels === 1;
  if (!histogramEnabled || !pv.loaded || !singleCh) {
    histPanel.style.display = 'none';
    histogramView = null;
    return;
  }
  const d = decoded.get(img.id);
  if (!d) { histPanel.style.display = 'none'; histogramView = null; return; }

  let bins = histCache.get(img.id);
  if (!bins) {
    bins = new Uint32Array(256);
    const raw = b64ToU8(img.base64Data);
    for (let i = 0; i < raw.length; i++) bins[raw[i]]++;
    histCache.set(img.id, bins);
  }

  let total = 0, weighted = 0, maxVal = 0, peak = 0;
  for (let i = 0; i < 256; i++) {
    const count = bins[i];
    total += count;
    weighted += count * i;
    if (count > maxVal) { maxVal = count; peak = i; }
  }
  if (total === 0 || maxVal === 0) { histPanel.style.display = 'none'; return; }

  let cumulative = 0, median = 0;
  for (let i = 0; i < 256; i++) {
    cumulative += bins[i];
    if (cumulative >= total / 2) { median = i; break; }
  }

  histPanel.style.display = 'block';
  histTotal.textContent = formatHistogramCount(total) + ' px';
  histTotal.title = total.toLocaleString() + ' pixels';
  histogramView = {
    bins: bins,
    total: total,
    maxVal: maxVal,
    mean: weighted / total,
    median: median,
    peak: peak,
    plot: null,
    hoverBin: -1
  };
  drawHistogram(histogramView, -1);
}

function histogramThemeColor(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function formatHistogramCount(value) {
  if (value >= 1000000) return (value / 1000000).toFixed(value >= 10000000 ? 0 : 1) + 'm';
  if (value >= 1000) return (value / 1000).toFixed(value >= 10000 ? 0 : 1) + 'k';
  return Math.round(value).toString();
}

function histogramLevel(count, maxVal) {
  return histogramScale === 'log'
    ? Math.log1p(count) / Math.log1p(maxVal)
    : count / maxVal;
}

function histogramAxisCount(level, maxVal) {
  return histogramScale === 'log'
    ? Math.expm1(level * Math.log1p(maxVal))
    : level * maxVal;
}

function setHistogramReadout(view, hoverBin) {
  histReadout.textContent = '';
  if (hoverBin >= 0) {
    const count = view.bins[hoverBin];
    const pct = count / view.total * 100;
    histReadout.classList.add('hover');
    histReadout.textContent = 'Value ' + hoverBin + '   ' + count.toLocaleString() + ' px   ' + pct.toFixed(pct < 0.1 ? 2 : 1) + '%';
    return;
  }

  histReadout.classList.remove('hover');
  const values = [
    'Mean ' + view.mean.toFixed(1),
    'Median ' + view.median,
    'Peak ' + view.peak
  ];
  for (const value of values) {
    const span = document.createElement('span');
    span.textContent = value;
    histReadout.appendChild(span);
  }
}

function drawHistogram(view, hoverBin) {
  if (!view || histPanel.style.display === 'none') return;

  const width = Math.max(140, Math.round(histCv.clientWidth || 320));
  const height = 148;
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const physicalW = Math.round(width * dpr), physicalH = Math.round(height * dpr);
  if (histCv.width !== physicalW) histCv.width = physicalW;
  if (histCv.height !== physicalH) histCv.height = physicalH;

  const ctx = histCv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const padL = width < 210 ? 30 : 38;
  const padR = 8, padT = 8, padB = 22;
  const plotW = width - padL - padR, plotH = height - padT - padB;
  const baseY = padT + plotH;
  const accent = histogramThemeColor('--vscode-charts-blue', '#4daafc');
  const textColor = histogramThemeColor('--vscode-descriptionForeground', '#a0a0a0');
  const gridColor = histogramThemeColor('--vscode-editorWidget-border', 'rgba(255,255,255,.16)');

  ctx.font = '9px ' + histogramThemeColor('--vscode-editor-font-family', 'monospace');
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;

  for (const level of [0, 0.5, 1]) {
    const y = Math.round(baseY - level * plotH) + 0.5;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatHistogramCount(histogramAxisCount(level, view.maxVal)), padL - 6, y);
  }

  const xTicks = width < 210 ? [0, 128, 255] : [0, 64, 128, 192, 255];
  for (const value of xTicks) {
    const x = padL + value / 255 * plotW;
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, padT);
    ctx.lineTo(Math.round(x) + 0.5, baseY);
    ctx.stroke();
    ctx.textBaseline = 'top';
    ctx.textAlign = value === 0 ? 'left' : (value === 255 ? 'right' : 'center');
    ctx.fillText(String(value), x, baseY + 6);
  }

  ctx.beginPath();
  ctx.moveTo(padL, baseY);
  for (let i = 0; i < 256; i++) {
    const x = padL + i / 255 * plotW;
    const y = baseY - histogramLevel(view.bins[i], view.maxVal) * plotH;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(padL + plotW, baseY);
  ctx.closePath();
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.18;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  for (let i = 0; i < 256; i++) {
    const x = padL + i / 255 * plotW;
    const y = baseY - histogramLevel(view.bins[i], view.maxVal) * plotH;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.25;
  ctx.lineJoin = 'round';
  ctx.stroke();

  if (hoverBin >= 0) {
    const x = padL + hoverBin / 255 * plotW;
    const y = baseY - histogramLevel(view.bins[hoverBin], view.maxVal) * plotH;
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, padT);
    ctx.lineTo(Math.round(x) + 0.5, baseY);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
  }

  view.plot = { left: padL, width: plotW, top: padT, bottom: baseY };
  view.hoverBin = hoverBin;
  setHistogramReadout(view, hoverBin);
}

// ──── Heatmap (jet colormap, single-channel) ────────────────────────────────────────────────────────────────────
function setHistogramScale(scale) {
  histogramScale = scale;
  histLinear.classList.toggle('active', scale === 'linear');
  histLog.classList.toggle('active', scale === 'log');
  histLinear.setAttribute('aria-pressed', String(scale === 'linear'));
  histLog.setAttribute('aria-pressed', String(scale === 'log'));
  if (histogramView) drawHistogram(histogramView, -1);
}

histLinear.addEventListener('click', () => setHistogramScale('linear'));
histLog.addEventListener('click', () => setHistogramScale('log'));

histCv.addEventListener('mousemove', e => {
  if (!histogramView || !histogramView.plot) return;
  const rect = histCv.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (histCv.clientWidth / rect.width);
  const y = (e.clientY - rect.top) * (histCv.clientHeight / rect.height);
  const plot = histogramView.plot;
  let hoverBin = -1;
  if (x >= plot.left && x <= plot.left + plot.width && y >= plot.top && y <= plot.bottom) {
    hoverBin = Math.max(0, Math.min(255, Math.round((x - plot.left) / plot.width * 255)));
  }
  if (hoverBin !== histogramView.hoverBin) drawHistogram(histogramView, hoverBin);
});

histCv.addEventListener('mouseleave', () => {
  if (histogramView && histogramView.hoverBin !== -1) drawHistogram(histogramView, -1);
});

histPanel.addEventListener('mouseenter', () => {
  tooltip.style.display = 'none';
  pixelBar.textContent = '';
});
for (const eventName of ['mousedown', 'dblclick', 'mousemove', 'wheel']) {
  histPanel.addEventListener(eventName, e => e.stopPropagation());
}
histPanel.addEventListener('contextmenu', e => {
  e.preventDefault();
  e.stopPropagation();
});

if (typeof ResizeObserver !== 'undefined') {
  new ResizeObserver(() => {
    if (histogramView && histPanel.style.display !== 'none') drawHistogram(histogramView, -1);
  }).observe(histPanel);
}

function jetLUT() {
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r, g, b;
    if (t < 0.125)      { r = 0;               g = 0;                 b = 0.5 + t * 4;         }
    else if (t < 0.375) { r = 0;               g = (t - 0.125) * 4;   b = 1;                   }
    else if (t < 0.625) { r = (t - 0.375) * 4; g = 1;                 b = 1 - (t - 0.375) * 4; }
    else if (t < 0.875) { r = 1;               g = 1 - (t - 0.625)*4; b = 0;                   }
    else                { r = 1 - (t-0.875)*4; g = 0;                 b = 0;                   }
    lut[i * 3]     = Math.round(Math.max(0, Math.min(1, r)) * 255);
    lut[i * 3 + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
    lut[i * 3 + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
  }
  return lut;
}
const JET = jetLUT();

function applyHeatmap(src, w, h) {
  const tmpCv = document.createElement('canvas');
  tmpCv.width = w; tmpCv.height = h;
  const tmpCtx = tmpCv.getContext('2d');
  tmpCtx.drawImage(src, 0, 0);
  const imgData = tmpCtx.getImageData(0, 0, w, h);
  const px = imgData.data;
  for (let i = 0; i < px.length; i += 4) {
    const v = px[i] * 3;
    px[i] = JET[v]; px[i + 1] = JET[v + 1]; px[i + 2] = JET[v + 2]; px[i + 3] = 255;
  }
  tmpCtx.putImageData(imgData, 0, 0);
  return tmpCv;
}

// ���� Pixel fill helper ������������������������������������������������������������������������������������������������������������
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
`;
}

export function getWebviewHtml(): string {
  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:;">
<title>Image Watch</title>
<style>
${getStyles()}
</style>
</head>
<body>
${getBody()}
<script>
${getScript()}
</script>
</body>
</html>`;
}

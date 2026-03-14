/**
 * 核心逻辑单元测试（无需 VS Code 环境）
 * 运行方式: node test-assets/test-logic.js
 */

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log('  ✅ PASS:', name);
        passed++;
    } catch (e) {
        console.log('  ❌ FAIL:', name);
        console.log('     ', e.message);
        failed++;
    }
}

function assert(cond, msg) {
    if (!cond) { throw new Error(msg || 'assertion failed'); }
}
function assertEqual(a, b, msg) {
    if (a !== b) { throw new Error((msg || '') + ` expected ${b}, got ${a}`); }
}

// ─── 1. Base64 编解码 ─────────────────────────────────────────────────────
console.log('\n[1] Base64 编解码');

test('Buffer.from → base64 → 还原', () => {
    const raw = Buffer.from([0, 0, 255,   0, 255, 0,  255, 0, 0,  255, 255, 255]);
    const b64 = raw.toString('base64');
    const restored = Buffer.from(b64, 'base64');
    assert(restored.length === raw.length, '长度不一致');
    for (let i = 0; i < raw.length; i++) {
        assertEqual(restored[i], raw[i], `index ${i}: `);
    }
});

test('Base64 字符串不含非法字符', () => {
    const data = Buffer.alloc(192, 128);
    const b64 = data.toString('base64');
    assert(/^[A-Za-z0-9+/=]+$/.test(b64), 'base64 含非法字符');
});

test('Uint8Array → Buffer → base64 往返', () => {
    const u8 = new Uint8Array([10, 20, 30, 40, 250, 255]);
    const b64 = Buffer.from(u8).toString('base64');
    const back = Buffer.from(b64, 'base64');
    for (let i = 0; i < u8.length; i++) {
        assertEqual(back[i], u8[i], `index ${i}`);
    }
});

// ─── 2. BGR→RGBA 通道转换 (模拟 WebView Canvas 逻辑) ─────────────────────
console.log('\n[2] BGR → RGBA 通道转换');

function bgrToRgba(raw, w, h, ch) {
    const n = w * h;
    const out = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
        if (ch === 1) {
            out[i*4] = out[i*4+1] = out[i*4+2] = raw[i]; out[i*4+3] = 255;
        } else if (ch === 3) {
            out[i*4]   = raw[i*3+2]; // R <- B(idx 2)
            out[i*4+1] = raw[i*3+1]; // G <- G(idx 1)
            out[i*4+2] = raw[i*3];   // B <- R(idx 0)
            out[i*4+3] = 255;
        } else if (ch === 4) {
            out[i*4]   = raw[i*4+2];
            out[i*4+1] = raw[i*4+1];
            out[i*4+2] = raw[i*4];
            out[i*4+3] = raw[i*4+3];
        }
    }
    return out;
}

test('BGR 红色像素 → RGBA 应变为 R=255 G=0 B=0', () => {
    // OpenCV BGR: red = B=0, G=0, R=255
    const raw = new Uint8Array([0, 0, 255]);
    const rgba = bgrToRgba(raw, 1, 1, 3);
    assertEqual(rgba[0], 255, 'R');
    assertEqual(rgba[1], 0,   'G');
    assertEqual(rgba[2], 0,   'B');
    assertEqual(rgba[3], 255, 'A');
});

test('BGR 纯绿色 → RGBA G=255', () => {
    const raw = new Uint8Array([0, 255, 0]); // BGR green
    const rgba = bgrToRgba(raw, 1, 1, 3);
    assertEqual(rgba[0], 0,   'R');
    assertEqual(rgba[1], 255, 'G');
    assertEqual(rgba[2], 0,   'B');
});

test('BGR 纯蓝色 → RGBA B=255', () => {
    const raw = new Uint8Array([255, 0, 0]); // BGR blue
    const rgba = bgrToRgba(raw, 1, 1, 3);
    assertEqual(rgba[0], 0,   'R');
    assertEqual(rgba[1], 0,   'G');
    assertEqual(rgba[2], 255, 'B');
});

test('灰度图像 (ch=1) 展开为 RGB 相等', () => {
    const raw = new Uint8Array([128]);
    const rgba = bgrToRgba(raw, 1, 1, 1);
    assertEqual(rgba[0], 128, 'R');
    assertEqual(rgba[1], 128, 'G');
    assertEqual(rgba[2], 128, 'B');
    assertEqual(rgba[3], 255, 'A');
});

test('BGRA 通道转换保留 Alpha', () => {
    const raw = new Uint8Array([50, 100, 200, 180]); // B=50 G=100 R=200 A=180
    const rgba = bgrToRgba(raw, 1, 1, 4);
    assertEqual(rgba[0], 200, 'R');
    assertEqual(rgba[1], 100, 'G');
    assertEqual(rgba[2], 50,  'B');
    assertEqual(rgba[3], 180, 'A');
});

test('2x2 BGR 图像转换（读取测试文件）', () => {
    const fs = require('fs');
    const path = require('path');
    const binPath = path.join(__dirname, 'raw_8x8_bgr.bin');
    const raw = new Uint8Array(fs.readFileSync(binPath));
    assertEqual(raw.length, 8 * 8 * 3, '文件大小');
    const rgba = bgrToRgba(raw, 8, 8, 3);
    // 左上角 (0,0) 应是红色 (BGR=0,0,255 → RGBA=255,0,0,255)
    assertEqual(rgba[0], 255, '(0,0) R');
    assertEqual(rgba[1], 0,   '(0,0) G');
    assertEqual(rgba[2], 0,   '(0,0) B');
    // 右上角 (4,0) 应是绿色 (BGR=0,255,0 → RGBA=0,255,0,255)
    const idx4 = 4 * 4; // x=4, y=0
    assertEqual(rgba[idx4], 0,   '(4,0) R');
    assertEqual(rgba[idx4+1], 255, '(4,0) G');
    assertEqual(rgba[idx4+2], 0,  '(4,0) B');
});

// ─── 3. NumPy shape 字符串解析 ────────────────────────────────────────────
console.log('\n[3] NumPy shape 解析');

function parseNumpyShape(shapeStr) {
    const s = shapeStr.replace(/^'|'$/g, '').trim();
    const m = s.match(/^\((\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
    if (!m) { return null; }
    return {
        height: parseInt(m[1]),
        width:  parseInt(m[2]),
        channels: m[3] ? parseInt(m[3]) : 1
    };
}

test("解析 '(480, 640, 3)' → H=480 W=640 C=3", () => {
    const r = parseNumpyShape("(480, 640, 3)");
    assert(r !== null, 'should parse');
    assertEqual(r.height, 480);
    assertEqual(r.width, 640);
    assertEqual(r.channels, 3);
});

test("解析 '(1080, 1920)' → H=1080 W=1920 C=1", () => {
    const r = parseNumpyShape("(1080, 1920)");
    assert(r !== null, 'should parse');
    assertEqual(r.height, 1080);
    assertEqual(r.width, 1920);
    assertEqual(r.channels, 1);
});

test("解析 '(100, 100, 4)' → C=4 (BGRA)", () => {
    const r = parseNumpyShape("(100, 100, 4)");
    assert(r !== null);
    assertEqual(r.channels, 4);
});

test("带引号的输出 \"'(64, 64, 1)'\" 被剥离", () => {
    const r = parseNumpyShape("'(64, 64, 1)'");
    assert(r !== null);
    assertEqual(r.channels, 1);
});

test("无效输入 'hello' → null", () => {
    assert(parseNumpyShape('hello') === null, 'should return null');
});

test("tuple 中有空格 '(200, 300,  3)' 依然解析", () => {
    const r = parseNumpyShape("(200, 300,  3)");
    assert(r !== null);
    assertEqual(r.width, 300);
});

// ─── 4. 图像尺寸边界检查 ─────────────────────────────────────────────────
console.log('\n[4] 尺寸边界检查');

function isValidSize(w, h, ch) {
    return w > 0 && h > 0 && w <= 8192 && h <= 8192 && ch >= 1 && ch <= 4;
}

test('正常尺寸 640x480x3 → valid', () => assert(isValidSize(640, 480, 3)));
test('零宽度 0x480 → invalid',      () => assert(!isValidSize(0, 480, 3)));
test('超大尺寸 8193x100 → invalid', () => assert(!isValidSize(8193, 100, 3)));
test('5通道 → invalid',             () => assert(!isValidSize(100, 100, 5)));
test('最大允许 8192x8192x4 → valid',() => assert(isValidSize(8192, 8192, 4)));

// ─── 5. 预期字节数验证（base64 长度校验） ───────────────────────────────
console.log('\n[5] Base64 长度校验');

function validateBase64Size(b64, w, h, ch) {
    const expected = w * h * ch;
    const decoded  = Math.floor(b64.length * 3 / 4);
    return Math.abs(decoded - expected) <= 4; // 允许 padding 误差
}

test('正确大小的 base64 通过校验', () => {
    const raw = Buffer.alloc(8 * 8 * 3);
    const b64 = raw.toString('base64');
    assert(validateBase64Size(b64, 8, 8, 3));
});

test('大小不符的 base64 被拒绝', () => {
    const b64 = Buffer.alloc(10).toString('base64');
    assert(!validateBase64Size(b64, 640, 480, 3));
});

// ─── 结果汇总 ─────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
if (failed > 0) { process.exit(1); }

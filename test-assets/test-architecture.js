const { inferImageLayout, isValidBase64ByteLength } = require('../out/core/imageLayout');
const { VisualizationStore } = require('../out/core/visualizationStore');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log('  PASS:', name);
        passed++;
    } catch (error) {
        console.error('  FAIL:', name, error.message);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) { throw new Error(message || 'assertion failed'); }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'value'}: expected ${expected}, got ${actual}`);
    }
}

console.log('\n[Architecture] image layout inference');

test('infers HW grayscale layout', () => {
    const layout = inferImageLayout([480, 640]);
    assert(layout);
    assertEqual(layout.transform, 'hw');
    assertEqual(layout.channels, 1);
});

test('infers HWC and CHW layouts', () => {
    assertEqual(inferImageLayout([480, 640, 3]).transform, 'hwc');
    assertEqual(inferImageLayout([3, 480, 640]).transform, 'chw');
});

test('infers first image from NHWC and NCHW batches', () => {
    assertEqual(inferImageLayout([8, 224, 224, 3]).transform, 'nhwc-first');
    assertEqual(inferImageLayout([8, 3, 224, 224]).transform, 'nchw-first');
});

test('rejects non-image tensor shapes', () => {
    assertEqual(inferImageLayout([8, 16, 32]), null);
    assertEqual(inferImageLayout([100]), null);
});

test('validates exact base64 byte lengths', () => {
    const data = Buffer.alloc(17).toString('base64');
    assert(isValidBase64ByteLength(data, 17));
    assert(!isValidBase64ByteLength(data, 19));
});

console.log('\n[Architecture] visualization store');

function image(id, name, source) {
    return {
        id,
        kind: 'image',
        name,
        source,
        width: 2,
        height: 2,
        channels: 1,
        dtype: 'uint8',
        channelOrder: 'gray',
        encoding: 'base64',
        base64Data: 'AAAAAA==',
        isFile: source === 'file'
    };
}

test('upserts scanned variables by stable key', () => {
    const store = new VisualizationStore();
    store.upsert(image('first', 'img', 'scan'), 'scan:img');
    store.upsert(image('second', 'img', 'scan'), 'scan:img');
    assertEqual(store.list().length, 1);
    assertEqual(store.list()[0].id, 'second');
});

test('tracks and removes watch expressions independently', () => {
    const store = new VisualizationStore();
    store.addWatchExpression('tensor');
    store.upsert(image('watch-id', 'tensor', 'watch'), 'watch:tensor');
    assert(store.hasWatchExpressions());
    store.removeById('watch-id');
    assert(!store.hasWatchExpressions());
});

test('debug cleanup preserves file visualizations', () => {
    const store = new VisualizationStore();
    store.addFile(image('file-id', 'photo.png', 'file'));
    store.upsert(image('scan-id', 'img', 'scan'));
    store.clearDebugItems();
    assertEqual(store.list().length, 1);
    assertEqual(store.list()[0].source, 'file');
});

test('reorders one visible group without moving other sources', () => {
    const store = new VisualizationStore();
    store.upsert(image('local-a', 'a', 'scan'), 'scan:a');
    store.upsert(image('watch-a', 'watch', 'watch'), 'watch:watch');
    store.upsert(image('local-b', 'b', 'scan'), 'scan:b');
    store.reorder(['local-b', 'local-a']);
    assertEqual(store.list().map(item => item.id).join(','), 'local-b,watch-a,local-a');
});

console.log(`\nArchitecture tests: ${passed} passed, ${failed} failed`);
if (failed > 0) { process.exit(1); }

export type ImageLayoutTransform = 'hw' | 'hwc' | 'chw' | 'nhwc-first' | 'nchw-first';

export interface ImageLayout {
    width: number;
    height: number;
    channels: number;
    transform: ImageLayoutTransform;
}

const IMAGE_CHANNEL_COUNTS = new Set([1, 3, 4]);

export function inferImageLayout(shape: readonly number[]): ImageLayout | null {
    if (shape.some(dimension => !Number.isInteger(dimension) || dimension <= 0)) { return null; }

    if (shape.length === 2) {
        return { height: shape[0], width: shape[1], channels: 1, transform: 'hw' };
    }

    if (shape.length === 3) {
        if (IMAGE_CHANNEL_COUNTS.has(shape[2])) {
            return { height: shape[0], width: shape[1], channels: shape[2], transform: 'hwc' };
        }
        if (IMAGE_CHANNEL_COUNTS.has(shape[0])) {
            return { height: shape[1], width: shape[2], channels: shape[0], transform: 'chw' };
        }
        return null;
    }

    if (shape.length === 4 && shape[0] > 0) {
        if (IMAGE_CHANNEL_COUNTS.has(shape[3])) {
            return { height: shape[1], width: shape[2], channels: shape[3], transform: 'nhwc-first' };
        }
        if (IMAGE_CHANNEL_COUNTS.has(shape[1])) {
            return { height: shape[2], width: shape[3], channels: shape[1], transform: 'nchw-first' };
        }
    }

    return null;
}

export function isValidImageSize(layout: Pick<ImageLayout, 'width' | 'height' | 'channels'>): boolean {
    return layout.width > 0 && layout.height > 0 &&
        layout.width <= 8192 && layout.height <= 8192 &&
        layout.channels >= 1 && layout.channels <= 4;
}

export function isValidBase64ByteLength(base64Data: string, expectedBytes: number): boolean {
    if (!base64Data || expectedBytes <= 0) { return false; }
    const padding = base64Data.endsWith('==') ? 2 : (base64Data.endsWith('=') ? 1 : 0);
    const decodedBytes = Math.floor(base64Data.length * 3 / 4) - padding;
    return Math.abs(decodedBytes - expectedBytes) <= 1;
}

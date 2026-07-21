import { ChannelOrder, ImageVisualization } from '../../core/visualization';
import { ImageLayout, inferImageLayout, isValidBase64ByteLength, isValidImageSize } from '../../core/imageLayout';
import { ContainerExtractor, ExtractionContext, ExtractionTarget } from '../types';
import { parseDebuggerJson, unwrapDebuggerString } from './pythonResult';

interface PythonArrayMetadata {
    shape: number[];
    dtype?: string;
    device?: string;
}

export abstract class PythonImageExtractor implements ContainerExtractor {
    public abstract readonly id: string;

    protected abstract readonly channelOrder: ChannelOrder;

    public abstract canExtract(target: ExtractionTarget): boolean;

    protected abstract metadataExpression(expression: string): string;

    protected abstract arrayExpression(expression: string): string;

    public async extract(target: ExtractionTarget, context: ExtractionContext): Promise<ImageVisualization | null> {
        try {
            const metadataResult = await context.dap.evaluate(
                this.metadataExpression(target.expression),
                context.frameId,
                'watch'
            );
            const metadata = parseDebuggerJson<PythonArrayMetadata>(metadataResult.result);
            if (!metadata || !Array.isArray(metadata.shape)) { return null; }

            const layout = inferImageLayout(metadata.shape.map(Number));
            if (!layout || !isValidImageSize(layout)) { return null; }

            const transformedArray = this.applyLayout(this.arrayExpression(target.expression), layout);
            const uint8Array = this.normalizeToUint8(transformedArray);
            const dataExpression = `__import__('base64').b64encode(${uint8Array}.tobytes()).decode()`;
            const dataResult = await context.dap.evaluate(dataExpression, context.frameId, 'clipboard');
            const base64Data = unwrapDebuggerString(dataResult.result);
            const expectedBytes = layout.width * layout.height * layout.channels;
            if (!isValidBase64ByteLength(base64Data, expectedBytes)) { return null; }

            const shapeInfo = `shape=${metadata.shape.join('x')} (${layout.transform})`;
            const typeDetails = [target.type, metadata.dtype, metadata.device, shapeInfo].filter(Boolean).join(' | ');
            return {
                id: context.createId(this.id, target.expression),
                kind: 'image',
                name: target.expression,
                width: layout.width,
                height: layout.height,
                channels: layout.channels,
                dtype: 'uint8',
                channelOrder: layout.channels === 1 ? 'gray' : this.channelOrder,
                encoding: 'base64',
                base64Data,
                isFile: false,
                source: context.source,
                typeInfo: typeDetails || undefined,
                origin: {
                    providerId: 'python',
                    extractorId: this.id,
                    runtime: context.dap.session.type
                }
            };
        } catch {
            return null;
        }
    }

    private applyLayout(arrayExpression: string, layout: ImageLayout): string {
        switch (layout.transform) {
            case 'hw':
            case 'hwc':
                return `(${arrayExpression})`;
            case 'chw':
                return `__import__('numpy').transpose((${arrayExpression}), (1, 2, 0))`;
            case 'nhwc-first':
                return `(${arrayExpression})[0]`;
            case 'nchw-first':
                return `__import__('numpy').transpose((${arrayExpression})[0], (1, 2, 0))`;
        }
    }

    private normalizeToUint8(arrayExpression: string): string {
        return `(lambda a: __import__('numpy').clip(` +
            `(a * 255 if a.dtype.kind == 'f' and a.size and float(a.min()) >= 0 and float(a.max()) <= 1 else a), ` +
            `0, 255).astype('uint8'))(${arrayExpression})`;
    }
}

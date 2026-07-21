import { ImageVisualization } from '../../core/visualization';
import { isValidImageSize } from '../../core/imageLayout';
import { DapVariable } from '../../debug/types';
import { ContainerExtractor, ExtractionContext, ExtractionTarget } from '../types';
import { selectCppDialect } from './cppDialect';

const MAX_DEBUG_IMAGE_BYTES = 16_000_000;

interface MatMetadata {
    width: number;
    height: number;
    channels: number;
    elementBytes: number;
    rowStride: number;
}

export class OpenCvMatExtractor implements ContainerExtractor {
    public readonly id = 'opencv-mat';

    public canExtract(target: ExtractionTarget): boolean {
        if (!target.type) { return true; }
        const type = target.type.toLowerCase();
        return type.includes('cv::mat') && !type.includes('gpumat');
    }

    public async extract(target: ExtractionTarget, context: ExtractionContext): Promise<ImageVisualization | null> {
        try {
            const children = target.variablesReference
                ? await context.dap.getVariables(target.variablesReference)
                : [];
            const metadata = await this.readMetadata(target.expression, children, context);
            if (!metadata || metadata.elementBytes !== 1 || !isValidImageSize(metadata)) { return null; }

            const byteCount = metadata.width * metadata.height * metadata.channels;
            if (byteCount <= 0 || byteCount > MAX_DEBUG_IMAGE_BYTES) { return null; }

            const raw = await this.readBytes(target.expression, children, metadata, byteCount, context);
            if (!raw || raw.length !== byteCount) { return null; }

            return {
                id: context.createId(this.id, target.expression),
                kind: 'image',
                name: target.expression,
                width: metadata.width,
                height: metadata.height,
                channels: metadata.channels,
                dtype: 'uint8',
                channelOrder: metadata.channels === 1 ? 'gray' : (metadata.channels === 4 ? 'bgra' : 'bgr'),
                encoding: 'base64',
                base64Data: Buffer.from(raw).toString('base64'),
                isFile: false,
                source: context.source,
                typeInfo: target.type,
                origin: {
                    providerId: 'cpp',
                    extractorId: this.id,
                    runtime: selectCppDialect(context.dap.session).id
                }
            };
        } catch {
            return null;
        }
    }

    private async readMetadata(
        expression: string,
        children: readonly DapVariable[],
        context: ExtractionContext
    ): Promise<MatMetadata | null> {
        let height = this.childInteger(children, ['rows']);
        let width = this.childInteger(children, ['cols']);
        let channels = this.childInteger(children, ['channels', 'channels()']);

        height ||= await this.evaluateInteger(`${expression}.rows`, context);
        width ||= await this.evaluateInteger(`${expression}.cols`, context);
        channels ||= await this.evaluateInteger(`${expression}.channels()`, context);
        const elementBytes = await this.evaluateInteger(`${expression}.elemSize1()`, context) || 1;
        const rowBytes = width * channels * elementBytes;
        const rowStride = await this.evaluateFirstInteger([
            `${expression}.step[0]`,
            `${expression}.step.p[0]`,
            `${expression}.step`
        ], context) || rowBytes;

        if (!width || !height || !channels) { return null; }
        return { width, height, channels, elementBytes, rowStride };
    }

    private async readBytes(
        expression: string,
        children: readonly DapVariable[],
        metadata: MatMetadata,
        byteCount: number,
        context: ExtractionContext
    ): Promise<Uint8Array | null> {
        const dataChild = children.find(child => {
            const name = child.name.toLowerCase();
            return name === 'data' || name === 'data.ptr';
        });

        if (dataChild?.variablesReference) {
            const values = await context.dap.getVariables(dataChild.variablesReference, byteCount);
            if (values.length >= byteCount) {
                const raw = new Uint8Array(byteCount);
                for (let index = 0; index < byteCount; index++) {
                    raw[index] = this.parseInteger(values[index].value) ?? 0;
                }
                return raw;
            }
        }

        let memoryReference = dataChild?.memoryReference;
        if (!memoryReference) {
            const pointer = await context.dap.evaluate(`${expression}.data`, context.frameId, 'watch');
            memoryReference = pointer.memoryReference ?? this.pointerResult(pointer.result);
        }
        if (!memoryReference) { return null; }

        const rowBytes = metadata.width * metadata.channels * metadata.elementBytes;
        const readCount = metadata.rowStride * (metadata.height - 1) + rowBytes;
        const response = await context.dap.readMemory(memoryReference, readCount);
        if (!response.data || response.unreadableBytes) { return null; }
        const buffer = Buffer.from(response.data, 'base64');
        if (buffer.length < readCount) { return null; }

        if (metadata.rowStride === rowBytes) { return new Uint8Array(buffer.subarray(0, byteCount)); }

        const packed = new Uint8Array(byteCount);
        for (let row = 0; row < metadata.height; row++) {
            const sourceStart = row * metadata.rowStride;
            packed.set(buffer.subarray(sourceStart, sourceStart + rowBytes), row * rowBytes);
        }
        return packed;
    }

    private childInteger(children: readonly DapVariable[], names: readonly string[]): number {
        for (const child of children) {
            if (!names.includes(child.name.toLowerCase())) { continue; }
            const value = this.parseInteger(child.value);
            if (value !== null) { return value; }
        }
        return 0;
    }

    private async evaluateInteger(expression: string, context: ExtractionContext): Promise<number> {
        try {
            const dialect = selectCppDialect(context.dap.session);
            const result = await context.dap.evaluate(dialect.integer(expression), context.frameId, 'watch');
            return this.parseInteger(result.result) ?? 0;
        } catch {
            return 0;
        }
    }

    private async evaluateFirstInteger(expressions: readonly string[], context: ExtractionContext): Promise<number> {
        for (const expression of expressions) {
            const value = await this.evaluateInteger(expression, context);
            if (value > 0) { return value; }
        }
        return 0;
    }

    private parseInteger(value: unknown): number | null {
        const text = String(value ?? '').trim();
        const hex = text.match(/0x[0-9a-f]+/i);
        if (hex) { return parseInt(hex[0], 16); }
        const decimal = text.match(/-?\d+/);
        if (!decimal) { return null; }
        const parsed = parseInt(decimal[0], 10);
        return Number.isFinite(parsed) ? parsed : null;
    }

    private pointerResult(value: unknown): string | undefined {
        const match = String(value ?? '').match(/0x[0-9a-f]+/i);
        return match?.[0];
    }
}

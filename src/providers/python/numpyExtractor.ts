import { ExtractionTarget } from '../types';
import { PythonImageExtractor } from './pythonImageExtractor';

export class NumpyExtractor extends PythonImageExtractor {
    public readonly id = 'numpy';
    protected readonly channelOrder = 'bgr' as const;

    public canExtract(target: ExtractionTarget): boolean {
        if (!target.type) { return true; }
        const type = target.type.toLowerCase();
        return type.includes('ndarray') || type.includes('numpy');
    }

    protected metadataExpression(expression: string): string {
        const array = this.arrayExpression(expression);
        return `__import__('json').dumps({'shape': list((${array}).shape), 'dtype': str((${array}).dtype)})`;
    }

    protected arrayExpression(expression: string): string {
        return `__import__('numpy').asarray(${expression})`;
    }
}

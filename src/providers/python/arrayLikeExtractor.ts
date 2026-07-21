import { ExtractionTarget } from '../types';
import { PythonImageExtractor } from './pythonImageExtractor';

export class ArrayLikeExtractor extends PythonImageExtractor {
    public readonly id = 'python-array-like';
    protected readonly channelOrder = 'bgr' as const;

    public canExtract(_target: ExtractionTarget): boolean {
        return true;
    }

    protected metadataExpression(expression: string): string {
        const array = this.arrayExpression(expression);
        return `__import__('json').dumps({'shape': list((${array}).shape), 'dtype': str((${array}).dtype)})`;
    }

    protected arrayExpression(expression: string): string {
        return `__import__('numpy').asarray(${expression})`;
    }
}

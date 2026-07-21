import { ExtractionTarget } from '../types';
import { PythonImageExtractor } from './pythonImageExtractor';

export class TorchTensorExtractor extends PythonImageExtractor {
    public readonly id = 'torch-tensor';
    protected readonly channelOrder = 'rgb' as const;

    public canExtract(target: ExtractionTarget): boolean {
        if (!target.type) { return true; }
        const type = target.type.toLowerCase();
        return type.includes('tensor') || type.includes('torch');
    }

    protected metadataExpression(expression: string): string {
        return `__import__('json').dumps({` +
            `'shape': list((${expression}).shape), ` +
            `'dtype': str((${expression}).dtype), ` +
            `'device': str((${expression}).device)` +
            `})`;
    }

    protected arrayExpression(expression: string): string {
        return `(${expression}).detach().cpu().numpy()`;
    }
}

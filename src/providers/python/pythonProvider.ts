import * as vscode from 'vscode';
import { VisualizationItem } from '../../core/visualization';
import { DapVariable } from '../../debug/types';
import { DebugVisualizationProvider, ExtractionContext, ExtractionTarget, ContainerExtractor } from '../types';
import { ArrayLikeExtractor } from './arrayLikeExtractor';
import { NumpyExtractor } from './numpyExtractor';
import { PillowExtractor } from './pillowExtractor';
import { TorchTensorExtractor } from './torchTensorExtractor';

export class PythonVisualizationProvider implements DebugVisualizationProvider {
    public readonly id = 'python';

    private readonly extractors: readonly ContainerExtractor[] = [
        new TorchTensorExtractor(),
        new NumpyExtractor(),
        new PillowExtractor(),
        new ArrayLikeExtractor()
    ];

    public supports(session: vscode.DebugSession): boolean {
        const type = session.type.toLowerCase();
        return type === 'python' || type === 'debugpy' || type.includes('python');
    }

    public async scan(context: ExtractionContext): Promise<VisualizationItem[]> {
        const results: VisualizationItem[] = [];
        const seen = new Set<string>();

        for (const scope of await context.dap.getScopes(context.frameId)) {
            if (!scope.variablesReference || scope.expensive) { continue; }
            for (const variable of await context.dap.getVariables(scope.variablesReference)) {
                if (seen.has(variable.name) || !this.isCandidate(variable)) { continue; }
                seen.add(variable.name);
                const item = await this.extractTarget({
                    expression: variable.name,
                    type: variable.type,
                    variablesReference: variable.variablesReference,
                    variable
                }, context);
                if (item) { results.push(item); }
            }
        }

        return results;
    }

    public async extractExpression(expression: string, context: ExtractionContext): Promise<VisualizationItem | null> {
        try {
            const evaluated = await context.dap.evaluate(expression, context.frameId, 'watch');
            return await this.extractTarget({
                expression,
                type: evaluated.type,
                variablesReference: evaluated.variablesReference
            }, context);
        } catch {
            return await this.extractTarget({ expression }, context);
        }
    }

    private async extractTarget(target: ExtractionTarget, context: ExtractionContext): Promise<VisualizationItem | null> {
        for (const extractor of this.extractors) {
            if (!extractor.canExtract(target)) { continue; }
            const item = await extractor.extract(target, context);
            if (item) { return item; }
        }
        return null;
    }

    private isCandidate(variable: DapVariable): boolean {
        const name = variable.name.toLowerCase();
        const type = (variable.type ?? '').toLowerCase();
        return type.includes('ndarray') || type.includes('numpy') ||
            type.includes('tensor') || type.includes('torch') ||
            type.includes('pil.') || type.includes('image.image') ||
            /^(img|image|frame|mask|gray|rgb|bgr|depth)$/.test(name) ||
            /_(img|image|frame|tensor)$/.test(name);
    }
}

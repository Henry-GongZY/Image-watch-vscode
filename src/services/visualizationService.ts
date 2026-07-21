import * as vscode from 'vscode';
import { VisualizationItem, VisualizationSource } from '../core/visualization';
import { DapClient } from '../debug/dapClient';
import { CppVisualizationProvider } from '../providers/cpp/cppProvider';
import { ProviderRegistry } from '../providers/providerRegistry';
import { PythonVisualizationProvider } from '../providers/python/pythonProvider';
import { ExtractionContext } from '../providers/types';

export class UnsupportedDebugSessionError extends Error {}
export class NoActiveFrameError extends Error {}

export class VisualizationService {
    private idCounter = 0;

    public constructor(
        private readonly registry = new ProviderRegistry([
            new PythonVisualizationProvider(),
            new CppVisualizationProvider()
        ])
    ) {}

    public async scan(session: vscode.DebugSession): Promise<VisualizationItem[]> {
        const prepared = await this.prepare(session, 'scan');
        return await prepared.provider.scan(prepared.context);
    }

    public async extractExpression(
        expression: string,
        session: vscode.DebugSession
    ): Promise<VisualizationItem | null> {
        const prepared = await this.prepare(session, 'watch');
        return await prepared.provider.extractExpression(expression, prepared.context);
    }

    private async prepare(session: vscode.DebugSession, source: VisualizationSource) {
        const provider = this.registry.find(session);
        if (!provider) {
            throw new UnsupportedDebugSessionError(`Unsupported debugger: ${session.type}`);
        }

        const dap = new DapClient(session);
        const frameId = await dap.getActiveFrameId();
        if (frameId === null) {
            throw new NoActiveFrameError('Pause the debugger on a stack frame before scanning.');
        }

        const context: ExtractionContext = {
            dap,
            frameId,
            source,
            createId: (prefix, name) => {
                const safeName = name.replace(/[^a-z0-9_-]+/gi, '_').slice(0, 48) || 'value';
                return `${prefix}_${safeName}_${this.idCounter++}`;
            }
        };
        return { provider, context };
    }
}

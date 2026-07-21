import * as vscode from 'vscode';
import { DebugVisualizationProvider } from './types';

export class ProviderRegistry {
    public constructor(private readonly providers: readonly DebugVisualizationProvider[]) {}

    public find(session: vscode.DebugSession): DebugVisualizationProvider | undefined {
        return this.providers.find(provider => provider.supports(session));
    }

    public list(): readonly DebugVisualizationProvider[] {
        return this.providers;
    }
}

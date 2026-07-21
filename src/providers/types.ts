import * as vscode from 'vscode';
import { VisualizationItem, VisualizationSource } from '../core/visualization';
import { DapClient } from '../debug/dapClient';
import { DapVariable } from '../debug/types';

export interface ExtractionTarget {
    expression: string;
    type?: string;
    variablesReference?: number;
    variable?: DapVariable;
}

export interface ExtractionContext {
    dap: DapClient;
    frameId: number;
    source: VisualizationSource;
    createId(prefix: string, name: string): string;
}

export interface ContainerExtractor {
    readonly id: string;
    canExtract(target: ExtractionTarget): boolean;
    extract(target: ExtractionTarget, context: ExtractionContext): Promise<VisualizationItem | null>;
}

export interface DebugVisualizationProvider {
    readonly id: string;
    supports(session: vscode.DebugSession): boolean;
    scan(context: ExtractionContext): Promise<VisualizationItem[]>;
    extractExpression(expression: string, context: ExtractionContext): Promise<VisualizationItem | null>;
}

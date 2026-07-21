import * as vscode from 'vscode';
import { DapEvaluateResult, DapReadMemoryResult, DapScope, DapVariable } from './types';

export type EvaluationContext = 'watch' | 'hover' | 'repl' | 'clipboard';

export class DapClient {
    public constructor(public readonly session: vscode.DebugSession) {}

    public async request<T>(command: string, args: Record<string, unknown>, label: string): Promise<T> {
        console.log(`[Image Watch] DAP ${label} -> ${command}`, JSON.stringify(args).slice(0, 500));
        try {
            return await this.session.customRequest(command, args) as T;
        } catch (error) {
            console.log(`[Image Watch] DAP ${label} failed`, error);
            throw error;
        }
    }

    public async getActiveFrameId(): Promise<number | null> {
        const activeItem = vscode.debug.activeStackItem;
        let threadId: number;

        if (activeItem?.session.id === this.session.id) {
            threadId = activeItem.threadId;
            if ('frameId' in activeItem) { return activeItem.frameId; }
        } else {
            threadId = await this.getFirstThreadId();
        }

        try {
            const response = await this.request<{ stackFrames?: { id: number }[] }>(
                'stackTrace',
                { threadId, startFrame: 0, levels: 1 },
                'activeFrame'
            );
            return response.stackFrames?.[0]?.id ?? null;
        } catch {
            return null;
        }
    }

    public async getScopes(frameId: number): Promise<DapScope[]> {
        const response = await this.request<{ scopes?: DapScope[] }>('scopes', { frameId }, 'scopes');
        return response.scopes ?? [];
    }

    public async getVariables(variablesReference: number, count?: number): Promise<DapVariable[]> {
        const args: Record<string, unknown> = { variablesReference };
        if (count !== undefined) { args.count = count; }
        const response = await this.request<{ variables?: DapVariable[] }>('variables', args, 'variables');
        return response.variables ?? [];
    }

    public async evaluate(expression: string, frameId: number, context: EvaluationContext = 'watch'): Promise<DapEvaluateResult> {
        return await this.request<DapEvaluateResult>('evaluate', { expression, frameId, context }, 'evaluate');
    }

    public async readMemory(memoryReference: string, count: number, offset = 0): Promise<DapReadMemoryResult> {
        return await this.request<DapReadMemoryResult>('readMemory', { memoryReference, count, offset }, 'readMemory');
    }

    private async getFirstThreadId(): Promise<number> {
        try {
            const response = await this.request<{ threads?: { id: number }[] }>('threads', {}, 'threads');
            return response.threads?.[0]?.id ?? 1;
        } catch {
            return 1;
        }
    }
}

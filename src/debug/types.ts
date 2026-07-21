export interface DapVariable {
    name: string;
    value?: string;
    type?: string;
    variablesReference: number;
    memoryReference?: string;
}

export interface DapScope {
    name?: string;
    variablesReference: number;
    expensive?: boolean;
}

export interface DapEvaluateResult {
    result?: string;
    type?: string;
    variablesReference: number;
    memoryReference?: string;
}

export interface DapReadMemoryResult {
    address?: string;
    data?: string;
    unreadableBytes?: number;
}

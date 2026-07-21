import * as vscode from 'vscode';

export interface CppDebuggerDialect {
    readonly id: string;
    integer(expression: string): string;
}

class StandardCppDialect implements CppDebuggerDialect {
    public constructor(public readonly id: string) {}

    public integer(expression: string): string {
        return `(int)(${expression})`;
    }
}

const DIALECTS: Record<string, CppDebuggerDialect> = {
    cppdbg: new StandardCppDialect('gdb-mi'),
    cppvsdbg: new StandardCppDialect('visual-cpp'),
    lldb: new StandardCppDialect('lldb'),
    codelldb: new StandardCppDialect('lldb'),
    gdb: new StandardCppDialect('gdb')
};

const FALLBACK_DIALECT = new StandardCppDialect('generic-cpp');

export function isCppDebugSession(session: vscode.DebugSession): boolean {
    const type = session.type.toLowerCase();
    return Boolean(DIALECTS[type]) || type.includes('cpp') || type.includes('gdb') || type.includes('lldb');
}

export function selectCppDialect(session: vscode.DebugSession): CppDebuggerDialect {
    return DIALECTS[session.type.toLowerCase()] ?? FALLBACK_DIALECT;
}

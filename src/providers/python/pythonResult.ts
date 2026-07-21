export function unwrapDebuggerString(value: unknown): string {
    const text = String(value ?? '').trim();
    if (text.length >= 2) {
        const first = text[0], last = text[text.length - 1];
        if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
            return text.slice(1, -1);
        }
    }
    return text;
}

export function parseDebuggerJson<T>(value: unknown): T | null {
    const text = unwrapDebuggerString(value);
    try {
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

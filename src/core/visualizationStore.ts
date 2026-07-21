import { VisualizationItem, VisualizationSource } from './visualization';

export class VisualizationStore {
    private readonly items = new Map<string, VisualizationItem>();
    private readonly watchExpressions = new Set<string>();

    public list(): VisualizationItem[] {
        return Array.from(this.items.values());
    }

    public addFile(item: VisualizationItem): void {
        this.items.set(`file:${item.id}`, { ...item, source: 'file' });
    }

    public upsert(item: VisualizationItem, stableKey?: string): void {
        const key = stableKey ?? this.keyFor(item.source, item.name, item.id);
        this.items.set(key, item);
    }

    public addWatchExpression(expression: string): void {
        const normalized = expression.trim();
        if (normalized) { this.watchExpressions.add(normalized); }
    }

    public removeById(id: string): void {
        for (const [key, item] of this.items) {
            if (item.id !== id) { continue; }
            this.items.delete(key);
            if (item.source === 'watch') { this.watchExpressions.delete(item.name); }
            return;
        }
    }

    public reorder(orderedIds: readonly string[]): void {
        const entries = Array.from(this.items.entries());
        const entriesById = new Map(entries.map(entry => [entry[1].id, entry] as const));
        const seen = new Set<string>();
        const orderedEntries: [string, VisualizationItem][] = [];

        for (const id of orderedIds) {
            if (seen.has(id)) { continue; }
            const entry = entriesById.get(id);
            if (!entry) { continue; }
            seen.add(id);
            orderedEntries.push(entry);
        }
        if (orderedEntries.length < 2) { return; }

        let nextOrderedIndex = 0;
        const reordered = entries.map(entry =>
            seen.has(entry[1].id) ? orderedEntries[nextOrderedIndex++] : entry
        );
        this.items.clear();
        for (const [key, item] of reordered) { this.items.set(key, item); }
    }

    public clearItems(): void {
        this.items.clear();
    }

    public clearDebugItems(): void {
        for (const [key, item] of this.items) {
            if (item.source !== 'file') { this.items.delete(key); }
        }
    }

    public getWatchExpressions(): string[] {
        return Array.from(this.watchExpressions);
    }

    public hasWatchExpressions(): boolean {
        return this.watchExpressions.size > 0;
    }

    private keyFor(source: VisualizationSource, name: string, id: string): string {
        return source === 'file' ? `file:${id}` : `${source}:${name}`;
    }
}

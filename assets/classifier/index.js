export function validateDecision(value, document, task) {
    if (!value || typeof value !== 'object')
        throw new Error('Classifier returned no decision');
    const d = value;
    if (d.schemaVersion !== 1 || d.documentId !== document.documentId || d.contentRevision !== document.contentRevision || d.taskId !== task.id)
        throw new Error('Decision belongs to another document, revision, or task');
    if (typeof d.label !== 'string' || !task.options.some(o => o.id === d.label))
        throw new Error('Decision label is outside the allowed options');
    if (typeof d.confidence !== 'number' || !Number.isFinite(d.confidence) || d.confidence < 0 || d.confidence > 1)
        throw new Error('Confidence must be between zero and one');
    if (typeof d.provider !== 'string' || !d.provider || typeof d.model !== 'string' || !d.model)
        throw new Error('Decision must identify its provider and model');
    if (d.evidence !== undefined && (!Array.isArray(d.evidence) || !d.evidence.every(e => e && Number.isInteger(e.line) && e.line > 0 && e.line <= document.text.split('\n').length && typeof e.excerpt === 'string')))
        throw new Error('Invalid evidence');
    return value;
}
export class ClassifierRegistry {
    adapters = new Map();
    register(adapter) { if (!adapter.id || this.adapters.has(adapter.id))
        throw new Error('Classifier ID must be unique'); this.adapters.set(adapter.id, adapter); }
    async classify(adapterId, document, task, signal) {
        const adapter = this.adapters.get(adapterId);
        if (!adapter)
            throw new Error('Classifier is not connected');
        if (!task.id || !task.question.trim() || task.options.length < 2 || task.options.some(o => !o.id) || new Set(task.options.map(o => o.id)).size !== task.options.length)
            throw new Error('A task needs a question and at least two distinct labels');
        signal?.throwIfAborted();
        const raw = await adapter.classify(document, task, signal);
        signal?.throwIfAborted();
        return validateDecision(raw, document, task);
    }
}

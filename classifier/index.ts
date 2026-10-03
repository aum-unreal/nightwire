/** Local, versioned extension contract. This is not the TypeSafe API wire format. */
export interface Section { id: string; text: string; line: number; level: number }
export interface MarkdownInput {
 schemaVersion: 1; documentId: string; contentRevision: string; name: string;
 title: string; text: string; headings: readonly Section[]; tags: readonly string[];
}
export interface LabelOption { id: string; description: string }
export interface ClassificationTask {
 id: string; question: string; options: readonly LabelOption[];
}
export interface Decision {
 schemaVersion: 1; documentId: string; contentRevision: string; taskId: string;
 label: string; confidence: number; provider: string; model: string;
 evidence?: readonly { line: number; excerpt: string }[];
}
export interface Classifier {
 readonly id: string;
 classify(document: MarkdownInput, task: ClassificationTask, signal?: AbortSignal): Promise<Decision>;
}
export function validateDecision(value: unknown, document: MarkdownInput, task: ClassificationTask): Decision {
 if(!value || typeof value !== 'object') throw new Error('Classifier returned no decision');
 const d = value as Record<string, unknown>;
 if(d.schemaVersion !== 1 || d.documentId !== document.documentId || d.contentRevision !== document.contentRevision || d.taskId !== task.id) throw new Error('Decision belongs to another document, revision, or task');
 if(typeof d.label !== 'string' || !task.options.some(o=>o.id===d.label)) throw new Error('Decision label is outside the allowed options');
 if(typeof d.confidence !== 'number' || !Number.isFinite(d.confidence) || d.confidence<0 || d.confidence>1) throw new Error('Confidence must be between zero and one');
 if(typeof d.provider !== 'string' || !d.provider || typeof d.model !== 'string' || !d.model) throw new Error('Decision must identify its provider and model');
 if(d.evidence !== undefined && (!Array.isArray(d.evidence) || !d.evidence.every(e=>e && Number.isInteger(e.line) && e.line>0 && e.line<=document.text.split('\n').length && typeof e.excerpt==='string'))) throw new Error('Invalid evidence');
 return value as Decision;
}
export class ClassifierRegistry {
 private adapters = new Map<string, Classifier>();
 register(adapter: Classifier) { if(!adapter.id || this.adapters.has(adapter.id)) throw new Error('Classifier ID must be unique'); this.adapters.set(adapter.id, adapter); }
 async classify(adapterId: string, document: MarkdownInput, task: ClassificationTask, signal?: AbortSignal): Promise<Decision> {
  const adapter = this.adapters.get(adapterId); if(!adapter) throw new Error('Classifier is not connected');
  if(!task.id || !task.question.trim() || task.options.length<2 || task.options.some(o=>!o.id) || new Set(task.options.map(o=>o.id)).size!==task.options.length) throw new Error('A task needs a question and at least two distinct labels');
  signal?.throwIfAborted(); const raw = await adapter.classify(document,task,signal); signal?.throwIfAborted(); return validateDecision(raw,document,task);
 }
}

/** Local, versioned extension contract. This is not the TypeSafe API wire format. */
export interface Section {
    id: string;
    text: string;
    line: number;
    level: number;
}
export interface MarkdownInput {
    schemaVersion: 1;
    documentId: string;
    contentRevision: string;
    name: string;
    title: string;
    text: string;
    headings: readonly Section[];
    tags: readonly string[];
}
export interface LabelOption {
    id: string;
    description: string;
}
export interface ClassificationTask {
    id: string;
    question: string;
    options: readonly LabelOption[];
}
export interface Decision {
    schemaVersion: 1;
    documentId: string;
    contentRevision: string;
    taskId: string;
    label: string;
    confidence: number;
    provider: string;
    model: string;
    evidence?: readonly {
        line: number;
        excerpt: string;
    }[];
}
export interface Classifier {
    readonly id: string;
    classify(document: MarkdownInput, task: ClassificationTask, signal?: AbortSignal): Promise<Decision>;
}
export declare function validateDecision(value: unknown, document: MarkdownInput, task: ClassificationTask): Decision;
export declare class ClassifierRegistry {
    private adapters;
    register(adapter: Classifier): void;
    classify(adapterId: string, document: MarkdownInput, task: ClassificationTask, signal?: AbortSignal): Promise<Decision>;
}

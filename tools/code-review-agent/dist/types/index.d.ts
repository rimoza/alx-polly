export interface CodeFile {
    path: string;
    content: string;
    lines: string[];
    size: number;
    extension: string;
}
export interface GitDiff {
    file: string;
    additions: number;
    deletions: number;
    changes: DiffChange[];
}
export interface DiffChange {
    type: 'add' | 'remove' | 'modify';
    lineNumber: number;
    content: string;
    context?: string[];
}
export interface ReviewComment {
    file: string;
    line?: number;
    type: 'error' | 'warning' | 'suggestion' | 'info';
    category: 'style' | 'performance' | 'security' | 'logic' | 'documentation' | 'testing';
    message: string;
    suggestion?: string;
    severity: 1 | 2 | 3 | 4 | 5;
}
export interface CodeMetrics {
    linesOfCode: number;
    complexity: number;
    maintainabilityIndex: number;
    testCoverage?: number;
    duplicateLines?: number;
}
export interface ReviewSummary {
    totalFiles: number;
    totalLines: number;
    addedLines: number;
    removedLines: number;
    comments: ReviewComment[];
    metrics: CodeMetrics;
    score: number;
    recommendation: 'approve' | 'request_changes' | 'comment';
}
export interface CommitMessageConfig {
    type: string;
    scope?: string;
    subject: string;
    body?: string;
    footer?: string;
    breakingChange?: boolean;
}
export interface ReviewConfig {
    includeTests: boolean;
    includeDocumentation: boolean;
    strictMode: boolean;
    outputFormat: 'markdown' | 'json' | 'console';
    outputPath?: string;
    rules: ReviewRule[];
}
export interface ReviewRule {
    name: string;
    enabled: boolean;
    severity: 'error' | 'warning' | 'info';
    pattern?: RegExp;
    message: string;
}
export interface AnalysisResult {
    summary: ReviewSummary;
    commitMessage?: CommitMessageConfig;
    markdownReport?: string;
    jsonReport?: object;
}
//# sourceMappingURL=index.d.ts.map
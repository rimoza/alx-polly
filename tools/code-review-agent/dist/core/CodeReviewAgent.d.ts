import { AnalysisResult, ReviewConfig } from '../types/index.js';
export declare class CodeReviewAgent {
    private reviewEngine;
    private commitGenerator;
    private reportGenerator;
    constructor(repositoryPath?: string, config?: Partial<ReviewConfig>, outputPath?: string);
    /**
     * Perform a full code review with all features
     */
    performFullReview(): Promise<AnalysisResult>;
    /**
     * Analyze changes only (for specific commits or staged changes)
     */
    analyzeChanges(commitHash?: string): Promise<AnalysisResult>;
    /**
     * Generate commit message only
     */
    generateCommitMessage(): Promise<string>;
    /**
     * Generate markdown report from previous analysis
     */
    generateReport(analysisResult?: AnalysisResult): Promise<string>;
    /**
     * Interactive mode - let user choose what to do
     */
    runInteractive(): Promise<void>;
    /**
     * Validate commit message format
     */
    validateCommitMessage(): Promise<void>;
    /**
     * Quick status check
     */
    quickStatus(): Promise<void>;
    /**
     * Show configuration
     */
    showConfig(): void;
}
//# sourceMappingURL=CodeReviewAgent.d.ts.map
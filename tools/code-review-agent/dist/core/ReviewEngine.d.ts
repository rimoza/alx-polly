import { ReviewConfig, AnalysisResult } from '../types/index.js';
export declare class ReviewEngine {
    private git;
    private config;
    constructor(repositoryPath?: string, config?: Partial<ReviewConfig>);
    analyzeRepository(): Promise<AnalysisResult>;
    analyzeChanges(commitHash?: string): Promise<AnalysisResult>;
    private getCodeFiles;
    private getChangedFiles;
    private getGitDiffs;
    private parseGitDiff;
    private analyzeFiles;
    private analyzeFile;
    private applyRule;
    private calculateMetrics;
    private calculateScore;
    private getRecommendation;
    private getDefaultRules;
}
//# sourceMappingURL=ReviewEngine.d.ts.map
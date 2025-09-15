import { ReviewSummary, CommitMessageConfig, AnalysisResult } from '../types/index.js';
export declare class MarkdownReportGenerator {
    private outputPath;
    constructor(outputPath?: string);
    /**
     * Generate a comprehensive markdown report from analysis results
     */
    generateReport(result: AnalysisResult): Promise<string>;
    /**
     * Generate a quick summary report
     */
    generateQuickReport(summary: ReviewSummary): string;
    /**
     * Generate commit message section
     */
    generateCommitMessageSection(commitConfig: CommitMessageConfig): string;
    private buildMarkdownReport;
    private buildHeader;
    private buildExecutiveSummary;
    private buildMetricsSection;
    private buildFindingsSection;
    private buildCommitMessageSection;
    private buildRecommendationsSection;
    private buildFooter;
    private buildQuickSummary;
    private groupCommentsByFile;
    private getCommentIcon;
    private getCategoryBadge;
    private getStatusIcon;
    private getComplexityStatus;
    private getMaintainabilityStatus;
    private getCoverageStatus;
    private generateQualityChart;
    private generateRecommendations;
}
//# sourceMappingURL=MarkdownReportGenerator.d.ts.map
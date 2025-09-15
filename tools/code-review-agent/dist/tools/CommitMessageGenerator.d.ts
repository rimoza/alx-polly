import { CommitMessageConfig } from '../types/index.js';
export declare class CommitMessageGenerator {
    private git;
    constructor(repositoryPath?: string);
    /**
     * Generate a conventional commit message based on staged changes
     */
    generateCommitMessage(): Promise<CommitMessageConfig>;
    /**
     * Generate commit message from specific files or diff
     */
    generateFromDiff(filePaths?: string[]): Promise<CommitMessageConfig>;
    /**
     * Validate commit message against conventional commit format
     */
    validateCommitMessage(message: string): {
        valid: boolean;
        errors: string[];
    };
    private getStagedFiles;
    private getModifiedFiles;
    private getStagedDiffs;
    private getFilesDiffs;
    private analyzeChanges;
    private buildCommitMessage;
    private determineCommitType;
    private determineScope;
    private generateSubject;
    private generateBody;
    /**
     * Format commit message for git commit
     */
    formatCommitMessage(config: CommitMessageConfig): string;
}
//# sourceMappingURL=CommitMessageGenerator.d.ts.map
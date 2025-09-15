import { simpleGit } from 'simple-git';
export class CommitMessageGenerator {
    git;
    constructor(repositoryPath = '.') {
        this.git = simpleGit(repositoryPath);
    }
    /**
     * Generate a conventional commit message based on staged changes
     */
    async generateCommitMessage() {
        console.log('📝 Analyzing staged changes for commit message...');
        const stagedFiles = await this.getStagedFiles();
        const diffs = await this.getStagedDiffs();
        if (stagedFiles.length === 0) {
            throw new Error('No staged changes found. Please stage your changes first.');
        }
        const analysis = this.analyzeChanges(stagedFiles, diffs);
        const commitConfig = this.buildCommitMessage(analysis);
        console.log(`✅ Generated commit message: ${commitConfig.type}${commitConfig.scope ? `(${commitConfig.scope})` : ''}: ${commitConfig.subject}`);
        return commitConfig;
    }
    /**
     * Generate commit message from specific files or diff
     */
    async generateFromDiff(filePaths) {
        console.log('📝 Analyzing changes for commit message...');
        const files = filePaths || await this.getModifiedFiles();
        const diffs = await this.getFilesDiffs(files);
        const analysis = this.analyzeChanges(files, diffs);
        const commitConfig = this.buildCommitMessage(analysis);
        return commitConfig;
    }
    /**
     * Validate commit message against conventional commit format
     */
    validateCommitMessage(message) {
        const errors = [];
        // Check conventional commit format: type(scope): subject
        const conventionalPattern = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?: .{1,50}$/;
        if (!conventionalPattern.test(message.split('\n')[0])) {
            errors.push('First line must follow conventional commit format: type(scope): subject (max 50 chars)');
        }
        const lines = message.split('\n');
        // Check subject line
        if (lines[0].length > 50) {
            errors.push('Subject line must be 50 characters or less');
        }
        if (lines[0].endsWith('.')) {
            errors.push('Subject line should not end with a period');
        }
        // Check blank line after subject
        if (lines.length > 1 && lines[1] !== '') {
            errors.push('Second line must be blank');
        }
        // Check body line length
        for (let i = 2; i < lines.length; i++) {
            if (lines[i].length > 72) {
                errors.push(`Line ${i + 1} exceeds 72 characters`);
            }
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    async getStagedFiles() {
        const status = await this.git.status();
        return status.staged;
    }
    async getModifiedFiles() {
        const status = await this.git.status();
        return [...status.modified, ...status.staged, ...status.created];
    }
    async getStagedDiffs() {
        const stagedFiles = await this.getStagedFiles();
        const diffs = {};
        for (const file of stagedFiles) {
            try {
                const diff = await this.git.diff(['--staged', file]);
                diffs[file] = diff;
            }
            catch (error) {
                console.warn(`Could not get diff for ${file}`);
            }
        }
        return diffs;
    }
    async getFilesDiffs(files) {
        const diffs = {};
        for (const file of files) {
            try {
                const diff = await this.git.diff([file]);
                diffs[file] = diff;
            }
            catch (error) {
                console.warn(`Could not get diff for ${file}`);
            }
        }
        return diffs;
    }
    analyzeChanges(files, diffs) {
        const analysis = {
            files,
            totalFiles: files.length,
            addedLines: 0,
            removedLines: 0,
            fileTypes: new Set(),
            directories: new Set(),
            changeTypes: new Set(),
            isBreakingChange: false,
            affectedComponents: new Set(),
            hasTests: false,
            hasDocs: false,
            hasConfig: false,
            hasAssets: false
        };
        files.forEach(file => {
            // Analyze file extensions
            const ext = file.split('.').pop()?.toLowerCase();
            if (ext)
                analysis.fileTypes.add(ext);
            // Analyze directories
            const dir = file.split('/')[0];
            analysis.directories.add(dir);
            // Categorize file types
            if (file.includes('test') || file.includes('spec') || ext === 'test.ts' || ext === 'test.js') {
                analysis.hasTests = true;
            }
            if (file.includes('doc') || ext === 'md' || ext === 'mdx') {
                analysis.hasDocs = true;
            }
            if (file.includes('config') || ['json', 'yml', 'yaml', 'toml'].includes(ext || '')) {
                analysis.hasConfig = true;
            }
            if (['png', 'jpg', 'svg', 'gif', 'css', 'scss'].includes(ext || '')) {
                analysis.hasAssets = true;
            }
            // Analyze component names
            const filename = file.split('/').pop()?.split('.')[0];
            if (filename) {
                analysis.affectedComponents.add(filename);
            }
        });
        // Analyze diffs for line changes and breaking changes
        Object.values(diffs).forEach(diff => {
            const lines = diff.split('\n');
            lines.forEach(line => {
                if (line.startsWith('+'))
                    analysis.addedLines++;
                if (line.startsWith('-'))
                    analysis.removedLines++;
                // Check for breaking changes
                if (line.includes('BREAKING CHANGE') ||
                    line.includes('breaking:') ||
                    line.includes('!:')) {
                    analysis.isBreakingChange = true;
                }
            });
        });
        return analysis;
    }
    buildCommitMessage(analysis) {
        const config = {
            type: this.determineCommitType(analysis),
            scope: this.determineScope(analysis),
            subject: this.generateSubject(analysis),
            body: this.generateBody(analysis),
            breakingChange: analysis.isBreakingChange
        };
        // Add footer for breaking changes
        if (analysis.isBreakingChange) {
            config.footer = 'BREAKING CHANGE: This commit introduces breaking changes';
        }
        return config;
    }
    determineCommitType(analysis) {
        // Priority order for determining commit type
        if (analysis.hasTests && analysis.totalFiles <= 3) {
            return 'test';
        }
        if (analysis.hasDocs && !analysis.hasTests) {
            return 'docs';
        }
        if (analysis.hasConfig && !analysis.hasTests && !analysis.hasDocs) {
            return 'chore';
        }
        if (analysis.hasAssets && analysis.totalFiles <= 2) {
            return 'style';
        }
        // Analyze directory patterns
        if (analysis.directories.has('src') || analysis.directories.has('lib')) {
            if (analysis.addedLines > analysis.removedLines * 2) {
                return 'feat';
            }
            else if (analysis.removedLines > analysis.addedLines) {
                return 'refactor';
            }
            else {
                return 'fix';
            }
        }
        if (analysis.directories.has('.github') || analysis.directories.has('ci')) {
            return 'ci';
        }
        if (analysis.directories.has('build') || analysis.directories.has('dist')) {
            return 'build';
        }
        // Default based on change size
        if (analysis.addedLines > 50) {
            return 'feat';
        }
        else if (analysis.removedLines > analysis.addedLines) {
            return 'refactor';
        }
        else {
            return 'fix';
        }
    }
    determineScope(analysis) {
        // Determine scope based on affected components
        const components = Array.from(analysis.affectedComponents);
        if (components.length === 1) {
            return components[0];
        }
        // Check for common directory patterns
        const dirs = Array.from(analysis.directories);
        if (dirs.includes('api'))
            return 'api';
        if (dirs.includes('ui') || dirs.includes('components'))
            return 'ui';
        if (dirs.includes('auth'))
            return 'auth';
        if (dirs.includes('database') || dirs.includes('db'))
            return 'db';
        if (dirs.includes('types'))
            return 'types';
        if (dirs.includes('utils'))
            return 'utils';
        if (dirs.includes('config'))
            return 'config';
        // If multiple components, use directory
        if (dirs.length === 1) {
            return dirs[0];
        }
        return undefined;
    }
    generateSubject(analysis) {
        const type = this.determineCommitType(analysis);
        const components = Array.from(analysis.affectedComponents).slice(0, 2);
        let subject = '';
        switch (type) {
            case 'feat':
                if (components.length === 1) {
                    subject = `add ${components[0]} functionality`;
                }
                else {
                    subject = `add new features and improvements`;
                }
                break;
            case 'fix':
                if (components.length === 1) {
                    subject = `resolve ${components[0]} issues`;
                }
                else {
                    subject = `fix bugs and improve stability`;
                }
                break;
            case 'refactor':
                subject = `refactor code structure and organization`;
                break;
            case 'test':
                subject = `add and improve test coverage`;
                break;
            case 'docs':
                subject = `update documentation`;
                break;
            case 'style':
                subject = `update styling and visual elements`;
                break;
            case 'chore':
                subject = `update configuration and maintenance`;
                break;
            case 'ci':
                subject = `update CI/CD configuration`;
                break;
            case 'build':
                subject = `update build configuration`;
                break;
            default:
                subject = `update ${components.join(' and ')}`;
        }
        // Ensure subject doesn't exceed 50 characters
        if (subject.length > 50) {
            subject = subject.substring(0, 47) + '...';
        }
        return subject;
    }
    generateBody(analysis) {
        if (analysis.totalFiles <= 2 && analysis.addedLines + analysis.removedLines < 20) {
            return undefined; // Small changes don't need body
        }
        const bodyParts = [];
        // Summary of changes
        bodyParts.push(`Modified ${analysis.totalFiles} file${analysis.totalFiles > 1 ? 's' : ''}`);
        bodyParts.push(`+${analysis.addedLines} -${analysis.removedLines} lines`);
        // Key components affected
        const components = Array.from(analysis.affectedComponents);
        if (components.length > 1) {
            bodyParts.push(`\nAffected components: ${components.slice(0, 5).join(', ')}`);
        }
        // Special mentions
        if (analysis.hasTests) {
            bodyParts.push('- Updated test suite');
        }
        if (analysis.hasDocs) {
            bodyParts.push('- Updated documentation');
        }
        return bodyParts.join('\n');
    }
    /**
     * Format commit message for git commit
     */
    formatCommitMessage(config) {
        let message = `${config.type}`;
        if (config.scope) {
            message += `(${config.scope})`;
        }
        if (config.breakingChange) {
            message += '!';
        }
        message += `: ${config.subject}`;
        if (config.body) {
            message += `\n\n${config.body}`;
        }
        if (config.footer) {
            message += `\n\n${config.footer}`;
        }
        return message;
    }
}
//# sourceMappingURL=CommitMessageGenerator.js.map
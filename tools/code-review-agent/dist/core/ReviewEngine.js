import { simpleGit } from 'simple-git';
import { glob } from 'glob';
import { readFile } from 'fs/promises';
import { extname } from 'path';
export class ReviewEngine {
    git;
    config;
    constructor(repositoryPath = '.', config = {}) {
        this.git = simpleGit(repositoryPath);
        this.config = {
            includeTests: true,
            includeDocumentation: true,
            strictMode: false,
            outputFormat: 'markdown',
            rules: this.getDefaultRules(),
            ...config
        };
    }
    async analyzeRepository() {
        console.log('🔍 Starting code review analysis...');
        const files = await this.getCodeFiles();
        const diffs = await this.getGitDiffs();
        const comments = await this.analyzeFiles(files, diffs);
        const metrics = await this.calculateMetrics(files);
        const summary = {
            totalFiles: files.length,
            totalLines: files.reduce((sum, file) => sum + file.lines.length, 0),
            addedLines: diffs.reduce((sum, diff) => sum + diff.additions, 0),
            removedLines: diffs.reduce((sum, diff) => sum + diff.deletions, 0),
            comments,
            metrics,
            score: this.calculateScore(comments, metrics),
            recommendation: this.getRecommendation(comments)
        };
        console.log(`✅ Analysis complete: ${comments.length} comments, score: ${summary.score}/100`);
        return { summary };
    }
    async analyzeChanges(commitHash) {
        console.log('🔍 Analyzing recent changes...');
        const diffs = await this.getGitDiffs(commitHash);
        const changedFiles = await this.getChangedFiles(diffs);
        const comments = await this.analyzeFiles(changedFiles, diffs);
        const metrics = await this.calculateMetrics(changedFiles);
        const summary = {
            totalFiles: changedFiles.length,
            totalLines: changedFiles.reduce((sum, file) => sum + file.lines.length, 0),
            addedLines: diffs.reduce((sum, diff) => sum + diff.additions, 0),
            removedLines: diffs.reduce((sum, diff) => sum + diff.deletions, 0),
            comments,
            metrics,
            score: this.calculateScore(comments, metrics),
            recommendation: this.getRecommendation(comments)
        };
        return { summary };
    }
    async getCodeFiles() {
        const patterns = [
            '**/*.{ts,tsx,js,jsx}',
            '**/*.{py,java,cpp,c,cs,go,rs}',
            '**/*.{php,rb,swift,kt}',
            '**/*.{html,css,scss,less}',
            '**/*.{json,yaml,yml,xml}'
        ];
        const excludePatterns = [
            'node_modules/**',
            'dist/**',
            'build/**',
            '.next/**',
            'coverage/**',
            '**/*.min.js',
            '**/*.bundle.js'
        ];
        const files = [];
        for (const pattern of patterns) {
            const filePaths = await glob(pattern, {
                ignore: excludePatterns,
                absolute: false
            });
            for (const filePath of filePaths) {
                try {
                    const content = await readFile(filePath, 'utf-8');
                    const lines = content.split('\n');
                    files.push({
                        path: filePath,
                        content,
                        lines,
                        size: content.length,
                        extension: extname(filePath)
                    });
                }
                catch (error) {
                    console.warn(`⚠️ Could not read file: ${filePath}`);
                }
            }
        }
        return files;
    }
    async getChangedFiles(diffs) {
        const files = [];
        for (const diff of diffs) {
            try {
                const content = await readFile(diff.file, 'utf-8');
                const lines = content.split('\n');
                files.push({
                    path: diff.file,
                    content,
                    lines,
                    size: content.length,
                    extension: extname(diff.file)
                });
            }
            catch (error) {
                console.warn(`⚠️ Could not read changed file: ${diff.file}`);
            }
        }
        return files;
    }
    async getGitDiffs(commitHash) {
        try {
            const diffSummary = commitHash
                ? await this.git.diffSummary([`${commitHash}^`, commitHash])
                : await this.git.diffSummary(['HEAD^', 'HEAD']);
            const diffs = [];
            for (const file of diffSummary.files) {
                const changes = await this.parseGitDiff(file.file, commitHash);
                diffs.push({
                    file: file.file,
                    additions: file.insertions || 0,
                    deletions: file.deletions || 0,
                    changes
                });
            }
            return diffs;
        }
        catch (error) {
            console.warn('⚠️ Could not get git diffs, analyzing current state');
            return [];
        }
    }
    async parseGitDiff(filePath, commitHash) {
        try {
            const diffText = commitHash
                ? await this.git.diff([`${commitHash}^`, commitHash, '--', filePath])
                : await this.git.diff(['HEAD^', 'HEAD', '--', filePath]);
            const changes = [];
            const lines = diffText.split('\n');
            let lineNumber = 0;
            for (const line of lines) {
                if (line.startsWith('@@')) {
                    const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
                    if (match) {
                        lineNumber = parseInt(match[2]);
                    }
                }
                else if (line.startsWith('+') && !line.startsWith('+++')) {
                    changes.push({
                        type: 'add',
                        lineNumber: lineNumber++,
                        content: line.substring(1)
                    });
                }
                else if (line.startsWith('-') && !line.startsWith('---')) {
                    changes.push({
                        type: 'remove',
                        lineNumber: lineNumber,
                        content: line.substring(1)
                    });
                }
                else if (!line.startsWith('\\')) {
                    lineNumber++;
                }
            }
            return changes;
        }
        catch (error) {
            return [];
        }
    }
    async analyzeFiles(files, diffs) {
        const comments = [];
        for (const file of files) {
            const fileComments = await this.analyzeFile(file, diffs.find(d => d.file === file.path));
            comments.push(...fileComments);
        }
        return comments;
    }
    async analyzeFile(file, diff) {
        const comments = [];
        // Apply enabled rules
        for (const rule of this.config.rules.filter(r => r.enabled)) {
            const ruleComments = this.applyRule(file, rule, diff);
            comments.push(...ruleComments);
        }
        return comments;
    }
    applyRule(file, rule, diff) {
        const comments = [];
        file.lines.forEach((line, index) => {
            if (rule.pattern && rule.pattern.test(line)) {
                comments.push({
                    file: file.path,
                    line: index + 1,
                    type: rule.severity === 'error' ? 'error' : rule.severity === 'warning' ? 'warning' : 'info',
                    category: 'style',
                    message: rule.message,
                    severity: rule.severity === 'error' ? 4 : rule.severity === 'warning' ? 3 : 2
                });
            }
        });
        return comments;
    }
    async calculateMetrics(files) {
        const totalLines = files.reduce((sum, file) => sum + file.lines.length, 0);
        const codeLines = files.reduce((sum, file) => {
            return sum + file.lines.filter(line => line.trim() &&
                !line.trim().startsWith('//') &&
                !line.trim().startsWith('/*') &&
                !line.trim().startsWith('*')).length;
        }, 0);
        // Simple complexity calculation based on control structures
        const complexity = files.reduce((sum, file) => {
            const complexityKeywords = /\b(if|else|for|while|switch|case|catch|&&|\|\|)\b/g;
            const matches = file.content.match(complexityKeywords);
            return sum + (matches ? matches.length : 0);
        }, 0);
        // Simple maintainability index (0-100)
        const avgFileSize = files.length > 0 ? totalLines / files.length : 0;
        const maintainabilityIndex = Math.max(0, Math.min(100, 100 - (complexity / codeLines * 50) - (avgFileSize / 100 * 20)));
        return {
            linesOfCode: codeLines,
            complexity,
            maintainabilityIndex: Math.round(maintainabilityIndex)
        };
    }
    calculateScore(comments, metrics) {
        const errorCount = comments.filter(c => c.type === 'error').length;
        const warningCount = comments.filter(c => c.type === 'warning').length;
        let score = 100;
        score -= errorCount * 10;
        score -= warningCount * 5;
        score -= Math.max(0, (metrics.complexity / metrics.linesOfCode * 100) - 20);
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    getRecommendation(comments) {
        const errorCount = comments.filter(c => c.type === 'error').length;
        const warningCount = comments.filter(c => c.type === 'warning').length;
        if (errorCount > 0)
            return 'request_changes';
        if (warningCount > 5)
            return 'comment';
        return 'approve';
    }
    getDefaultRules() {
        return [
            {
                name: 'no-console-log',
                enabled: true,
                severity: 'warning',
                pattern: /console\.log\(/,
                message: 'Remove console.log statements before committing'
            },
            {
                name: 'no-todo-comments',
                enabled: true,
                severity: 'info',
                pattern: /\/\/\s*TODO|\/\*\s*TODO/i,
                message: 'TODO comment found - consider creating an issue'
            },
            {
                name: 'no-hardcoded-secrets',
                enabled: true,
                severity: 'error',
                pattern: /(password|secret|key|token)\s*[:=]\s*['"][^'"]{8,}/i,
                message: 'Potential hardcoded secret detected'
            },
            {
                name: 'large-function',
                enabled: true,
                severity: 'warning',
                pattern: /function.*\{[\s\S]{1000,}/,
                message: 'Function appears to be very large - consider breaking it down'
            }
        ];
    }
}
//# sourceMappingURL=ReviewEngine.js.map
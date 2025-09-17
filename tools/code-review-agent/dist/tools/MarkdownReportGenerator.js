import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
export class MarkdownReportGenerator {
    outputPath;
    constructor(outputPath = './code-review-report.md') {
        this.outputPath = outputPath;
    }
    /**
     * Generate a comprehensive markdown report from analysis results
     */
    async generateReport(result) {
        console.log('📄 Generating markdown report...');
        const markdown = this.buildMarkdownReport(result);
        // Ensure output directory exists
        await mkdir(dirname(this.outputPath), { recursive: true });
        // Write report to file
        await writeFile(this.outputPath, markdown, 'utf-8');
        console.log(`✅ Report generated: ${this.outputPath}`);
        return markdown;
    }
    /**
     * Generate a quick summary report
     */
    generateQuickReport(summary) {
        return this.buildQuickSummary(summary);
    }
    /**
     * Generate commit message section
     */
    generateCommitMessageSection(commitConfig) {
        return this.buildCommitMessageSection(commitConfig);
    }
    buildMarkdownReport(result) {
        const { summary, commitMessage } = result;
        const timestamp = new Date().toISOString().split('T')[0];
        let markdown = '';
        // Header
        markdown += this.buildHeader(timestamp);
        // Executive Summary
        markdown += this.buildExecutiveSummary(summary);
        // Code Quality Metrics
        markdown += this.buildMetricsSection(summary);
        // Detailed Findings
        markdown += this.buildFindingsSection(summary.comments);
        // Commit Message Suggestion
        if (commitMessage) {
            markdown += this.buildCommitMessageSection(commitMessage);
        }
        // Recommendations
        markdown += this.buildRecommendationsSection(summary);
        // Footer
        markdown += this.buildFooter();
        return markdown;
    }
    buildHeader(timestamp) {
        return `# 🔍 Code Review Report

**Generated on:** ${timestamp}
**Review Type:** Automated Code Analysis
**Tool:** Code Review Agent v1.0.0

---

`;
    }
    buildExecutiveSummary(summary) {
        const { recommendation } = summary;
        const recommendationEmoji = {
            approve: '✅',
            request_changes: '❌',
            comment: '💬'
        };
        const recommendationText = {
            approve: 'Approved',
            request_changes: 'Requires Changes',
            comment: 'Comments Added'
        };
        return `## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Score** | ${summary.score}/100 |
| **Recommendation** | ${recommendationEmoji[recommendation]} ${recommendationText[recommendation]} |
| **Files Analyzed** | ${summary.totalFiles} |
| **Total Lines** | ${summary.totalLines.toLocaleString()} |
| **Lines Added** | +${summary.addedLines} |
| **Lines Removed** | -${summary.removedLines} |
| **Issues Found** | ${summary.comments.length} |

`;
    }
    buildMetricsSection(summary) {
        const { metrics } = summary;
        return `## 📈 Code Quality Metrics

### 🎯 Key Indicators

| Metric | Value | Status |
|--------|-------|--------|
| **Lines of Code** | ${metrics.linesOfCode.toLocaleString()} | ${this.getStatusIcon(metrics.linesOfCode, 10000, 5000)} |
| **Complexity** | ${metrics.complexity} | ${this.getComplexityStatus(metrics.complexity, metrics.linesOfCode)} |
| **Maintainability Index** | ${metrics.maintainabilityIndex}/100 | ${this.getMaintainabilityStatus(metrics.maintainabilityIndex)} |
${metrics.testCoverage ? `| **Test Coverage** | ${metrics.testCoverage}% | ${this.getCoverageStatus(metrics.testCoverage)} |` : ''}

### 📊 Quality Assessment

${this.generateQualityChart(summary.score)}

`;
    }
    buildFindingsSection(comments) {
        if (comments.length === 0) {
            return `## 🎉 Findings

**Great job!** No issues were found in the code review.

`;
        }
        const errorComments = comments.filter(c => c.type === 'error');
        const warningComments = comments.filter(c => c.type === 'warning');
        const suggestionComments = comments.filter(c => c.type === 'suggestion');
        const infoComments = comments.filter(c => c.type === 'info');
        let markdown = `## 🔍 Detailed Findings

### 📊 Issue Breakdown

| Type | Count |
|------|-------|
| ❌ Errors | ${errorComments.length} |
| ⚠️ Warnings | ${warningComments.length} |
| 💡 Suggestions | ${suggestionComments.length} |
| ℹ️ Info | ${infoComments.length} |

`;
        // Group by file
        const commentsByFile = this.groupCommentsByFile(comments);
        for (const [file, fileComments] of Object.entries(commentsByFile)) {
            markdown += `### 📁 \`${file}\`

`;
            fileComments.forEach(comment => {
                const icon = this.getCommentIcon(comment.type);
                const badge = this.getCategoryBadge(comment.category);
                markdown += `#### ${icon} ${comment.type.toUpperCase()}: Line ${comment.line || 'Unknown'}

${badge}

**Message:** ${comment.message}

`;
                if (comment.suggestion) {
                    markdown += `**Suggestion:**
\`\`\`
${comment.suggestion}
\`\`\`

`;
                }
            });
        }
        return markdown;
    }
    buildCommitMessageSection(commitConfig) {
        return `## 📝 Suggested Commit Message

Based on the analysis of your changes, here's a suggested commit message following conventional commit format:

### 🎯 Generated Message

\`\`\`
${commitConfig.type}${commitConfig.scope ? `(${commitConfig.scope})` : ''}${commitConfig.breakingChange ? '!' : ''}: ${commitConfig.subject}
${commitConfig.body ? `\n${commitConfig.body}` : ''}
${commitConfig.footer ? `\n${commitConfig.footer}` : ''}
\`\`\`

### 📋 Message Breakdown

- **Type:** \`${commitConfig.type}\`
${commitConfig.scope ? `- **Scope:** \`${commitConfig.scope}\`\n` : ''}
- **Subject:** ${commitConfig.subject}
${commitConfig.breakingChange ? '- **Breaking Change:** Yes ⚠️\n' : ''}

`;
    }
    buildRecommendationsSection(summary) {
        const recommendations = this.generateRecommendations(summary);
        let markdown = `## 🎯 Recommendations

`;
        recommendations.forEach((rec, index) => {
            markdown += `### ${index + 1}. ${rec.title}

**Priority:** ${rec.priority}
**Category:** ${rec.category}

${rec.description}

`;
            if (rec.actions && rec.actions.length > 0) {
                markdown += `**Suggested Actions:**
`;
                rec.actions.forEach(action => {
                    markdown += `- ${action}\n`;
                });
                markdown += '\n';
            }
        });
        return markdown;
    }
    buildFooter() {
        return `---

## 🤖 About This Report

This automated code review was generated by the Code Review Agent. The analysis includes:

- **Static Code Analysis:** Pattern matching and rule-based checks
- **Complexity Analysis:** Cyclomatic complexity and maintainability metrics
- **Best Practices:** Industry standard coding practices and conventions
- **Security Checks:** Basic security vulnerability patterns

### 🔧 How to Use This Report

1. **Address Errors First:** Fix any critical errors before proceeding
2. **Review Warnings:** Consider addressing warnings to improve code quality
3. **Apply Suggestions:** Implement suggestions to enhance maintainability
4. **Use Generated Commit Message:** Copy the suggested commit message for consistency

### 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Clean Code Principles](https://clean-code-developer.com/)
- [Code Review Best Practices](https://google.github.io/eng-practices/review/)

---

*Generated by Code Review Agent v1.0.0 on ${new Date().toLocaleString()}*
`;
    }
    buildQuickSummary(summary) {
        const scoreEmoji = summary.score >= 80 ? '🟢' : summary.score >= 60 ? '🟡' : '🔴';
        return `## 📊 Code Review Summary

${scoreEmoji} **Score:** ${summary.score}/100
📁 **Files:** ${summary.totalFiles}
📝 **Lines:** ${summary.totalLines.toLocaleString()}
⚠️ **Issues:** ${summary.comments.length}
🎯 **Recommendation:** ${summary.recommendation.replace('_', ' ').toUpperCase()}
`;
    }
    groupCommentsByFile(comments) {
        return comments.reduce((groups, comment) => {
            if (!groups[comment.file]) {
                groups[comment.file] = [];
            }
            groups[comment.file].push(comment);
            return groups;
        }, {});
    }
    getCommentIcon(type) {
        const icons = {
            error: '❌',
            warning: '⚠️',
            suggestion: '💡',
            info: 'ℹ️'
        };
        return icons[type] || '📝';
    }
    getCategoryBadge(category) {
        const badges = {
            style: '![Style](https://img.shields.io/badge/Category-Style-blue)',
            performance: '![Performance](https://img.shields.io/badge/Category-Performance-orange)',
            security: '![Security](https://img.shields.io/badge/Category-Security-red)',
            logic: '![Logic](https://img.shields.io/badge/Category-Logic-purple)',
            documentation: '![Documentation](https://img.shields.io/badge/Category-Documentation-green)',
            testing: '![Testing](https://img.shields.io/badge/Category-Testing-yellow)'
        };
        return badges[category] || '![General](https://img.shields.io/badge/Category-General-gray)';
    }
    getStatusIcon(value, warning, good) {
        if (value <= good)
            return '🟢 Good';
        if (value <= warning)
            return '🟡 Moderate';
        return '🔴 High';
    }
    getComplexityStatus(complexity, linesOfCode) {
        const ratio = linesOfCode > 0 ? complexity / linesOfCode : 0;
        if (ratio <= 0.1)
            return '🟢 Low';
        if (ratio <= 0.2)
            return '🟡 Moderate';
        return '🔴 High';
    }
    getMaintainabilityStatus(index) {
        if (index >= 80)
            return '🟢 Excellent';
        if (index >= 60)
            return '🟡 Good';
        if (index >= 40)
            return '🟠 Fair';
        return '🔴 Poor';
    }
    getCoverageStatus(coverage) {
        if (coverage >= 80)
            return '🟢 Excellent';
        if (coverage >= 60)
            return '🟡 Good';
        if (coverage >= 40)
            return '🟠 Fair';
        return '🔴 Poor';
    }
    generateQualityChart(score) {
        const filled = Math.floor(score / 10);
        const empty = 10 - filled;
        return `\`\`\`
Quality Score: ${score}/100
${'█'.repeat(filled)}${'░'.repeat(empty)} ${score}%
\`\`\``;
    }
    generateRecommendations(summary) {
        const recommendations = [];
        // Error-based recommendations
        const errors = summary.comments.filter(c => c.type === 'error');
        if (errors.length > 0) {
            recommendations.push({
                title: 'Fix Critical Errors',
                priority: '🔴 High',
                category: 'Quality',
                description: `${errors.length} critical error(s) were found that should be addressed before merging.`,
                actions: errors.slice(0, 3).map(e => `Fix ${e.category} issue in ${e.file}`)
            });
        }
        // Complexity recommendations
        if (summary.metrics.complexity / summary.metrics.linesOfCode > 0.2) {
            recommendations.push({
                title: 'Reduce Code Complexity',
                priority: '🟡 Medium',
                category: 'Maintainability',
                description: 'The code complexity is higher than recommended. Consider breaking down large functions.',
                actions: [
                    'Identify large functions and break them into smaller ones',
                    'Reduce nested conditional statements',
                    'Extract complex logic into separate functions'
                ]
            });
        }
        // Documentation recommendations
        const docIssues = summary.comments.filter(c => c.category === 'documentation');
        if (docIssues.length > 0) {
            recommendations.push({
                title: 'Improve Documentation',
                priority: '🟢 Low',
                category: 'Documentation',
                description: 'Adding documentation will help other developers understand the code better.',
                actions: [
                    'Add JSDoc comments to public functions',
                    'Update README if necessary',
                    'Add inline comments for complex logic'
                ]
            });
        }
        // Test recommendations
        const testIssues = summary.comments.filter(c => c.category === 'testing');
        if (testIssues.length > 0 || summary.metrics.testCoverage && summary.metrics.testCoverage < 70) {
            recommendations.push({
                title: 'Enhance Test Coverage',
                priority: '🟡 Medium',
                category: 'Testing',
                description: 'Improving test coverage will help catch bugs early and ensure code reliability.',
                actions: [
                    'Add unit tests for new functions',
                    'Add integration tests for new features',
                    'Consider edge cases in existing tests'
                ]
            });
        }
        return recommendations;
    }
}
//# sourceMappingURL=MarkdownReportGenerator.js.map
# 🤖 Code Review Agent

An AI-powered code review agent with commit message generation and comprehensive markdown reporting capabilities.

## ✨ Features

### 🔍 **Code Review & Analysis**
- **Static Code Analysis**: Pattern-based rule checking and code quality assessment
- **Complexity Analysis**: Cyclomatic complexity and maintainability metrics
- **Security Checks**: Basic security vulnerability pattern detection
- **Best Practices**: Industry standard coding conventions verification

### 📝 **Commit Message Generation**
- **Conventional Commits**: Automatic generation following conventional commit format
- **Smart Analysis**: Analyzes staged changes to determine commit type and scope
- **Validation**: Built-in commit message validation with detailed feedback
- **Auto-commit**: Option to automatically commit with generated messages

### 📄 **Markdown Reporting**
- **Comprehensive Reports**: Detailed markdown reports with findings and recommendations
- **Visual Charts**: Progress bars and quality indicators
- **Categorized Issues**: Organized by severity and category
- **Actionable Recommendations**: Specific suggestions for code improvements

### 🛠️ **Advanced Tools**
- **Interactive Mode**: User-friendly CLI interface
- **Multiple Output Formats**: Markdown, JSON, and console output
- **Configurable Rules**: Customizable analysis rules and settings
- **Git Integration**: Deep integration with git for change analysis

## 🚀 Quick Start

### Installation

```bash
cd tools/code-review-agent
npm install
npm run build
```

### Basic Usage

```bash
# Interactive mode (recommended for first-time users)
npm run dev

# Full code review with all features
npm run review

# Generate commit message for staged changes
npm run commit-msg

# Generate markdown report
npm run generate-report
```

## 📖 Detailed Usage

### 1. Full Code Review

Perform a comprehensive analysis including code review, commit message generation, and markdown report:

```bash
# Basic full review
npx tsx src/index.ts review

# With custom options
npx tsx src/index.ts review --path ./my-project --output ./reports/review.md --strict
```

**Options:**
- `--path <path>`: Repository path (default: current directory)
- `--output <path>`: Output file path (default: ./code-review-report.md)
- `--strict`: Enable strict mode for more rigorous analysis
- `--no-tests`: Exclude test files from analysis
- `--no-docs`: Exclude documentation files from analysis

### 2. Commit Message Generation

Generate conventional commit messages based on your staged changes:

```bash
# Generate commit message
npx tsx src/index.ts commit-message

# Auto-commit with generated message
npx tsx src/index.ts commit-message --auto-commit
```

**Features:**
- Analyzes file changes to determine commit type (`feat`, `fix`, `refactor`, etc.)
- Automatically detects scope based on affected components
- Generates descriptive subject line and optional body
- Follows conventional commit format

### 3. Markdown Report Generation

Create detailed markdown reports of your code analysis:

```bash
# Generate report for current changes
npx tsx src/index.ts generate-report

# Generate report for specific commit
npx tsx src/index.ts generate-report --commit abc123

# Custom output path
npx tsx src/index.ts generate-report --output ./docs/review.md
```

### 4. Change Analysis

Analyze specific changes without generating reports:

```bash
# Analyze staged changes
npx tsx src/index.ts analyze

# Analyze specific commit
npx tsx src/index.ts analyze --commit abc123

# JSON output
npx tsx src/index.ts analyze --json
```

### 5. Commit Message Validation

Validate existing commit messages against conventional commit format:

```bash
npx tsx src/index.ts validate "feat(ui): add new button component"
```

### 6. Repository Status

Quick overview of your repository status:

```bash
npx tsx src/index.ts status
```

### 7. Interactive Mode

User-friendly interactive interface:

```bash
npx tsx src/index.ts interactive
# or simply
npx tsx src/index.ts
```

## ⚙️ Configuration

### Default Rules

The agent comes with built-in rules for:

1. **No Console Logs**: Warns about `console.log` statements
2. **TODO Comments**: Identifies TODO comments that should be converted to issues
3. **Hardcoded Secrets**: Detects potential hardcoded passwords, API keys, and tokens
4. **Large Functions**: Warns about functions that might be too complex

### Custom Configuration

Create a configuration object to customize behavior:

```typescript
const config = {
  includeTests: true,          // Include test files in analysis
  includeDocumentation: true,  // Include documentation files
  strictMode: false,           // Enable strict analysis mode
  outputFormat: 'markdown',    // Output format: 'markdown' | 'json' | 'console'
  rules: [
    // Custom rules
    {
      name: 'custom-rule',
      enabled: true,
      severity: 'warning',
      pattern: /custom-pattern/,
      message: 'Custom rule violation'
    }
  ]
};
```

## 📊 Report Format

### Sample Markdown Report Structure

```markdown
# 🔍 Code Review Report

## 📊 Executive Summary
- Overall Score: 85/100
- Files Analyzed: 15
- Issues Found: 3
- Recommendation: ✅ Approved

## 📈 Code Quality Metrics
- Lines of Code: 1,250
- Complexity: 45
- Maintainability Index: 82/100

## 🔍 Detailed Findings
### ❌ Errors
### ⚠️ Warnings
### 💡 Suggestions

## 📝 Suggested Commit Message
```feat(api): add user authentication endpoints```

## 🎯 Recommendations
1. Fix Critical Errors
2. Reduce Code Complexity
3. Improve Documentation
```

## 🔧 Development

### Project Structure

```
src/
├── core/
│   ├── ReviewEngine.ts          # Main analysis engine
│   └── CodeReviewAgent.ts       # Main agent orchestrator
├── tools/
│   ├── CommitMessageGenerator.ts # Commit message generation
│   └── MarkdownReportGenerator.ts # Report generation
├── utils/
│   └── cli-utils.ts             # CLI utilities
├── types/
│   └── index.ts                 # TypeScript definitions
└── index.ts                     # CLI entry point
```

### Building and Testing

```bash
# Build TypeScript
npm run build

# Development mode
npm run dev

# Run specific commands
npm run review
npm run commit-msg
npm run generate-report
```

## 🎯 Use Cases

### 1. **Pre-commit Hook**
Integrate with git hooks to automatically review code before commits:

```bash
#!/bin/sh
# .git/hooks/pre-commit
npx tsx tools/code-review-agent/src/index.ts analyze --json > /tmp/review.json
if [ $? -ne 0 ]; then
  echo "Code review failed. Please fix issues before committing."
  exit 1
fi
```

### 2. **CI/CD Integration**
Add to your CI pipeline for automated code reviews:

```yaml
# .github/workflows/code-review.yml
- name: Code Review
  run: |
    cd tools/code-review-agent
    npm install
    npx tsx src/index.ts review --output review-report.md
- name: Upload Report
  uses: actions/upload-artifact@v3
  with:
    name: code-review-report
    path: review-report.md
```

### 3. **Team Code Quality**
Generate reports for pull requests and team reviews:

```bash
# Generate report for PR changes
git checkout feature-branch
npx tsx tools/code-review-agent/src/index.ts analyze --commit main..HEAD
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with TypeScript and Node.js
- Uses conventional commit standards
- Inspired by industry best practices for code review automation

---

**Happy Coding!** 🚀

For issues and feature requests, please visit our [GitHub Issues](https://github.com/your-repo/issues) page.
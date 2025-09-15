import { ReviewEngine } from './ReviewEngine.js';
import { CommitMessageGenerator } from '../tools/CommitMessageGenerator.js';
import { MarkdownReportGenerator } from '../tools/MarkdownReportGenerator.js';
import { CLIUtils } from '../utils/cli-utils.js';
import { AnalysisResult, ReviewConfig } from '../types/index.js';

export class CodeReviewAgent {
  private reviewEngine: ReviewEngine;
  private commitGenerator: CommitMessageGenerator;
  private reportGenerator: MarkdownReportGenerator;

  constructor(
    repositoryPath: string = '.',
    config: Partial<ReviewConfig> = {},
    outputPath: string = './code-review-report.md'
  ) {
    this.reviewEngine = new ReviewEngine(repositoryPath, config);
    this.commitGenerator = new CommitMessageGenerator(repositoryPath);
    this.reportGenerator = new MarkdownReportGenerator(outputPath);
  }

  /**
   * Perform a full code review with all features
   */
  async performFullReview(): Promise<AnalysisResult> {
    CLIUtils.header('🔍 Full Code Review Analysis');

    const startTime = Date.now();

    try {
      // Step 1: Analyze repository
      CLIUtils.section('Analyzing Repository');
      const analysisResult = await this.reviewEngine.analyzeRepository();

      // Step 2: Generate commit message (if there are staged changes)
      CLIUtils.section('Generating Commit Message');
      try {
        const commitMessage = await this.commitGenerator.generateCommitMessage();
        analysisResult.commitMessage = commitMessage;
        CLIUtils.success('Commit message generated successfully');
      } catch (error) {
        CLIUtils.warning('No staged changes found - skipping commit message generation');
      }

      // Step 3: Generate markdown report
      CLIUtils.section('Generating Report');
      const markdownReport = await this.reportGenerator.generateReport(analysisResult);
      analysisResult.markdownReport = markdownReport;

      const duration = Date.now() - startTime;
      CLIUtils.success(`Full review completed in ${CLIUtils.formatDuration(duration)}`);

      return analysisResult;

    } catch (error) {
      CLIUtils.error(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Analyze changes only (for specific commits or staged changes)
   */
  async analyzeChanges(commitHash?: string): Promise<AnalysisResult> {
    CLIUtils.header('🔍 Analyzing Changes');

    try {
      const analysisResult = await this.reviewEngine.analyzeChanges(commitHash);

      // Generate commit message for staged changes
      if (!commitHash) {
        try {
          const commitMessage = await this.commitGenerator.generateCommitMessage();
          analysisResult.commitMessage = commitMessage;
        } catch (error) {
          CLIUtils.warning('No staged changes found for commit message generation');
        }
      }

      CLIUtils.success('Change analysis completed');
      return analysisResult;

    } catch (error) {
      CLIUtils.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Generate commit message only
   */
  async generateCommitMessage(): Promise<string> {
    CLIUtils.header('📝 Generating Commit Message');

    try {
      const commitConfig = await this.commitGenerator.generateCommitMessage();
      const formattedMessage = this.commitGenerator.formatCommitMessage(commitConfig);

      CLIUtils.section('Generated Commit Message');
      console.log('```');
      console.log(formattedMessage);
      console.log('```');

      // Ask if user wants to use this commit message
      const useMessage = await CLIUtils.confirmAction('Would you like to commit with this message?');

      if (useMessage) {
        const { simpleGit } = await import('simple-git');
        const git = simpleGit();
        await git.commit(formattedMessage);
        CLIUtils.success('Changes committed successfully!');
      }

      return formattedMessage;

    } catch (error) {
      CLIUtils.error(`Commit message generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Generate markdown report from previous analysis
   */
  async generateReport(analysisResult?: AnalysisResult): Promise<string> {
    CLIUtils.header('📄 Generating Markdown Report');

    try {
      let result = analysisResult;

      if (!result) {
        CLIUtils.info('No analysis result provided, performing fresh analysis...');
        result = await this.reviewEngine.analyzeRepository();
      }

      const markdownReport = await this.reportGenerator.generateReport(result);

      CLIUtils.success('Markdown report generated successfully');
      return markdownReport;

    } catch (error) {
      CLIUtils.error(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Interactive mode - let user choose what to do
   */
  async runInteractive(): Promise<void> {
    CLIUtils.header('🤖 Interactive Code Review Agent');

    const options = [
      'Full Code Review (Analysis + Commit Message + Report)',
      'Analyze Changes Only',
      'Generate Commit Message',
      'Generate Report from Previous Analysis',
      'Validate Existing Commit Message',
      'Exit'
    ];

    while (true) {
      console.log();
      const choice = await CLIUtils.selectOption('What would you like to do?', options);

      switch (choice) {
        case options[0]: // Full review
          await this.performFullReview();
          break;

        case options[1]: // Analyze changes
          const commitHash = await CLIUtils.inputText('Enter commit hash (leave empty for staged changes):');
          await this.analyzeChanges(commitHash || undefined);
          break;

        case options[2]: // Generate commit message
          await this.generateCommitMessage();
          break;

        case options[3]: // Generate report
          await this.generateReport();
          break;

        case options[4]: // Validate commit message
          await this.validateCommitMessage();
          break;

        case options[5]: // Exit
          CLIUtils.success('Goodbye! 👋');
          return;
      }

      const continueChoice = await CLIUtils.confirmAction('Would you like to perform another action?', true);
      if (!continueChoice) {
        CLIUtils.success('Goodbye! 👋');
        break;
      }
    }
  }

  /**
   * Validate commit message format
   */
  async validateCommitMessage(): Promise<void> {
    CLIUtils.section('Validating Commit Message');

    const message = await CLIUtils.inputText('Enter commit message to validate:');
    const validation = this.commitGenerator.validateCommitMessage(message);

    if (validation.valid) {
      CLIUtils.success('✅ Commit message is valid!');
    } else {
      CLIUtils.error('❌ Commit message has issues:');
      validation.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
  }

  /**
   * Quick status check
   */
  async quickStatus(): Promise<void> {
    CLIUtils.header('⚡ Quick Status');

    try {
      const { simpleGit } = await import('simple-git');
      const git = simpleGit();
      const status = await git.status();

      console.log(`📁 Branch: ${status.current}`);
      console.log(`📝 Modified: ${status.modified.length} files`);
      console.log(`➕ Staged: ${status.staged.length} files`);
      console.log(`❓ Untracked: ${status.not_added.length} files`);

      if (status.ahead > 0 || status.behind > 0) {
        console.log(`🔄 Sync: ${status.ahead} ahead, ${status.behind} behind`);
      }

      if (status.staged.length > 0) {
        const generateCommit = await CLIUtils.confirmAction('Generate commit message for staged changes?');
        if (generateCommit) {
          await this.generateCommitMessage();
        }
      }

    } catch (error) {
      CLIUtils.error('Could not get git status');
    }
  }

  /**
   * Show configuration
   */
  showConfig(): void {
    CLIUtils.header('⚙️ Configuration');

    const config = this.reviewEngine['config'];
    const table = [
      ['Include Tests', config.includeTests ? '✅' : '❌'],
      ['Include Documentation', config.includeDocumentation ? '✅' : '❌'],
      ['Strict Mode', config.strictMode ? '✅' : '❌'],
      ['Output Format', config.outputFormat],
      ['Active Rules', config.rules.filter(r => r.enabled).length.toString()]
    ];

    CLIUtils.table(['Setting', 'Value'], table);
  }
}
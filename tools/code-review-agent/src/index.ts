#!/usr/bin/env node

import { Command } from 'commander';
import { CodeReviewAgent } from './core/CodeReviewAgent.js';
import { CLIUtils } from './utils/cli-utils.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getPackageInfo() {
  try {
    const packagePath = join(__dirname, '../package.json');
    const packageContent = await readFile(packagePath, 'utf-8');
    return JSON.parse(packageContent);
  } catch {
    return { version: '1.0.0', description: 'Code Review Agent' };
  }
}

async function main() {
  const packageInfo = await getPackageInfo();

  const program = new Command();

  program
    .name('code-review-agent')
    .description(packageInfo.description)
    .version(packageInfo.version);

  // Full review command
  program
    .command('review')
    .description('Perform a full code review analysis')
    .option('-p, --path <path>', 'Repository path', '.')
    .option('-o, --output <path>', 'Output file path', './code-review-report.md')
    .option('--strict', 'Enable strict mode')
    .option('--no-tests', 'Exclude test files')
    .option('--no-docs', 'Exclude documentation files')
    .action(async (options) => {
      try {
        const config = {
          includeTests: options.tests,
          includeDocumentation: options.docs,
          strictMode: options.strict,
          outputFormat: 'markdown' as const
        };

        const agent = new CodeReviewAgent(options.path, config, options.output);
        const result = await agent.performFullReview();

        // Display summary
        CLIUtils.section('Review Summary');
        console.log(result.summary);

        if (result.commitMessage) {
          CLIUtils.section('Suggested Commit Message');
          const formatted = agent['commitGenerator'].formatCommitMessage(result.commitMessage);
          console.log('```');
          console.log(formatted);
          console.log('```');
        }

      } catch (error) {
        CLIUtils.error(`Review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Commit message generation command
  program
    .command('commit-message')
    .alias('commit')
    .description('Generate a conventional commit message')
    .option('-p, --path <path>', 'Repository path', '.')
    .option('--auto-commit', 'Automatically commit with generated message')
    .action(async (options) => {
      try {
        const agent = new CodeReviewAgent(options.path);
        const message = await agent.generateCommitMessage();

        if (!options.autoCommit) {
          console.log('\nGenerated commit message:');
          console.log('```');
          console.log(message);
          console.log('```');
          console.log('\nTo commit with this message, run:');
          console.log(`git commit -m "${message.split('\n')[0]}"`);
        }

      } catch (error) {
        CLIUtils.error(`Commit message generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Generate report command
  program
    .command('generate-report')
    .alias('report')
    .description('Generate a markdown report')
    .option('-p, --path <path>', 'Repository path', '.')
    .option('-o, --output <path>', 'Output file path', './code-review-report.md')
    .option('-c, --commit <hash>', 'Specific commit to analyze')
    .action(async (options) => {
      try {
        const agent = new CodeReviewAgent(options.path, {}, options.output);

        let result;
        if (options.commit) {
          result = await agent.analyzeChanges(options.commit);
        } else {
          result = await agent.analyzeChanges();
        }

        await agent.generateReport(result);
        CLIUtils.success(`Report generated: ${options.output}`);

      } catch (error) {
        CLIUtils.error(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Analyze changes command
  program
    .command('analyze')
    .description('Analyze code changes')
    .option('-p, --path <path>', 'Repository path', '.')
    .option('-c, --commit <hash>', 'Specific commit to analyze')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      try {
        const agent = new CodeReviewAgent(options.path);
        const result = await agent.analyzeChanges(options.commit);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          CLIUtils.section('Analysis Results');
          const { summary } = result;

          const summaryTable = [
            ['Files Analyzed', summary.totalFiles.toString()],
            ['Total Lines', summary.totalLines.toLocaleString()],
            ['Lines Added', `+${summary.addedLines}`],
            ['Lines Removed', `-${summary.removedLines}`],
            ['Issues Found', summary.comments.length.toString()],
            ['Score', `${summary.score}/100`],
            ['Recommendation', summary.recommendation.replace('_', ' ').toUpperCase()]
          ];

          CLIUtils.table(['Metric', 'Value'], summaryTable);

          if (summary.comments.length > 0) {
            CLIUtils.section('Top Issues');
            summary.comments.slice(0, 5).forEach(comment => {
              const icon = comment.type === 'error' ? '❌' : comment.type === 'warning' ? '⚠️' : 'ℹ️';
              console.log(`${icon} ${comment.file}:${comment.line} - ${comment.message}`);
            });
          }
        }

      } catch (error) {
        CLIUtils.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Validate commit message command
  program
    .command('validate')
    .description('Validate a commit message')
    .argument('<message>', 'Commit message to validate')
    .action(async (message) => {
      try {
        const agent = new CodeReviewAgent();
        const validation = agent['commitGenerator'].validateCommitMessage(message);

        if (validation.valid) {
          CLIUtils.success('✅ Commit message is valid!');
        } else {
          CLIUtils.error('❌ Commit message has issues:');
          validation.errors.forEach(error => {
            console.log(`  • ${error}`);
          });
          process.exit(1);
        }

      } catch (error) {
        CLIUtils.error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Interactive mode command
  program
    .command('interactive')
    .alias('i')
    .description('Run in interactive mode')
    .option('-p, --path <path>', 'Repository path', '.')
    .action(async (options) => {
      try {
        const agent = new CodeReviewAgent(options.path);
        await agent.runInteractive();
      } catch (error) {
        CLIUtils.error(`Interactive mode failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Status command
  program
    .command('status')
    .description('Quick repository status')
    .option('-p, --path <path>', 'Repository path', '.')
    .action(async (options) => {
      try {
        const agent = new CodeReviewAgent(options.path);
        await agent.quickStatus();
      } catch (error) {
        CLIUtils.error(`Status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Config command
  program
    .command('config')
    .description('Show current configuration')
    .option('-p, --path <path>', 'Repository path', '.')
    .action(async (options) => {
      try {
        const agent = new CodeReviewAgent(options.path);
        agent.showConfig();
      } catch (error) {
        CLIUtils.error(`Config display failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // If no command is provided, run interactive mode
  if (process.argv.length <= 2) {
    const agent = new CodeReviewAgent();
    await agent.runInteractive();
  } else {
    await program.parseAsync();
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  CLIUtils.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  CLIUtils.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  CLIUtils.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
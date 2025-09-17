#!/usr/bin/env node

import { CodeReviewAgent } from './src/core/CodeReviewAgent.js';
import { CLIUtils } from './src/utils/cli-utils.js';

async function runDemo() {
  CLIUtils.header('🤖 Code Review Agent Demo');

  try {
    // Test 1: Quick status
    CLIUtils.section('1. Quick Status Check');
    const agent = new CodeReviewAgent('../../');
    await agent.quickStatus();

    // Test 2: Show configuration
    CLIUtils.section('2. Configuration Display');
    agent.showConfig();

    // Test 3: Validate a commit message
    CLIUtils.section('3. Commit Message Validation');
    const testMessage = 'feat(tools): add code review agent with commit generation';
    const validation = agent['commitGenerator'].validateCommitMessage(testMessage);

    if (validation.valid) {
      CLIUtils.success('✅ Test commit message is valid!');
    } else {
      CLIUtils.error('❌ Test commit message has issues:');
      validation.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }

    // Test 4: Generate a sample markdown report
    CLIUtils.section('4. Sample Markdown Report Generation');

    const sampleSummary = {
      totalFiles: 15,
      totalLines: 1250,
      addedLines: 450,
      removedLines: 80,
      comments: [
        {
          file: 'src/example.ts',
          line: 42,
          type: 'warning' as const,
          category: 'style' as const,
          message: 'Consider using const instead of let for immutable variables',
          severity: 3 as const
        },
        {
          file: 'src/api.ts',
          line: 15,
          type: 'suggestion' as const,
          category: 'performance' as const,
          message: 'Add async/await for better error handling',
          severity: 2 as const
        }
      ],
      metrics: {
        linesOfCode: 1000,
        complexity: 45,
        maintainabilityIndex: 78
      },
      score: 85,
      recommendation: 'approve' as const
    };

    const sampleCommitMessage = {
      type: 'feat',
      scope: 'tools',
      subject: 'add comprehensive code review agent',
      body: 'Includes commit message generation, markdown reporting, and interactive CLI',
      breakingChange: false
    };

    const sampleResult = {
      summary: sampleSummary,
      commitMessage: sampleCommitMessage
    };

    const markdownGenerator = agent['reportGenerator'];
    const sampleReport = await markdownGenerator.generateReport(sampleResult);

    CLIUtils.success('✅ Sample markdown report generated successfully!');
    console.log('\n📄 Report preview (first 10 lines):');
    console.log('```markdown');
    console.log(sampleReport.split('\n').slice(0, 10).join('\n'));
    console.log('...');
    console.log('```');

    CLIUtils.success('🎉 Demo completed successfully!');

    console.log('\n🚀 Next steps:');
    console.log('1. Run `npm run review` for a full code review');
    console.log('2. Run `npm run commit-msg` to generate commit messages');
    console.log('3. Run `npx tsx src/index.ts interactive` for interactive mode');

  } catch (error) {
    CLIUtils.error(`Demo failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

runDemo();
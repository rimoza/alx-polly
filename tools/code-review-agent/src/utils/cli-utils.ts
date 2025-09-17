import chalk from 'chalk';
import inquirer from 'inquirer';

export class CLIUtils {
  static success(message: string): void {
    console.log(chalk.green('✅'), message);
  }

  static error(message: string): void {
    console.log(chalk.red('❌'), message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow('⚠️'), message);
  }

  static info(message: string): void {
    console.log(chalk.blue('ℹ️'), message);
  }

  static header(title: string): void {
    console.log('\n' + chalk.bold.blue('='.repeat(50)));
    console.log(chalk.bold.blue(`  ${title}`));
    console.log(chalk.bold.blue('='.repeat(50)) + '\n');
  }

  static section(title: string): void {
    console.log('\n' + chalk.bold.cyan(`📋 ${title}`));
    console.log(chalk.cyan('-'.repeat(title.length + 4)));
  }

  static async confirmAction(message: string, defaultValue: boolean = false): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue
      }
    ]);
    return confirmed;
  }

  static async selectOption(message: string, choices: string[]): Promise<string> {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices
      }
    ]);
    return selected;
  }

  static async inputText(message: string, defaultValue?: string): Promise<string> {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message,
        default: defaultValue
      }
    ]);
    return input;
  }

  static async selectMultiple(message: string, choices: string[]): Promise<string[]> {
    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message,
        choices
      }
    ]);
    return selected;
  }

  static progressBar(current: number, total: number, label: string = ''): void {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * 20);
    const empty = 20 - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r${label} [${bar}] ${percentage}% (${current}/${total})`);

    if (current === total) {
      console.log(); // New line when complete
    }
  }

  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  static table(headers: string[], rows: string[][]): void {
    const columnWidths = headers.map((header, i) =>
      Math.max(header.length, ...rows.map(row => (row[i] || '').length))
    );

    // Header
    const headerRow = headers.map((header, i) =>
      header.padEnd(columnWidths[i])
    ).join(' | ');

    console.log(chalk.bold(headerRow));
    console.log(columnWidths.map(w => '-'.repeat(w)).join('-+-'));

    // Rows
    rows.forEach(row => {
      const formattedRow = row.map((cell, i) =>
        (cell || '').padEnd(columnWidths[i])
      ).join(' | ');
      console.log(formattedRow);
    });
  }

  static spinner(message: string): { stop: () => void } {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const interval = setInterval(() => {
      process.stdout.write(`\r${frames[i]} ${message}`);
      i = (i + 1) % frames.length;
    }, 100);

    return {
      stop: () => {
        clearInterval(interval);
        process.stdout.write('\r');
      }
    };
  }
}
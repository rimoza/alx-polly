export declare class CLIUtils {
    static success(message: string): void;
    static error(message: string): void;
    static warning(message: string): void;
    static info(message: string): void;
    static header(title: string): void;
    static section(title: string): void;
    static confirmAction(message: string, defaultValue?: boolean): Promise<boolean>;
    static selectOption(message: string, choices: string[]): Promise<string>;
    static inputText(message: string, defaultValue?: string): Promise<string>;
    static selectMultiple(message: string, choices: string[]): Promise<string[]>;
    static progressBar(current: number, total: number, label?: string): void;
    static formatBytes(bytes: number): string;
    static formatDuration(ms: number): string;
    static table(headers: string[], rows: string[][]): void;
    static spinner(message: string): {
        stop: () => void;
    };
}
//# sourceMappingURL=cli-utils.d.ts.map
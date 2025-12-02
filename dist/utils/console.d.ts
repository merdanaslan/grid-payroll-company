import { SessionData, ConsoleConfig, FreelancerAccount } from '../types/index.js';
export default class ConsoleHelper {
    private rl;
    private config;
    constructor(config?: ConsoleConfig);
    question(prompt: string): Promise<string>;
    close(): void;
    printHeader(title: string): void;
    printSuccess(message: string): void;
    printError(message: string): void;
    printInfo(message: string): void;
    printWarning(message: string): void;
    printMenu(options: string[]): void;
    printAccountInfo(sessionData: SessionData): void;
    printFreelancerAccountInfo(account: FreelancerAccount): void;
    confirm(message: string): Promise<boolean>;
    clearScreen(): void;
    printSeparator(): void;
    printTable(headers: string[], rows: string[][]): void;
    promptForNumber(message: string, min?: number, max?: number): Promise<number>;
    promptForEmail(message?: string): Promise<string>;
    private isValidEmail;
}
//# sourceMappingURL=console.d.ts.map
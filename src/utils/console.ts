import readline from 'readline';
import { SessionData, ConsoleConfig, FreelancerAccount } from '../types/index.js';

export default class ConsoleHelper {
  private rl: readline.Interface;
  private config: ConsoleConfig;

  constructor(config: ConsoleConfig = {}) {
    this.config = {
      clearOnStart: true,
      showTimestamps: false,
      ...config
    };
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  close(): void {
    this.rl.close();
  }

  printHeader(title: string): void {
    console.log('\n' + '='.repeat(50));
    console.log(`  ${title}`);
    console.log('='.repeat(50) + '\n');
  }

  printSuccess(message: string): void {
    const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
    console.log(`${timestamp}✅ ${message}`);
  }

  printError(message: string): void {
    const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
    console.log(`${timestamp}❌ ${message}`);
  }

  printInfo(message: string): void {
    const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
    console.log(`${timestamp}ℹ️  ${message}`);
  }

  printWarning(message: string): void {
    const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
    console.log(`${timestamp}⚠️  ${message}`);
  }

  printMenu(options: string[]): void {
    console.log('\nPlease select an option:');
    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option}`);
    });
    console.log();
  }

  printAccountInfo(sessionData: SessionData): void {
    console.log('\n📋 Account Information:');
    console.log('─'.repeat(30));
    console.log(`Email: ${sessionData.email}`);
    console.log(`Type: ${sessionData.type === 'signup' ? 'New Account' : 'Existing Account'}`);
    console.log(`Status: ${sessionData.authenticated ? 'Authenticated' : 'Pending'}`);
    
    if (sessionData.user?.id) {
      console.log(`User ID: ${sessionData.user.id}`);
    }
    
    if (sessionData.completedAt) {
      console.log(`Completed: ${new Date(sessionData.completedAt).toLocaleString()}`);
    }
    
    console.log('─'.repeat(30) + '\n');
  }

  printFreelancerAccountInfo(account: FreelancerAccount): void {
    console.log('\n💼 Freelancer Account Details:');
    console.log('─'.repeat(40));
    console.log(`Email: ${account.email}`);
    console.log(`Account ID: ${account.id}`);
    console.log(`Smart Account Address: ${account.smartAccountAddress}`);
    console.log(`Chain ID: ${account.chainId}`);
    console.log(`Status: ${account.status}`);
    console.log(`Created: ${new Date(account.createdAt).toLocaleString()}`);
    
    if (account.permissions.length > 0) {
      console.log('\n🔐 Permissions (from Grid SDK):');
      console.log(JSON.stringify(account.permissions, null, 2));
    } else {
      console.log('\n🔐 Permissions: None yet (will show actual Grid SDK data)');
    }
    
    if (account.spendingLimits) {
      console.log('\n💳 Spending Limits:');
      console.log(`  Daily Limit: $${account.spendingLimits.dailyLimit}`);
      console.log(`  Monthly Limit: $${account.spendingLimits.monthlyLimit}`);
      console.log(`  Allowed Tokens: ${account.spendingLimits.allowedTokens.join(', ')}`);
      if (account.spendingLimits.allowedRecipients) {
        console.log(`  Allowed Recipients: ${account.spendingLimits.allowedRecipients.length} addresses`);
      }
    }
    
    console.log('─'.repeat(40) + '\n');
  }

  async confirm(message: string): Promise<boolean> {
    const answer = await this.question(`${message} (y/n): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  clearScreen(): void {
    if (this.config.clearOnStart) {
      console.clear();
    }
  }

  printSeparator(): void {
    console.log('\n' + '-'.repeat(50) + '\n');
  }

  printTable(headers: string[], rows: string[][]): void {
    if (rows.length === 0) {
      this.printInfo('No data to display');
      return;
    }

    const columnWidths = headers.map((header, index) => {
      const maxRowWidth = Math.max(...rows.map(row => (row[index] || '').length));
      return Math.max(header.length, maxRowWidth);
    });

    const printRow = (row: string[]) => {
      const formatted = row.map((cell, index) => 
        (cell || '').padEnd(columnWidths[index])
      ).join(' | ');
      console.log(`| ${formatted} |`);
    };

    const separator = '|' + columnWidths.map(width => '-'.repeat(width + 2)).join('|') + '|';
    
    console.log(separator);
    printRow(headers);
    console.log(separator);
    rows.forEach(row => printRow(row));
    console.log(separator);
  }

  async promptForNumber(message: string, min?: number, max?: number): Promise<number> {
    while (true) {
      const input = await this.question(message);
      const num = parseInt(input, 10);
      
      if (isNaN(num)) {
        this.printError('Please enter a valid number');
        continue;
      }
      
      if (min !== undefined && num < min) {
        this.printError(`Number must be at least ${min}`);
        continue;
      }
      
      if (max !== undefined && num > max) {
        this.printError(`Number must be at most ${max}`);
        continue;
      }
      
      return num;
    }
  }

  async promptForEmail(message: string = 'Enter email address: '): Promise<string> {
    while (true) {
      const email = await this.question(message);
      if (this.isValidEmail(email)) {
        return email;
      }
      this.printError('Invalid email address. Please try again.');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = __importDefault(require("readline"));
class ConsoleHelper {
    constructor(config = {}) {
        this.config = {
            clearOnStart: true,
            showTimestamps: false,
            ...config
        };
        this.rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }
    close() {
        this.rl.close();
    }
    printHeader(title) {
        console.log('\n' + '='.repeat(50));
        console.log(`  ${title}`);
        console.log('='.repeat(50) + '\n');
    }
    printSuccess(message) {
        const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
        console.log(`${timestamp}✅ ${message}`);
    }
    printError(message) {
        const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
        console.log(`${timestamp}❌ ${message}`);
    }
    printInfo(message) {
        const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
        console.log(`${timestamp}ℹ️  ${message}`);
    }
    printWarning(message) {
        const timestamp = this.config.showTimestamps ? `[${new Date().toISOString()}] ` : '';
        console.log(`${timestamp}⚠️  ${message}`);
    }
    printMenu(options) {
        console.log('\nPlease select an option:');
        options.forEach((option, index) => {
            console.log(`${index + 1}. ${option}`);
        });
        console.log();
    }
    printAccountInfo(sessionData) {
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
    printFreelancerAccountInfo(account) {
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
        }
        else {
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
    async confirm(message) {
        const answer = await this.question(`${message} (y/n): `);
        return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
    }
    clearScreen() {
        if (this.config.clearOnStart) {
            console.clear();
        }
    }
    printSeparator() {
        console.log('\n' + '-'.repeat(50) + '\n');
    }
    printTable(headers, rows) {
        if (rows.length === 0) {
            this.printInfo('No data to display');
            return;
        }
        const columnWidths = headers.map((header, index) => {
            const maxRowWidth = Math.max(...rows.map(row => (row[index] || '').length));
            return Math.max(header.length, maxRowWidth);
        });
        const printRow = (row) => {
            const formatted = row.map((cell, index) => (cell || '').padEnd(columnWidths[index])).join(' | ');
            console.log(`| ${formatted} |`);
        };
        const separator = '|' + columnWidths.map(width => '-'.repeat(width + 2)).join('|') + '|';
        console.log(separator);
        printRow(headers);
        console.log(separator);
        rows.forEach(row => printRow(row));
        console.log(separator);
    }
    async promptForNumber(message, min, max) {
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
    async promptForEmail(message = 'Enter email address: ') {
        while (true) {
            const email = await this.question(message);
            if (this.isValidEmail(email)) {
                return email;
            }
            this.printError('Invalid email address. Please try again.');
        }
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.default = ConsoleHelper;
//# sourceMappingURL=console.js.map
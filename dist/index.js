"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grid_1 = require("@sqds/grid");
const dotenv_1 = __importDefault(require("dotenv"));
const console_1 = __importDefault(require("./utils/console"));
dotenv_1.default.config();
class GridPayrollDemo {
    constructor() {
        this.authResult = null;
        this.tempSessionData = null;
        this.sessionSecrets = null;
        // Initialize Grid SDK client directly (following quickstart example)
        this.gridClient = new grid_1.GridClient({
            environment: process.env.GRID_ENVIRONMENT || 'sandbox',
            apiKey: process.env.GRID_API_KEY,
            baseUrl: 'https://grid.squads.xyz'
        });
        this.console = new console_1.default();
    }
    async start() {
        this.console.clearScreen();
        this.console.printHeader('Grid SDK Payroll Company Prototype - TypeScript');
        try {
            await this.showAuthMenu();
        }
        catch (error) {
            this.console.printError(`Application error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        finally {
            this.console.close();
        }
    }
    // =============================================================================
    // AUTHENTICATION METHODS - Following Grid SDK quickstart examples exactly
    // =============================================================================
    async showAuthMenu() {
        while (true) {
            this.console.printMenu([
                'Create New Freelancer Account (Sign Up)',
                'Login to Existing Freelancer Account',
                'Exit'
            ]);
            const choice = await this.console.question('Enter your choice (1-3): ');
            switch (choice) {
                case '1':
                    await this.handleSignup();
                    break;
                case '2':
                    await this.handleLogin();
                    break;
                case '3':
                    this.console.printInfo('Goodbye!');
                    return;
                default:
                    this.console.printError('Invalid choice. Please try again.');
                    continue;
            }
            if (this.authResult) {
                await this.showMainMenu();
                break;
            }
        }
    }
    async handleSignup() {
        this.console.printSeparator();
        this.console.printInfo('Creating a new freelancer Grid account...');
        const email = await this.console.promptForEmail('Enter your email address: ');
        try {
            this.console.printInfo('Initiating freelancer account creation...');
            // Step 1: Create account (following quickstart example exactly)
            this.console.printInfo('🔍 Calling Grid SDK: createAccount({ email })');
            const response = await this.gridClient.createAccount({ email });
            console.log('\n=== GRID SDK RESPONSE: createAccount ===');
            console.log(JSON.stringify(response, null, 2));
            console.log('=== END RESPONSE ===\n');
            const user = response.data;
            // Step 2: Generate session secrets
            this.console.printInfo('🔍 Calling Grid SDK: generateSessionSecrets()');
            const sessionSecrets = await this.gridClient.generateSessionSecrets();
            console.log('\n=== GRID SDK RESPONSE: generateSessionSecrets ===');
            console.log(JSON.stringify(sessionSecrets, null, 2));
            console.log('=== END RESPONSE ===\n');
            // Store session data temporarily for OTP completion
            this.tempSessionData = {
                email,
                user,
                sessionSecrets,
                type: 'signup'
            };
            this.console.printSuccess('Account creation initiated. Check your email for OTP.');
            await this.handleOtpVerification('signup');
        }
        catch (error) {
            this.console.printError(`Account creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleLogin() {
        this.console.printSeparator();
        this.console.printInfo('Logging into existing freelancer Grid account...');
        const email = await this.console.promptForEmail('Enter your email address: ');
        try {
            this.console.printInfo('Initiating login...');
            // Step 1: Generate fresh session secrets for authentication (FIRST, per quickstart)
            this.console.printInfo('🔍 Calling Grid SDK: generateSessionSecrets() [for login]');
            const authSessionSecrets = await this.gridClient.generateSessionSecrets();
            console.log('\n=== GRID SDK RESPONSE: generateSessionSecrets [LOGIN] ===');
            console.log(JSON.stringify(authSessionSecrets, null, 2));
            console.log('=== END RESPONSE ===\n');
            // Step 2: Initialize authentication for existing account (following quickstart order)
            this.console.printInfo('🔍 Calling Grid SDK: initAuth({ email })');
            const authUser = await this.gridClient.initAuth({ email });
            console.log('\n=== GRID SDK RESPONSE: initAuth ===');
            console.log(JSON.stringify(authUser, null, 2));
            console.log('=== END RESPONSE ===\n');
            // Store session data temporarily for OTP completion
            this.tempSessionData = {
                email,
                user: authUser.data,
                sessionSecrets: authSessionSecrets,
                type: 'login'
            };
            this.console.printSuccess('Login initiated. Check your email for OTP.');
            await this.handleOtpVerification('login');
        }
        catch (error) {
            this.console.printError(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async handleOtpVerification(type) {
        this.console.printInfo('Please check your email for the OTP code (including spam folder).');
        while (true) {
            const otpCode = await this.console.question('Enter the 6-digit OTP code: ');
            if (!/^\d{6}$/.test(otpCode)) {
                this.console.printError('OTP code must be 6 digits. Please try again.');
                continue;
            }
            try {
                this.console.printInfo('Verifying OTP code...');
                if (!this.tempSessionData) {
                    this.console.printError('Session data not found. Please start over.');
                    return;
                }
                let authResult;
                if (type === 'signup') {
                    // Step 3: Complete authentication and create account (for new accounts)
                    this.console.printInfo('🔍 Calling Grid SDK: completeAuthAndCreateAccount()');
                    authResult = await this.gridClient.completeAuthAndCreateAccount({
                        user: this.tempSessionData.user,
                        otpCode,
                        sessionSecrets: this.tempSessionData.sessionSecrets
                    });
                    console.log('\n=== GRID SDK RESPONSE: completeAuthAndCreateAccount ===');
                    console.log(JSON.stringify(authResult, null, 2));
                    console.log('=== END RESPONSE ===\n');
                }
                else {
                    // Step 3: Complete authentication only (for existing accounts)
                    this.console.printInfo('🔍 Calling Grid SDK: completeAuth()');
                    authResult = await this.gridClient.completeAuth({
                        user: this.tempSessionData.user,
                        otpCode,
                        sessionSecrets: this.tempSessionData.sessionSecrets
                    });
                    console.log('\n=== GRID SDK RESPONSE: completeAuth ===');
                    console.log(JSON.stringify(authResult, null, 2));
                    console.log('=== END RESPONSE ===\n');
                }
                // Store auth result and session secrets for transaction signing
                this.authResult = authResult;
                this.sessionSecrets = this.tempSessionData?.sessionSecrets;
                this.tempSessionData = null;
                this.console.printSuccess(`${type === 'signup' ? 'Account created' : 'Logged in'} successfully!`);
                // Automatically display smart account details after successful authentication
                await this.showSmartAccountInfo();
                break;
            }
            catch (error) {
                this.console.printError(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                const retry = await this.console.confirm('Would you like to try again?');
                if (!retry) {
                    break;
                }
            }
        }
    }
    // =============================================================================
    // MAIN MENU AND SMART ACCOUNT METHODS
    // =============================================================================
    async showMainMenu() {
        while (true) {
            this.console.printSeparator();
            this.console.printMenu([
                'View Account Balance (✅ Working)',
                'View Spending Limits (✅ Working)',
                'Create Spending Limit (✅ Working)',
                'Update Signature Threshold (✅ Working)',
                'Exit'
            ]);
            const choice = await this.console.question('Enter your choice (1-5): ');
            switch (choice) {
                case '1':
                    await this.showAccountBalance();
                    break;
                case '2':
                    await this.showSpendingLimits();
                    break;
                case '3':
                    await this.createSpendingLimit();
                    break;
                case '4':
                    await this.updateSignatureThreshold();
                    break;
                case '5':
                    this.console.printInfo('Goodbye!');
                    return;
                default:
                    this.console.printError('Invalid choice. Please try again.');
            }
        }
    }
    async showSmartAccountInfo() {
        if (!this.authResult || !this.authResult.data) {
            this.console.printError('❌ No authenticated account found.');
            this.console.printInfo('Please complete the login or signup process first.');
            await this.console.question('Press Enter to continue...');
            return;
        }
        try {
            this.console.printSeparator();
            this.console.printInfo('📋 Smart Account Details');
            this.console.printSeparator();
            const accountData = this.authResult.data;
            // Display wallet address
            this.console.printSuccess(`🏦 Smart Account Address: ${accountData.address}`);
            this.console.printSeparator();
            // Fetch additional account details using getAccount()
            this.console.printInfo('🔍 Calling Grid SDK: getAccount() for comprehensive details...');
            const accountDetailsResponse = await this.gridClient.getAccount(accountData.address);
            console.log('\n=== GRID SDK RESPONSE: getAccount ===');
            console.log(JSON.stringify(accountDetailsResponse, null, 2));
            console.log('=== END RESPONSE ===\n');
            // Display ownership and permissions from auth data
            if (accountData.policies && accountData.policies.signers) {
                this.console.printInfo('👥 Account Ownership & Permissions:');
                accountData.policies.signers.forEach((signer, index) => {
                    this.console.printInfo(`\n${index + 1}. ${signer.role.toUpperCase()} SIGNER:`);
                    this.console.printInfo(`   Address: ${signer.address}`);
                    this.console.printInfo(`   Provider: ${signer.provider}`);
                    this.console.printInfo(`   Permissions: ${signer.permissions.join(', ')}`);
                });
                this.console.printSeparator();
                // Display account policies
                this.console.printInfo('🔒 Account Policies:');
                this.console.printInfo(`   Signature Threshold: ${accountData.policies.threshold}`);
                this.console.printInfo(`   Time Lock: ${accountData.policies.time_lock || 'None'}`);
                this.console.printInfo(`   Admin Address: ${accountData.policies.admin_address || 'None'}`);
                // Grid User ID
                this.console.printInfo(`\n🆔 Grid User ID: ${accountData.grid_user_id}`);
            }
            else {
                this.console.printWarning('⚠️ No policy data found in authentication response.');
            }
        }
        catch (error) {
            this.console.printError(`Failed to fetch account details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await this.console.question('\nPress Enter to continue...');
    }
    async showAccountBalance() {
        if (!this.authResult || !this.authResult.data) {
            this.console.printError('❌ No authenticated account found.');
            this.console.printInfo('Please complete the login or signup process first.');
            await this.console.question('Press Enter to continue...');
            return;
        }
        try {
            this.console.printSeparator();
            this.console.printInfo('💰 Account Balance');
            this.console.printSeparator();
            const accountAddress = this.authResult.data.address;
            this.console.printSuccess(`🏦 Account: ${accountAddress}`);
            // Fetch account balances using Grid SDK
            this.console.printInfo('🔍 Calling Grid SDK: getAccountBalances()');
            const balanceResponse = await this.gridClient.getAccountBalances(accountAddress);
            console.log('\n=== GRID SDK RESPONSE: getAccountBalances ===');
            console.log(JSON.stringify(balanceResponse, null, 2));
            console.log('=== END RESPONSE ===\n');
            const balanceData = balanceResponse.data;
            // Display SOL balance
            this.console.printInfo('💎 SOL Balance:');
            this.console.printInfo(`   Lamports: ${balanceData.lamports.toString()}`);
            this.console.printInfo(`   SOL: ${balanceData.sol} SOL`);
            // Display token balances
            this.console.printSeparator();
            if (balanceData.tokens && balanceData.tokens.length > 0) {
                this.console.printInfo('🪙 Token Balances:');
                balanceData.tokens.forEach((token, index) => {
                    this.console.printInfo(`\n${index + 1}. Token:`);
                    this.console.printInfo(`   Mint: ${token.mint || 'Unknown'}`);
                    this.console.printInfo(`   Amount: ${token.amount || '0'}`);
                    this.console.printInfo(`   Decimals: ${token.decimals || 'Unknown'}`);
                    this.console.printInfo(`   Symbol: ${token.symbol || 'Unknown'}`);
                    // Highlight USDC specifically for payroll context
                    if (token.symbol === 'USDC' || token.mint?.includes('USDC')) {
                        this.console.printSuccess(`   💵 USDC Balance: ${token.amount || '0'} USDC`);
                    }
                });
            }
            else {
                this.console.printInfo('🪙 Token Balances: No tokens found');
            }
        }
        catch (error) {
            this.console.printError(`Failed to fetch account balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await this.console.question('\nPress Enter to continue...');
    }
    async showSpendingLimits() {
        if (!this.authResult || !this.authResult.data) {
            this.console.printError('❌ No authenticated account found.');
            this.console.printInfo('Please complete the login or signup process first.');
            await this.console.question('Press Enter to continue...');
            return;
        }
        try {
            this.console.printSeparator();
            this.console.printInfo('🚦 Spending Limits');
            this.console.printSeparator();
            const accountAddress = this.authResult.data.address;
            this.console.printSuccess(`🏦 Account: ${accountAddress}`);
            // Fetch spending limits using Grid SDK
            this.console.printInfo('🔍 Calling Grid SDK: getSpendingLimits()');
            const spendingLimitsResponse = await this.gridClient.getSpendingLimits(accountAddress);
            console.log('\n=== GRID SDK RESPONSE: getSpendingLimits ===');
            console.log(JSON.stringify(spendingLimitsResponse, null, 2));
            console.log('=== END RESPONSE ===\n');
            const spendingLimits = spendingLimitsResponse.data;
            if (spendingLimits && spendingLimits.length > 0) {
                this.console.printInfo(`📋 Found ${spendingLimits.length} spending limit(s):`);
                spendingLimits.forEach((limit, index) => {
                    this.console.printInfo(`\n${index + 1}. Spending Limit:`);
                    this.console.printInfo(`   Address: ${limit.address}`);
                    this.console.printInfo(`   Token Mint: ${limit.mint}`);
                    this.console.printInfo(`   Amount: ${limit.amount}`);
                    this.console.printInfo(`   Remaining: ${limit.remaining_amount}`);
                    const periodTypes = ['One-time', 'Daily', 'Weekly', 'Monthly'];
                    this.console.printInfo(`   Period: ${periodTypes[limit.period] || 'Unknown'}`);
                    this.console.printInfo(`   Status: ${limit.status}`);
                    if (limit.destinations && limit.destinations.length > 0) {
                        this.console.printInfo(`   Allowed destinations: ${limit.destinations.length}`);
                    }
                    if (limit.signers && limit.signers.length > 0) {
                        this.console.printInfo(`   Authorized signers (${limit.signers.length}):`);
                        limit.signers.forEach((signerAddress, signerIndex) => {
                            // Try to match this signer address with our account signers to get provider info
                            const accountSigner = this.authResult.data.policies.signers.find((accountSigner) => accountSigner.address === signerAddress);
                            if (accountSigner) {
                                this.console.printInfo(`     ${signerIndex + 1}. ${signerAddress} (${accountSigner.provider} - ${accountSigner.role})`);
                            }
                            else {
                                this.console.printInfo(`     ${signerIndex + 1}. ${signerAddress} (Unknown provider)`);
                            }
                        });
                    }
                });
            }
            else {
                this.console.printInfo('📋 No spending limits configured for this account');
                this.console.printInfo('Use "Create Spending Limit" to set up spending controls');
            }
        }
        catch (error) {
            this.console.printError(`Failed to fetch spending limits: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await this.console.question('\nPress Enter to continue...');
    }
    async createSpendingLimit() {
        if (!this.authResult || !this.authResult.data) {
            this.console.printError('❌ No authenticated account found.');
            this.console.printInfo('Please complete the login or signup process first.');
            await this.console.question('Press Enter to continue...');
            return;
        }
        try {
            this.console.printSeparator();
            this.console.printInfo('➕ Create New Spending Limit');
            this.console.printSeparator();
            const accountAddress = this.authResult.data.address;
            this.console.printSuccess(`🏦 Account: ${accountAddress}`);
            // Collect spending limit parameters
            const amount = await this.console.question('Enter spending limit amount: ');
            this.console.printInfo('\nToken options:');
            this.console.printInfo('1. USDC (recommended for payroll)');
            this.console.printInfo('2. SOL');
            this.console.printInfo('3. Custom token mint address');
            const tokenChoice = await this.console.question('Select token type (1-3): ');
            let mint = '';
            switch (tokenChoice) {
                case '1':
                    mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint on mainnet
                    break;
                case '2':
                    mint = 'So11111111111111111111111111111111111111112'; // Wrapped SOL
                    break;
                case '3':
                    mint = await this.console.question('Enter token mint address: ');
                    break;
                default:
                    this.console.printError('Invalid choice. Defaulting to USDC.');
                    mint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
            }
            this.console.printInfo('\nPeriod options:');
            this.console.printInfo('0. One-time');
            this.console.printInfo('1. Daily');
            this.console.printInfo('2. Weekly');
            this.console.printInfo('3. Monthly');
            const periodChoice = await this.console.question('Select period (0-3): ');
            const periodIndex = parseInt(periodChoice) || 1; // Default to daily
            // Map numeric choice to lowercase string values
            const periodValues = ['one_time', 'daily', 'weekly', 'monthly'];
            const period = periodValues[periodIndex] || 'daily';
            // Create spending limit request
            const spendingLimitRequest = {
                amount: parseFloat(amount) || 0,
                mint: mint,
                period: period, // Cast to SpendingLimitPeriod type
                spending_limit_signers: [this.authResult.data.policies.signers[0].address] // Use primary signer by default
            };
            this.console.printInfo('🔍 Calling Grid SDK: createSpendingLimit()');
            const createResponse = await this.gridClient.createSpendingLimit(accountAddress, spendingLimitRequest);
            console.log('\n=== GRID SDK RESPONSE: createSpendingLimit ===');
            console.log(JSON.stringify(createResponse, null, 2));
            console.log('=== END RESPONSE ===\n');
            // Immediately sign and submit the transaction to deploy the spending limit (no user interaction)
            this.console.printInfo('🔍 Calling Grid SDK: signAndSend() to deploy spending limit');
            // Debug: Log the parameters we're passing to signAndSend
            console.log('\n=== DEBUG: signAndSend PARAMETERS ===');
            console.log('sessionSecrets:', JSON.stringify(this.sessionSecrets, null, 2));
            console.log('session (authResult.data.authentication):', JSON.stringify(this.authResult.data.authentication, null, 2));
            console.log('transactionPayload:', JSON.stringify(createResponse.data, null, 2));
            console.log('address:', accountAddress);
            console.log('=== END DEBUG ===\n');
            const signature = await this.gridClient.signAndSend({
                sessionSecrets: this.sessionSecrets,
                session: this.authResult.data.authentication,
                transactionPayload: createResponse.data,
                address: accountAddress
            });
            console.log('\n=== GRID SDK RESPONSE: signAndSend ===');
            console.log(JSON.stringify(signature, null, 2));
            console.log('=== END RESPONSE ===\n');
            this.console.printSuccess('✅ Spending limit created and deployed successfully!');
            this.console.printInfo(`💰 Amount: ${amount}`);
            this.console.printInfo(`🪙 Token: ${mint}`);
            this.console.printInfo(`📅 Period: ${['One-time', 'Daily', 'Weekly', 'Monthly'][periodIndex]}`);
            if (createResponse.data && createResponse.data.spending_limit_address) {
                this.console.printInfo(`🔗 Spending Limit Address: ${createResponse.data.spending_limit_address}`);
            }
            if (signature && signature.data && signature.data.transaction_signature) {
                this.console.printSuccess(`📝 Transaction Signature: ${signature.data.transaction_signature}`);
            }
        }
        catch (error) {
            this.console.printError(`Failed to create spending limit: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await this.console.question('\nPress Enter to continue...');
    }
    async updateSignatureThreshold() {
        if (!this.authResult || !this.authResult.data) {
            this.console.printError('❌ No authenticated account found.');
            this.console.printInfo('Please complete the login or signup process first.');
            await this.console.question('Press Enter to continue...');
            return;
        }
        try {
            this.console.printSeparator();
            this.console.printInfo('🔧 Update Signature Threshold');
            this.console.printSeparator();
            const accountAddress = this.authResult.data.address;
            this.console.printSuccess(`🏦 Account: ${accountAddress}`);
            // Show current threshold and signer information
            const currentPolicies = this.authResult.data.policies;
            const currentThreshold = currentPolicies.threshold;
            const signerCount = currentPolicies.signers ? currentPolicies.signers.length : 0;
            this.console.printInfo('\nCurrent Account Configuration:');
            this.console.printInfo(`   📊 Signature Threshold: ${currentThreshold}`);
            this.console.printInfo(`   👥 Total Signers: ${signerCount}`);
            this.console.printInfo(`   ℹ️  Currently requires ${currentThreshold} out of ${signerCount} signatures for transactions`);
            // Get new threshold from user
            this.console.printSeparator();
            const newThreshold = await this.console.question(`Enter new signature threshold (1-${signerCount}, current: ${currentThreshold}): `);
            const threshold = parseInt(newThreshold);
            // Enhanced validation
            if (isNaN(threshold) || threshold < 1) {
                this.console.printError('Threshold must be at least 1.');
                return;
            }
            if (threshold > signerCount) {
                this.console.printError(`Threshold cannot exceed the number of signers (${signerCount}).`);
                this.console.printInfo('Add more signers to the account before increasing the threshold.');
                return;
            }
            if (threshold === currentThreshold) {
                this.console.printWarning('New threshold is the same as current threshold.');
                await this.console.question('Press Enter to continue...');
                return;
            }
            // Show what will change and ask for confirmation
            this.console.printInfo(`\n🔄 Proposed Change:`);
            this.console.printInfo(`   Current: ${currentThreshold}/${signerCount} signatures required`);
            this.console.printInfo(`   New: ${threshold}/${signerCount} signatures required`);
            if (threshold < currentThreshold) {
                this.console.printWarning('⚠️  This will REDUCE security by requiring fewer signatures.');
            }
            else {
                this.console.printInfo('✅ This will INCREASE security by requiring more signatures.');
            }
            const confirm = await this.console.confirm('\nProceed with signature threshold update?');
            if (!confirm) {
                this.console.printInfo('Update cancelled.');
                await this.console.question('Press Enter to continue...');
                return;
            }
            const updateRequest = { threshold };
            this.console.printInfo('🔍 Calling Grid SDK: updateAccount()');
            const updateResponse = await this.gridClient.updateAccount(accountAddress, updateRequest);
            console.log('\n=== GRID SDK RESPONSE: updateAccount ===');
            console.log(JSON.stringify(updateResponse, null, 2));
            console.log('=== END RESPONSE ===\n');
            // Sign and send the transaction to deploy the policy changes (following pattern from createSpendingLimit)
            this.console.printInfo('🔍 Calling Grid SDK: signAndSend() to deploy account policy changes');
            // Debug: Log the parameters we're passing to signAndSend
            console.log('\n=== DEBUG: signAndSend PARAMETERS ===');
            console.log('sessionSecrets:', JSON.stringify(this.sessionSecrets, null, 2));
            console.log('session (authResult.data.authentication):', JSON.stringify(this.authResult.data.authentication, null, 2));
            console.log('transactionPayload:', JSON.stringify(updateResponse.data, null, 2));
            console.log('address:', accountAddress);
            console.log('=== END DEBUG ===\n');
            const signature = await this.gridClient.signAndSend({
                sessionSecrets: this.sessionSecrets,
                session: this.authResult.data.authentication,
                transactionPayload: updateResponse.data,
                address: accountAddress
            });
            console.log('\n=== GRID SDK RESPONSE: signAndSend ===');
            console.log(JSON.stringify(signature, null, 2));
            console.log('=== END RESPONSE ===\n');
            this.console.printSuccess('✅ Account policy changes deployed successfully!');
            if (signature && signature.data && signature.data.transaction_signature) {
                this.console.printSuccess(`📝 Transaction Signature: ${signature.data.transaction_signature}`);
            }
            if (updateRequest.threshold) {
                this.console.printInfo(`🔧 New Signature Threshold: ${updateRequest.threshold}`);
            }
        }
        catch (error) {
            this.console.printError(`Failed to update account policies: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        await this.console.question('\nPress Enter to continue...');
    }
    // =============================================================================
    // HELPER METHODS
    // =============================================================================
    async getFreelancerAccountInfo() {
        // This method will be implemented to extract real data from Grid SDK responses
        // For now, returning null to avoid mock data
        return null;
    }
    // =============================================================================
    // HELPER METHODS
    // =============================================================================
    // Direct access to GridClient for advanced operations (if needed later)
    getGridClient() {
        return this.gridClient;
    }
}
// Start the application
const demo = new GridPayrollDemo();
demo.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
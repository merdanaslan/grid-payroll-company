import { GridClient } from '@sqds/grid';
import dotenv from 'dotenv';
import ConsoleHelper from './utils/console';
import { FreelancerAccount } from './types/index';

dotenv.config();

class GridPayrollDemo {
  private gridClient: GridClient;
  private console: ConsoleHelper;
  private authResult: any = null;
  private tempSessionData: any = null;
  private sessionSecrets: any = null;

  constructor() {
    // Initialize Grid SDK client directly (following quickstart example)
    this.gridClient = new GridClient({
      environment: (process.env.GRID_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      apiKey: process.env.GRID_API_KEY!,
      baseUrl: 'https://grid.squads.xyz'
    });
    
    this.console = new ConsoleHelper();
  }

  async start(): Promise<void> {
    this.console.clearScreen();
    this.console.printHeader('Grid SDK Payroll Company Prototype - TypeScript');
    
    try {
      await this.showAuthMenu();
    } catch (error) {
      this.console.printError(`Application error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.console.close();
    }
  }



  private async showAuthMenu(): Promise<void> {
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

  private async handleSignup(): Promise<void> {
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
      
    } catch (error) {
      this.console.printError(`Account creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleLogin(): Promise<void> {
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
      
    } catch (error) {
      this.console.printError(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleOtpVerification(type: 'signup' | 'login'): Promise<void> {
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
            sessionSecrets: this.tempSessionData.sessionSecrets as any
          });
          
          console.log('\n=== GRID SDK RESPONSE: completeAuthAndCreateAccount ===');
          console.log(JSON.stringify(authResult, null, 2));
          console.log('=== END RESPONSE ===\n');
          
        } else {
          // Step 3: Complete authentication only (for existing accounts)
          this.console.printInfo('🔍 Calling Grid SDK: completeAuth()');
          authResult = await this.gridClient.completeAuth({
            user: this.tempSessionData.user,
            otpCode,
            sessionSecrets: this.tempSessionData.sessionSecrets as any
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
        
      } catch (error) {
        this.console.printError(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        const retry = await this.console.confirm('Would you like to try again?');
        if (!retry) {
          break;
        }
      }
    }
  }

  
  // MAIN MENU AND SMART ACCOUNT METHODS
 

  private async showMainMenu(): Promise<void> {
    while (true) {
      this.console.printSeparator();
      this.console.printMenu([
        'View Account Balance (✅ Working)',
        'View Spending Limits (✅ Working)',
        'Create Spending Limit (✅ Working)',
        'Update Signature Threshold (✅ Working)',
        'Simulate Receiving USDC Payroll Payment (Demo)',
        'Spend USDC Within Limits (Demo)',
        'Create Multiple Freelancer Accounts (Sequential Demo)',
        'Setup Automated Payroll System (Standing Orders Demo)',
        'Exit'
      ]);

      const choice = await this.console.question('Enter your choice (1-9): ');

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
          await this.simulateReceivePayrollPayment();
          break;
        case '6':
          await this.spendUSDCWithinLimits();
          break;
        case '7':
          await this.createMultipleFreelancerAccounts();
          break;
        case '8':
          await this.setupAutomatedPayroll();
          break;
        case '9':
          this.console.printInfo('Goodbye!');
          return;
        default:
          this.console.printError('Invalid choice. Please try again.');
      }
    }
  }


  private async showSmartAccountInfo(): Promise<void> {
    if (!this.authResult || !this.authResult.data) {
      this.console.printError('❌ No authenticated account found.');
      this.console.printInfo('Please complete the login or signup process first.');
      await this.console.question('Press Enter to continue...');
      return;
    }

    try {
      this.console.printSeparator();
      this.console.printInfo('Smart Account Details');
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
        
        accountData.policies.signers.forEach((signer: any, index: number) => {
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
        
      } else {
        this.console.printWarning('⚠️ No policy data found in authentication response.');
      }

    } catch (error) {
      this.console.printError(`Failed to fetch account details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  private async showAccountBalance(): Promise<void> {
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
        balanceData.tokens.forEach((token: any, index: number) => {
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
      } else {
        this.console.printInfo('🪙 Token Balances: No tokens found');
      }

    } catch (error) {
      this.console.printError(`Failed to fetch account balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  private async showSpendingLimits(): Promise<void> {
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
        this.console.printInfo(`Found ${spendingLimits.length} spending limit(s):`);
        
        spendingLimits.forEach((limit: any, index: number) => {
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
            limit.signers.forEach((signerAddress: string, signerIndex: number) => {
              // Try to match this signer address with our account signers to get provider info
              const accountSigner = this.authResult.data.policies.signers.find(
                (accountSigner: any) => accountSigner.address === signerAddress
              );
              
              if (accountSigner) {
                this.console.printInfo(`     ${signerIndex + 1}. ${signerAddress} (${accountSigner.provider} - ${accountSigner.role})`);
              } else {
                this.console.printInfo(`     ${signerIndex + 1}. ${signerAddress} (Unknown provider)`);
              }
            });
          }
        });
      } else {
        this.console.printInfo('No spending limits configured for this account');
        this.console.printInfo('Use "Create Spending Limit" to set up spending controls');
      }

    } catch (error) {
      this.console.printError(`Failed to fetch spending limits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  private async createSpendingLimit(): Promise<void> {
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
        period: period as any, // Cast to SpendingLimitPeriod type
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

    } catch (error) {
      this.console.printError(`Failed to create spending limit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  private async updateSignatureThreshold(): Promise<void> {
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
      this.console.printInfo(`   Currently requires ${currentThreshold} out of ${signerCount} signatures for transactions`);

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
      this.console.printInfo(`\nProposed Change:`);
      this.console.printInfo(`   Current: ${currentThreshold}/${signerCount} signatures required`);
      this.console.printInfo(`   New: ${threshold}/${signerCount} signatures required`);
      
      if (threshold < currentThreshold) {
        this.console.printWarning('⚠️  This will REDUCE security by requiring fewer signatures.');
      } else {
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

    } catch (error) {
      this.console.printError(`Failed to update account policies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  private async simulateReceivePayrollPayment(): Promise<void> {
    if (!this.authResult || !this.authResult.data) {
      this.console.printError('❌ No authenticated account found.');
      this.console.printInfo('Please complete the login or signup process first.');
      await this.console.question('Press Enter to continue...');
      return;
    }

    try {
      this.console.printSeparator();
      this.console.printInfo('💰 Simulate Receiving USDC Payroll Payment');
      this.console.printSeparator();

      const accountAddress = this.authResult.data.address;
      this.console.printSuccess(`🏦 Account: ${accountAddress}`);

      // Show current balance first
      this.console.printInfo('📊 Current Balance:');
      const balanceResponse = await this.gridClient.getAccountBalances(accountAddress);
      const currentUSDCBalance = this.extractUSDCBalance(balanceResponse.data);
      this.console.printInfo(`   Current USDC: ${currentUSDCBalance} USDC`);

      this.console.printSeparator();
      this.console.printInfo('🏢 USDC Payroll Payment Simulation');
      this.console.printInfo('Scenario: Your employer (TechCorp Inc.) is sending your monthly freelancer payment in USDC');

      // Present payment amount options
      this.console.printInfo('\nSelect payment amount:');
      this.console.printInfo('1. 1,000 USDC');
      this.console.printInfo('2. 2,500 USDC');
      this.console.printInfo('3. 5,000 USDC');
      this.console.printInfo('4. Custom amount');

      const amountChoice = await this.console.question('Enter your choice (1-4): ');
      let paymentAmount = 2500; // Default

      switch (amountChoice) {
        case '1':
          paymentAmount = 1000;
          break;
        case '2':
          paymentAmount = 2500;
          break;
        case '3':
          paymentAmount = 5000;
          break;
        case '4':
          const customAmount = await this.console.question('Enter amount in USDC: ');
          paymentAmount = parseFloat(customAmount) || 2500;
          break;
        default:
          this.console.printWarning('Invalid choice. Using default 2,500 USDC');
      }

      this.console.printSeparator();
      this.console.printInfo('Processing Payment...');
      
      // Real Grid SDK code for monitoring incoming USDC transfers:
      // const transfers = await this.gridClient.getTransfers(accountAddress);
      // 
      // // Check for new incoming payments:
      // const incomingPayments = transfers.data.filter(tx => 
      //   tx.direction === "inbound" && tx.confirmation_status === "confirmed"
      // );

      // Simulate payment processing delay
      this.console.printInfo('\nSimulating payment processing...');
      await this.sleep(2000);

      // Generate mock payment details
      const mockTransactionSignature = this.generateMockSignature();
      const timestamp = new Date().toISOString();

      // Show payment confirmation
      this.console.printSuccess('\n✅ USDC Payment Received Successfully!');
      this.console.printInfo('\nPayment Details:');
      this.console.printInfo(`   From: TechCorp Inc. (Employer Wallet)`);
      this.console.printInfo(`   Amount: ${paymentAmount} USDC`);
      this.console.printInfo(`   Token: USDC (SPL Token)`);
      this.console.printInfo(`   Transaction ID: ${mockTransactionSignature}`);
      this.console.printInfo(`   Processed At: ${new Date(timestamp).toLocaleString()}`);

      // Real Grid SDK code to check updated balance:
      // const balanceResponse = await this.gridClient.getAccountBalances(accountAddress);
      // const usdcBalance = balanceResponse.data.tokens.find(
      //   token => token.symbol === "USDC"
      // );
      // console.log(`New USDC balance: ${usdcBalance.amount}`);

      // Show updated balance
      this.console.printSeparator();
      this.console.printInfo('💰 Updated Balance:');
      const newUSDCBalance = currentUSDCBalance + paymentAmount;
      this.console.printInfo(`   Previous USDC: ${currentUSDCBalance} USDC`);
      this.console.printSuccess(`   Current USDC: ${newUSDCBalance} USDC`);
      this.console.printSuccess(`   Increase: +${paymentAmount} USDC`);

      // Store the simulated balance for use in spending demo
      if (!this.tempSessionData) {
        this.tempSessionData = {};
      }
      this.tempSessionData.mockUSDCBalance = newUSDCBalance;

      // Show recent transaction history
      this.console.printSeparator();
      this.console.printInfo('Recent Transaction History:');
      await this.showMockTransactionHistory(accountAddress, {
        type: 'incoming',
        amount: paymentAmount,
        signature: mockTransactionSignature,
        timestamp: timestamp,
        description: 'Payroll Payment from TechCorp Inc.'
      });

      this.console.printSeparator();
      this.console.printInfo('Demo Note: This was a simulated USDC transfer for demonstration purposes.');
      this.console.printInfo('In production, the employer would send real USDC from their wallet to yours');
      this.console.printInfo('and the Grid SDK would track the incoming transfer on the Solana blockchain.');

    } catch (error) {
      this.console.printError(`Failed to simulate payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  private extractUSDCBalance(balanceData: any): number {
    if (!balanceData || !balanceData.tokens) {
      return 0;
    }
    
    const usdcToken = balanceData.tokens.find((token: any) => 
      token.symbol === 'USDC' || 
      token.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    );
    
    return usdcToken ? parseFloat(usdcToken.amount || '0') : 0;
  }

  private generateMockSignature(): string {
    // Generate a realistic-looking Solana transaction signature
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 88; i++) { // Solana signatures are ~88 characters
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async spendUSDCWithinLimits(): Promise<void> {
    if (!this.authResult || !this.authResult.data) {
      this.console.printError('❌ No authenticated account found.');
      this.console.printInfo('Please complete the login or signup process first.');
      await this.console.question('Press Enter to continue...');
      return;
    }

    try {
      this.console.printSeparator();
      this.console.printInfo('💸 Spend USDC Within Configured Limits');
      this.console.printSeparator();

      const accountAddress = this.authResult.data.address;
      this.console.printSuccess(`🏦 Account: ${accountAddress}`);

      // Get current spending limits
      this.console.printInfo('📊 Checking current spending limits...');
      const spendingLimitsResponse = await this.gridClient.getSpendingLimits(accountAddress);
      const spendingLimits = spendingLimitsResponse.data || [];

      // Find USDC spending limits
      const usdcLimits = spendingLimits.filter((limit: any) => 
        limit.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' || // USDC mainnet
        limit.mint?.includes('USDC')
      );

      if (usdcLimits.length === 0) {
        this.console.printWarning('⚠️ No USDC spending limits configured.');
        this.console.printInfo('You may want to create a spending limit first for better security.');
        this.console.printInfo('Proceeding with demo using simulated limits...');
        
        // Use mock spending limit for demo
        await this.demonstrateSpendingWithMockLimits(accountAddress);
        return;
      }

      // Display available spending limits
      this.console.printInfo('\nAvailable USDC Spending Limits:');
      usdcLimits.forEach((limit: any, index: number) => {
        const periodTypes = ['One-time', 'Daily', 'Weekly', 'Monthly'];
        this.console.printInfo(`\n${index + 1}. Spending Limit:`);
        this.console.printInfo(`   Address: ${limit.address}`);
        this.console.printInfo(`   Amount: ${limit.amount} USDC`);
        this.console.printInfo(`   Remaining: ${limit.remaining_amount} USDC`);
        this.console.printInfo(`   Period: ${periodTypes[limit.period] || 'Unknown'}`);
        this.console.printInfo(`   Status: ${limit.status}`);
      });

      // Select spending limit to use
      let selectedLimit = usdcLimits[0]; // Default to first one
      if (usdcLimits.length > 1) {
        const choice = await this.console.question(`\nSelect spending limit to use (1-${usdcLimits.length}): `);
        const choiceIndex = parseInt(choice) - 1;
        if (choiceIndex >= 0 && choiceIndex < usdcLimits.length) {
          selectedLimit = usdcLimits[choiceIndex];
        }
      }

      this.console.printSeparator();
      this.console.printSuccess(`✅ Using spending limit: ${selectedLimit.address}`);
      this.console.printInfo(`💰 Available to spend: ${selectedLimit.remaining_amount} USDC`);

      // Get current balance (including any simulated balance)
      const balanceResponse = await this.gridClient.getAccountBalances(accountAddress);
      let currentUSDCBalance = this.extractUSDCBalance(balanceResponse.data);
      
      // Use simulated balance if available
      if (this.tempSessionData?.mockUSDCBalance) {
        currentUSDCBalance = this.tempSessionData.mockUSDCBalance;
        this.console.printInfo(`💵 Current USDC Balance: ${currentUSDCBalance} USDC (includes simulated payment)`);
      } else {
        this.console.printInfo(`💵 Current USDC Balance: ${currentUSDCBalance} USDC`);
      }

      // Present spending scenarios
      this.console.printSeparator();
      this.console.printInfo('Select spending scenario:');
      this.console.printInfo('1. Pay contractor ($500 USDC)');
      this.console.printInfo('2. Swap USDC to SOL ($75 worth)');

      const spendingChoice = await this.console.question('Enter your choice (1-2): ');
      let spendAmount = 75;
      let recipient = '';
      let description = '';

      switch (spendingChoice) {
        case '1':
          spendAmount = 500;
          recipient = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'; // Mock contractor address
          description = 'Pay contractor for development work';
          break;
        case '2':
          spendAmount = 75;
          recipient = accountAddress; // User's own wallet for swap
          description = 'Swap USDC to SOL';
          break;
        default:
          this.console.printWarning('Invalid choice. Using default token swap.');
          spendAmount = 75;
          recipient = accountAddress; // User's own wallet for swap
          description = 'Swap USDC to SOL';
      }

      // Validate spending constraints
      this.console.printSeparator();
      this.console.printInfo('🔍 Validating spending constraints...');
      
      const constraints = this.checkSpendingLimitConstraints(
        spendAmount, 
        currentUSDCBalance, 
        selectedLimit
      );

      if (!constraints.canSpend) {
        this.console.printError(`❌ Cannot process transaction: ${constraints.reason}`);
        this.console.printInfo('\n💡 Suggestions:');
        constraints.suggestions.forEach(suggestion => {
          this.console.printInfo(`   • ${suggestion}`);
        });
        await this.console.question('\nPress Enter to continue...');
        return;
      }

      this.console.printSuccess('✅ Transaction validates against spending limits');

      // Real Grid SDK code that would be used in production:
      if (description.includes('contractor')) {
        // External payment using spending limit:
        // const spendingLimitTx = await this.gridClient.useSpendingLimit(
        //   accountAddress,
        //   selectedLimit.address,
        //   {
        //     destination_address: recipient,
        //     amount: spendAmount,
        //     mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC
        //   }
        // );
        //
        // // Sign and send the spending limit transaction:
        // const signature = await this.gridClient.signAndSend({
        //   sessionSecrets: this.sessionSecrets,
        //   session: this.authResult.data.authentication,
        //   transactionPayload: spendingLimitTx.data,
        //   address: accountAddress
        // });
      } else {
        // Token swap within spending limits:
        // const spendingLimitTx = await this.gridClient.useSpendingLimit(
        //   accountAddress,
        //   selectedLimit.address,
        //   {
        //     destination_address: accountAddress, // Self for swap
        //     amount: spendAmount,
        //     mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC
        //   }
        // );
        //
        // // For token swaps, prepare the swap transaction:
        // const swapTx = await this.gridClient.prepareArbitraryTransaction(
        //   accountAddress,
        //   { transaction: serializedSwapTransaction }
        // );
        // const swapSignature = await this.gridClient.signAndSend({
        //   sessionSecrets: this.sessionSecrets,
        //   session: this.authResult.data.authentication,
        //   transactionPayload: swapTx.data,
        //   address: accountAddress
        // });
      }

      // Simulate transaction processing
      this.console.printSeparator();
      this.console.printInfo('Processing transaction...');
      await this.sleep(1500);

      // Generate mock transaction details
      const mockTxSignature = this.generateMockSignature();
      const timestamp = new Date().toISOString();

      // Show transaction success
      this.console.printSuccess('\n✅ Transaction Completed Successfully!');
      this.console.printInfo('\nTransaction Details:');
      this.console.printInfo(`   Description: ${description}`);
      this.console.printInfo(`   Amount: ${spendAmount} USDC`);
      
      if (description.includes('contractor')) {
        this.console.printInfo(`   To: ${recipient} (External wallet)`);
      } else {
        this.console.printInfo(`   To: ${recipient} (Your wallet)`);
        this.console.printInfo(`   Type: Token swap (USDC → SOL)`);
        this.console.printInfo(`   Rate: ~166.67 USDC/SOL (example)`);
      }
      
      this.console.printInfo(`   Transaction ID: ${mockTxSignature}`);
      this.console.printInfo(`   Processed At: ${new Date(timestamp).toLocaleString()}`);

      // Update balances
      const newUSDCBalance = currentUSDCBalance - spendAmount;
      const newRemainingLimit = selectedLimit.remaining_amount - spendAmount;

      this.console.printSeparator();
      this.console.printInfo('💰 Updated Balances:');
      
      if (description.includes('contractor')) {
        this.console.printInfo(`   USDC Balance: ${currentUSDCBalance} → ${newUSDCBalance} USDC`);
      } else {
        // Show both USDC and SOL changes for swap
        const solReceived = (spendAmount / 166.67).toFixed(3); // Example conversion
        this.console.printInfo(`   USDC Balance: ${currentUSDCBalance} → ${newUSDCBalance} USDC (-${spendAmount})`);
        this.console.printInfo(`   SOL Balance: ~${solReceived} SOL added (+${solReceived} SOL)`);
      }
      
      this.console.printInfo(`   Spending Limit Remaining: ${selectedLimit.remaining_amount} → ${newRemainingLimit} USDC`);

      // Update simulated balance
      if (this.tempSessionData) {
        this.tempSessionData.mockUSDCBalance = newUSDCBalance;
      }

      // Show recent transaction history
      this.console.printSeparator();
      this.console.printInfo('Recent Transaction History:');
      await this.showMockTransactionHistory(accountAddress, {
        type: 'outgoing',
        amount: spendAmount,
        signature: mockTxSignature,
        timestamp: timestamp,
        description: description,
        recipient: recipient
      });

      this.console.printSeparator();
      this.console.printInfo('Demo Note: This was a simulated transaction for demonstration purposes.');
      this.console.printInfo('In production, the Grid SDK would create and sign the actual blockchain transaction');
      this.console.printInfo('using the configured spending limit to enforce the transfer constraints.');

    } catch (error) {
      this.console.printError(`Failed to process transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  private async demonstrateSpendingWithMockLimits(accountAddress: string): Promise<void> {
    this.console.printInfo('\n🔧 Creating mock spending limit for demonstration...');
    
    // Show what a real spending limit setup would look like
    this.console.printInfo('\nProduction Code for Creating Spending Limit:');
    this.console.printInfo('// const spendingLimit = await this.gridClient.createSpendingLimit(');
    this.console.printInfo(`//   '${accountAddress}',`);
    this.console.printInfo('//   {');
    this.console.printInfo('//     amount: 1000,');
    this.console.printInfo('//     mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC');
    this.console.printInfo('//     period: "daily",');
    this.console.printInfo('//     spending_limit_signers: [primarySignerAddress]');
    this.console.printInfo('//   }');
    this.console.printInfo('// );');

    // Mock spending limit for demo
    const mockLimit = {
      address: 'SpL1m1tMockAddr3ssForD3m0nstrat10nPurp0s3s0nly',
      amount: 1000,
      remaining_amount: 750,
      period: 1, // Daily
      status: 'active',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    };

    this.console.printInfo('\nMock Daily Spending Limit:');
    this.console.printInfo(`   Address: ${mockLimit.address}`);
    this.console.printInfo(`   Daily Limit: ${mockLimit.amount} USDC`);
    this.console.printInfo(`   Remaining Today: ${mockLimit.remaining_amount} USDC`);
    this.console.printInfo(`   Status: ${mockLimit.status}`);

    // Continue with spending demo using mock limit
    await this.sleep(1000);
    this.console.printInfo('\n📱 Proceeding with spending demo...');
  }


  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private checkSpendingLimitConstraints(
    spendAmount: number, 
    currentBalance: number, 
    spendingLimit: any
  ): { canSpend: boolean; reason?: string; suggestions: string[] } {
    const suggestions: string[] = [];

    // Check if user has sufficient balance
    if (spendAmount > currentBalance) {
      return {
        canSpend: false,
        reason: 'Insufficient account balance',
        suggestions: [
          'Wait for incoming payments to clear',
          'Reduce the transaction amount',
          'Request additional funding from your employer'
        ]
      };
    }

    // Check if spending limit allows this amount
    if (spendAmount > spendingLimit.remaining_amount) {
      const periodTypes = ['one-time', 'daily', 'weekly', 'monthly'];
      const periodName = periodTypes[spendingLimit.period] || 'period';
      
      return {
        canSpend: false,
        reason: `Exceeds ${periodName} spending limit`,
        suggestions: [
          `Reduce amount to ${spendingLimit.remaining_amount} USDC or less`,
          `Wait for the ${periodName} limit to reset`,
          'Create a new spending limit with higher amount',
          'Contact account admin to modify spending limits'
        ]
      };
    }

    // Check if spending limit is active (handle quoted status from API)
    const status = spendingLimit.status.replace(/"/g, ''); // Remove quotes if present
    if (status !== 'active') {
      return {
        canSpend: false,
        reason: `Spending limit is ${status}`,
        suggestions: [
          'Contact account admin to activate spending limit',
          'Create a new active spending limit'
        ]
      };
    }

    // All checks passed
    return {
      canSpend: true,
      suggestions: []
    };
  }

  private async showMockTransactionHistory(
    accountAddress: string, 
    latestTransaction?: {
      type: 'incoming' | 'outgoing';
      amount: number;
      signature: string;
      timestamp: string;
      description: string;
      recipient?: string;
    }
  ): Promise<void> {
    // Real Grid SDK code to get transfer history:
    // const transfers = await this.gridClient.getTransfers(accountAddress);
    
    this.console.printInfo('\nRecent Transactions:');
    
    // Create mock transaction history
    const mockTransactions = [
      {
        type: 'outgoing',
        amount: 125.50,
        description: 'Office supplies purchase',
        recipient: 'OfficeMax Corp',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        signature: 'AbC123...XyZ789'
      },
      {
        type: 'incoming',
        amount: 1500.00,
        description: 'Payroll Payment from TechCorp Inc.',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        signature: 'DeF456...UvW012'
      },
      {
        type: 'outgoing',
        amount: 75.00,
        description: 'Software license renewal',
        recipient: 'Adobe Systems',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        signature: 'GhI789...StU345'
      }
    ];

    // Add the latest transaction if provided
    if (latestTransaction) {
      mockTransactions.unshift({
        type: latestTransaction.type,
        amount: latestTransaction.amount,
        description: latestTransaction.description,
        recipient: latestTransaction.recipient || '',
        timestamp: latestTransaction.timestamp,
        signature: latestTransaction.signature.substring(0, 10) + '...' + latestTransaction.signature.substring(-6)
      });
    }

    // Display transactions
    mockTransactions.slice(0, 5).forEach((tx, index) => {
      const date = new Date(tx.timestamp);
      const direction = tx.type === 'incoming' ? '⬇️ IN' : '⬆️ OUT';
      const amountColor = tx.type === 'incoming' ? '+' : '-';
      
      this.console.printInfo(`\n${index + 1}. ${direction}  ${date.toLocaleDateString()}`);
      this.console.printInfo(`   Amount: ${amountColor}${tx.amount} USDC`);
      this.console.printInfo(`   ${tx.description}`);
      if (tx.recipient && tx.type === 'outgoing') {
        this.console.printInfo(`   To: ${tx.recipient}`);
      }
      this.console.printInfo(`   TX: ${tx.signature}`);
      
      if (index === 0 && latestTransaction) {
        this.console.printSuccess('   Latest Transaction');
      }
    });

    this.console.printInfo(`\nShowing ${Math.min(mockTransactions.length, 5)} most recent transactions`);
  }

  private async getFreelancerAccountInfo(): Promise<FreelancerAccount | null> {
    // This method will be implemented to extract real data from Grid SDK responses
    // For now, returning null to avoid mock data
    return null;
  }

  private async createMultipleFreelancerAccounts(): Promise<void> {
    if (!this.authResult || !this.authResult.data) {
      this.console.printError('❌ No authenticated account found.');
      this.console.printInfo('Please complete the login or signup process first.');
      await this.console.question('Press Enter to continue...');
      return;
    }

    try {
      this.console.printSeparator();
      this.console.printInfo('Create Multiple Freelancer Accounts');
      this.console.printSeparator();

      this.console.printInfo('This demonstration shows how to create multiple freelancer accounts sequentially.');
      this.console.printInfo('Note: Each account requires individual OTP verification in production.');

      // Get number of accounts to create
      const accountCount = await this.console.promptForNumber(
        'How many freelancer accounts would you like to create? (1-5): ', 
        1, 
        5
      );

      // Generate mock email addresses for demo
      const freelancerEmails = [];
      for (let i = 1; i <= accountCount; i++) {
        freelancerEmails.push(`freelancer${i}@yourcompany.com`);
      }

      this.console.printSeparator();
      this.console.printInfo(`Creating ${accountCount} freelancer accounts...`);

      // Real Grid SDK implementation (commented for demo):
      // const createdAccounts = [];
      // 
      // for (let i = 0; i < freelancerEmails.length; i++) {
      //   const email = freelancerEmails[i];
      //   this.console.printInfo(`Processing account ${i + 1} of ${freelancerEmails.length}: ${email}`);
      //   
      //   try {
      //     // Step 1: Create account
      //     this.console.printInfo('🔍 Calling Grid SDK: createAccount({ email })');
      //     const response = await this.gridClient.createAccount({ email });
      //     
      //     // Step 2: Generate session secrets
      //     this.console.printInfo('🔍 Calling Grid SDK: generateSessionSecrets()');
      //     const sessionSecrets = await this.gridClient.generateSessionSecrets();
      //     
      //     // Step 3: OTP verification required
      //     this.console.printWarning(`OTP verification required for ${email}`);
      //     this.console.printInfo('In production: user checks email and provides OTP code');
      //     
      //     // Step 4: Complete account creation with OTP
      //     // const otpCode = await this.console.question(`Enter OTP for ${email}: `);
      //     // const authResult = await this.gridClient.completeAuthAndCreateAccount({
      //     //   user: response.data,
      //     //   otpCode,
      //     //   sessionSecrets
      //     // });
      //     
      //     createdAccounts.push({
      //       email,
      //       user: response.data,
      //       sessionSecrets,
      //       // address: authResult.data.address (after OTP verification)
      //       status: 'pending_otp'
      //     });
      //     
      //     this.console.printSuccess(`Account ${i + 1} initiated successfully`);
      //     
      //   } catch (error) {
      //     this.console.printError(`Failed to create account for ${email}: ${error.message}`);
      //   }
      // }

      // Mock demonstration
      const createdAccounts = [];
      for (let i = 0; i < freelancerEmails.length; i++) {
        const email = freelancerEmails[i];
        
        this.console.printInfo(`Processing account ${i + 1} of ${freelancerEmails.length}: ${email}`);
        
        // Simulate API call delay
        await this.sleep(800);
        
        // Simulate account creation
        const mockAddress = this.generateMockAccountAddress();
        
        createdAccounts.push({
          email,
          address: mockAddress,
          status: 'created',
          gridUserId: `user_${Date.now()}_${i + 1}`
        });
        
        this.console.printSuccess(`Account ${i + 1} created successfully`);
        this.console.printInfo(`   Email: ${email}`);
        this.console.printInfo(`   Smart Account Address: ${mockAddress}`);
        this.console.printInfo(`   Status: Active`);
      }

      // Display summary
      this.console.printSeparator();
      this.console.printInfo('Account Creation Summary');
      this.console.printSeparator();
      
      this.console.printInfo(`Total Accounts Created: ${createdAccounts.length}`);
      this.console.printInfo('Account Details:');
      
      createdAccounts.forEach((account, index) => {
        this.console.printInfo(`\n${index + 1}. ${account.email}`);
        this.console.printInfo(`   Address: ${account.address}`);
        this.console.printInfo(`   Status: ${account.status}`);
      });

      this.console.printSeparator();
      this.console.printInfo('Production Notes:');
      this.console.printInfo('• Each account requires individual OTP verification');
      this.console.printInfo('• Consider batch onboarding workflows for efficiency');
      this.console.printInfo('• Accounts can be configured with spending limits and policies');
      this.console.printInfo('• Use these accounts for automated payroll distribution');

    } catch (error) {
      this.console.printError(`Failed to create multiple accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  private async setupAutomatedPayroll(): Promise<void> {
    if (!this.authResult || !this.authResult.data) {
      this.console.printError('❌ No authenticated account found.');
      this.console.printInfo('Please complete the login or signup process first.');
      await this.console.question('Press Enter to continue...');
      return;
    }

    try {
      this.console.printSeparator();
      this.console.printInfo('Setup Automated Payroll System');
      this.console.printSeparator();

      const mainAccountAddress = this.authResult.data.address;
      this.console.printSuccess(`Company Account: ${mainAccountAddress}`);

      this.console.printInfo('\nThis feature demonstrates setting up automated recurring payroll');
      this.console.printInfo('using Grid SDK Standing Orders for multiple freelancers.');

      // Mock freelancer accounts for demo
      const mockFreelancers = [
        { email: 'alice@freelancer.com', address: '8WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', monthlyRate: '3000' },
        { email: 'bob@freelancer.com', address: '9XaEYzCcmkg9ZUcOMrVyxRRAyrZzDsGYdLVL9zYtBXXN', monthlyRate: '2500' },
        { email: 'charlie@freelancer.com', address: '7VbFZzDdnlh7ZVdPNsWzzSRAyrZzDsGYdLVL9zYtCYYO', monthlyRate: '2800' }
      ];

      this.console.printSeparator();
      this.console.printInfo('Freelancer Accounts for Payroll Setup:');
      
      mockFreelancers.forEach((freelancer, index) => {
        this.console.printInfo(`\n${index + 1}. ${freelancer.email}`);
        this.console.printInfo(`   Address: ${freelancer.address}`);
        this.console.printInfo(`   Monthly Rate: ${freelancer.monthlyRate} USDC`);
      });

      // Payroll frequency options
      this.console.printSeparator();
      this.console.printInfo('Select payroll frequency:');
      this.console.printInfo('1. Monthly (1st of each month)');
      this.console.printInfo('2. Bi-weekly (Every 2 weeks)');
      this.console.printInfo('3. Weekly (Every week)');

      const frequencyChoice = await this.console.question('Select frequency (1-3): ');
      const frequencyMap = {
        '1': { name: 'monthly', description: 'Monthly on 1st' },
        '2': { name: 'bi_weekly', description: 'Every 2 weeks' },
        '3': { name: 'weekly', description: 'Every week' }
      };
      
      const selectedFrequency = frequencyMap[frequencyChoice as keyof typeof frequencyMap] || frequencyMap['1'];

      this.console.printSeparator();
      this.console.printInfo(`Setting up ${selectedFrequency.description} automated payroll...`);

      // Real Grid SDK implementation for Standing Orders (commented for demo):
      // const standingOrderResults = [];
      // 
      // for (let i = 0; i < mockFreelancers.length; i++) {
      //   const freelancer = mockFreelancers[i];
      //   this.console.printInfo(`Creating standing order ${i + 1} of ${mockFreelancers.length}: ${freelancer.email}`);
      //   
      //   try {
      //     const standingOrder = await this.gridClient.createStandingOrder(
      //       mainAccountAddress,
      //       {
      //         amount: freelancer.monthlyRate,
      //         grid_user_id: this.authResult.data.grid_user_id,
      //         source: {
      //           account: mainAccountAddress,
      //           currency: "USDC",
      //           payment_rail: "solana"
      //         },
      //         destination: {
      //           account: freelancer.address,
      //           currency: "USDC",
      //           payment_rail: "solana"
      //         },
      //         frequency: selectedFrequency.name,
      //         start_date: new Date().toISOString(),
      //         end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      //       }
      //     );
      //     
      //     standingOrderResults.push({
      //       freelancer: freelancer.email,
      //       amount: freelancer.monthlyRate,
      //       frequency: selectedFrequency.name,
      //       standingOrderId: standingOrder.data.id,
      //       status: 'active'
      //     });
      //     
      //     this.console.printSuccess(`Standing order created for ${freelancer.email}`);
      //     
      //   } catch (error) {
      //     this.console.printError(`Failed to create standing order for ${freelancer.email}: ${error.message}`);
      //     standingOrderResults.push({
      //       freelancer: freelancer.email,
      //       status: 'failed',
      //       error: error.message
      //     });
      //   }
      // }

      // Mock demonstration
      const standingOrderResults = [];
      for (let i = 0; i < mockFreelancers.length; i++) {
        const freelancer = mockFreelancers[i];
        
        this.console.printInfo(`Creating standing order ${i + 1} of ${mockFreelancers.length}: ${freelancer.email}`);
        
        // Simulate API call delay
        await this.sleep(1000);
        
        const mockStandingOrderId = `so_${Date.now()}_${i + 1}`;
        
        standingOrderResults.push({
          freelancer: freelancer.email,
          amount: freelancer.monthlyRate,
          frequency: selectedFrequency.name,
          standingOrderId: mockStandingOrderId,
          status: 'active',
          nextPayment: this.getNextPaymentDate(selectedFrequency.name)
        });
        
        this.console.printSuccess(`Standing order created for ${freelancer.email}`);
        this.console.printInfo(`   Amount: ${freelancer.monthlyRate} USDC`);
        this.console.printInfo(`   Frequency: ${selectedFrequency.description}`);
        this.console.printInfo(`   Standing Order ID: ${mockStandingOrderId}`);
      }

      // Display summary
      this.console.printSeparator();
      this.console.printInfo('Automated Payroll Setup Complete');
      this.console.printSeparator();
      
      this.console.printInfo(`Total Standing Orders Created: ${standingOrderResults.length}`);
      this.console.printInfo(`Payment Frequency: ${selectedFrequency.description}`);
      
      let totalMonthlyPayroll = 0;
      this.console.printInfo('\nPayroll Schedule:');
      
      standingOrderResults.forEach((result, index) => {
        this.console.printInfo(`\n${index + 1}. ${result.freelancer}`);
        this.console.printInfo(`   Amount: ${result.amount} USDC`);
        this.console.printInfo(`   Status: ${result.status}`);
        this.console.printInfo(`   Next Payment: ${result.nextPayment}`);
        this.console.printInfo(`   Standing Order ID: ${result.standingOrderId}`);
        
        totalMonthlyPayroll += parseFloat(result.amount);
      });

      this.console.printSeparator();
      this.console.printInfo(`Total Monthly Payroll: ${totalMonthlyPayroll} USDC`);
      
      this.console.printSeparator();
      this.console.printInfo('Automation Benefits:');
      this.console.printInfo('✓ Payments execute automatically on schedule');
      this.console.printInfo('✓ No manual intervention required');
      this.console.printInfo('✓ Consistent payment timing for freelancers');
      this.console.printInfo('✓ Reduced administrative overhead');
      this.console.printInfo('✓ Full audit trail of all payments');

      this.console.printSeparator();
      this.console.printInfo('Management Options:');
      this.console.printInfo('• View all standing orders: getStandingOrders()');
      this.console.printInfo('• Pause/resume payments as needed');
      this.console.printInfo('• Update payment amounts or schedules');
      this.console.printInfo('• Cancel standing orders when contracts end');

    } catch (error) {
      this.console.printError(`Failed to setup automated payroll: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    await this.console.question('\nPress Enter to continue...');
  }

  

  private generateMockAccountAddress(): string {
    // Generate a realistic-looking Solana address for demo
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 44; i++) { // Solana addresses are 44 characters
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private getNextPaymentDate(frequency: string): string {
    const now = new Date();
    let nextPayment = new Date(now);

    switch (frequency) {
      case 'weekly':
        nextPayment.setDate(now.getDate() + 7);
        break;
      case 'bi_weekly':
        nextPayment.setDate(now.getDate() + 14);
        break;
      case 'monthly':
      default:
        nextPayment.setMonth(now.getMonth() + 1, 1); // First of next month
        break;
    }

    return nextPayment.toLocaleDateString();
  }

  // Direct access to GridClient for advanced operations (if needed later)
  getGridClient(): GridClient {
    return this.gridClient;
  }
}

// Start the application
const demo = new GridPayrollDemo();
demo.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
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

  // =============================================================================
  // AUTHENTICATION METHODS - Following Grid SDK quickstart examples exactly
  // =============================================================================

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

        // Store auth result in memory
        this.authResult = authResult;
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

  // =============================================================================
  // MAIN MENU AND SMART ACCOUNT METHODS
  // =============================================================================

  private async showMainMenu(): Promise<void> {
    while (true) {
      this.console.printSeparator();
      this.console.printMenu([
        'View Account Balance (⚠️ Not implemented)',
        'Exit'
      ]);

      const choice = await this.console.question('Enter your choice (1-2): ');

      switch (choice) {
        case '1':
          await this.showAccountBalance();
          break;
        case '2':
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
    this.console.printWarning('Account balance feature not implemented yet.');
    this.console.printInfo('This will show USDC/SOL balances using Grid SDK getAccountBalances() method.');
    
    await this.console.question('Press Enter to continue...');
  }


  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  private async getFreelancerAccountInfo(): Promise<FreelancerAccount | null> {
    // This method will be implemented to extract real data from Grid SDK responses
    // For now, returning null to avoid mock data
    return null;
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

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
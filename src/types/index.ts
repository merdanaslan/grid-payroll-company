// Grid SDK Types - simplified to match actual SDK responses
export interface GridUser {
  // Grid SDK user object - keeping it flexible since SDK types may vary
  [key: string]: any;
}

export interface SessionSecrets {
  // Grid SDK session secrets - keeping flexible for SDK compatibility
  [key: string]: any;
}

export interface GridAuthResult {
  // Grid SDK authentication result - keeping flexible for SDK compatibility
  address?: string;
  status?: string;
  policies?: any;
  grid_user_id?: string;
  authentication?: any;
  [key: string]: any; // Allow additional properties from Grid SDK
}

// Note: AccountPermission removed - was made up, not from Grid SDK
// We'll use actual response data once we see what Grid SDK returns

// Application Types
export interface SessionData {
  email: string;
  user: GridUser;
  sessionSecrets: SessionSecrets;
  type: 'signup' | 'login';
  timestamp: string;
  authResult?: GridAuthResult;
  authenticated: boolean;
  completedAt?: string;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Payroll Company Specific Types
export interface FreelancerAccount {
  id: string;
  email: string;
  smartAccountAddress: string;
  chainId: number;
  permissions: any[]; // Will be updated based on actual Grid SDK responses
  spendingLimits?: SpendingLimits;
  createdAt: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}

export interface SpendingLimits {
  dailyLimit: number;
  monthlyLimit: number;
  allowedTokens: string[];
  allowedRecipients?: string[];
}

export interface PayrollPayment {
  id: string;
  freelancerId: string;
  amount: number;
  token: string;
  transactionHash?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
}

// Menu and UI Types
export interface MenuOption {
  id: string;
  label: string;
  action: () => Promise<void>;
}

export interface ConsoleConfig {
  clearOnStart?: boolean;
  showTimestamps?: boolean;
}
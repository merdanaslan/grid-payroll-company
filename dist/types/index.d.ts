export interface GridUser {
    [key: string]: any;
}
export interface SessionSecrets {
    [key: string]: any;
}
export interface GridAuthResult {
    address?: string;
    status?: string;
    policies?: any;
    grid_user_id?: string;
    authentication?: any;
    [key: string]: any;
}
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
export interface FreelancerAccount {
    id: string;
    email: string;
    smartAccountAddress: string;
    chainId: number;
    permissions: any[];
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
export interface MenuOption {
    id: string;
    label: string;
    action: () => Promise<void>;
}
export interface ConsoleConfig {
    clearOnStart?: boolean;
    showTimestamps?: boolean;
}
//# sourceMappingURL=index.d.ts.map
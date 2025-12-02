import { GridClient } from '@sqds/grid';
import { SessionData, FreelancerAccount } from '../types/index.js';
export default class AccountManager {
    private gridClient;
    private sessionFile;
    constructor();
    createAccount(email: string): Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>;
    completeAccountCreation(otpCode: string): Promise<{
        success: boolean;
        message: string;
        error?: string;
        data?: any;
    }>;
    loginUser(email: string): Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>;
    completeLogin(otpCode: string): Promise<{
        success: boolean;
        message: string;
        error?: string;
        data?: any;
    }>;
    getCurrentSession(): Promise<{
        success: boolean;
        message: string;
        data?: SessionData;
    }>;
    getFreelancerAccountInfo(): Promise<{
        success: boolean;
        message: string;
        data?: FreelancerAccount;
        error?: string;
    }>;
    getAccountBalance(address: string): Promise<{
        success: boolean;
        message: string;
        data?: any;
        error?: string;
    }>;
    logout(): Promise<{
        success: boolean;
        message: string;
        error?: string;
    }>;
    getGridClient(): GridClient;
    private saveSessionData;
    private loadSessionData;
    private clearSessionData;
}
//# sourceMappingURL=accountManager.d.ts.map
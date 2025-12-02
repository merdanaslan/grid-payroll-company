"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grid_1 = require("@sqds/grid");
const fs_1 = require("fs");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class AccountManager {
    constructor() {
        this.gridClient = new grid_1.GridClient({
            environment: process.env.GRID_ENVIRONMENT || 'sandbox',
            apiKey: process.env.GRID_API_KEY,
            baseUrl: 'https://grid.squads.xyz'
        });
        this.sessionFile = 'sessions/current-session.json';
    }
    async createAccount(email) {
        try {
            // Step 1: Create account (following quickstart example)
            const response = await this.gridClient.createAccount({ email });
            const user = response.data;
            // Step 2: Generate session secrets
            const sessionSecrets = this.gridClient.generateSessionSecrets();
            // Save session data for OTP completion
            await this.saveSessionData({
                email,
                user,
                sessionSecrets,
                type: 'signup',
                timestamp: new Date().toISOString(),
                authenticated: false
            });
            return {
                success: true,
                message: 'Account creation initiated. Check your email for OTP.'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Error during account creation process'
            };
        }
    }
    async completeAccountCreation(otpCode) {
        try {
            const sessionData = await this.loadSessionData();
            if (!sessionData || sessionData.type !== 'signup') {
                return {
                    success: false,
                    message: 'No pending account creation found'
                };
            }
            // Step 3: Complete authentication (following quickstart example)
            const authResult = await this.gridClient.completeAuthAndCreateAccount({
                user: sessionData.user,
                otpCode,
                sessionSecrets: sessionData.sessionSecrets
            });
            // Update session with auth result
            await this.saveSessionData({
                ...sessionData,
                authResult,
                authenticated: true,
                completedAt: new Date().toISOString()
            });
            return {
                success: true,
                message: 'Account created and authenticated successfully',
                data: authResult
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Error completing account creation'
            };
        }
    }
    async loginUser(email) {
        try {
            // For existing accounts, we use the same createAccount method
            // The Grid SDK handles both new and existing accounts through this method
            const response = await this.gridClient.createAccount({ email });
            const user = response.data;
            // Generate session secrets
            const sessionSecrets = this.gridClient.generateSessionSecrets();
            // Save session data for OTP completion
            await this.saveSessionData({
                email,
                user,
                sessionSecrets,
                type: 'login',
                timestamp: new Date().toISOString(),
                authenticated: false
            });
            return {
                success: true,
                message: 'Login initiated. Check your email for OTP.'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Error during login process'
            };
        }
    }
    async completeLogin(otpCode) {
        try {
            const sessionData = await this.loadSessionData();
            if (!sessionData || sessionData.type !== 'login') {
                return {
                    success: false,
                    message: 'No pending login found'
                };
            }
            // Complete authentication using the same method for both new and existing accounts
            const authResult = await this.gridClient.completeAuthAndCreateAccount({
                user: sessionData.user,
                otpCode,
                sessionSecrets: sessionData.sessionSecrets
            });
            // Update session with auth result
            await this.saveSessionData({
                ...sessionData,
                authResult,
                authenticated: true,
                completedAt: new Date().toISOString()
            });
            return {
                success: true,
                message: 'Login successful',
                data: authResult
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Error completing login'
            };
        }
    }
    async getCurrentSession() {
        try {
            const sessionData = await this.loadSessionData();
            if (!sessionData || !sessionData.authenticated) {
                return {
                    success: false,
                    message: 'No authenticated session found'
                };
            }
            return {
                success: true,
                data: sessionData,
                message: 'Active session found'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Error retrieving session'
            };
        }
    }
    async getFreelancerAccountInfo() {
        try {
            const sessionResult = await this.getCurrentSession();
            if (!sessionResult.success || !sessionResult.data?.authResult) {
                return {
                    success: false,
                    message: 'No authenticated session found. Please login first.'
                };
            }
            const authResult = sessionResult.data.authResult;
            // Create freelancer account info from Grid SDK response
            const freelancerAccount = {
                id: authResult.grid_user_id || 'unknown',
                email: sessionResult.data.email,
                smartAccountAddress: authResult.address || 'N/A',
                chainId: 1, // Default to mainnet
                permissions: [
                    {
                        type: 'OWNER',
                        address: authResult.address || 'N/A',
                        permissions: ['FULL_ACCESS']
                    }
                ],
                createdAt: sessionResult.data.completedAt || new Date().toISOString(),
                status: 'ACTIVE'
            };
            return {
                success: true,
                data: freelancerAccount,
                message: 'Freelancer account retrieved successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Error retrieving freelancer account info'
            };
        }
    }
    async getAccountBalance(address) {
        try {
            // For demonstration purposes, return mock balance
            // In a real implementation, you would use blockchain queries or Grid SDK methods
            const mockBalance = {
                address,
                balances: [
                    { token: 'USDC', amount: '0.00', symbol: 'USDC', decimals: 6 },
                    { token: 'SOL', amount: '0.00', symbol: 'SOL', decimals: 9 }
                ],
                totalValueUSD: '0.00'
            };
            return {
                success: true,
                data: mockBalance,
                message: 'Balance retrieved successfully (mock data)'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Error retrieving account balance'
            };
        }
    }
    async logout() {
        try {
            await this.clearSessionData();
            return {
                success: true,
                message: 'Logged out successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Error during logout'
            };
        }
    }
    // Direct access to GridClient for advanced operations
    getGridClient() {
        return this.gridClient;
    }
    // Session management methods
    async saveSessionData(data) {
        try {
            await fs_1.promises.mkdir('sessions', { recursive: true });
            await fs_1.promises.writeFile(this.sessionFile, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Error saving session data:', error);
            throw error;
        }
    }
    async loadSessionData() {
        try {
            const data = await fs_1.promises.readFile(this.sessionFile, 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }
    async clearSessionData() {
        try {
            await fs_1.promises.unlink(this.sessionFile);
        }
        catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }
}
exports.default = AccountManager;
//# sourceMappingURL=accountManager.js.map
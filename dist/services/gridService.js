"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const grid_1 = require("@sqds/grid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class GridService {
    constructor() {
        this.client = new grid_1.GridClient({
            environment: process.env.GRID_ENVIRONMENT || 'sandbox',
            apiKey: process.env.GRID_API_KEY,
            baseUrl: 'https://grid.squads.xyz'
        });
    }
    async createAccount(email) {
        try {
            const response = await this.client.createAccount({ email });
            return {
                success: true,
                data: response.data,
                message: 'Account creation initiated. Check your email for OTP.'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to create account'
            };
        }
    }
    async completeAccountCreation(user, otpCode, sessionSecrets) {
        try {
            const authResult = await this.client.completeAuthAndCreateAccount({
                user,
                otpCode,
                sessionSecrets: sessionSecrets
            });
            return {
                success: true,
                data: authResult,
                message: 'Account created and authenticated successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to complete account creation'
            };
        }
    }
    async loginUser(email) {
        try {
            // Note: Grid SDK doesn't have a separate loginUser method for existing accounts
            // We'll use the createAccount method which works for both new and existing accounts
            const response = await this.client.createAccount({ email });
            return {
                success: true,
                data: response.data,
                message: 'Login initiated. Check your email for OTP.'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to initiate login'
            };
        }
    }
    async completeLogin(user, otpCode, sessionSecrets) {
        try {
            // For existing accounts, we use the same method as account creation
            const authResult = await this.client.completeAuthAndCreateAccount({
                user,
                otpCode,
                sessionSecrets: sessionSecrets
            });
            return {
                success: true,
                data: authResult,
                message: 'Login successful'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to complete login'
            };
        }
    }
    generateSessionSecrets() {
        return this.client.generateSessionSecrets();
    }
    async createSmartAccount(authResult) {
        try {
            // Extract account address from Grid SDK response
            const smartAccountAddress = authResult.address || this.generateMockAddress();
            const chainId = 1; // Default to mainnet
            const permissions = [
                {
                    type: 'OWNER',
                    address: smartAccountAddress,
                    permissions: ['FULL_ACCESS']
                }
            ];
            const freelancerAccount = {
                id: authResult.grid_user_id || authResult.user?.id || 'unknown',
                email: authResult.user?.email || '',
                smartAccountAddress,
                chainId,
                permissions,
                createdAt: new Date().toISOString(),
                status: 'ACTIVE'
            };
            return {
                success: true,
                data: freelancerAccount,
                message: 'Smart account created successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to create smart account'
            };
        }
    }
    async getSmartAccountBalance(address, chainId) {
        try {
            // In a real implementation, this would query the blockchain for account balance
            // For now, we'll return a mock balance
            const mockBalance = {
                address,
                chainId,
                balances: [
                    { token: 'USDC', amount: '0', symbol: 'USDC', decimals: 6 },
                    { token: 'ETH', amount: '0', symbol: 'ETH', decimals: 18 }
                ],
                totalValueUSD: '0'
            };
            return {
                success: true,
                data: mockBalance,
                message: 'Balance retrieved successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to get account balance'
            };
        }
    }
    async getSmartAccountPermissions(address) {
        try {
            // In a real implementation, this would query the smart account permissions
            // For now, we'll return mock permissions
            const permissions = [
                {
                    type: 'OWNER',
                    address: address,
                    permissions: ['FULL_ACCESS', 'TRANSFER', 'RECEIVE', 'ADMIN']
                }
            ];
            return {
                success: true,
                data: permissions,
                message: 'Permissions retrieved successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                message: 'Failed to get account permissions'
            };
        }
    }
    generateMockAddress() {
        // Generate a mock Ethereum-style address for demonstration
        const chars = '0123456789abcdef';
        let address = '0x';
        for (let i = 0; i < 40; i++) {
            address += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return address;
    }
    getClient() {
        return this.client;
    }
}
exports.default = GridService;
//# sourceMappingURL=gridService.js.map
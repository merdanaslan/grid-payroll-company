import { GridClient } from '@sqds/grid';
import { GridUser, SessionSecrets, GridAuthResult, ServiceResponse, FreelancerAccount, AccountPermission } from '../types/index.js';
export default class GridService {
    private client;
    constructor();
    createAccount(email: string): Promise<ServiceResponse<GridUser>>;
    completeAccountCreation(user: GridUser, otpCode: string, sessionSecrets: SessionSecrets): Promise<ServiceResponse<GridAuthResult>>;
    loginUser(email: string): Promise<ServiceResponse<GridUser>>;
    completeLogin(user: GridUser, otpCode: string, sessionSecrets: SessionSecrets): Promise<ServiceResponse<GridAuthResult>>;
    generateSessionSecrets(): SessionSecrets;
    createSmartAccount(authResult: GridAuthResult): Promise<ServiceResponse<FreelancerAccount>>;
    getSmartAccountBalance(address: string, chainId: number): Promise<ServiceResponse<any>>;
    getSmartAccountPermissions(address: string): Promise<ServiceResponse<AccountPermission[]>>;
    private generateMockAddress;
    getClient(): GridClient;
}
//# sourceMappingURL=gridService.d.ts.map
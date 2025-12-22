import { PrismaClient } from '@prisma/client';
export interface LoginRequest {
    username: string;
    password: string;
}
export interface AuthUser {
    userId: string;
    username: string;
    name: string;
    displayName?: string;
    email?: string;
    role: string;
    schoolId: string;
    schoolName?: string;
    primaryClassName?: string;
}
export interface LoginResponse {
    success: boolean;
    user?: AuthUser;
    token?: string;
    expiresIn?: number;
    message?: string;
}
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 用户登录验证
     */
    login(loginData: LoginRequest): Promise<LoginResponse>;
    /**
     * 验证 JWT 令牌
     */
    verifyToken(token: string): AuthUser | null;
    /**
     * 解析过期时间为秒数
     */
    private parseExpiresIn;
    /**
     * 刷新令牌
     */
    refreshToken(oldToken: string): Promise<LoginResponse>;
    /**
     * 用户注册（预留功能）
     */
    register(userData: {
        username: string;
        email: string;
        password: string;
        schoolName: string;
    }): Promise<LoginResponse>;
}
export default AuthService;
//# sourceMappingURL=auth.service.d.ts.map
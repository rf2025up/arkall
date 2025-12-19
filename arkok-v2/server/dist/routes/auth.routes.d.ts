import { Router } from 'express';
import { AuthService } from '../services/auth.service';
export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: {
        userId: string;
        username: string;
        name: string;
        displayName?: string;
        email?: string;
        role: string;
        schoolId: string;
        schoolName?: string;
        primaryClassName?: string;
    };
    token?: string;
    expiresIn?: number;
    data?: any;
}
/**
 * 认证相关路由
 */
export declare class AuthRoutes {
    private authService;
    private router;
    constructor(authService: AuthService);
    private initializeRoutes;
    /**
     * 用户登录
     */
    private login;
    /**
     * 刷新令牌
     */
    private refreshToken;
    /**
     * 验证令牌
     */
    private verifyToken;
    /**
     * 获取当前用户信息
     */
    private getCurrentUser;
    /**
     * 用户登出
     */
    private logout;
    /**
     * 获取路由器实例
     */
    getRoutes(): Router;
}
export default AuthRoutes;
//# sourceMappingURL=auth.routes.d.ts.map
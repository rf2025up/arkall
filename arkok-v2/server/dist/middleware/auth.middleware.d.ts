import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthUser } from '../services/auth.service';
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
            schoolId?: string;
        }
    }
}
export interface AuthRequest extends Request {
    user: AuthUser;
    schoolId: string;
}
/**
 * 认证中间件工厂函数
 */
export declare const authenticateToken: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 可选认证中间件（令牌存在时验证，不存在时继续）
 */
export declare const optionalAuth: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 角色检查中间件
 */
export declare const requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * 管理员权限检查中间件
 */
export declare const requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * 教师权限检查中间件
 */
export declare const requireTeacher: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * 用户信息验证中间件
 */
export declare const validateUser: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * 请求日志中间件（包含用户信息）
 */
export declare const authLogger: (req: AuthRequest, res: Response, next: NextFunction) => void;
declare const _default: {
    authenticateToken: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
    optionalAuth: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
    requireRole: (roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
    requireTeacher: (req: AuthRequest, res: Response, next: NextFunction) => void;
    validateUser: (req: AuthRequest, res: Response, next: NextFunction) => void;
    authLogger: (req: AuthRequest, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=auth.middleware.d.ts.map
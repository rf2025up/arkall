/**
 * 类型安全的认证中间件模板
 *
 * 这个文件展示了如何按照最高类型安全准则编写认证中间件
 * 使用扩展的标准 Express Request 接口，而不是创建独立的 AuthRequest 接口
 */
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
/**
 * 认证中间件工厂函数
 * @param authService - 认证服务实例
 * @returns 认证中间件函数
 */
export declare const authenticateToken: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 可选认证中间件（令牌存在时验证，不存在时继续）
 * @param authService - 认证服务实例
 * @returns 可选认证中间件函数
 */
export declare const optionalAuth: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 角色检查中间件
 * @param roles - 允许的角色列表
 * @returns 角色检查中间件函数
 */
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * 管理员权限检查中间件
 */
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 教师权限检查中间件
 */
export declare const requireTeacher: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 用户信息验证中间件
 * @param req - Express Request（已扩展）
 * @param res - Express Response
 * @param next - NextFunction
 */
export declare const validateUser: (req: Request, res: Response, next: NextFunction) => void;
/**
 * 请求日志中间件（包含用户信息）
 * @param req - Express Request（已扩展）
 * @param res - Express Response
 * @param next - NextFunction
 */
export declare const authLogger: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    authenticateToken: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
    optionalAuth: (authService: AuthService) => (req: Request, res: Response, next: NextFunction) => void;
    requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
    requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
    requireTeacher: (req: Request, res: Response, next: NextFunction) => void;
    validateUser: (req: Request, res: Response, next: NextFunction) => void;
    authLogger: (req: Request, res: Response, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=type-safe-auth.middleware.d.ts.map
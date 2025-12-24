import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthUser } from '../services/auth.service';

// 扩展 Request 接口以包含用户信息
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
export const authenticateToken = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log(`🔐 [AUTH_MIDDLEWARE] Processing ${req.method} ${req.path}`);
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log(`🔐 [AUTH_MIDDLEWARE] Token found: ${!!token}, Length: ${token ? token.length : 0}`);

    if (!token) {
      console.log(`❌ [AUTH_MIDDLEWARE] No token provided`);
      res.status(401).json({
        success: false,
        message: '访问令牌缺失',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    // 验证令牌
    const user = authService.verifyToken(token);

    console.log(`🔐 [AUTH_MIDDLEWARE] Token verification result: ${!!user}`);

    if (!user) {
      console.log(`❌ [AUTH_MIDDLEWARE] Invalid token`);
      res.status(401).json({
        success: false,
        message: '无效的访问令牌',
        code: 'TOKEN_INVALID'
      });
      return;
    }

    // 将用户信息附加到请求对象
    req.user = user;
    req.schoolId = user.schoolId;

    console.log(`✅ [AUTH_MIDDLEWARE] User authenticated: ${user.username} (${user.role})`);
    next();
  };
};

/**
 * 可选认证中间件（令牌存在时验证，不存在时继续）
 */
export const optionalAuth = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = authService.verifyToken(token);
      if (user) {
        req.user = user;
        req.schoolId = user.schoolId;
      }
    }

    next();
  };
};

/**
 * 角色检查中间件
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

/**
 * 平台管理员权限检查中间件
 */
export const requirePlatformAdmin = requireRole(['PLATFORM_ADMIN']);

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = requireRole(['ADMIN', 'PLATFORM_ADMIN']);

/**
 * 教师权限检查中间件
 */
export const requireTeacher = requireRole(['ADMIN', 'TEACHER', 'PLATFORM_ADMIN']);

/**
 * 用户信息验证中间件
 */
export const validateUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.schoolId) {
    res.status(401).json({
      success: false,
      message: '用户信息无效',
      code: 'INVALID_USER_INFO'
    });
    return;
  }

  // 验证用户是否属于请求的学校ID（如果URL中包含学校ID）
  const urlSchoolId = req.params.schoolId || req.query.schoolId;

  // 超级管理员 (PLATFORM_ADMIN) 允许跨校区访问，绕过 schoolId 检查
  if (req.user.role === 'PLATFORM_ADMIN') {
    return next();
  }

  if (urlSchoolId && urlSchoolId !== req.schoolId) {
    res.status(403).json({
      success: false,
      message: '无权访问指定学校的数据',
      code: 'SCHOOL_MISMATCH',
      userSchoolId: req.schoolId,
      requestedSchoolId: urlSchoolId
    });
    return;
  }

  next();
};

/**
 * 请求日志中间件（包含用户信息）
 */
export const authLogger = (req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const userInfo = req.user ? `${req.user.username}(${req.user.role})` : 'Anonymous';
  const schoolInfo = req.schoolId ? `School:${req.schoolId}` : 'NoSchool';

  console.log(`[${timestamp}] ${req.method} ${req.path} - User: ${userInfo} - ${schoolInfo}`);

  next();
};

export default {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireTeacher,
  validateUser,
  authLogger
};
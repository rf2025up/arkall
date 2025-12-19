/**
 * 类型安全的认证中间件模板
 *
 * 这个文件展示了如何按照最高类型安全准则编写认证中间件
 * 使用扩展的标准 Express Request 接口，而不是创建独立的 AuthRequest 接口
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthUser } from '../services/auth.service';
import { logSafeError, createSafeErrorResponse } from '../utils/type-safe-error-handler';

/**
 * 认证中间件工厂函数
 * @param authService - 认证服务实例
 * @returns 认证中间件函数
 */
export const authenticateToken = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log(`🔐 [AUTH_MIDDLEWARE] Processing ${req.method} ${req.path}`);

    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      console.log(`🔐 [AUTH_MIDDLEWARE] Token found: ${!!token}, Length: ${token ? token.length : 0}`);

      if (!token) {
        console.log(`❌ [AUTH_MIDDLEWARE] No token provided`);
        const response = createSafeErrorResponse(
          new Error('Access token is required'),
          '访问令牌缺失'
        );
        res.status(401).json({
          ...response,
          code: 'TOKEN_MISSING'
        });
        return;
      }

      // 验证令牌
      const user = authService.verifyToken(token);

      console.log(`🔐 [AUTH_MIDDLEWARE] Token verification result: ${!!user}`);

      if (!user) {
        console.log(`❌ [AUTH_MIDDLEWARE] Invalid token`);
        const response = createSafeErrorResponse(
          new Error('Invalid access token'),
          '无效的访问令牌'
        );
        res.status(401).json({
          ...response,
          code: 'TOKEN_INVALID'
        });
        return;
      }

      // 将用户信息附加到请求对象（使用扩展的标准 Request 接口）
      req.user = user;
      req.schoolId = user.schoolId;

      console.log(`✅ [AUTH_MIDDLEWARE] User authenticated: ${user.username} (${user.role})`);
      next();
    } catch (error) {
      logSafeError(error, 'AUTH_MIDDLEWARE');
      const response = createSafeErrorResponse(error, '认证过程中发生错误');
      res.status(500).json(response);
    }
  };
};

/**
 * 可选认证中间件（令牌存在时验证，不存在时继续）
 * @param authService - 认证服务实例
 * @returns 可选认证中间件函数
 */
export const optionalAuth = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
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
    } catch (error) {
      logSafeError(error, 'OPTIONAL_AUTH_MIDDLEWARE');
      // 可选认证失败时不阻止请求继续
      next();
    }
  };
};

/**
 * 角色检查中间件
 * @param roles - 允许的角色列表
 * @returns 角色检查中间件函数
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        const response = createSafeErrorResponse(
          new Error('User not authenticated'),
          '用户未认证'
        );
        res.status(401).json({
          ...response,
          code: 'USER_NOT_AUTHENTICATED'
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        const response = createSafeErrorResponse(
          new Error(`Insufficient permissions. Required roles: ${roles.join(', ')}`),
          '权限不足'
        );
        res.status(403).json({
          ...response,
          code: 'INSUFFICIENT_PERMISSIONS',
          required: roles,
          current: req.user.role
        });
        return;
      }

      next();
    } catch (error) {
      logSafeError(error, 'ROLE_CHECK_MIDDLEWARE');
      const response = createSafeErrorResponse(error, '权限检查过程中发生错误');
      res.status(500).json(response);
    }
  };
};

/**
 * 管理员权限检查中间件
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * 教师权限检查中间件
 */
export const requireTeacher = requireRole(['ADMIN', 'TEACHER']);

/**
 * 用户信息验证中间件
 * @param req - Express Request（已扩展）
 * @param res - Express Response
 * @param next - NextFunction
 */
export const validateUser = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user || !req.schoolId) {
      const response = createSafeErrorResponse(
        new Error('Invalid user information'),
        '用户信息无效'
      );
      res.status(401).json({
        ...response,
        code: 'INVALID_USER_INFO'
      });
      return;
    }

    // 验证用户是否属于请求的学校ID（如果URL中包含学校ID）
    const urlSchoolId = req.params.schoolId || req.query.schoolId;
    if (urlSchoolId && urlSchoolId !== req.schoolId) {
      const response = createSafeErrorResponse(
        new Error(`School mismatch. User school: ${req.schoolId}, Requested school: ${urlSchoolId}`),
        '无权访问指定学校的数据'
      );
      res.status(403).json({
        ...response,
        code: 'SCHOOL_MISMATCH',
        userSchoolId: req.schoolId,
        requestedSchoolId: urlSchoolId
      });
      return;
    }

    next();
  } catch (error) {
    logSafeError(error, 'USER_VALIDATION_MIDDLEWARE');
    const response = createSafeErrorResponse(error, '用户验证过程中发生错误');
    res.status(500).json(response);
  }
};

/**
 * 请求日志中间件（包含用户信息）
 * @param req - Express Request（已扩展）
 * @param res - Express Response
 * @param next - NextFunction
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
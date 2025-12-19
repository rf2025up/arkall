/**
 * Express 类型扩展
 *
 * 这个文件定义了全局 Express Request 接口的扩展
 * 所有自定义的请求属性都应该在这里声明，而不是创建独立的接口
 */

import { Request } from 'express';
import { AuthUser } from '../../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      // 用户认证信息（由认证中间件注入）
      user?: AuthUser;

      // 学校ID（从 user 中提取，便于访问）
      schoolId?: string;
    }
  }
}

// 导出扩展后的 Request 类型以供其他模块使用
export type ExtendedRequest = Request;

export {};
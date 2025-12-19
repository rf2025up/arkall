import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  // 记录错误日志
  console.error('❌ Error occurred:', {
    message: error.message,
    stack: error.stack,
    statusCode,
    isOperational,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: {
        statusCode,
        stack: error.stack,
        isOperational
      },
      timestamp: new Date().toISOString()
    });
  } else {
    // 生产环境只返回必要的错误信息
    const message = isOperational ? error.message : 'Internal server error';

    res.status(statusCode).json({
      success: false,
      message,
      timestamp: new Date().toISOString()
    });
  }
};

// 异步错误处理包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 创建应用错误
export const createAppError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// 验证错误处理
export const handleValidationError = (message: string): AppError => {
  return createAppError(message, 400);
};

// 未授权错误处理
export const handleUnauthorizedError = (message: string = 'Unauthorized'): AppError => {
  return createAppError(message, 401);
};

// 禁止访问错误处理
export const handleForbiddenError = (message: string = 'Forbidden'): AppError => {
  return createAppError(message, 403);
};

// 资源未找到错误处理
export const handleNotFoundError = (message: string = 'Resource not found'): AppError => {
  return createAppError(message, 404);
};

// 冲突错误处理
export const handleConflictError = (message: string = 'Conflict'): AppError => {
  return createAppError(message, 409);
};
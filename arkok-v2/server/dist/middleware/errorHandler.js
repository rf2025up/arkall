"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConflictError = exports.handleNotFoundError = exports.handleForbiddenError = exports.handleUnauthorizedError = exports.handleValidationError = exports.createAppError = exports.asyncHandler = exports.errorHandler = void 0;
const errorHandler = (error, req, res, next) => {
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
    }
    else {
        // 生产环境只返回必要的错误信息
        const message = isOperational ? error.message : 'Internal server error';
        res.status(statusCode).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    }
};
exports.errorHandler = errorHandler;
// 异步错误处理包装器
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// 创建应用错误
const createAppError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createAppError = createAppError;
// 验证错误处理
const handleValidationError = (message) => {
    return (0, exports.createAppError)(message, 400);
};
exports.handleValidationError = handleValidationError;
// 未授权错误处理
const handleUnauthorizedError = (message = 'Unauthorized') => {
    return (0, exports.createAppError)(message, 401);
};
exports.handleUnauthorizedError = handleUnauthorizedError;
// 禁止访问错误处理
const handleForbiddenError = (message = 'Forbidden') => {
    return (0, exports.createAppError)(message, 403);
};
exports.handleForbiddenError = handleForbiddenError;
// 资源未找到错误处理
const handleNotFoundError = (message = 'Resource not found') => {
    return (0, exports.createAppError)(message, 404);
};
exports.handleNotFoundError = handleNotFoundError;
// 冲突错误处理
const handleConflictError = (message = 'Conflict') => {
    return (0, exports.createAppError)(message, 409);
};
exports.handleConflictError = handleConflictError;
//# sourceMappingURL=errorHandler.js.map
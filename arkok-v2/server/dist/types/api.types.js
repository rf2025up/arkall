"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseBuilder = exports.HTTP_STATUS = exports.ApiErrorCode = void 0;
// API错误代码枚举
var ApiErrorCode;
(function (ApiErrorCode) {
    ApiErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ApiErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ApiErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ApiErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ApiErrorCode["CONFLICT"] = "CONFLICT";
    ApiErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ApiErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
})(ApiErrorCode || (exports.ApiErrorCode = ApiErrorCode = {}));
// HTTP状态码映射
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    RATE_LIMITED: 429,
    INTERNAL_SERVER_ERROR: 500
};
// 通用响应构建器
class ResponseBuilder {
    static success(data, message) {
        const response = {
            success: true,
            data
        };
        if (message !== undefined) {
            response.message = message;
        }
        return response;
    }
    static error(code, message, details) {
        return {
            success: false,
            error: {
                code,
                message,
                ...(details !== undefined && { details })
            }
        };
    }
    static paginated(data, page, limit, total, message) {
        const response = {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        if (message !== undefined) {
            response.message = message;
        }
        return response;
    }
}
exports.ResponseBuilder = ResponseBuilder;
//# sourceMappingURL=api.types.js.map
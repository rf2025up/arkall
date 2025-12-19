export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    token?: string;
    user?: any;
    error?: {
        code: string;
        message: string;
        details?: any[];
    };
}
export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    message?: string;
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any[] | undefined;
    };
}
export declare enum ApiErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    INTERNAL_ERROR = "INTERNAL_ERROR"
}
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly RATE_LIMITED: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare class ResponseBuilder {
    static success<T>(data: T, message?: string): ApiResponse<T>;
    static error(code: string, message: string, details?: any[]): ApiResponse<never>;
    static paginated<T>(data: T[], page: number, limit: number, total: number, message?: string): PaginatedResponse<T>;
}
//# sourceMappingURL=api.types.d.ts.map
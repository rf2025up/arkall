// 标准API响应接口 - 遵循TypeScript类型安全宪法
export interface ApiResponse<T = any> {
  success: boolean;           // 请求是否成功
  data: T;                    // 实际数据载荷，类型安全
  message?: string;           // 可选的错误或成功消息
  token?: string;             // 认证响应中的JWT令牌
  user?: any;                 // 认证响应中的用户信息
}

// 分页响应接口
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;           // 可选的消息
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[] | undefined;
  };
}

// API错误代码枚举
export enum ApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// HTTP状态码映射
export const HTTP_STATUS = {
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
} as const;

// 通用响应构建器
export class ResponseBuilder {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: true,
      data
    };

    if (message !== undefined) {
      response.message = message;
    }

    return response;
  }

  static error(code: string, message: string, details?: any[]): ErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined && { details })
      }
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): PaginatedResponse<T> {
    const response: PaginatedResponse<T> = {
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
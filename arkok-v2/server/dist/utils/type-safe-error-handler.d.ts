/**
 * 类型安全的错误处理工具
 *
 * 提供符合 TypeScript 类型安全准则的错误处理函数
 * 严禁直接访问 unknown error 的属性
 */
export interface SafeErrorInfo {
    name?: string;
    message?: string;
    stack?: string;
    isNativeError: boolean;
}
/**
 * 类型安全的错误日志记录
 * @param error - unknown 类型的错误对象
 * @param context - 错误上下文信息
 */
export declare function logSafeError(error: unknown, context: string): void;
/**
 * 安全地提取错误信息
 * @param error - unknown 类型的错误对象
 * @returns SafeErrorInfo - 安全的错误信息
 */
export declare function extractSafeErrorInfo(error: unknown): SafeErrorInfo;
/**
 * 创建类型安全的错误响应
 * @param error - unknown 类型的错误对象
 * @param defaultMessage - 默认错误消息
 * @returns API 响应对象
 */
export declare function createSafeErrorResponse(error: unknown, defaultMessage?: string): {
    success: boolean;
    message: string;
    error: string;
};
/**
 * 包装异步函数以提供类型安全的错误处理
 * @param fn - 异步函数
 * @param context - 错误上下文
 * @returns 包装后的函数
 */
export declare function withSafeErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T, context: string): T;
//# sourceMappingURL=type-safe-error-handler.d.ts.map
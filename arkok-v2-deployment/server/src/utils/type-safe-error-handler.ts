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
export function logSafeError(error: unknown, context: string): void {
  console.error(`[${context}] Error occurred:`, error);

  if (error instanceof Error) {
    console.error(`[${context}] Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } else {
    console.error(`[${context}] Non-Error object thrown:`, {
      type: typeof error,
      value: error
    });
  }
}

/**
 * 安全地提取错误信息
 * @param error - unknown 类型的错误对象
 * @returns SafeErrorInfo - 安全的错误信息
 */
export function extractSafeErrorInfo(error: unknown): SafeErrorInfo {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      isNativeError: true
    };
  }

  return {
    isNativeError: false
  };
}

/**
 * 创建类型安全的错误响应
 * @param error - unknown 类型的错误对象
 * @param defaultMessage - 默认错误消息
 * @returns API 响应对象
 */
export function createSafeErrorResponse(error: unknown, defaultMessage: string = 'Internal server error') {
  const errorInfo = extractSafeErrorInfo(error);

  return {
    success: false,
    message: errorInfo.isNativeError ? errorInfo.message || defaultMessage : defaultMessage,
    error: errorInfo.isNativeError ? errorInfo.name : 'UnknownError'
  };
}

/**
 * 包装异步函数以提供类型安全的错误处理
 * @param fn - 异步函数
 * @param context - 错误上下文
 * @returns 包装后的函数
 */
export function withSafeErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      logSafeError(error, context);
      throw error; // 重新抛出以便上层处理
    }
  }) as T;
}
import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
}
export declare const errorHandler: (error: AppError, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const createAppError: (message: string, statusCode?: number) => AppError;
export declare const handleValidationError: (message: string) => AppError;
export declare const handleUnauthorizedError: (message?: string) => AppError;
export declare const handleForbiddenError: (message?: string) => AppError;
export declare const handleNotFoundError: (message?: string) => AppError;
export declare const handleConflictError: (message?: string) => AppError;
//# sourceMappingURL=errorHandler.d.ts.map
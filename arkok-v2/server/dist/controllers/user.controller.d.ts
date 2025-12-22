import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
export interface CreateTeacherRequest {
    username: string;
    password: string;
    displayName?: string;
    primaryClassName?: string;
    email?: string;
    name: string;
}
export declare class UserController {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 创建教师账号 (仅 Admin)
     */
    createTeacher: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * 获取教师列表 (仅 Admin)
     */
    getTeachers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * 更新教师信息 (仅 Admin)
     */
    updateTeacher: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * 重置教师密码 (仅 Admin)
     */
    resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * 删除教师账号 (仅 Admin)
     */
    deleteTeacher: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
export default UserController;
//# sourceMappingURL=user.controller.d.ts.map
import { Router } from 'express';
import { LMSService } from '../services/lms.service';
import { PrismaClient } from '@prisma/client';
import AuthService from '../services/auth.service';
/**
 * 学习管理系统 (LMS) 路由
 */
export declare class LMSRoutes {
    private lmsService;
    private authService;
    private prisma;
    private router;
    constructor(lmsService: LMSService, authService: AuthService, prisma: PrismaClient);
    private initializeRoutes;
    getRoutes(): Router;
}
//# sourceMappingURL=lms.routes.d.ts.map
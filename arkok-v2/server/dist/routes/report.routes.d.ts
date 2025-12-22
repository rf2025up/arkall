import { Router } from 'express';
import { ReportService } from '../services/report.service';
import AuthService from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
/**
 * 报表相关路由 (V5.0)
 */
export declare class ReportRoutes {
    private reportService;
    private authService;
    private prisma;
    private router;
    private reportController;
    constructor(reportService: ReportService, authService: AuthService, prisma: PrismaClient);
    private initializeRoutes;
    getRoutes(): Router;
}
//# sourceMappingURL=report.routes.d.ts.map
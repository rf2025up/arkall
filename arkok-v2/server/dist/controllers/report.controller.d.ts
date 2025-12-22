import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportService } from '../services/report.service';
/**
 * 报表控制器 - 支持依赖注入模式 (V5.0)
 */
export declare class ReportController {
    private prisma;
    private reportService;
    constructor(prisma: PrismaClient, reportService: ReportService);
    /**
     * 获取学生统计数据
     * POST /api/reports/student-stats
     */
    getStudentStats: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * 获取学校周历
     */
    getWeekCalendar: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * 获取学校设置
     */
    getSchoolSettings: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=report.controller.d.ts.map
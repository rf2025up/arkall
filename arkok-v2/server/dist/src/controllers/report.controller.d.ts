import { Request, Response, NextFunction } from 'express';
export declare class ReportController {
    private prisma;
    private reportService;
    /**
     * 获取学生统计数据
     * POST /api/reports/student-stats
     */
    getStudentStats: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * 获取学校周历
     * GET /api/reports/week-calendar
     */
    getWeekCalendar: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    /**
     * 获取学校设置
     * GET /api/reports/school-settings
     */
    getSchoolSettings: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
    private isDateInWeek;
}
//# sourceMappingURL=report.controller.d.ts.map
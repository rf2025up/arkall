import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { ReportService } from '../services/report.service';
import AuthService from '../services/auth.service';
import { PrismaClient } from '@prisma/client';

/**
 * 报表相关路由 (V5.0)
 */
export class ReportRoutes {
    private router: Router;
    private reportController: ReportController;

    constructor(
        private reportService: ReportService,
        private authService: AuthService,
        private prisma: PrismaClient
    ) {
        this.router = Router();
        this.reportController = new ReportController(this.prisma, this.reportService);
        this.initializeRoutes();
    }

    private initializeRoutes(): void {
        // 应用认证中间件到所有路由
        this.router.use(authenticateToken(this.authService));

        /**
         * 获取学生统计数据和AI提示词
         * POST /api/reports/student-stats
         */
        this.router.post('/student-stats', this.reportController.getStudentStats);

        /**
         * 获取学校周历
         * GET /api/reports/week-calendar
         */
        this.router.get('/week-calendar', this.reportController.getWeekCalendar);

        /**
         * 获取学校设置
         * GET /api/reports/school-settings
         */
        this.router.get('/school-settings', this.reportController.getSchoolSettings);
    }

    public getRoutes(): Router {
        return this.router;
    }
}
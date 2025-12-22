"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportRoutes = void 0;
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * 报表相关路由 (V5.0)
 */
class ReportRoutes {
    constructor(reportService, authService, prisma) {
        this.reportService = reportService;
        this.authService = authService;
        this.prisma = prisma;
        this.router = (0, express_1.Router)();
        this.reportController = new report_controller_1.ReportController(this.prisma, this.reportService);
        this.initializeRoutes();
    }
    initializeRoutes() {
        // 应用认证中间件到所有路由
        this.router.use((0, auth_middleware_1.authenticateToken)(this.authService));
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
    getRoutes() {
        return this.router;
    }
}
exports.ReportRoutes = ReportRoutes;
//# sourceMappingURL=report.routes.js.map
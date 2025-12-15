"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const reportController = new report_controller_1.ReportController();
// 应用认证中间件到所有路由
router.use(auth_middleware_1.authenticateToken);
/**
 * 获取学生统计数据和AI提示词
 * POST /api/reports/student-stats
 */
router.post('/student-stats', (req, res, next) => reportController.getStudentStats(req, res, next));
/**
 * 获取学校周历
 * GET /api/reports/week-calendar
 */
router.get('/week-calendar', (req, res, next) => reportController.getWeekCalendar(req, res, next));
/**
 * 获取学校设置（包括教育理念）
 * GET /api/reports/school-settings
 */
router.get('/school-settings', (req, res, next) => reportController.getSchoolSettings(req, res, next));
exports.default = router;

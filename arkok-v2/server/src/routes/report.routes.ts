import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const reportController = new ReportController();

// 应用认证中间件到所有路由
router.use(authenticateToken);

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

export default router;
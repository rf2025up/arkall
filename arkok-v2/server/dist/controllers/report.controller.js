"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
/**
 * 报表控制器 - 支持依赖注入模式 (V5.0)
 */
class ReportController {
    constructor(prisma, reportService) {
        this.prisma = prisma;
        this.reportService = reportService;
        /**
         * 获取学生统计数据
         * POST /api/reports/student-stats
         */
        this.getStudentStats = async (req, res, next) => {
            try {
                console.log('📊 [REPORT_CTRL] getStudentStats called', { body: req.body });
                const { studentId, startDate, endDate } = req.body;
                const schoolId = req.schoolId || req.user?.schoolId;
                if (!studentId || !startDate || !endDate || !schoolId) {
                    return res.status(400).json({
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: '缺少必要参数' }
                    });
                }
                const stats = await this.reportService.getStudentStats({
                    studentId,
                    schoolId,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate)
                });
                const school = await this.prisma.schools.findUnique({
                    where: { id: schoolId },
                    select: { educationalPhilosophy: true }
                });
                const philosophy = school?.educationalPhilosophy || '我们致力于培养面向未来的孩子...';
                const prompt = await this.reportService.generatePrompt(stats, philosophy);
                res.json({
                    success: true,
                    data: { stats, prompt, educationalPhilosophy: philosophy },
                    message: '学生统计数据获取成功'
                });
            }
            catch (error) {
                console.error('❌ [REPORT_CTRL] Error:', error);
                res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
            }
        };
        /**
         * 获取学校周历
         */
        this.getWeekCalendar = async (req, res, next) => {
            try {
                const schoolId = req.schoolId || req.user?.schoolId;
                if (!schoolId)
                    return res.status(400).json({ success: false, message: '缺少学校ID' });
                // 简化逻辑：生成当前学年的周历
                const currentYear = new Date().getFullYear();
                const weeks = [];
                const startDate = new Date(currentYear, 8, 1);
                while (startDate.getDay() !== 1)
                    startDate.setDate(startDate.getDate() + 1);
                for (let i = 1; i <= 20; i++) {
                    const weekEnd = new Date(startDate);
                    weekEnd.setDate(startDate.getDate() + 6);
                    weeks.push({ weekNumber: i, startDate: new Date(startDate), endDate: new Date(weekEnd), label: `第${i}周` });
                    startDate.setDate(startDate.getDate() + 7);
                }
                res.json({ success: true, data: { weeks, schoolYear: currentYear } });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        /**
         * 获取学校设置
         */
        this.getSchoolSettings = async (req, res, next) => {
            try {
                const schoolId = req.schoolId || req.user?.schoolId;
                const school = await this.prisma.schools.findUnique({
                    where: { id: schoolId },
                    select: { name: true, educationalPhilosophy: true, settings: true }
                });
                if (!school)
                    return res.status(404).json({ success: false, message: '学校未找到' });
                res.json({ success: true, data: school });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
    }
}
exports.ReportController = ReportController;
//# sourceMappingURL=report.controller.js.map
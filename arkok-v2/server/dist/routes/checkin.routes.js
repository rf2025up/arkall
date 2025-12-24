"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckinRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const checkin_service_1 = __importDefault(require("../services/checkin.service"));
class CheckinRoutes {
    constructor(authService) {
        this.authService = authService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // 批量签到
        this.router.post('/batch', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.batchCheckin.bind(this));
        // 获取学生本月签到天数
        this.router.get('/student/:studentId/monthly', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.getMonthlyCheckinCount.bind(this));
        // 检查学生今日是否已签到
        this.router.get('/student/:studentId/today', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.isTodayCheckedIn.bind(this));
    }
    /**
     * 批量签到
     */
    async batchCheckin(req, res) {
        try {
            const { studentIds, schoolId } = req.body;
            const checkedBy = req.user?.userId;
            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: '请选择要签到的学生'
                });
                return;
            }
            if (!schoolId) {
                res.status(400).json({
                    success: false,
                    message: '学校ID不能为空'
                });
                return;
            }
            const result = await checkin_service_1.default.batchCheckin({
                studentIds,
                schoolId,
                checkedBy: checkedBy || ''
            });
            res.status(200).json({
                success: true,
                message: `成功签到 ${result.success.length} 人，失败 ${result.failed.length} 人`,
                data: result
            });
        }
        catch (error) {
            console.error('Batch checkin error:', error);
            res.status(500).json({
                success: false,
                message: '批量签到失败'
            });
        }
    }
    /**
     * 获取学生本月签到天数
     */
    async getMonthlyCheckinCount(req, res) {
        try {
            const { studentId } = req.params;
            const count = await checkin_service_1.default.getMonthlyCheckinCount(studentId);
            res.status(200).json({
                success: true,
                data: { count }
            });
        }
        catch (error) {
            console.error('Get monthly checkin count error:', error);
            res.status(500).json({
                success: false,
                message: '获取签到天数失败'
            });
        }
    }
    /**
     * 检查学生今日是否已签到
     */
    async isTodayCheckedIn(req, res) {
        try {
            const { studentId } = req.params;
            const isCheckedIn = await checkin_service_1.default.isTodayCheckedIn(studentId);
            res.status(200).json({
                success: true,
                data: { isCheckedIn }
            });
        }
        catch (error) {
            console.error('Check today checkin error:', error);
            res.status(500).json({
                success: false,
                message: '检查签到状态失败'
            });
        }
    }
    getRoutes() {
        return this.router;
    }
}
exports.CheckinRoutes = CheckinRoutes;
exports.default = CheckinRoutes;
//# sourceMappingURL=checkin.routes.js.map
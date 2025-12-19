"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const dashboard_service_1 = require("../services/dashboard.service");
const router = (0, express_1.Router)();
exports.dashboardRoutes = router;
const dashboardService = new dashboard_service_1.DashboardService();
// 获取大屏数据
router.get('/', async (req, res) => {
    try {
        console.log("--- [DASHBOARD] API hit. Using DashboardService. ---");
        // 获取学校ID，如果没有则自动查找第一个可用的学校
        let schoolId = req.user?.schoolId || req.query.schoolId;
        console.log(`[DASHBOARD] Loading data for school: ${schoolId}`);
        // 获取仪表板数据
        const dashboardData = await dashboardService.getDashboardData(schoolId);
        console.log(`✅ [DASHBOARD] Data loaded successfully:`, {
            topStudents: dashboardData.topStudents.length,
            ongoingPKs: dashboardData.ongoingPKs.length,
            recentChallenges: dashboardData.recentChallenges.length,
            classRanking: dashboardData.classRanking.length
        });
        res.status(200).json({
            success: true,
            data: dashboardData,
        });
    }
    catch (error) {
        console.error("--- [ERROR] in Dashboard API ---", error);
        // 返回错误但不崩溃
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
//# sourceMappingURL=dashboard.routes.js.map
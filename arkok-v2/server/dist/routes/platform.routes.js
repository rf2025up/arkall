"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
class PlatformRoutes {
    constructor(platformService, authService) {
        this.platformService = platformService;
        this.authService = authService;
    }
    getRoutes() {
        const router = (0, express_1.Router)();
        // 所有平台路由都需要 Token 认证和平台管理员权限
        router.use((0, auth_middleware_1.authenticateToken)(this.authService));
        router.use(auth_middleware_1.requirePlatformAdmin);
        /**
         * GET /api/platform/overview
         * 获取全平台概览统计
         */
        router.get('/overview', async (req, res) => {
            try {
                const stats = await this.platformService.getGlobalOverview();
                res.json({
                    success: true,
                    data: stats
                });
            }
            catch (error) {
                console.error('❌ Error in GET /api/platform/overview:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get platform overview',
                    error: error.message
                });
            }
        });
        /**
         * GET /api/platform/campuses
         * 获取所有校区列表
         */
        router.get('/campuses', async (req, res) => {
            try {
                const campuses = await this.platformService.listAllCampuses();
                res.json({
                    success: true,
                    data: campuses
                });
            }
            catch (error) {
                console.error('❌ Error in GET /api/platform/campuses:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to list campuses',
                    error: error.message
                });
            }
        });
        /**
         * PATCH /api/platform/campuses/:schoolId/status
         * 切换校区激活状态
         */
        router.patch('/campuses/:schoolId/status', async (req, res) => {
            try {
                const { schoolId } = req.params;
                const { isActive } = req.body;
                if (typeof isActive !== 'boolean') {
                    return res.status(400).json({
                        success: false,
                        message: 'isActive (boolean) is required'
                    });
                }
                const updated = await this.platformService.toggleCampusStatus(schoolId, isActive);
                res.json({
                    success: true,
                    data: updated
                });
            }
            catch (error) {
                console.error('❌ Error in PATCH /api/platform/campuses/status:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to update campus status',
                    error: error.message
                });
            }
        });
        /**
         * PATCH /api/platform/campuses/:schoolId/expiry
         * 更新校区服务到期时间
         */
        router.patch('/campuses/:schoolId/expiry', async (req, res) => {
            try {
                const { schoolId } = req.params;
                const { expiredAt } = req.body;
                if (!expiredAt) {
                    return res.status(400).json({
                        success: false,
                        message: 'expiredAt date is required'
                    });
                }
                const date = new Date(expiredAt);
                if (isNaN(date.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid date format'
                    });
                }
                const updated = await this.platformService.updateCampusExpiry(schoolId, date);
                res.json({
                    success: true,
                    data: updated
                });
            }
            catch (error) {
                console.error('❌ Error in PATCH /api/platform/campuses/expiry:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to update campus expiry',
                    error: error.message
                });
            }
        });
        /**
         * POST /api/platform/campuses
         * 创建新校区及管理员账号
         */
        router.post('/campuses', async (req, res) => {
            try {
                const { name, adminUsername, adminName, planType } = req.body;
                if (!name || !adminUsername || !adminName) {
                    return res.status(400).json({
                        success: false,
                        message: '校区名称、管理员用户名和姓名为必填项'
                    });
                }
                const result = await this.platformService.createCampus({
                    name,
                    adminUsername,
                    adminName,
                    planType
                });
                res.json({
                    success: true,
                    data: result,
                    message: `校区「${name}」创建成功，管理员初始密码为 0000`
                });
            }
            catch (error) {
                console.error('❌ Error in POST /api/platform/campuses:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || '创建校区失败'
                });
            }
        });
        /**
         * GET /api/platform/search
         * 全局搜索学生或教师
         */
        router.get('/search', async (req, res) => {
            try {
                const { q, type = 'student', limit = '20' } = req.query;
                if (!q || typeof q !== 'string') {
                    return res.status(400).json({
                        success: false,
                        message: 'Query parameter "q" is required'
                    });
                }
                let results;
                if (type === 'teacher') {
                    results = await this.platformService.searchTeachersGlobal(q, parseInt(limit));
                }
                else {
                    results = await this.platformService.searchStudentsGlobal(q, parseInt(limit));
                }
                res.json({
                    success: true,
                    data: results
                });
            }
            catch (error) {
                console.error('❌ Error in GET /api/platform/search:', error);
                res.status(500).json({
                    success: false,
                    message: 'Search failed',
                    error: error.message
                });
            }
        });
        return router;
    }
}
exports.PlatformRoutes = PlatformRoutes;
exports.default = PlatformRoutes;
//# sourceMappingURL=platform.routes.js.map
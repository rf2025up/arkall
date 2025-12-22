"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
class SchoolRoutes {
    constructor(schoolService, authService) {
        this.schoolService = schoolService;
        this.authService = authService;
    }
    getRoutes() {
        const router = (0, express_1.Router)();
        // 获取学校列表 (认证 + 管理员)
        router.get('/', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.requireAdmin, async (req, res) => {
            try {
                const schools = await this.schoolService.getSchoolsWithStats();
                res.json({
                    success: true,
                    data: schools
                });
            }
            catch (error) {
                console.error('❌ Error in GET /api/schools:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get schools',
                    error: error.message
                });
            }
        });
        // 获取学生列表 (认证 + 基础校验)
        router.get('/students', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, async (req, res) => {
            try {
                const { schoolId, className, limit = 50 } = req.query;
                const students = await this.schoolService.getStudentsWithStats({
                    schoolId: schoolId,
                    className: className,
                    limit: parseInt(limit)
                });
                res.json({
                    success: true,
                    data: students
                });
            }
            catch (error) {
                console.error('❌ Error in GET /api/schools/students:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to get students',
                    error: error.message
                });
            }
        });
        // 创建新学校 (仅限管理员)
        router.post('/', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.requireAdmin, async (req, res) => {
            try {
                const { name, planType = 'FREE' } = req.body;
                if (!name) {
                    return res.status(400).json({
                        success: false,
                        message: 'School name is required'
                    });
                }
                const school = await this.schoolService.createSchool({
                    name,
                    planType: planType,
                    isActive: true
                });
                res.status(201).json({
                    success: true,
                    message: 'School created successfully',
                    data: school
                });
            }
            catch (error) {
                console.error('❌ Error in POST /api/schools:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to create school',
                    error: error.message
                });
            }
        });
        return router;
    }
}
exports.SchoolRoutes = SchoolRoutes;
exports.default = SchoolRoutes;
//# sourceMappingURL=school.routes.js.map
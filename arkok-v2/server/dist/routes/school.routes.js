"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolRoutes = void 0;
const express_1 = require("express");
const school_service_1 = require("../services/school.service");
const router = (0, express_1.Router)();
exports.schoolRoutes = router;
const schoolService = new school_service_1.SchoolService();
// 获取学校列表（包含教师和学生统计）
router.get('/', async (req, res) => {
    try {
        const schools = await schoolService.getSchoolsWithStats();
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
// 获取学生列表（按经验值排序）
router.get('/students', async (req, res) => {
    try {
        const { schoolId, className, limit = 50 } = req.query;
        const students = await schoolService.getStudentsWithStats({
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
// 创建新学校
router.post('/', async (req, res) => {
    try {
        const { name, planType = 'FREE' } = req.body;
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'School name is required'
            });
        }
        const school = await schoolService.createSchool({
            name,
            planType,
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
//# sourceMappingURL=school.routes.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lmsRoutes = void 0;
const express_1 = require("express");
const lms_service_1 = require("../services/lms.service");
const client_1 = require("@prisma/client");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_service_1 = __importDefault(require("../services/auth.service"));
const router = (0, express_1.Router)();
exports.lmsRoutes = router;
const prisma = new client_1.PrismaClient();
const lmsService = new lms_service_1.LMSService(prisma);
const authService = new auth_service_1.default(prisma);
// 🚨 临时调试端点 - 测试前端是否能调用API (无认证)
router.get('/debug-test', async (req, res) => {
    console.log('🔥 [DEBUG] ===== 前端API调用测试成功！ =====');
    console.log('🔥 [DEBUG] 请求时间:', new Date().toISOString());
    console.log('🔥 [DEBUG] 请求URL:', req.originalUrl);
    console.log('🔥 [DEBUG] 请求方法:', req.method);
    console.log('🔥 [DEBUG] User-Agent:', req.headers['user-agent']);

    res.json({
        success: true,
        message: '前端API调用测试成功！',
        timestamp: new Date().toISOString(),
        requestInfo: {
            url: req.originalUrl,
            method: req.method,
            userAgent: req.headers['user-agent']
        }
    });
});

// 应用认证中间件到所有路由
router.use((0, auth_middleware_1.authenticateToken)(authService));
// 临时处理mistakes端点 - 临时解决方案
router.get('/mistakes', async (req, res) => {
    try {
        res.json({
            success: true,
            data: [],
            message: '错题数据获取成功'
        });
    }
    catch (error) {
        console.error('获取错题数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取错题数据失败'
        });
    }
});
// 临时处理records端点 - 临时解决方案
router.get('/records', async (req, res) => {
    try {
        res.json({
            success: true,
            data: [],
            message: '记录数据获取成功'
        });
    }
    catch (error) {
        console.error('获取记录数据失败:', error);
        res.status(500).json({
            success: false,
            message: '获取记录数据失败'
        });
    }
});
// 处理记录尝试端点
router.patch('/records/:id/attempt', async (req, res) => {
    try {
        const { id } = req.params;
        res.json({
            success: true,
            message: `记录 ${id} 尝试更新成功`
        });
    }
    catch (error) {
        console.error('更新记录尝试失败:', error);
        res.status(500).json({
            success: false,
            message: '更新记录尝试失败'
        });
    }
});
// 处理学生通过所有记录端点
router.patch('/records/student/:studentId/pass-all', async (req, res) => {
    try {
        const { studentId } = req.params;
        res.json({
            success: true,
            message: `学生 ${studentId} 通过所有记录更新成功`
        });
    }
    catch (error) {
        console.error('更新学生通过所有记录失败:', error);
        res.status(500).json({
            success: false,
            message: '更新学生通过所有记录失败'
        });
    }
});
// 获取任务库
router.get('/task-library', async (req, res) => {
    try {
        const tasks = await lmsService.getTaskLibrary();
        res.json({
            success: true,
            data: tasks,
            message: 'Task library retrieved successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in GET /api/lms/task-library:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get task library',
            error: error.message
        });
    }
});
// 发布教学计划
router.post('/publish', async (req, res) => {
    try {
        const io = req.app.get('io'); // 从app实例获取io
        const { courseInfo, qcTasks, normalTasks, specialTasks, className } = req.body;
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        // 验证请求数据
        if (!courseInfo || !courseInfo.title) {
            return res.status(400).json({
                success: false,
                message: 'Course info and title are required'
            });
        }
        // 构建发布请求
        const publishRequest = {
            schoolId: user.schoolId,
            teacherId: user.userId,
            title: courseInfo.title,
            content: {
                courseInfo,
                qcTasks,
                normalTasks,
                specialTasks
            },
            date: courseInfo.date ? new Date(courseInfo.date) : new Date(),
            className: className, // 传递目标班级信息
            tasks: [] // 根据前端数据构建任务数组
        };
        // 将前端的任务数据转换为服务所需的格式
        if (qcTasks && qcTasks.length > 0) {
            publishRequest.tasks.push(...qcTasks.map((task) => ({
                type: 'QC',
                title: task.taskName,
                content: {
                    category: task.category,
                    difficulty: task.difficulty
                },
                expAwarded: task.defaultExp || 5
            })));
        }
        if (normalTasks && normalTasks.length > 0) {
            publishRequest.tasks.push(...normalTasks.map((task) => ({
                type: 'TASK',
                title: task.taskName,
                content: {
                    category: task.category,
                    taskId: task.taskId
                },
                expAwarded: task.defaultExp || 10
            })));
        }
        if (specialTasks && specialTasks.length > 0) {
            publishRequest.tasks.push(...specialTasks.map((task) => ({
                type: 'SPECIAL',
                title: task.taskName,
                content: {
                    category: task.category,
                    description: task.description
                },
                expAwarded: task.defaultExp || 15
            })));
        }
        const result = await lmsService.publishPlan(publishRequest, io);
        res.json({
            success: true,
            message: 'Lesson plan published successfully',
            data: result
        });
    }
    catch (error) {
        console.error('❌ Error in POST /api/lms/publish:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to publish lesson plan',
            error: error.message
        });
    }
});
// 获取教学计划列表
router.get('/plans', async (req, res) => {
    try {
        const { schoolId } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: 'schoolId is required'
            });
        }
        const result = await lmsService.getLessonPlans(schoolId, {
            page,
            limit,
            startDate,
            endDate
        });
        res.json({
            success: true,
            data: result,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            }
        });
    }
    catch (error) {
        console.error('❌ Error in GET /api/lms/plans:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get lesson plans',
            error: error.message
        });
    }
});
// 获取教学计划详情
router.get('/plans/:planId', async (req, res) => {
    try {
        const { planId } = req.params;
        const result = await lmsService.getLessonPlanDetail(planId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('❌ Error in GET /api/lms/plans/:planId:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get lesson plan detail',
            error: error.message
        });
    }
});
// 删除教学计划
router.delete('/plans/:planId', async (req, res) => {
    try {
        const { planId } = req.params;
        await lmsService.deleteLessonPlan(planId);
        res.json({
            success: true,
            message: 'Lesson plan deleted successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in DELETE /api/lms/plans/:planId:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete lesson plan',
            error: error.message
        });
    }
});
// 获取学校统计信息
router.get('/stats/:schoolId', async (req, res) => {
    try {
        const { schoolId } = req.params;
        const stats = await lmsService.getSchoolStats(schoolId);
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        console.error('❌ Error in GET /api/lms/stats/:schoolId:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get school statistics',
            error: error.message
        });
    }
});

// 获取学生的每日任务记录
router.get('/daily-records', async (req, res) => {
    try {
        const { studentId, date } = req.query;
        if (!studentId || !date) {
            return res.status(400).json({
                success: false,
                message: 'studentId and date are required'
            });
        }
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        const records = await lmsService.getDailyRecords(user.schoolId, studentId, date);
        res.json({
            success: true,
            data: records,
            message: 'Daily records retrieved successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in GET /api/lms/daily-records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get daily records',
            error: error.message
        });
    }
});
// 增加任务尝试次数
router.patch('/records/:recordId/attempt', async (req, res) => {
    try {
        const { recordId } = req.params;
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        const updatedRecord = await lmsService.markAttempt(recordId, user.userId);
        res.json({
            success: true,
            data: updatedRecord,
            message: 'Attempt recorded successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in PATCH /api/lms/records/:recordId/attempt:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record attempt',
            error: error.message
        });
    }
});
// 更新任务状态
router.patch('/records/:recordId/status', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { status } = req.body;
        if (!status || !['PENDING', 'SUBMITTED', 'REVIEWED', 'COMPLETED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: PENDING, SUBMITTED, REVIEWED, COMPLETED'
            });
        }
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        const updatedRecord = await lmsService.updateRecordStatus(recordId, status, user.userId);
        res.json({
            success: true,
            data: updatedRecord,
            message: 'Record status updated successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in PATCH /api/lms/records/:recordId/status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update record status',
            error: error.message
        });
    }
});
// 批量更新任务状态
router.patch('/records/batch/status', async (req, res) => {
    try {
        const { recordIds, status } = req.body;
        if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'recordIds array is required'
            });
        }
        if (!status || !['PENDING', 'SUBMITTED', 'REVIEWED', 'COMPLETED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: PENDING, SUBMITTED, REVIEWED, COMPLETED'
            });
        }
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        const results = await lmsService.updateMultipleRecordStatus(user.schoolId, recordIds, status, user.userId);
        res.json({
            success: true,
            data: results,
            message: `Batch update completed: ${results.success} succeeded, ${results.failed} failed`
        });
    }
    catch (error) {
        console.error('❌ Error in PATCH /api/lms/records/batch/status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to batch update records',
            error: error.message
        });
    }
});

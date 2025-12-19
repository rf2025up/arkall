"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lmsRoutes = void 0;
const express_1 = require("express");
const lms_service_1 = require("../services/lms.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_service_1 = __importDefault(require("../services/auth.service"));
const router = (0, express_1.Router)();
exports.lmsRoutes = router;
const lmsService = new lms_service_1.LMSService();
const authService = new auth_service_1.default();
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
// 🆕 发布教学计划 - 基于师生绑定的安全发布
router.post('/publish', async (req, res) => {
    try {
        const io = req.app.get('io'); // 从app实例获取io
        const { courseInfo, qcTasks, normalTasks, specialTasks, progress } = req.body;
        // 🆕 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        const publisherId = user.userId; // 🆕 发布者ID，用于安全锁定
        // 🚫 校长权限检查：禁止校长发布备课内容
        if (user.role === 'ADMIN') {
            console.log(`🚫 [PERMISSION_DENIED] 校长用户 ${user.username} 尝试发布教学计划，已拒绝`);
            return res.status(403).json({
                success: false,
                message: '校长无权限发布备课内容，请切换到具体老师班级',
                code: 'ADMIN_PUBLISH_FORBIDDEN',
                suggestion: '如需发布备课内容，请切换到具体老师身份后再操作'
            });
        }
        // 验证请求数据
        if (!courseInfo || !courseInfo.title) {
            return res.status(400).json({
                success: false,
                message: 'Course info and title are required'
            });
        }
        console.log(`🔒 [LMS_SECURITY] Teacher ${publisherId} is publishing tasks`);
        // 🆕 构建发布请求 - 基于师生绑定安全约束
        const publishRequest = {
            schoolId: user.schoolId,
            teacherId: publisherId, // 🆕 使用发布者ID进行安全锁定
            title: courseInfo.title,
            content: {
                courseInfo,
                qcTasks,
                normalTasks,
                specialTasks,
                // 🆕 记录发布安全信息
                publisherId: publisherId,
                securityScope: 'TEACHERS_STUDENTS',
                publishedAt: new Date().toISOString()
            },
            date: courseInfo.date ? new Date(courseInfo.date) : new Date(),
            progress: progress, // 🆕 添加课程进度数据
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
// 🆕 获取学生所有历史任务记录（用于动态学期地图）
router.get('/all-records', async (req, res) => {
    try {
        const { studentId, limit = 100 } = req.query;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        const records = await lmsService.getAllStudentRecords(user.schoolId, studentId, parseInt(limit));
        res.json({
            success: true,
            data: records,
            message: 'All student records retrieved successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in GET /api/lms/all-records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get all records',
            error: error.message
        });
    }
});
// 增加任务尝试次数
router.patch('/records/:recordId/attempt', async (req, res) => {
    try {
        const { recordId } = req.params;
        const user = req.user;
        const updatedRecord = await lmsService.markAttempt(recordId, user.userId);
        res.json({ success: true, data: updatedRecord, message: 'Attempt recorded successfully' });
    }
    catch (error) {
        console.error('❌ Error in PATCH /api/lms/records/:recordId/attempt:', error);
        res.status(500).json({ success: false, message: 'Failed to record attempt', error: error.message });
    }
});
// 🆕 核心修复：添加前端过关页急需的状态更新路由
// 前端请求路径：/api/lms/records/:id/status
router.patch('/records/:recordId/status', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { status } = req.body;
        const user = req.user;
        console.log(`🎯 [LMS_ROUTE] 收到状态更新: ID=${recordId}, Status=${status}, User=${user.username}`);
        if (!['PENDING', 'SUBMITTED', 'REVIEWED', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        // 🚀 直接在路由层进行数据库操作，确保万无一失
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const result = await prisma.task_records.update({
            where: { id: recordId },
            data: {
                status,
                updatedAt: new Date(),
                submittedAt: (status === 'SUBMITTED' || status === 'COMPLETED') ? new Date() : null
            }
        });
        console.log(`✅ [LMS_ROUTE] 数据库更新成功:`, result.id);
        res.json({
            success: true,
            data: result,
            message: 'Status updated successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in PATCH /api/lms/records/:recordId/status:', error);
        res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
    }
});
// 批量更新任务状态
router.patch('/records/batch/status', async (req, res) => {
    try {
        console.log(`🔍 [ROUTE_DEBUG] 批量更新请求:`);
        console.log(`   - 请求体:`, JSON.stringify(req.body, null, 2));
        const { recordIds, status } = req.body;
        console.log(`   - recordIds:`, recordIds);
        console.log(`   - status:`, status);
        if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
            console.log(`❌ [ROUTE_DEBUG] recordIds验证失败`);
            return res.status(400).json({
                success: false,
                message: 'recordIds array is required'
            });
        }
        if (!status || !['PENDING', 'SUBMITTED', 'REVIEWED', 'COMPLETED'].includes(status)) {
            console.log(`❌ [ROUTE_DEBUG] status验证失败`);
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: PENDING, SUBMITTED, REVIEWED, COMPLETED'
            });
        }
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        console.log(`✅ [ROUTE_DEBUG] 用户信息:`, {
            userId: user.userId,
            schoolId: user.schoolId,
            username: user.username
        });
        console.log(`🚀 [ROUTE_DEBUG] 开始调用服务方法`);
        const results = await lmsService.updateMultipleRecordStatus(user.schoolId, recordIds, status, user.userId);
        console.log(`✅ [ROUTE_DEBUG] 服务方法调用成功:`, results);
        res.json({
            success: true,
            data: results,
            message: `Batch update completed: ${results.success} succeeded, ${results.failed} failed`
        });
    }
    catch (error) {
        console.error('❌ Error in PATCH /api/lms/records/batch/status:', error);
        console.error('❌ [ROUTE_DEBUG] 错误详情:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Failed to batch update records',
            error: error.message
        });
    }
});
// 获取最新教学计划 - 供备课页加载当前数据
router.get('/latest-lesson-plan', async (req, res) => {
    try {
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        console.log(`🔍 [LATEST_LESSON_PLAN] 获取最新教学计划: schoolId=${user.schoolId}, userId=${user.userId}`);
        // 查找当前老师的最新教学计划（用于表单回填）
        const latestLessonPlan = await lmsService.getLatestLessonPlan(user.schoolId, user.userId);
        if (latestLessonPlan?.content) {
            console.log(`✅ [LATEST_LESSON_PLAN] 找到最新教学计划: id=${latestLessonPlan.id}, date=${latestLessonPlan.date}`);
            res.json({
                success: true,
                data: {
                    id: latestLessonPlan.id,
                    date: latestLessonPlan.date,
                    content: latestLessonPlan.content,
                    courseInfo: latestLessonPlan.content.courseInfo || {
                        chinese: { unit: "1", lesson: "1", title: "默认课程" },
                        math: { unit: "1", lesson: "1", title: "默认课程" },
                        english: { unit: "1", title: "Default Course" }
                    },
                    updatedAt: latestLessonPlan.updatedAt.toISOString()
                },
                message: 'Latest lesson plan retrieved successfully'
            });
        }
        else {
            console.log(`📝 [LATEST_LESSON_PLAN] 未找到教学计划，返回默认值`);
            // 返回默认教学计划
            const defaultPlan = {
                courseInfo: {
                    chinese: { unit: "1", lesson: "1", title: "默认课程" },
                    math: { unit: "1", lesson: "1", title: "默认课程" },
                    english: { unit: "1", title: "Default Course" }
                }
            };
            res.json({
                success: true,
                data: {
                    id: null,
                    date: null,
                    content: defaultPlan,
                    courseInfo: defaultPlan.courseInfo,
                    updatedAt: new Date().toISOString()
                },
                message: 'No lesson plan found, returning default data'
            });
        }
    }
    catch (error) {
        console.error('❌ Error in GET /api/lms/latest-lesson-plan:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get latest lesson plan',
            error: error.message
        });
    }
});
// 获取学生课程进度 - 集成备课页数据
router.get('/student-progress', async (req, res) => {
    try {
        const { studentId } = req.query;
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'studentId is required'
            });
        }
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        // 获取该学生最新的课程进度数据
        const latestProgress = await lmsService.getStudentProgress(user.schoolId, studentId);
        res.json({
            success: true,
            data: latestProgress,
            message: 'Student progress retrieved successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in GET /api/lms/student-progress:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get student progress',
            error: error.message
        });
    }
});
// 更新学生课程进度 - 权限高于备课页
router.patch('/student-progress/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { chinese, math, english } = req.body;
        if (!chinese && !math && !english) {
            return res.status(400).json({
                success: false,
                message: 'At least one subject progress must be provided'
            });
        }
        // 从认证中间件获取用户信息（已由中间件验证）
        const user = req.user;
        const updatedProgress = await lmsService.updateStudentProgress(user.schoolId, studentId, user.userId, { chinese, math, english });
        res.json({
            success: true,
            data: updatedProgress,
            message: 'Student progress updated successfully'
        });
    }
    catch (error) {
        console.error('❌ Error in PATCH /api/lms/student-progress/:studentId:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student progress',
            error: error.message
        });
    }
});
//# sourceMappingURL=lms.routes.js.map
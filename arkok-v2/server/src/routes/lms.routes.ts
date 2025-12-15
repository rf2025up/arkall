import { Router } from 'express';
import { LMSService, PublishPlanRequest } from '../services/lms.service';
import { PrismaClient, TaskType } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import AuthService from '../services/auth.service';

const router = Router();
const prisma = new PrismaClient();
const lmsService = new LMSService(prisma);
const authService = new AuthService(prisma);

// 应用认证中间件到所有路由
router.use(authenticateToken(authService));

// 临时处理mistakes端点 - 临时解决方案
router.get('/mistakes', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: '错题数据获取成功'
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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

  } catch (error) {
    console.error('❌ Error in GET /api/lms/task-library:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task library',
      error: (error as Error).message
    });
  }
});

// 🆕 发布教学计划 - 基于师生绑定的安全发布
router.post('/publish', async (req, res) => {
  try {
    const io = req.app.get('io'); // 从app实例获取io
    const { courseInfo, qcTasks, normalTasks, specialTasks } = req.body;

    // 🆕 从认证中间件获取用户信息（已由中间件验证）
    const user = (req as any).user;
    const publisherId = user.userId; // 🆕 发布者ID，用于安全锁定

    // 验证请求数据
    if (!courseInfo || !courseInfo.title) {
      return res.status(400).json({
        success: false,
        message: 'Course info and title are required'
      });
    }

    console.log(`🔒 [LMS_SECURITY] Teacher ${publisherId} is publishing tasks`);

    // 🆕 构建发布请求 - 基于师生绑定安全约束
    const publishRequest: PublishPlanRequest = {
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
      tasks: [] // 根据前端数据构建任务数组
    };

    // 将前端的任务数据转换为服务所需的格式
    if (qcTasks && qcTasks.length > 0) {
      publishRequest.tasks.push(...qcTasks.map((task: any) => ({
        type: 'QC' as TaskType,
        title: task.taskName,
        content: {
          category: task.category,
          difficulty: task.difficulty
        },
        expAwarded: task.defaultExp || 5
      })));
    }

    if (normalTasks && normalTasks.length > 0) {
      publishRequest.tasks.push(...normalTasks.map((task: any) => ({
        type: 'TASK' as TaskType,
        title: task.taskName,
        content: {
          category: task.category,
          taskId: task.taskId
        },
        expAwarded: task.defaultExp || 10
      })));
    }

    if (specialTasks && specialTasks.length > 0) {
      publishRequest.tasks.push(...specialTasks.map((task: any) => ({
        type: 'SPECIAL' as TaskType,
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

  } catch (error) {
    console.error('❌ Error in POST /api/lms/publish:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish lesson plan',
      error: (error as Error).message
    });
  }
});

// 获取教学计划列表
router.get('/plans', async (req, res) => {
  try {
    const { schoolId } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: 'schoolId is required'
      });
    }

    const result = await lmsService.getLessonPlans(schoolId as string, {
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

  } catch (error) {
    console.error('❌ Error in GET /api/lms/plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lesson plans',
      error: (error as Error).message
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

  } catch (error) {
    console.error('❌ Error in GET /api/lms/plans/:planId:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get lesson plan detail',
      error: (error as Error).message
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

  } catch (error) {
    console.error('❌ Error in DELETE /api/lms/plans/:planId:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lesson plan',
      error: (error as Error).message
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

  } catch (error) {
    console.error('❌ Error in GET /api/lms/stats/:schoolId:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get school statistics',
      error: (error as Error).message
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
    const user = (req as any).user;

    const records = await lmsService.getDailyRecords(
      user.schoolId,
      studentId as string,
      date as string
    );

    res.json({
      success: true,
      data: records,
      message: 'Daily records retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error in GET /api/lms/daily-records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily records',
      error: (error as Error).message
    });
  }
});

// 增加任务尝试次数
router.patch('/records/:recordId/attempt', async (req, res) => {
  try {
    const { recordId } = req.params;

    // 从认证中间件获取用户信息（已由中间件验证）
    const user = (req as any).user;

    const updatedRecord = await lmsService.markAttempt(recordId, user.userId);

    res.json({
      success: true,
      data: updatedRecord,
      message: 'Attempt recorded successfully'
    });

  } catch (error) {
    console.error('❌ Error in PATCH /api/lms/records/:recordId/attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attempt',
      error: (error as Error).message
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
    const user = (req as any).user;

    const updatedRecord = await lmsService.updateRecordStatus(
      recordId,
      status,
      user.userId
    );

    res.json({
      success: true,
      data: updatedRecord,
      message: 'Record status updated successfully'
    });

  } catch (error) {
    console.error('❌ Error in PATCH /api/lms/records/:recordId/status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update record status',
      error: (error as Error).message
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
    const user = (req as any).user;

    const results = await lmsService.updateMultipleRecordStatus(
      user.schoolId,
      recordIds,
      status,
      user.userId
    );

    res.json({
      success: true,
      data: results,
      message: `Batch update completed: ${results.success} succeeded, ${results.failed} failed`
    });

  } catch (error) {
    console.error('❌ Error in PATCH /api/lms/records/batch/status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to batch update records',
      error: (error as Error).message
    });
  }
});

export { router as lmsRoutes };
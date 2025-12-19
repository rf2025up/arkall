# 🔍 ArkOK V2 LMS 数据链路诊断

## 1. 数据库定义 (Schema) - 检查外键关系
```prisma
model task_records {
  id            String        @id
  schoolId      String
  studentId     String
  type          TaskType
  title         String
  content       Json?
  status        TaskStatus    @default(PENDING)
  expAwarded    Int           @default(0)
  submittedAt   DateTime?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime
  lessonPlanId  String?
  task_category TaskCategory  @default(TASK)
  is_current    Boolean       @default(true)
  attempts      Int           @default(0)
  subject       String?
  lesson_plans  lesson_plans? @relation(fields: [lessonPlanId], references: [id])
  schools       schools       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  students      students      @relation(fields: [studentId], references: [id], onDelete: Cascade)
}
```

## 2. 后端发布逻辑 (publishPlan) - 检查它是如何创建任务记录的
# 路径：server/src/services/lms.service.ts 中的 publishPlan 函数
```typescript
  async publishPlan(request: PublishPlanRequest, io: any): Promise<PublishPlanResult> {
    const { schoolId, teacherId, title, content, date, tasks } = request;

    try {
      console.log(`🔒 [LMS_SECURITY] Publishing lesson plan: ${title}`);
      console.log(`🔒 [LMS_SECURITY] Teacher ID: ${teacherId}`);
      console.log(`🔒 [LMS_SECURITY] School ID: ${schoolId}`);

      // 🚨 严重安全检查：验证当前用户的权限
      if (!teacherId) {
        console.error(`🚨 [LMS_SECURITY] CRITICAL: teacherId is undefined or null!`);
        throw new Error('发布者ID不能为空');
      }

      // 🆕 安全锁定：只查找归属该老师的学生
      const students = await this.prisma.students.findMany({
        where: {
          schoolId: schoolId,
          teacherId: teacherId, // 🔒 核心安全约束：只给发布者的学生投送
          isActive: true
        },
        select: {
          id: true,
          name: true,
          className: true,
          teacherId: true
        }
      });

      // 🚨 额外安全验证：检查所有返回的学生都确实属于当前老师
      const invalidStudents = students.filter(s => s.teacherId !== teacherId);
      if (invalidStudents.length > 0) {
        console.error(`🚨 [LMS_SECURITY] CRITICAL: Found students belonging to other teachers:`, invalidStudents);
        throw new Error('严重安全错误：查询结果包含其他老师的学生');
      }

      if (students.length === 0) {
        console.log(`⚠️ [LMS_SECURITY] No students found for teacher: ${teacherId}`);
        throw new Error(`该老师名下暂无学生，无法发布任务`);
      }

      console.log(`👥 [LMS_SECURITY] Found ${students.length} students for teacher: ${teacherId}`);
      students.forEach(s => {
        console.log(`👤 [LMS_SECURITY] Student: ${s.name} (${s.className}) - teacherId: ${s.teacherId}`);
      });

      // 2. 创建教学计划
      const lessonPlan = await this.prisma.lesson_plans.create({
        data: {
          schoolId,
          teacherId,
          title,
          content: {
            ...content,
            // 🆕 记录发布范围信息
            publishedTo: 'TEACHERS_STUDENTS',
            publisherId: teacherId
          },
          date: new Date(date),
          isActive: true
        }
      });

      console.log(`✅ [LMS_SECURITY] Created lesson plan: ${lessonPlan.id} for ${students.length} students`);

      // 3. 🆕 防重复发布：创建任务记录前先检查
      const taskRecords: any[] = [];
      const affectedClasses = new Set<string>();
      let duplicateCount = 0;
      let newTaskCount = 0;

      // 📅 计算今天的时间范围（考虑时区）- 使用服务器零点时间
      const today = new Date();
      const serverDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // 不包含时间部分的纯日期
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      console.log(`🔍 [LMS_DUPLICATE_CHECK] Server Date: ${serverDate.toISOString()}`);
      console.log(`🔍 [LMS_DUPLICATE_CHECK] Checking for duplicates within time range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);

      for (const student of students) {
        affectedClasses.add(student.className || '未分班');

        for (const task of tasks) {
          // 🔍 防重检查：查询今天是否已有同名任务
          const existingRecord = await this.prisma.task_records.findFirst({
            where: {
              studentId: student.id,
              title: task.title,
              type: task.type,
              createdAt: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          });

          if (existingRecord) {
            // 🚫 发现已存在任务，跳过创建
            console.log(`🔄 [LMS_DUPLICATE_CHECK] Task "${task.title}" already exists for student "${student.name}" today. Skipping.`);
            duplicateCount++;

            // 🆕 可选：更新现有记录的内容和经验值
            await this.prisma.task_records.update({
              where: { id: existingRecord.id },
              data: {
                content: {
                  ...(typeof existingRecord.content === 'object' ? existingRecord.content : {}),
                  ...(task.content || {}),
                  lessonPlanId: lessonPlan.id,
                  lessonPlanTitle: lessonPlan.title,
                  publisherId: teacherId,
                  taskDate: serverDate.toISOString().split('T')[0], // 确保也有纯日期
                  lastUpdated: new Date().toISOString()
                },
                expAwarded: task.expAwarded,
                updatedAt: new Date()
              }
            });
            console.log(`✅ [LMS_DUPLICATE_CHECK] Updated existing task record for student "${student.name}"`);
          } else {
            // ✅ 无重复记录，创建新任务
            taskRecords.push({
              schoolId,
              studentId: student.id,
              lessonPlanId: lessonPlan.id, // 🆕 关联教学计划
              type: task.type,
              title: task.title,
              content: {
                ...task.content,
                lessonPlanId: lessonPlan.id,
                lessonPlanTitle: lessonPlan.title,
                publisherId: teacherId,
                taskDate: serverDate.toISOString().split('T')[0] // 存储纯日期字符串 YYYY-MM-DD
              },
              status: 'PENDING',
              expAwarded: task.expAwarded,
              createdAt: new Date()
            });
            newTaskCount++;
          }
        }
      }

      // 批量插入新任务记录
      if (taskRecords.length > 0) {
        await this.prisma.task_records.createMany({
          data: taskRecords
        });
        console.log(`✅ [LMS_SECURITY] Created ${taskRecords.length} new task records for ${students.length} students`);
      }

      // 📊 防重统计报告
      console.log(`📊 [LMS_DUPLICATE_CHECK] Publication Summary:`);
      console.log(`   - New tasks created: ${newTaskCount}`);
      console.log(`   - Duplicate tasks skipped: ${duplicateCount}`);
      console.log(`   - Total tasks processed: ${newTaskCount + duplicateCount}`);
      console.log(`   - Total students: ${students.length}`);
      console.log(`   - Tasks per student: ${tasks.length}`);
      console.log(`   - Total expected tasks: ${students.length * tasks.length}`);
      console.log(`   - Total exp per student: ${totalExpPerStudent}`);
      console.log(`   - Total exp awarded: ${taskStats.totalExpAwarded}`);

      // 4. 📊 计算防重后的统计信息 - 修正经验值计算
      const actualTaskCount = newTaskCount; // 实际创建的新任务数
      const totalExpPerStudent = tasks.reduce((sum, task) => sum + task.expAwarded, 0); // 每个学生的总经验
      const taskStats = {
        totalStudents: students.length,
        tasksCreated: newTaskCount, // 🆕 只计算新创建的任务数
        tasksUpdated: duplicateCount, // 🆕 更新的任务数
        totalExpAwarded: totalExpPerStudent * students.length, // 修正：应该是每个学生的经验值 × 学生数
        duplicateSkipped: duplicateCount // 🆕 重复跳过的任务数
      };

      // 5. 🆕 安全广播：只向该老师的房间广播事件
      const teacherRoom = `teacher_${teacherId}`;
      io.to(teacherRoom).emit(SOCKET_EVENTS.PLAN_PUBLISHED, {
        lessonPlanId: lessonPlan.id,
        schoolId,
        publisherId: teacherId,
        title,
        date: lessonPlan.date,
        taskStats,
        affectedClasses: Array.from(affectedClasses),
        timestamp: new Date().toISOString()
      });

      console.log(`📡 [LMS_SECURITY] Published to room: ${teacherRoom}`);

      // 6. 返回发布结果
      const result: PublishPlanResult = {
        lessonPlan,
        taskStats,
        affectedClasses: Array.from(affectedClasses)
      };

      console.log(`🎉 [LMS_SECURITY] Publish completed successfully!`);
      console.log(`🎯 [LMS_SECURITY] Result summary:`, {
        lessonPlanId: lessonPlan.id,
        totalStudents: taskStats.totalStudents,
        tasksCreated: taskStats.tasksCreated,
        tasksUpdated: taskStats.tasksUpdated,
        totalExpAwarded: taskStats.totalExpAwarded,
        duplicateSkipped: taskStats.duplicateSkipped,
        affectedClassesCount: result.affectedClasses.length
      });

      return result;

    } catch (error) {
      console.error('发布教学计划失败:', error);
      throw error;
    }
  }
```

## 3. 后端查询逻辑 (getDailyRecords) - 检查过关页如何读取任务
# 路径：server/src/services/lms.service.ts 中的 getDailyRecords 函数
```typescript
  async getDailyRecords(schoolId: string, studentId: string, date: string): Promise<TaskRecord[]> {
    try {
      console.log(`🔥 [LMS DEBUG] ===== getDailyRecords 调用开始 =====`);
      console.log(`🔥 [LMS DEBUG] 传入参数: schoolId=${schoolId}, studentId=${studentId}, date=${date}`);

      // 🔧 输入验证
      if (!schoolId || !studentId || !date) {
        console.error(`🔥 [LMS ERROR] 缺少必要参数: schoolId=${!!schoolId}, studentId=${!!studentId}, date=${!!date}`);
        throw new Error('缺少必要参数：schoolId, studentId, date');
      }

      // 🔧 修复时间处理：生成纯日期字符串用于匹配
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        console.error(`🔥 [LMS ERROR] 无效的日期格式: ${date}`);
        throw new Error(`无效的日期格式: ${date}`);
      }

      // 生成纯日期字符串 YYYY-MM-DD，用于匹配 content.taskDate
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // 同时保留时间范围查询作为备选方案
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();
      const day = targetDate.getDate();
      const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

      console.log(`🔥 [LMS DEBUG] 目标日期字符串: ${targetDateStr}`);
      console.log(`🔥 [LMS DEBUG] 查询范围: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
      console.log(`🔥 [LMS DEBUG] 目标日期: ${date}`);
      console.log(`🔥 [LMS DEBUG] 服务器当前时间: ${new Date().toISOString()}`);

      // 🔥 [修复] 使用OR查询：content.taskDate匹配 或 createdAt时间范围匹配
      const records = await this.prisma.task_records.findMany({
        where: {
          schoolId,
          studentId,
          OR: [
            // 优先：使用content.taskDate精确匹配（新发布的任务）
            {
              content: {
                path: ['taskDate'],
                equals: targetDateStr
              }
            },
            // 备选：createdAt时间范围查询（兼容旧数据）
            {
              createdAt: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          ]
        },
        select: {
          id: true,
          studentId: true,
          type: true,
          title: true,
          content: true,
          status: true,
          expAwarded: true,
          createdAt: true,
          updatedAt: true,
          lessonPlanId: true,
          task_category: true
        },
        orderBy: [
          { type: 'asc' }, // QC -> TASK -> SPECIAL
          { createdAt: 'asc' }
        ]
      });

      console.log(`🔥 [LMS DEBUG] 查询结果: 找到 ${records.length} 条记录`);

      if (records.length > 0) {
        console.log(`🔥 [LMS DEBUG] ===== 记录详情 =====`);
        records.forEach((record, index) => {
          const taskDate = record.content && typeof record.content === 'object' ? (record.content as any).taskDate : '无';
          console.log(`🔥 [LMS DEBUG] 记录 ${index + 1}:`);
          console.log(`   - ID: ${record.id}`);
          console.log(`   - Title: ${record.title}`);
          console.log(`   - Type: ${record.type}`);
          console.log(`   - Status: ${record.status}`);
          console.log(`   - Created: ${record.createdAt.toISOString()}`);
          console.log(`   - Created Local: ${record.createdAt.toLocaleString()}`);
          console.log(`   - TaskDate: ${taskDate}`);
          console.log(`   - Exp: ${record.expAwarded}`);
          console.log(`   - LessonPlanId: ${record.lessonPlanId || '无'}`);
        });
      } else {
        console.log(`🔥 [LMS DEBUG] ⚠️ 没有找到任何记录！`);
        // 🔥 调试：查询该学生的所有记录，忽略时间限制
        const allStudentRecords = await this.prisma.task_records.findMany({
          where: {
            schoolId,
            studentId
          },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            createdAt: true,
            expAwarded: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        });

        console.log(`🔥 [LMS DEBUG] 学生 ${studentId} 的最近10条记录（忽略时间限制）:`);
        if (allStudentRecords.length > 0) {
          allStudentRecords.forEach((record, index) => {
            console.log(`   ${index + 1}. [${record.type}] ${record.title} - ${record.createdAt.toISOString()}`);
          });
        } else {
          console.log(`🔥 [LMS DEBUG] 学生 ${studentId} 完全没有任何记录！`);
        }
      }

      return records;
    } catch (error) {
      console.error('获取每日任务记录失败:', error);
      throw new Error('获取任务记录失败');
    }
  }
```

## 4. 后端路由转发 (LMS Routes) - 检查参数传递
# 路径：server/src/routes/lms.routes.ts
```typescript
import { Router } from 'express';
import { LMSService } from '../services/lms.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { validate } from 'class-validator';
import { LMSController } from '../controllers/lms.controller';

const router = Router();
const prisma = new PrismaClient();
const lmsService = new LMSService(prisma);
const lmsController = new LMSController(lmsService);

// 获取任务库
router.get('/task-library', authenticateToken, lmsController.getTaskLibrary.bind(lmsController));

// 发布教学计划
router.post('/publish', authenticateToken, lmsController.publishPlan.bind(lmsController));

// 获取每日任务记录
router.get('/daily-records/:studentId/:date', authenticateToken, lmsController.getDailyRecords.bind(lmsController));

// 获取学生进度统计
router.get('/progress/:studentId', authenticateToken, lmsController.getStudentProgress.bind(lmsController));

// 增加任务尝试次数
router.post('/mark-attempt/:recordId', authenticateToken, lmsController.markAttempt.bind(lmsController));

// 完成任务
router.post('/complete-task/:recordId', authenticateToken, lmsController.completeTask.bind(lmsController));

// 获取教学计划列表
router.get('/lesson-plans', authenticateToken, lmsController.getLessonPlans.bind(lmsController));

export default router;
```

## 5. 前端发布参数 (PrepView POST) - 检查前端发了什么
# 路径：client/src/pages/PrepView.tsx 中的 handlePublish 函数
```typescript
  const handlePublish = async () => {
    if (!courseInfo.title.trim()) {
      toast({
        title: "请填写标题",
        description: "课程标题不能为空",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!isPublishingAllowed()) {
      toast({
        title: "无法发布",
        description: "请在“我的学生”视图模式下发布任务",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const teacher = getTeacher();
      const school = getSchool();
      
      if (!teacher || !school) {
        toast({
          title: "信息不完整",
          description: "无法获取用户或学校信息",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setIsPublishing(true);
      console.log('🚀 [PrepView] 开始发布教学计划:', courseInfo.title);

      const publishData = {
        schoolId: school.id,
        teacherId: teacher.id,
        title: courseInfo.title,
        content: courseInfo.content,
        date: courseInfo.date,
        tasks: courseInfo.tasks
      };

      console.log('📤 [PrepView] 发布数据:', JSON.stringify(publishData, null, 2));

      const response = await fetch('/api/lms/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(publishData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ [PrepView] 发布成功:', result);
        toast({
          title: "发布成功",
          description: `已向 ${result.taskStats.totalStudents} 名学生发布 ${result.taskStats.tasksCreated} 个任务`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // 清空表单
        setCourseInfo({
          title: '',
          date: new Date().toISOString().split('T')[0],
          tasks: [],
          content: {}
        });

        // 刷新任务库
        fetchTaskLibrary();
        
      } else {
        console.error('❌ [PrepView] 发布失败:', result);
        toast({
          title: "发布失败",
          description: result.message || "发布过程中出现错误",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('❌ [PrepView] 发布过程中发生错误:', error);
      toast({
        title: "发布失败",
        description: "网络连接错误，请稍后重试",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPublishing(false);
    }
  };
```


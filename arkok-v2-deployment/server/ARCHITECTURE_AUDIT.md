# ArkOK V2 核心逻辑审计文档 (Created: 2025-12-18 11:20:09)

## 1. 数据库定义 (The Source of Truth)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Users {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  username         String   @unique
  email            String   @unique
  password         String
  role             Role     @default(USER)
  isActive         Boolean  @default(true)
  lastLoginAt       DateTime?
  
  // Relations
  students         Student[]
  teachers         Teacher[]
}

model Teachers {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  username         String   @unique
  name             String
  password         String
  role             Role     @default(TEACHER)
  isActive         Boolean  @default(true)
  schoolId         String
  
  // Relations
  students         Student[]
  taskRecords      TaskRecord[]
  lessonPlans      LessonPlan[]
  
  @@map("teachers")
}

model Schools {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  name             String
  isActive         Boolean  @default(true)
  
  // Relations
  teachers         Teacher[]
  students         Student[]
  taskRecords      TaskRecord[]
  lessonPlans      LessonPlan[]
}

model Students {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  studentId        String   @unique
  name             String
  avatar           String
  className        String?
  level            Int?
  exp              Int      @default(0)
  totalExp         Int      @default(0)
  isActive         Boolean  @default(true)
  schoolId         String
  teacherId        String
  
  // Relations
  teacher          Teacher   @relation(fields: [teacherId], references: [id])
  school           School    @relation(fields: [schoolId], references: [id])
  taskRecords      TaskRecord[]
  lessonPlanRecord LessonPlanRecord[]
  
  @@map("students")
}

model LessonPlans {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  title            String
  date             DateTime
  teacherId        String
  schoolId         String
  
  // Relations
  teacher          Teacher   @relation(fields: [teacherId], references: [id])
  school           School    @relation(fields: [schoolId], references: [id])
  taskRecords      TaskRecord[]
  lessonPlanRecord LessonPlanRecord[]
  
  @@map("lesson_plans")
}

model LessonPlanRecord {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  studentId        String
  lessonPlanId     String
  
  // Relations
  student          Student   @relation(fields: [studentId], references: [id])
  lessonPlan       LessonPlan @relation(fields: [lessonPlanId], references: [id])
  
  @@map("lesson_plan_records")
  @@unique([studentId, lessonPlanId])
}

model Tasks {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  name             String
  category         String
  educationalDomain String
  educationalSubcategory String
  description      String?
  defaultExp       Int
  type             String   // 'QC', 'TASK', 'SPECIAL'
  difficulty       Int?
  isActive         Boolean  @default(true)
  
  // Relations
  taskRecords      TaskRecord[]
  tags             TaskTag[]
  
  @@map("tasks")
}

model TaskTag {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  taskId           String
  tag              String
  
  // Relations
  task             Tasks     @relation(fields: [taskId], references: [id])
  
  @@map("task_tags")
  @@unique([taskId, tag])
}

model TaskRecords {
  id               String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  studentId        String
  lessonPlanId     String?
  taskId           String
  name             String
  type             String   // 'QC', 'TASK', 'SPECIAL'
  status           String   // 'PENDING', 'PASSED', 'COMPLETED'
  exp              Int
  attempts         Int      @default(0)
  date             DateTime @default(now())
  schoolId         String
  
  // Relations
  student          Student   @relation(fields: [studentId], references: [id])
  lessonPlan       LessonPlan? @relation(fields: [lessonPlanId], references: [id])
  task             Tasks     @relation(fields: [taskId], references: [id])
  
  @@map("task_records")
}

enum Role {
  USER
  TEACHER
  ADMIN
}
```

## 2. 后端核心服务 (Backend Services)
### Student Service
```typescript
import { PrismaClient } from '@prisma/client';

export class StudentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getStudents(params: {
    scope?: 'MY_STUDENTS' | 'ALL_SCHOOL';
    teacherId?: string;
    userRole?: string;
    schoolId?: string;
    className?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      scope = 'MY_STUDENTS',
      teacherId,
      userRole,
      schoolId,
      className,
      page = 1,
      limit = 50
    } = params;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      isActive: true
    };

    // 根据scope设置查询条件
    if (scope === 'MY_STUDENTS' && teacherId) {
      where.teacherId = teacherId;
    } else if (scope === 'ALL_SCHOOL' && schoolId) {
      where.schoolId = schoolId;
    }

    // 班级过滤
    if (className && className !== 'ALL') {
      where.className = className;
    }

    // 执行查询
    const [students, total] = await Promise.all([
      this.prisma.students.findMany({
        where,
        include: {
          teacher: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
        },
        skip,
        take: limit,
        orderBy: {
          name: 'asc'
        }
      }),
      this.prisma.students.count({ where })
    ]);

    // 获取班级列表
    const classes = await this.prisma.students.findMany({
      where,
      select: {
        className: true
      },
      distinct: ['className'],
      orderBy: {
        className: 'asc'
      }
    });

    return {
      students,
      total,
      classes: classes.map(c => c.className).filter(Boolean),
      page,
      limit
    };
  }

  async getStudentById(id: string) {
    return await this.prisma.students.findUnique({
      where: { id, isActive: true },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });
  }

  async createStudent(data: {
    name: string;
    avatar?: string;
    className?: string;
    level?: number;
    exp?: number;
    schoolId: string;
    teacherId: string;
  }) {
    const studentId = await this.generateStudentId();
    
    return await this.prisma.students.create({
      data: {
        ...data,
        id: studentId
      }
    });
  }

  private async generateStudentId(): Promise<string> {
    // 生成唯一的学号
    let studentId: string;
    let exists = true;
    
    while (exists) {
      studentId = Math.floor(Math.random() * 900000000 + 100000000).toString();
      const existing = await this.prisma.students.findUnique({
        where: { studentId }
      });
      exists = !!existing;
    }
    
    return studentId;
  }
}
```

### LMS Service
```typescript
import { PrismaClient } from '@prisma/client';
import { SocketHandlers } from '../utils/socketHandlers';

export class LMSService {
  private prisma: PrismaClient;
  private socketHandlers: SocketHandlers;

  constructor() {
    this.prisma = new PrismaClient();
    this.socketHandlers = new SocketHandlers(this.prisma);
  }

  /**
   * 获取任务库
   */
  async getTaskLibrary(): Promise<{ success: boolean; data: any[]; message: string }> {
    console.log('🔍 [LMS_SERVICE] 开始获取任务库数据...');
    
    try {
      // --- 探针代码开始 ---
      console.log("🔬 [LMS DEBUG] Probing database connection...");
      const schoolCount = await this.prisma.schools.count();
      console.log();
      // 探针：检查taskLibrary表是否存在
      const tableExists = await this.prisma.tasks.count();
      console.log();
      // --- 探针代码结束 ---

      // 获取所有活跃任务
      const tasks = await this.prisma.tasks.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          category: true,
          educationalDomain: true,
          educationalSubcategory: true,
          description: true,
          defaultExp: true,
          type: true,
          difficulty: true,
          tags: {
            select: {
              tag: true
            }
          }
        },
        orderBy: [
          { category: 'asc' },
          { educationalDomain: 'asc' },
          { name: 'asc' }
        ]
      });

      console.log();
      return {
        success: true,
        data: tasks,
        message: 'Task library retrieved successfully'
      };
    } catch (error) {
      console.error('❌ [LMS_SERVICE] 获取任务库失败:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve task library'
      };
    }
  }

  /**
   * 发布教学计划
   */
  async publishPlan(
    teacherId: string,
    schoolId: string,
    courseInfo: {
      chinese?: { unit: string; lesson?: string; title: string };
      math?: { unit: string; lesson?: string; title: string };
      english?: { unit: string; title: string };
    },
    qcTasks: Array<{
      taskName: string;
      category: string;
      difficulty: string;
      defaultExp: number;
    }>,
    normalTasks: Array<{
      taskName: string;
      category: string;
      difficulty: string;
      defaultExp: number;
    }>,
    specialTasks: Array<{
      taskName: string;
      category: string;
      difficulty: string;
      defaultExp: number;
      targetStudents: string[];
    }>
  ): Promise<{ success: boolean; lessonPlanId: string; taskStats: any; message: string }> {
    try {
      console.log('🚀 [LMS_SERVICE] 开始发布教学计划...');
      console.log();
      console.log();
      console.log(, courseInfo);
      console.log();
      console.log();
      console.log();

      // 🔧 使用let以便修改schoolId
      let dynamicSchoolId = schoolId;

      // 🔧 新增：验证schoolId的有效性
      if (!dynamicSchoolId || dynamicSchoolId === 'default-school' || dynamicSchoolId === 'default') {
        console.error();
        
        const teacherInfo = await this.prisma.teachers.findUnique({
          where: { id: teacherId },
          select: { schoolId: true, name: true, username: true }
        });
        
        if (teacherInfo) {
          console.log();
          dynamicSchoolId = teacherInfo.schoolId;
        }
      }

      // 🔒 安全检查：验证老师存在且有绑定学生
      const teacher = await this.prisma.teachers.findUnique({
        where: { id: teacherId, isActive: true }
      });

      if (!teacher) {
        throw new Error('指定的教师不存在或已被禁用');
      }

      // 获取该老师名下的学生
      const students = await this.prisma.students.findMany({
        where: {
          teacherId: teacherId,
          schoolId: dynamicSchoolId, // 使用修正后的schoolId
          isActive: true
        },
        select: {
          id: true,
          name: true,
          className: true,
          teacherId: true
        }
      });

      if (students.length === 0) {
        throw new Error();
      }

      console.log();

      // 创建教学计划
      const lessonPlan = await this.prisma.lessonPlans.create({
        data: {
          title: ,
          date: new Date(),
          teacherId,
          schoolId: dynamicSchoolId
        }
      });

      console.log();

      // 创建任务记录
      const taskRecords = [];
      const allTasks = [
        ...qcTasks.map(task => ({ ...task, type: 'QC' })),
        ...normalTasks.map(task => ({ ...task, type: 'TASK' })),
        ...specialTasks.map(task => ({ ...task, type: 'SPECIAL' }))
      ];

      for (const task of allTasks) {
        if (task.type === 'SPECIAL' && task.targetStudents?.length > 0) {
          // 特殊任务只针对指定学生
          for (const targetStudentId of task.targetStudents) {
            if (students.some(s => s.id === targetStudentId)) {
              const taskRecord = await this.prisma.taskRecords.create({
                data: {
                  studentId: targetStudentId,
                  lessonPlanId: lessonPlan.id,
                  name: task.taskName,
                  type: 'SPECIAL',
                  exp: task.defaultExp,
                  status: 'PENDING',
                  schoolId: dynamicSchoolId
                }
              });
              taskRecords.push(taskRecord);
            }
          }
        } else {
          // QC和常规任务给所有学生
          for (const student of students) {
            const taskRecord = await this.prisma.taskRecords.create({
              data: {
                studentId: student.id,
                lessonPlanId: lessonPlan.id,
                name: task.taskName,
                type: task.type as 'QC' | 'TASK',
                exp: task.defaultExp,
                status: 'PENDING',
                schoolId: dynamicSchoolId
              }
            });
            taskRecords.push(taskRecord);
          }
        }
      }

      // 统计结果
      const taskStats = {
        totalStudents: students.length,
        qcTasks: qcTasks.length,
        normalTasks: normalTasks.length,
        specialTasks: specialTasks.length,
        totalTaskRecords: taskRecords.length
      };

      console.log();

      // 实时通知相关学生
      await this.socketHandlers.notifyStudentsOfPublishedPlan(lessonPlan.id, students);

      return {
        success: true,
        lessonPlanId: lessonPlan.id,
        taskStats,
        message: '教学计划发布成功'
      };
    } catch (error) {
      console.error('❌ [LMS_SERVICE] 发布教学计划失败:', error);
      return {
        success: false,
        lessonPlanId: '',
        taskStats: null,
        message: error instanceof Error ? error.message : '发布教学计划失败'
      };
    }
  }

  /**
   * 获取最新教学计划
   */
  async getLatestLessonPlan(teacherId: string) {
    try {
      const latestPlan = await this.prisma.lessonPlans.findFirst({
        where: {
          teacherId,
          date: {
            lte: new Date()
          }
        },
        orderBy: {
          date: 'desc'
        },
        include: {
          taskRecords: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      if (latestPlan) {
        return {
          success: true,
          hasData: true,
          data: {
            ...latestPlan,
            taskRecords: latestPlan.taskRecords || []
          }
        };
      }

      return {
        success: true,
        hasData: false,
        data: {
          chinese: { unit: "1", lesson: "1", title: "默认课程" },
          math: { unit: "1", lesson: "1", title: "默认课程" },
          english: { unit: "1", title: "Default Course" },
          source: 'default'
        }
      };
    } catch (error) {
      console.error('❌ [LMS_SERVICE] 获取最新教学计划失败:', error);
      return {
        success: false,
        hasData: false,
        data: null
      };
    }
  }

  /**
   * 获取学生任务记录
   */
  async getStudentDailyRecords(studentId: string, date: string) {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      targetDate.setHours(23, 59, 59, 999);

      const records = await this.prisma.taskRecords.findMany({
        where: {
          studentId,
          date: {
            gte: targetDate,
            lte: targetDate
          }
        },
        include: {
          task: {
            select: {
              name: true,
              category: true,
              defaultExp: true,
              type: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return {
        success: true,
        data: records,
        message: 'Daily records retrieved successfully'
      };
    } catch (error) {
      console.error('❌ [LMS_SERVICE] 获取学生任务记录失败:', error);
      return {
        success: false,
        data: [],
        message: 'Failed to retrieve daily records'
      };
    }
  }

  /**
   * 更新任务记录状态
   */
  async updateTaskRecord(taskRecordId: string, status: 'PENDING' | 'PASSED' | 'COMPLETED', exp?: number) {
    try {
      const updateData: any = {
        status
      };

      if (exp !== undefined) {
        updateData.exp = exp;
        updateData.attempts = { increment: 1 };
      }

      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }

      const taskRecord = await this.prisma.taskRecords.update({
        where: { id: taskRecordId },
        data: updateData
      });

      // 获取学生信息用于Socket.IO通知
      const student = await this.prisma.students.findUnique({
        where: { id: taskRecord.studentId }
      });

      // 实时通知学生任务状态更新
      if (student && student.teacherId) {
        this.socketHandlers.notifyTaskStatusUpdate(
          student.teacherId,
          studentId,
          taskRecordId,
          status,
          exp
        );
      }

      return {
        success: true,
        data: taskRecord,
        message: 'Task record updated successfully'
      };
    } catch (error) {
      console.error('❌ [LMS_SERVICE] 更新任务记录失败:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to update task record'
      };
    }
  }

  /**
   * 获取任务统计
   */
  async getTaskStats(teacherId: string, schoolId: string, dateRange?: { start?: string; end?: string }) {
    try {
      let dateFilter = {};
      if (dateRange?.start || dateRange?.end) {
        dateFilter = {};
        if (dateRange.start) {
          dateFilter.gte = new Date(dateRange.start);
        }
        if (dateRange.end) {
          dateFilter.lte = new Date(dateRange.end);
        }
      }

      const where: any = {
        teacherId,
        schoolId,
        ...dateFilter
      };

      const [
        totalRecords,
        pendingRecords,
        passedRecords,
        completedRecords
      ] = await Promise.all([
        this.prisma.taskRecords.count({ where }),
        this.prisma.taskRecords.count({ where: { ...where, status: 'PENDING' } }),
        this.prisma.taskRecords.count({ where: { ...where, status: 'PASSED' } }),
        this.prisma.taskRecords.count({ where: { ...where, status: 'COMPLETED' } })
      ]);

      return {
        success: true,
        data: {
          total: totalRecords,
          pending: pendingRecords,
          passed: passedRecords,
          completed: completedRecords,
          completionRate: totalRecords > 0 ? (completedRecords / totalRecords * 100).toFixed(1) : '0'
        },
        message: 'Task statistics retrieved successfully'
      };
    } catch (error) {
      console.error('❌ [LMS_SERVICE] 获取任务统计失败:', error);
      return {
        success: false,
        data: null,
        message: 'Failed to retrieve task statistics'
      };
    }
  }
}
```

## 3. 后端路由 (Backend Routes)
### Student Routes
```typescript
import { Router } from 'express';
import { StudentService } from '../services/student.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { typeSafeAuthMiddleware } from '../middleware/type-safe-auth.middleware';

const router = Router();
const studentService = new StudentService();

// Apply authentication middleware
router.use(authMiddleware);

/**
 * @route   GET /api/students
 * @desc    Get students based on scope and filters
 * @access  Private
 */
router.get('/', typeSafeAuthMiddleware, async (req, res) => {
  try {
    const {
      scope = 'MY_STUDENTS',
      teacherId,
      userRole,
      schoolId,
      className,
      page = 1,
      limit = 50
    } = req.query;

    const result = await studentService.getStudents({
      scope: scope as 'MY_STUDENTS' | 'ALL_SCHOOL',
      teacherId: teacherId as string,
      userRole: userRole as string,
      schoolId: schoolId as string,
      className: className as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: result.students,
      message: 'Students retrieved successfully',
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit)
      },
      classes: result.classes
    });
  } catch (error) {
    console.error('Student fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve students'
    });
  }
});

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Private
 */
router.get('/:id', typeSafeAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await studentService.getStudentById(id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student,
      message: 'Student retrieved successfully'
    });
  } catch (error) {
    console.error('Student fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve student'
    });
  }
});

/**
 * @route   POST /api/students
 * @desc    Create new student
 * @access  Private (TEACHER, ADMIN)
 */
router.post('/', typeSafeAuthMiddleware, async (req, res) => {
  try {
    const { name, avatar, className, level, exp, schoolId, teacherId } = req.body;

    if (!name || !schoolId || !teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Name, schoolId, and teacherId are required'
      });
    }

    const student = await studentService.createStudent({
      name,
      avatar,
      className,
      level,
      exp,
      schoolId,
      teacherId
    });

    res.status(201).json({
      success: true,
      data: student,
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('Student creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student'
    });
  }
});

export { router as studentRoutes };
```

### LMS Routes
```typescript
import { Router } from 'express';
import { LMSService } from '../services/lms.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { typeSafeAuthMiddleware } from '../middleware/type-safe-auth.middleware';

const router = Router();
const lmsService = new LMSService();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/lms/task-library
 * @desc    Get task library with all tasks
 * @access  Private (TEACHER, ADMIN)
 */
router.get('/task-library', typeSafeAuthMiddleware, async (req, res) => {
  try {
    const result = await lmsService.getTaskLibrary();
    
    res.json(result);
  } catch (error) {
    console.error('[LMS_ROUTES] Task library fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task library',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/lms/publish
 * @desc    Publish a lesson plan to students
 * @access  Private (TEACHER, ADMIN)
 */
router.post('/publish', typeSafeAuthMiddleware, async (req, res) => {
  try {
    const {
      courseInfo,
      qcTasks = [],
      normalTasks = [],
      specialTasks = []
    } = req.body;

    // Get teacher info from request
    const teacherId = req.user?.userId;
    const schoolId = req.user?.schoolId;
    const userRole = req.user?.role;

    if (!teacherId || !schoolId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID and School ID are required'
      });
    }

    // 角色检查：只有TEACHER和ADMIN可以发布
    if (!['TEACHER', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can publish lesson plans'
      });
    }

    const result = await lmsService.publishPlan(
      teacherId,
      schoolId,
      courseInfo,
      qcTasks,
      normalTasks,
      specialTasks
    );

    res.json(result);
  } catch (error) {
    console.error('[LMS_ROUTES] Publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish lesson plan',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/lms/latest-lesson-plan
 * @desc    Get latest lesson plan for the teacher
 * @access  Private (TEACHER, ADMIN)
 */
router.get('/latest-lesson-plan', typeSafeAuthMiddleware, async (req, res) => {
  try {
    const teacherId = req.user?.userId;
    
    if (!teacherId) {
      return res.status(400).json({
        success: false,
        message: 'Teacher ID is required'
      });
    }

    const result = await lmsService.getLatestLessonPlan(teacherId);
    
    res.json(result);
  } catch (error) {
    console.error('[LMS_ROUTES] Latest lesson plan fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest lesson plan'
    });
  }
});

/**
 * @route   GET /api/lms/student-daily-records
 * @desc    Get daily task records for a student
 * @access  Private (TEACHER, ADMIN, STUDENT)
 */
router.get('/student-daily-records', typeSafeAuthMiddleware, async (req, res) => {
  try {
    const { studentId, date = new Date().toISOString().split('T')[0] } = req.query;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const result = await lmsService.getStudentDailyRecords(studentId, date);
    
    res.json(result);
  } catch (error) {
    console.error('[LMS_ROUTES] Student daily records fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student daily records'
    });
  }
});

/**
 * @route   PUT /api/lms/task-records/:id
 * @desc    Update task record status
 * @access  Private (TEACHER, ADMIN, STUDENT)
 */
router.put('/task-records/:id', typeSafeAuthMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, exp } = req.body;
    
    const result = await lmsService.updateTaskRecord(id, status, exp);
    
    res.json(result);
  } catch (error) {
    console.error('[LMS_ROUTES] Task record update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task record'
    });
  }
});

export { router as lmsRoutes };
```

## 4. 前端状态管理 (Frontend Context)
### Auth Context
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  username: string;
  name: string;
  role: 'USER' | 'TEACHER' | 'ADMIN';
  schoolId: string;
  avatar?: string;
  exp?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; user: User; token: string; message: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user && !!token;

  // 从localStorage初始化状态
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        const decodedUser = jwtDecode(storedToken);
        setToken(storedToken);
        setUser(decodedUser as User);
      }
    } catch (error) {
      console.error('[AuthContext] 初始化认证状态失败:', error);
      // 清理无效token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // 直接调用后端API
      console.log('🔐 [AUTH] 正在调用登录API');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      
      if (result.success && result.data && result.token) {
        const decodedUser = jwtDecode(result.token);
        
        setToken(result.token);
        setUser(decodedUser);
        
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(decodedUser));
        
        console.log('✅ [AUTH] 登录成功，用户:', decodedUser.name);
        setIsLoading(false);
        
        return {
          success: true,
          user: decodedUser,
          token: result.token,
          message: result.message
        };
      } else {
        console.error('❌ [AUTH] 登录失败:', result.message);
        setIsLoading(false);
        return {
          success: false,
          user: null,
          token: null,
          message: result.message
        };
      }
    } catch (error) {
      console.error('❌ [AUTH] 登录异常:', error);
      setIsLoading(false);
      return {
        success: false,
        user: null,
        token: null,
        message: '登录失败，请检查网络连接'
      };
    }
  };

  const logout = () => {
    console.log('🔓 [AUTH] 用户登出');
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Class Context
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

export type ViewMode = 'MY_STUDENTS' | 'ALL_SCHOOL';

interface ClassContextType {
  currentClass: string;
  viewMode: ViewMode;
  selectedTeacherId: string;
  setCurrentClass: (className: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedTeacherId: (teacherId: string) => void;
  students: any[];
  classes: string[];
  setStudents: (students: any[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentClass, setCurrentClassState] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('MY_STUDENTS');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();

  // 当用户信息变化时，更新ClassContext
  useEffect(() => {
    if (user) {
      console.log('🔧 [CLASS_CONTEXT] 用户信息已更新，同步ClassContext');
      
      // 设置默认选中的老师ID（如果不是管理员）
      if (user.role !== 'ADMIN') {
        setSelectedTeacherId(user.userId);
      }
      
      // 从localStorage恢复班级选择状态
      const savedClass = localStorage.getItem('currentClass');
      if (savedClass) {
        console.log('🔧 [CLASS_CONTEXT] 从localStorage恢复班级选择:', savedClass);
        setCurrentClassState(savedClass);
      }
    } else {
      console.log('🔧 [CLASS_CONTEXT] 用户信息已清空，清空ClassContext');
      setCurrentClassState('');
      setViewMode('MY_STUDENTS');
      setSelectedTeacherId('');
    }
  }, [user]);

  const setCurrentClass = (className: string) => {
    setCurrentClassState(className);
    if (className && className !== 'ALL') {
      localStorage.setItem('currentClass', className);
    } else {
      localStorage.removeItem('currentClass');
    }
    console.log();
  };

  const setViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
    console.log();
  };

  const setSelectedTeacherId = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    console.log();
  };

  const value: ClassContextType = {
    currentClass,
    viewMode,
    selectedTeacherId,
    setCurrentClass,
    setViewMode,
    setSelectedTeacherId,
    students,
    classes,
    setStudents,
    loading,
    setLoading
  };

  return (
    <ClassContext.Provider value={value}>
      {children}
    </ClassContext.Provider>
  );
};

export const useClass = () => {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error('useClass must be used within a ClassProvider');
  }
  return context;
};
```

## 5. 前端核心页面 (Frontend Pages)
### Home Page
```typescript
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import apiService from '../services/api.service';

// --- 类型定义 ---
interface StudentProgressResponse {
  chinese?: { unit: string; lesson?: string; title: string };
  math?: { unit: string; lesson?: string; title: string };
  english?: { unit: string; title: string };
  source: 'lesson_plan' | 'default';
  updatedAt: string;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  exp?: number;
  level?: number;
  className?: string;
  teacher?: {
    id: string;
    name: string;
  };
}

interface ViewModeConfig {
  MY_STUDENTS: string;
  ALL_SCHOOL: string;
  title: string;
  description: string;
  icon: string;
}

// --- 组件实现 ---
const Home: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();
  const { currentClass, viewMode, selectedTeacherId, students, setStudents, setViewMode } = useClass();
  
  // UI状态
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // 视图模式配置
  const viewModeConfig: ViewModeConfig[] = [
    {
      MY_STUDENTS: 'MY_STUDENTS',
      title: '我的学生',
      description: '只显示本班学生',
      icon: '👥'
    },
    {
      ALL_SCHOOL: 'ALL_SCHOOL',
      title: '全校',
      description: '显示所有班级学生',
      icon: '🏫'
    }
  ];

  // --- 1. 数据获取 ---
  const fetchStudents = async () => {
    if (!token) return;

    try {
      console.log();
      
      // 🔒 安全检查：强制只查询当前教师的学生，确保数据安全
      const params = new URLSearchParams();
      params.append('scope', viewMode); // 动态使用视图模式
      params.append('userRole', user?.role || 'TEACHER');
      params.append('schoolId', user?.schoolId || '');

      // 如果是教师视角，必须提供teacherId
      if (viewMode === 'MY_STUDENTS') {
        if (selectedTeacherId) {
          params.append('teacherId', selectedTeacherId);
        } else {
          console.error('TEACHER_VIEW_ERROR: MY_STUDENTS 模式缺少必需的 teacherId 参数');
          return;
        }
      }

      // 如果选择了特定班级，也加上
      if (currentClass !== 'ALL' && currentClass !== '') {
        params.append('className', currentClass);
      }

      console.log();
      console.log();

      const url = ;
      
      console.log();
      
      const response = await apiService.get(url);
      
      console.log();
      console.log();
      
      // 🔧 数据提取：直接访问嵌套的students数组
      const studentsData = response.data?.students || [];
      console.log();
      console.log();
      console.log();
      console.log();
      console.log();

      console.log();
      console.log();
      
      setStudents(studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error(, error);
      setStudents([]);
    } finally {
      setIsInitializing(false);
    }
  };

  // --- 2. 过滤逻辑 ---
  const filteredStudents = useMemo(() => {
    if (!students || students.length === 0) return [];
    
    return students.filter(student => {
      // 基础过滤：只显示活跃学生
      if (!student.isActive !== undefined && !student.isActive) {
        return false;
      }
      
      // 根据视图模式过滤
      if (viewMode === 'MY_STUDENTS') {
        // 教师视角：只显示本班学生
        return student.teacherId === selectedTeacherId;
      } else {
        // 管理员视角：显示所有学生（已通过后端scope实现）
        return true;
      }
    });
  }, [students, viewMode, selectedTeacherId, user]);

  const currentViewConfig = viewModeConfig.find(config => config.MY_STUDENTS === viewMode);

  // --- 3. 副端状态管理 ---
  useEffect(() => {
    fetchStudents();
  }, [token, currentClass, viewMode, selectedTeacherId]); // 依赖项：重新获取数据

  // --- 4. UI 渲染 ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-medium mb-4">请登录后访问</div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl font-medium mb-4">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">课堂英雄 v2.0</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-8 h-8 bg-gray-200 rounded-full"></span>
                <span>{user?.name}</span>
              </div>
              <button
                onClick={() => setShowActionSheet(!showActionSheet)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7m-7 6h7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">班级管理</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">当前选择: </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg">
                {currentViewConfig?.title}
              </span>
              <span className="text-sm text-gray-500">（{filteredStudents.length} 位学生）</span>
            </div>
          </div>

          {/* 学生列表 */}
          <div className="space-y-3">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无学生数据
              </div>
            ) : (
              filteredStudents.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <img
                    src={student.avatar || '/api/placeholder/avatar.jpg'}
                    alt={student.name}
                    className="w-12 h-12 rounded-full bg-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-sm text-gray-600">
                      {student.className || '未分班'} · {student.level ?  : ''}
                    </div>
                    {student.teacher && (
                      <div className="text-xs text-gray-500">
                        教师: {student.teacher.name}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] pt-2 px-3 flex justify-around items-center z-[9999] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16">
        <a href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7-7-7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m0 0h7v7h7v7h-7z" />
          </svg>
          <span>班级</span>
        </a>
        
        <a href="/prep" className="flex flex-col items-center justify-center text-blue-600">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0V6m0 0l6-6m-6 0h6m-6 0v6" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2l-4-4m0 0h14" />
          </svg>
          <span>备课</span>
        </a>
        
        <a href="/qc" className="flex flex-col items-center justify-center text-blue-600">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2m0 0l4 4m-6 0l6 0m-6 0v6" />
          </svg>
          <span>过关</span>
        </a>
        
        <a href="/profile" className="flex flex-col items-center justify-center text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 00-8 0H4a4 4 0 00-8 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m1 11h6" />
          </svg>
          <span>我的</span>
        </a>
      </nav>

      {/* 视图选择弹窗 */}
      {showActionSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-md bg-white rounded-t-[24px] shadow-xl">
            <div className="flex justify-between items-center p-5 bg-white rounded-t-[24px]">
              <h3 className="text-lg font-semibold text-gray-900">切换视图模式</h3>
              <button
                onClick={() => setShowActionSheet(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              {viewModeConfig.map((config) => (
                <button
                  key={config.MY_STUDENTS}
                  onClick={() => {
                    setViewMode(config.MY_STUDENTS);
                    setShowActionSheet(false);
                    if (config.MY_STUDENTS !== 'ALL_SCHOOL') {
                      setCurrentClass('ALL');
                    }
                  }}
                  className={}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl mr-3">{config.icon}</span>
                    <div>
                      <div className="font-medium">{config.title}</div>
                      <div className="text-sm text-gray-500">{config.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                切换视图将重新获取学生数据
              </p>
            </div>
          </div>
        </div>
      )}

      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        currentView={viewMode}
        availableViews={viewModeConfig}
        onViewChange={(newView) => {
          setViewMode(newView);
          if (newView !== 'ALL_SCHOOL') {
            setCurrentClass('ALL');
          }
        }}
      />
    </div>
  );
};

export default Home;
```

### Prep (备课) Page
```typescript
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Layers,
  Sparkles,
  Plus,
  X,
  Trash2,
  UserPlus,
  ListPlus,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import apiService from '../services/api.service';

// --- 1. 类型定义 ---

interface LessonInput {
  unit: string;
  lesson?: string; // 英语可能没有课时
  title: string;
}

interface CourseInfo {
  chinese: LessonInput;
  math: LessonInput;
  english: LessonInput;
}

interface TaskLibraryItem {
  id: string;
  // 🏷️ 运营标签分类（过关页使用）
  category: string; // 9个标准标签：基础作业、语文、数学、英语、阅读、自主性、特色教学、学校、家庭
  // 📚 教育体系分类（备课页使用）
  educationalDomain: string; // '核心教学法' | '综合成长' | '基础作业'
  educationalSubcategory: string; // 具体维度/类别
  name: string;
  description?: string;
  defaultExp: number;
  type: string;
  difficulty?: number;
  isActive: boolean;
}

interface PublishStatus {
  isPublishing: boolean;
  error: string | null;
  success: boolean;
}

// 学科映射配置
const SUBJECT_CATEGORY_MAP: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  english: '英语'
};

// --- 2. 组件实现 ---
const PrepView: React.FC = () => {
  const { user, token } = useAuth();
  const { currentClass, viewMode } = useClass();

  // --- 3. 数据获取 ---
  const [taskLibrary, setTaskLibrary] = useState<TaskLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // 发布状态
  const [publishStatus, setPublishStatus] = useState<PublishStatus>({
    isPublishing: false,
    error: null,
    success: false
  });

  // --- 4. 状态管理 ---
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    chinese: { unit: '1', lesson: '1', title: '默认课程' },
    math: { unit: '1', lesson: '1', title: '默认课程' },
    english: { unit: '1', title: 'Default Course' }
  });

  const [qcItems, setQcItems] = useState<Record<string, string[]>>({
    chinese: ['古诗背诵', '生字听写', '词语解释', '课文背诵'],
    math: ['口算练习', '应用题', '几何图形', '应用题解答'],
    english: ['单词背诵', '句型练习', '听力理解']
  });

  const [selectedQC, setSelectedQC] = useState<Record<string, string[]>>({
    chinese: [],
    math: [],
    english: []
  });

  // 过滤状态
  const [showOnlyMethodology, setShowOnlyMethodology] = useState(false);
  const [showOnlyGrowth, setShowOnlyGrowth] = useState(false);

  // 🆕 最新教学计划响应类型
  interface LatestLessonPlanResponse {
    chinese?: LessonInput;
    math?: LessonInput;
    english?: LessonInput;
    source: 'lesson_plan' | 'default';
    updatedAt: string;
  }

  const [latestLessonPlan, setLatestLessonPlan] = useState<LatestLessonPlanResponse | null>(null);

  // 获取最新教学计划
  const fetchLatestLessonPlan = async () => {
    if (!token) return;
    
    try {
      console.log('🔍 [PREP_VIEW] 开始获取最新教学计划...');
      const response = await apiService.get('/lms/latest-lesson-plan');
      
      if (response.success && response.hasData) {
        const data = response.data;
        console.log('✅ [PREP_VIEW] 获取到课程信息:', data);
        
        // 更新课程信息状态
        setCourseInfo({
          chinese: data.chinese || { unit: '1', lesson: '1', title: '默认课程' },
          math: data.math || { unit: '1', lesson: '1', title: '默认课程' },
          english: data.english || { unit: '1', title: 'Default Course' }
        });
        
        setLatestLessonPlan(data);
        console.log('🎯 [PREP_VIEW] 课程信息已更新为最新教学计划数据');
      } else {
        console.log('📝 [PREP_VIEW] 未找到教学计划，使用默认课程信息');
      }
    } catch (error) {
      console.error('❌ [PREP_VIEW] 获取最新教学计划失败:', error);
    }
  };

  // 获取任务库
  const fetchTaskLibrary = async () => {
    if (!token) {
      console.error('🔍 [PREP_VIEW] 获取任务库失败：未找到认证token');
      return;
    }

    console.log('🔍 [PREP_VIEW] 开始获取任务库...');
    setIsLoading(true);
    setError(null);

    try {
      // 直接调用正式API
      console.log('📡 [PREP_VIEW] 正在调用任务库API: /lms/task-library');
      const response = await apiService.get('/lms/task-library');

      console.log('📊 [PREP_VIEW] API响应:', { success: response.success, dataLength: Array.isArray(response.data) ? response.data.length : 0, message: response.message });

      if (response.success && response.data) {
        const tasks = response.data as TaskLibraryItem[];
        console.log('✅ [PREP_VIEW] 任务库获取成功，任务数量:', tasks.length);
        console.log('📋 [PREP_VIEW] 任务列表预览:', tasks.map(t => ({ name: t.name, category: t.category, exp: t.defaultExp })));

        // 🆕 核心教学法分类 - 基于教学白皮书的9大维度
        const methodologyCategories = [
          '基础学习方法论',
          '数学思维与解题策略',
          '语文学科能力深化',
          '英语应用与输出',
          '阅读深度与分享',
          '自主学习与规划',
          '课堂互动与深度参与',
          '家庭联结与知识迁移',
          '高阶输出与创新',
          '其他教学法'
        ];

        // 🌱 综合成成长分类 - 基于教学白皮书的4大类
        const growthCategories = [
          '自我管理能力',
          '学科拓展活动',
          '社会实践活动',
          '创新探索项目'
        ];

        // 分类统计
        const methodologyCount = tasks.filter(t => t.educationalDomain === '核心教学法').length;
        const growthCount = tasks.filter(t => t.educationalDomain === '综合成长').length;
        const basicCount = tasks.filter(t => t.educationalDomain === '基础作业').length;

        console.log('📊 [PREP_VIEW] 实际任务分类:', [
          ...new Set(tasks.map(t => t.category))
        ]);
        console.log();
        console.log();
        console.log();

        // 更新任务库状态
        setTaskLibrary(tasks);

        // 生成QC项目
        generateQCItemsFromLibrary(tasks);
      } else {
        console.warn('⚠️ [PREP_VIEW] 获取任务库失败，使用默认QC项目:', response.message);
        setError(response.message || '获取任务库失败');
        // 即使API失败，也生成默认QC项目
        generateQCItemsFromLibrary([]);
      }
    } catch (err) {
      console.warn('⚠️ [PREP_VIEW] 获取任务库异常，使用默认QC项目:', err);
      setError('网络错误，获取任务库失败');
      // 即使异常，也生成默认QC项目
      generateQCItemsFromLibrary([]);
    } finally {
      setIsLoading(false);
      console.log('🏁 [PREP_VIEW] 任务库获取流程结束');
    }
  };

  // 从TaskLibrary生成QC项目
  const generateQCItemsFromLibrary = (tasks: TaskLibrary[]) => {
    // 从默认值开始，确保总有基础标签
    const defaultQcItems: Record<string, string[]> = {
      chinese: ['古诗背诵', '生字听写', '词语解释'],
      math: ['口算练习', '应用题', '几何图形'],
      english: ['单词背诵', '句型练习', '听力理解']
    };

    const qcTasks = tasks.filter(task => task.type === 'QC');
    
    // 按学科和任务名筛选任务
    const tasksBySubject = {
      chinese: qcTasks.filter(task => 
        task.category === '语文过关' || task.educationalDomain === '核心教学法' && task.educationalSubcategory?.includes('语')
      ),
      math: qcTasks.filter(task => 
        task.category === '数学过关' || task.educationalDomain === '核心教学法' && task.educationalSubcategory?.includes('数'))
      ),
      english: qcTasks.filter(task => 
        task.category === '英语过关' || task.educationalDomain === '核心教学法' && task.educationalSubcategory?.includes('英'))
      )
    };

    // 合并任务库QC任务和默认QC项目
    const mergedQcItems: Record<string, string[]> = {
      chinese: [...defaultQcItems.chinese, ...new Set(tasksBySubject.chinese.map(t => t.name))],
      math: [...defaultQcItems.math, ...new Set(tasksBySubject.math.map(t => t.name))],
      english: [...defaultQcItems.english, ...new Set(tasksBySubject.english.map(t => t.name))]
    };

    console.log('🎯 [PREP_VIEW] QC项目生成完成 - 默认值+任务库:', mergedQcItems);
    
    setQcItems(mergedQcItems);
    
    // 默认选择前2个
    const defaultSelected: Record<string, string[]> = {};
    Object.keys(mergedQcItems).forEach(subject => {
      defaultSelected[subject] = mergedQcItems[subject].slice(0, 2);
    });
    
    setSelectedQC(defaultSelected);
  };

  // 获取学生列表和班级信息
  const fetchStudents = async () => {
    if (!token) return;

    try {
      // 🔒 备课页安全锁定：始终只显示本班学生，不允许全校视图
      const params = new URLSearchParams();

      // 强制只查询当前教师的学生，确保数据安全
      params.append('scope', 'MY_STUDENTS');
      params.append('teacherId', user?.userId || '');
      params.append('userRole', user?.role || 'TEACHER');

      console.log();

      const response = await apiService.get();
      
      if (response.success && response.data) {
        const studentsData = response.data.students || [];
        setStudents(studentsData);
        
        // 提取班级列表
        const classData = response.data.classes || [];
        setClasses(classData);
        
        if (currentClass && classData.length > 0 && !classData.includes(currentClass)) {
          console.log();
          setCurrentClass(classData[0]);
        }

        console.log();
      }
    } catch (error) {
      console.error('[PREPVIEW] 学生数据获取失败:', error);
      setStudents([]);
    }
  };

  // 发布教学计划
  const handlePublish = async () => {
    // 🔒 安全检查：确保在"我的学生"视图
    if (viewMode !== 'MY_STUDENTS') {
      console.log('🔒 [PREPVIEW_SECURITY] 发布被阻止：当前视图不是"我的学生"视图');
      console.log();
      setPublishStatus({
        isPublishing: false,
        error: '请在"我的学生"视图中发布',
        success: false
      });
      return;
    }

    // 验证必要的数据
    if (!courseInfo || !qcTasks || !normalTasks || !specialTasks) {
      setPublishStatus({
        isPublishing: false,
        error: '请填写完整的课程信息和任务内容',
        success: false
      });
      return;
    }

    if (!selectedStudents || selectedStudents.length === 0) {
      setPublishStatus({
        isPublishing: false,
        error: '请至少选择一个学生',
        success: false
      });
      return;
    }

    setPublishStatus({
      isPublishing: true,
      error: null,
      success: false
    });

    try {
      // 🔥 修复：检查必要数据的存在性
      const hasChineseCourseInfo = courseInfo.chinese && 
        courseInfo.chinese.unit && 
        courseInfo.chinese.title;
      
      const hasMathCourseInfo = courseInfo.math && 
        courseInfo.math.unit && 
        courseInfo.math.title;
      
      const hasEnglishCourseInfo = courseInfo.english && 
        courseInfo.english.unit && 
        courseInfo.english.title;

      // 构建发布数据
      const publishData = {
        courseInfo: {
          chinese: hasChineseCourseInfo ? courseInfo.chinese : { unit: '1', title: '默认语文课程' },
          math: hasMathCourseInfo ? courseInfo.math : { unit: '1', title: '默认数学课程' },
          english: hasEnglishCourseInfo ? courseInfo.english : { unit: '1', title: '默认英语课程' }
        },
        qcTasks: qcTasks.map(task => ({
          taskName: task.taskName,
          category: task.category,
          difficulty: task.difficulty,
          defaultExp: task.defaultExp
        })),
        normalTasks: normalTasks.map(task => ({
          taskName: task.taskName,
          category: task.category,
          difficulty: task.difficulty,
          defaultExp: task.defaultExp
        })),
        specialTasks: specialTasks.map(task => ({
          taskName: task.taskName,
          category: task.category,
          difficulty: task.difficulty,
          defaultExp: task.defaultExp,
          targetStudents: task.targetStudents || []
        }))
      };

      console.log('🚀 [PREPVIEW] 开始发布教学计划...');
      console.log('📊 发布数据检查完成:', {
        courseInfo: {
          chinese: publishData.courseInfo.chinese ? publishData.courseInfo.chinese : '缺失',
          math: publishData.courseInfo.math ? publishData.courseInfo.math : '缺失',
          english: publishData.courseInfo.english ? publishData.courseInfo.english : '缺失'
        },
        qcTasks: publishData.qcTasks.length,
        normalTasks: publishData.normalTasks.length,
        specialTasks: publishData.specialTasks.length,
        selectedStudents: selectedStudents.length
      });

      const response = await apiService.post('/lms/publish', publishData);

      if (response.success) {
        console.log('✅ [PREP_VIEW] 发布成功！');
        console.log('📊 响应数据:', response.data);
        
        // 清空选中状态
        setSelectedStudents([]);
        
        setPublishStatus({
          isPublishing: false,
          error: null,
          success: true
        });
        
        // 刷新学生数据
        await fetchStudents();
      } else {
        setPublishStatus({
          isPublishing: false,
          error: response.message || '发布失败',
          success: false
        });
      }
    } catch (error) {
      console.log('💥 [PREP_VIEW] 发布过程中发生错误:', error);
      setPublishStatus({
        isPublishing: false,
        error: error instanceof Error ? error.message : '发布失败，请重试',
        success: false
      });
    }
  };

  // 课程信息修改
  const handleCourseChange = (sub: keyof CourseInfo, field: keyof LessonInput, val: string) => {
    setCourseInfo(prev => ({
      ...prev,
      [sub]: { ...prev[sub], [field]: val }
    }));
  };

  // QC 切换
  const toggleQC = (sub: string, item: string) => {
    setSelectedQC(prev => {
      const list = prev[sub];
      return {
        ...prev,
        [sub]: list.includes(item) ? 
          list.filter(i => i !== item) : 
          [...list, item]
      };
    });
  };

  // --- 5. 数据筛选 ---
  const visibleTasks = useMemo(() => {
    if (!taskLibrary || taskLibrary.length === 0) return [];
    
    return taskLibrary.filter(task => {
      // 活跃任务
      if (!task.isActive) return false;
      
      // 如果只显示核心教学法，则筛选educationalDomain为"核心教学法"的任务
      if (showOnlyMethodology) {
        return task.educationalDomain === "核心教学法";
      }
      
      // 如果只显示综合成长，则筛选educationalDomain为"综合成长"的任务
      if (showOnlyGrowth) {
        return task.educationalDomain === "综合成长";
      }
      
      return true;
    });
  }, [taskLibrary, showOnlyMethodology, showOnlyGrowth]);

  const tasksByCategory = useMemo(() => {
    const grouped: Record<string, TaskLibraryItem[]> = {};
    
    visibleTasks.forEach(task => {
      const category = task.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(task);
    });

    return grouped;
  }, [visibleTasks]);

  // --- 6. 交互逻辑 ---

  // --- 7. 渲染界面 ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin border-4 border-gray-300 border-t-transparent border-r-transparent" />
        <p className="ml-3 text-gray-600">正在加载任务库数据...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] pb-40 font-sans">
      {/* --- 顶部状态栏 --- */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">今日备课</h1>
            <div className="flex items-center space-x-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                {currentViewConfig?.title}
              </span>
              {publishStatus.isPublishing && (
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin border-2 border-gray-300 border-t-transparent border-r-transparent" />
                  <span className="text-blue-600 text-sm">发布中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- 发布成功/失败提示 --- */}
      {publishStatus.success && (
        <div className="sticky top-20 z-20 mx-4 max-w-md bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
          <CheckCircle2 size={24} className="text-green-700" />
          <div>
            <div className="font-bold text-green-800">发布成功！</div>
            <div className="text-sm text-green-600">教学计划已成功发布给所有学生</div>
          </div>
        </div>
      )}

      {publishStatus.error && (
        <div className="sticky top-20 z-20 mx-4 max-w-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3">
          <AlertCircle size={24} className="text-red-700" />
          <div>
            <div className="font-bold text-red-800">发布失败</div>
            <div className="text-sm text-red-600">{publishStatus.error}</div>
          </div>
        </div>
      )}

      {/* --- 主要内容区域 --- */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* --- 课程信息 --- */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center mb-4">
            <div className="flex items-center space-x-2">
              <img src="https://cdn-icons-png.flaticon.com/256/2874/2874769.png" className="w-6 h-6" alt="课程进度" />
              <h3 className="text-lg font-semibold text-gray-900">课程进度</h3>
            </div>
          </div>

          {/* 语文学科 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-2xl w-8 text-center font-mono">语</span>
              <input
                type="text"
                placeholder="单元"
                value={courseInfo.chinese.unit}
                onChange={(e) => handleCourseChange('chinese', 'unit', e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="课时"
                value={courseInfo.chinese.lesson}
                onChange={(e) => handleCourseChange('chinese', 'lesson', e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="课程标题"
                value={courseInfo.chinese.title}
                onChange={(e) => handleCourseChange('chinese', 'title', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 数学科 */}
            <div className="flex items-center space-x-4">
              <span className="text-2xl w-8 text-center font-mono">数</span>
              <input
                type="text"
                placeholder="章"
                value={courseInfo.math.unit}
                onChange={(e) => handleCourseChange('math', 'unit', e.target.value)}
                className="w-20 px-3 py-2 border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="节"
                value={courseInfo.math.lesson}
                onChange={(e) => handleCourseChange('math', 'lesson', e.target.value)}
                className="w-20 px-3 py-2 border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="课程标题"
                value={courseInfo.math.title}
                onChange={(e) => handleCourseChange('math', 'title', e.target.value)}
                className="flex-1 px-3 py-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 英语学科 */}
            <div className="flex items-center space-x-4">
              <span className="text-2xl w-8 text-center font-mono">英</span>
              <input
                type="text"
                placeholder="Unit"
                value={courseInfo.english.unit}
                onChange={(e) => handleCourseChange('english', 'unit', e.target.value)}
                className="w-20 px-3 py-2 border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="课程标题"
                value={courseInfo.english.title}
                onChange={(e) => handleCourseChange('english', 'title', e.target.value)}
                className="flex-1 px-3 py-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* --- 基础过关 --- */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center space-x-2">
                <img src="https://cdn-icons-png.flaticon.com/256/2874/2874769.png" className="w-6 h-6" alt="基础过关" />
                <h3 className="text-lg font-semibold text-gray-900">基础过关</h3>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* 语文学科 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">语文</h4>
                <div className="flex flex-wrap gap-2">
                  {qcItems.chinese.map((item, index) => (
                    <button
                      key={}
                      onClick={() => toggleQC('chinese', item)}
                      className={}
                    >
                      <Check
                        className={}
                      />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 数学科 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">数学</h4>
                <div className="flex flex-wrap gap-2">
                  {qcItems.math.map((item, index) => (
                    <button
                      key={}
                      onClick={() => toggleQC('math', item)}
                      className={}
                    >
                      <Check
                        className={}
                      />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 英语学科 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-2">英语</h4>
                <div className="flex flex-wrap gap-2">
                  {qcItems.english.map((item, index) => (
                    <button
                      key={}
                      onClick={() => toggleQC('english', item)}
                      className={}
                    >
                      <Check
                        className={}
                      />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 选择按钮和统计 */}
            <div className="flex justify-between items-center mt-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">任务 0</span>
                <span className="text-sm text-gray-600">QC {qcItems.chinese.length + qcItems.math.length + qcItems.english.length}</span>
              </div>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                onClick={() => handlePublish()}
                disabled={publishStatus.isPublishing}
              >
                {publishStatus.isPublishing ? '发布中...' : '确认发布'}
              </button>
            </div>
          </section>

          {/* --- 过程任务 --- */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center space-x-2">
                <img src="https://cdn-icons-png.flaticon.com/256/2874/2874769.png" className="w-6 h-6" alt="过程任务" />
                <h3 className="text-lg font-semibold text-gray-900">过程任务</h3>
              </div>
            </div>

            <div className="text-gray-600 text-center py-20">
              暂无过程任务，请在基础任务或特殊任务中选择
            </div>
          </section>

          {/* --- 特殊任务 --- */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center space-x-2">
                <img src="https://cdn-icons-png.flaticon.com/256/2874/2874769.png" className="w-6 h-6" alt="个性化加餐" />
                <h3 className="text-lg font-semibold text-gray-900">个性化加餐</h3>
              </div>
            </div>

            <div className="text-gray-600 text-center py-20">
              暂无个性化任务，请点击"添加特定学生任务"
            </div>
          </section>
        </div>
      </div>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] pt-2 px-3 flex justify-around items-center z-[9999] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16">
        <a href="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7-7-7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m0 0h7v7h7v7h-7z" />
          </svg>
          <span>班级</span>
        </a>
        
        <a href="/prep" className="flex flex-col items-center justify-center text-blue-600">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0l6-6m-6 0v6" />
          </svg>
          <span>备课</span>
        </a>
        
        <a href="/qc" className="flex flex-col items-center justify-center text-blue-600">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoinround" strokeWidth={2} d="M9 12l2 2m0 0l4 4m-6 0v6" />
          </svg>
          <span>过关</span>
        </a>
        
        <a href="/profile" className="flex flex-col items-center justify-center text-gray-600 hover:text-gray-900">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 00-8 0H4a4 4 0 00-8 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m1 11h6" />
          </svg>
          <span>我的</span>
        </a>
      </nav>

      {/* QC任务选择弹窗 */}
      {isQCDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-md bg-white rounded-t-[24px] shadow-xl">
            <div className="flex justify-between items-center p-5 bg-white rounded-t-[24px]">
              <h3 className="text-lg font-semibold text-gray-900">选择QC项目</h3>
              <button
                onClick={() => setIsQCDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-6">
                {/* 语文学科 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700">语文学科</h4>
                  <div className="flex flex-col gap-2">
                    {filteredTasks
                      .filter(task => task.educationalDomain === '核心教学法' && 
                            (task.category.includes('语文') || task.educationalSubcategory?.includes('语')))
                      .map(task => (
                        <button
                          key={task.id}
                          onClick={() => toggleQC('chinese', task.name)}
                          className={}
                        >
                          <Check
                            className={}
                          />
                          <span>{task.name}</span>
                          <span className="text-xs text-gray-500">
                            {task.category} · {task.educationalDomain} · {task.educationalSubcategory}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 数学科 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700">数学科</h4>
                  <div className="flex flex-col gap-2">
                    {filteredTasks
                      .filter(task => task.educationalDomain === '核心教学法' && 
                            (task.category.includes('数学') || task.educationalSubcategory?.includes('数')))
                      .map(task => (
                        <button
                          key={task.id}
                          onClick={() => toggleQC('math', task.name)}
                          className={}
                        >
                          <Check
                            className={}
                          />
                          <span>{task.name}</span>
                          <span className="text-xs text-gray-500">
                            {task.category} · {task.educationalDomain} · {task.educationalSubcategory}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 英语学科 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700">英语学科</h4>
                  <div className="flex flex-col gap-2">
                    {filteredTasks
                      .filter(task => task.educationalDomain === '核心教学法' && 
                            (task.category.includes('英语') || task.educationalSubcategory?.includes('英')))
                      .map(task => (
                        <button
                          key={task.id}
                          onClick={() => toggleQC('english', task.name)}
                          className={}
                        >
                          <Check
                            className={}
                          />
                          <span>{task.name}</span>
                          <span className="text-xs text-gray-500">
                            {task.category} · {task.educationalDomain} · {task.educationalSubcategory}
                          </span>
                        </button>
                      ))}
                    </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setSelectedQC({
                    chinese: [],
                    math: [],
                    english: []
                  });
                  setShowOnlyMethodology(false);
                  setShowOnlyGrowth(false);
                  setShowQCDrawer(false);
                }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 border border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4a1 1 0 11 11h11V3a4 1 0 0 0 0 2.12A10.91 0 0 0 10.32 0 0 0 .5H3a13 1 0 0 0 0 .5.5V21a10.91 0 0 0 .5.91V20a10.91 0 0 0 .5.91V21a10.91 0 0 10.32V12A10.91 0 0 10.32 0 0 12A2.12 0 0 0 12.12 0 0 12.12 0 0 0zM21 0 12h-4.39V10.91a3.91 0 0 10.32.32.12V12a2.12 0 0 12.12.5.5.91H21a10.91 0 0 10.32.91 0 0 12.12.5.5.91 2A10.91 0 0 12.12.5.91 5.5 0zm8 0a10.91 0 0 10.32 0 0 12.12 0 0 12.12.5.91H22a10.91 0 0 10.32 0 0 12.12.5.91 2.12 0 0 12.12.6.67a11 6 0 0 12.12.67a11 0 0 11.34.5.21a11 0 0 1.4.5.21a11.9 0 0 .5.42.5.21a11 0 0 3.35a11.51 0 0 .6a5.42.5.21a11.5 0 0 .96.87a2.12 0 0 12.91a2.12 0 0 2.4L4.25a2.12 0 0 5.78a2.12 0 0 8.11a11.51 0 0 10.33 10.5a6.91a2.12 0 0 12.12.6.67a11.6 0 0 10.68v.08a12 0 0 12.12zm10.5.42h-1a1a10.95A12.12 0 0 0 3.6zm-2.96 1.08v-4.21a10.95 0 0 .0 3.6l6.8 3.48 6.19 12.12v4.21a10.95 0 0 0-1.02A10.95 0 0 4.21zm-6.5.5.36a10.95 0 0 0 .91zm4.52 12.12a10.95 0 0 0 .91h13.58a10.95 0 0 .91h.34a11.51 0 0 1.42A11.51 0 0 2.83a11.51 0 0 4.24a11.51 0 0 5.67a11.51 0 0 6.5A11.51 0 0 7.78l.35 1.7a11.51 0 0 8.91a11.51 0 0 10.33 1.42h13.58A10.95 0 0 0 11.34a2.83 0 0 14.3a11.51 0 0 15.51h22.29 10.33 1.42h.45a11.51 0 0 17.3a11.51 0 0 19.2 1.42h5.45A11.51 0 0 21.02 1.42h9.82 10.33 1.42h9.8 10.33 10.5 1.42h24.91 10.5 1.42h42.94 1.42h42.94 2.83h4.42.94zm-2.83.1.23h-4.42.94zM12.12 0 0 1.42H9.82h6.67L12.12 0 0 2.94L2.83 1.23h-4.42.94zM2.12 0 5.67a6.67 0 10.33 0 10.83h14.5.18A12.12 0 0 10.83h10.33 0 0 12.12.13.58A12.12 0 0 13.58a12.12 0 0 16.5zM12.12 0 0 20.21a11.51 0 0 21.02A12.12 0 0 21.5a12.12 0 0 24.82a10.91 0 0 26.97a10.91 0 0 29.12A12.12 0 0 30.21a10.91 0 0 33.3v13.58A12.12 0 0 36.5a10.91 0 0 39.73a10.91 0 0 42.75A10.91 0 0 46v.5A10.91 0 0 49.7a11.51 0 0 56.14h12.12 0 0 62.5a10.91 0 0 65.63a11.51 0 0 68.1a12.12 0 0 70.61a10.91 0 0 73.65a12.12 0 0 76.68zm0 0a15.19a11.51 0 0 80.12a12.12 0 0 82.37a2.83 0 0 84.37zm2.21.16a12.12 0 0 85.39a11.51 0 0 86.41h13.18A12.12 0 0 87.17a6.67 0 0 88a11.51 0 0 89.37A11.51 0 0 90.64h35.94A11.51 0 0 91.97h14.18A12.12 0 0 93.3h28.43A10.91 0 0 94.7A10.91 0 0 95.3a11.51 0 0 96.62H12.12 0 0 97.75zm0 0a2.21A10.91 0 0 99.16a10.91 0 0 100.52a10.91 0 0 101.87a10.91 0 0 103.21a10.91 0 0 104.56a10.91 0 0 105.9a10.91 0 0 107.25h11.7zm-3.79-2.02L16.03-2.02h-.23zm2.55 2.11v.11h-.23a2.83 2.11H5.88v-11h-5.88a2.83 2.11H9.12v11a2.83 2.11h-2.83zm2.5 1.12v-11h2.22L18.03-2.11a2.83 2.11h3.44v11a2.83 2.11h-.23a2.83 2.11h2.23zm2.5 5.33a2.83 2.11h2.23zm2.5 2.11H16.03V13a2.83 2.11h-13.31a2.83 2.11zm0 14.06a10.91 0 0 12.12h32.41a10.91 0 0 15.06H19.23A10.91 0 0 16.2a10.91 0 0 16.2a10.91 0 0 17.83a10.91 0 0 19.44a10.91 0 0 20.04a10.91 0 0 20.64a10.91 0 0 22.04H9.23A10.91 0 0 22.66h10.34A10.91 0 0 23.3H19.23a10.91 0 0 23.89h12.32a10.91 0 0 23.91h17.73A10.91 0 0 24.97h32.41a10.91 0 0 26.03h37.58a10.91 0 0 27.08h19.52a10.91 0 0 28.14h32.44a10.91 0 0 29.2H32.68a10.91 0 0 30.26h37.97a10.91 0 0 31.37h33.28a10.91 0 0 32.48a11.51 0 0 33.59h37.58a10.91 0 0 34.7h37.58A10.91 0 0 35.81h30.37A10.91 0 0 36.94h25.37A10.91 0 0 38.07h20.37A10.91 0 0 39.19h19.47A10.91 0 0 40.31h18.37A10.91 0 0 0 41.42h19.47H19.47A10.91 0 0 42.54h19.47A10.91 0 0 43.66h19.47A10.91 0 0 44.78h19.47A10.91 0 0 45.9h22.47A10.91 0 0 47.03h22.47A10.91 0 0 48.16h22.47A10.91 0 0 49.29h22.47A10.91 0 0 50.42h22.47A10.91 0 0 51.55h22.47A10.91 0 0 52.68h22.47A10.91 0 0 53.81h25.37A10.91 0 0 54.94h33.28A10.91 0 0 56.07h33.28a10.91 0 0 57.2h33.28A10.91 0 0 58.41h33.28A10.91 0 0 59.54h41.28A10.91 0 0 60.67h41.28a10.91 0 0 61.8h42.21a10.91 0 0 62.93h43.58A10.91 0 0 64.04h43.58a10.91 0 0 65.15h43.58a10.91 0 0 66.26h43.58a10.91 0 0 67.37h43.58a10.91 0 0 68.48a10.91 0 0 69.59h43.58a10.91 0 0 70.7h42.21a10.91 0 0 71.82h42.21A10.91 0 0 72.96h42.21a10.91 0 0 74.1h44.21A10.91 0 0 75.24a10.91 0 0 76.48a10.91 0 0 77.71a10.91 0 0 78.94h44.21a10.91 0 0 80.17a10.91 0 0 81.39h44.21a10.91 0 0 82.6h42.21a10.91 0 0 83.83h42.21a10.91 0 0 85h42.21a10.91 0 0 86.58h42.21a10.91 0 0 87.32h42.21a10.91 0 0 89.05h41.28a10.91 0 0 90.1h41.28a10.91 0 0 91.15h41.28a10.91 0 0 92.21h41.28a10.91 0 0 93.27h41.28a10.91 0 0 94.33h41.28a10.91 0 0 95.39h41.28a10.91 0 0 96.52h41.28a10.91 0 0 97.65h41.28a10.91 0 0 98.78h41.28a10.91 0 0 99.91a10.91 0 0 101.04h41.28a10.91 0 0 101.04h41.28a10.91 0 0 102.07h41.28a10.91 0 0 103.1h41.28a10.91 0 0 104.13h41.28a10.91 0 0 105.19h41.28a10.91 0 0 106.25h41.28a10.91 0 0 107.3h41.28a10.91 0 0 108.36h41.28a10.91 0 0 109.49h41.28a10.91 0 0 110.6h41.28a10.91 0 0 111.72h41.28a10.91 0 0 113.05h41.28a10.91 0 0 114.37h41.28a10.91 0 0 115.69h41.28a10.91 0 0 117.01h41.28a10.91 0 0 118.35h41.28a10.91 0 0 119.69h41.28a10.91 0 0 121.03h41.28a10.91 0 0 122.35h41.28a10.91 0 0 123.67h41.28a10.91 0 0 125.99h41.28a10.91 0 0 127.31h41.28a10.91 0 0 128.63h41.28a10.91 0 0 129.95h41.28a10.91 0 0 131.27h41.28a10.91 0 0 132.59h41.28a10.91 0 0 133.91h41.28a10.91 0 0 135.23h41.28a10.91 0 0 136.55h41.28a10.91 0 0 137.87h41.28a10.91 0 0 139.19h41.28a10.91 0 0 140.51h41.28a10.91 0 0 142.82h41.28a10.91 0 0 144.13h41.28a10.91 0 0 145.44h41.28a10.91 0 0 146.74h41.28a10.91 0 0 148.05h41.28a10.91 0 0 149.36h41.28a10.91 0 0 150.67h41.28a10.91 0 0 151.98h41.28a10.91 0 0 153.59h41.28a10.91 0 0 155.2h41.28a10.91 0 0 156.81h41.28a10.91 0 0 158.03h41.28a10.91 0 0 159.25h41.28a10.91 0 0 160.47h41.28a10.91 0 0 161.69h41.28a10.91 0 0 163.91h41.28a10.91 0 0 165.13h41.28a10.91 0 0 166.35h41.28a10.91 0 0 167.57h41.28a10.91 0 0 168.78h41.28a10.91 0 0 170A10.91 0 0 171.3h41.28a10.91 0 0 172.52h41.28a10.91 0 0 173.74h41.28a10.91 0 0 175.96h41.28a10.91 0 0 177.18h41.28a10.91 0 0 178.4h41.28a10.91 0 0 179.61h41.28a10.91 0 0 181.04h41.28a10.91 0 0 182.47h41.28a10.91 0 0 183.89h41.28a10.91 0 0 185.12h41.28a10.91 0 0 186.35h41.28a10.91 0 0 187.58h41.28a10.91 0 0 188.8h41.28a10.91 0 0 190.02h41.28a10.91 0 0 191.14h41.28a10.91 0 0 192.26h41.28a10.91 0 0 193.38h41.28a10.91 0 0 194.5h41.28a10.91 0 0 195.61h41.28a10.91 0 0 196.77h41.28a10.91 0 0 198.89h41.28a10.91 0 0 200A11.51 0 0 200.11.51.51.51.51.52.51.52.52.52.52.53</span>
</div>
</div>


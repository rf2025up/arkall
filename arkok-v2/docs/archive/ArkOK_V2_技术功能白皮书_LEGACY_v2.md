# ArkOK V2 技术架构与功能说明白皮书

**版本:** v2.0.0
**发布日期:** 2025-12-18
**文档类型:** 技术白皮书
**适用范围:** 开发团队、技术决策者、系统架构师

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [技术架构设计](#2-技术架构设计)
3. [核心功能模块](#3-核心功能模块)
4. [数据模型设计](#4-数据模型设计)
5. [安全架构](#5-安全架构)
6. [前端架构详解](#6-前端架构详解)
7. [后端服务架构](#7-后端服务架构)
8. [实时通信系统](#8-实时通信系统)
9. [部署架构](#9-部署架构)
10. [开发规范与最佳实践](#10-开发规范与最佳实践)
11. [性能优化策略](#11-性能优化策略)
12. [未来技术演进](#12-未来技术演进)

---

## 1. 项目概述

### 1.1 系统简介

ArkOK V2是一款现代化的多租户教育管理SaaS平台，专为K-12教育场景设计。系统采用"统一托管"架构模式，集成了学生学习管理、教师备课工具、积分激励系统、师生关系管理、实时数据同步等核心功能。

### 1.2 核心价值主张

- **教学效率提升**: 通过智能化备课工具和任务管理系统提升教师工作效率
- **个性化学习**: 基于师生绑定的个性化学习路径和任务推荐
- **数据驱动决策**: 实时学习数据收集和分析，支持教学决策
- **多端统一体验**: 统一托管的Web应用，支持各种设备访问

### 1.3 技术特色

- **现代化技术栈**: React 19 + TypeScript + Prisma + Express
- **统一托管架构**: 前后端集成部署，简化运维复杂度
- **实时数据同步**: 基于Socket.io的实时通信机制
- **师生绑定安全**: 基于角色和权限的细粒度访问控制

---

## 2. 技术架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                 ArkOK V2 统一托管架构                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────────────────┐  │
│  │   前端应用       │    │        后端API服务           │  │
│  │  React 19       │◄──►│      Express.js 4.18       │  │
│  │  TypeScript      │    │      TypeScript            │  │
│  │  Vite 7.2       │    │      Prisma 5.7           │  │
│  └─────────────────┘    └─────────────────────────────┘  │
│           │                           │                  │
│           │              ┌─────────────────────────────┐  │
│           └──────────────►│      PostgreSQL 数据库       │  │
│                          │     (Prisma ORM)           │  │
│                          └─────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                    统一端口 3000                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 架构设计原则

#### 单一职责原则 (SRP)
- **前端**: 专注于用户界面和交互逻辑
- **后端**: 专注于业务逻辑和数据处理
- **数据库**: 专注于数据存储和关系管理

#### 依赖倒置原则 (DIP)
```typescript
// 服务层抽象，依赖注入模式
export class LMSService {
  private prisma = new PrismaClient(); // 自包含，无外部依赖

  async publishPlan(request: PublishPlanRequest): Promise<PublishPlanResult> {
    // 业务逻辑实现
  }
}
```

#### 开闭原则 (OCP)
- **插件化任务系统**: 支持动态扩展新的任务类型
- **可配置的评分系统**: 支持自定义积分规则
- **模块化的前端组件**: 支持组件的独立开发和测试

### 2.3 技术栈选型

| 层级 | 技术选型 | 版本 | 选型理由 |
|------|----------|------|----------|
| 前端框架 | React | 19.2.0 | 最新版本，性能优化，生态完善 |
| 构建工具 | Vite | 7.2.4 | 快速构建，热更新支持 |
| 类型系统 | TypeScript | 5.9.3 | 类型安全，开发体验好 |
| 后端框架 | Express.js | 4.18.2 | 成熟稳定，中间件丰富 |
| ORM框架 | Prisma | 5.7.1 | 类型安全，数据库迁移 |
| 数据库 | PostgreSQL | - | 强一致性，JSON支持 |
| 实时通信 | Socket.io | - | 跨浏览器兼容，稳定可靠 |

---

## 3. 核心功能模块

### 3.1 师生关系管理系统

#### 功能概述
实现教师与学生之间的绑定关系管理，支持多视图模式切换和安全的权限控制。

#### 技术实现

**数据模型:**
```typescript
interface Teacher {
  id: string;
  schoolId: string;
  primaryClassName: string; // 班主任班级名
  teacherId: string;
  username: string;
  name: string;
  role: "TEACHER" | "ADMIN";
}

interface Student {
  id: string;
  schoolId: string;
  teacherId: string | null; // 师生绑定字段
  name: string;
  className: string;
  exp: number;
  points: number;
}
```

**权限控制逻辑:**
```typescript
// 基于视图模式的数据访问控制
const getViewModeFilter = (viewMode: string, userId: string) => {
  switch (viewMode) {
    case 'MY_STUDENTS':
      return { teacherId: userId }; // 只查看自己的学生
    case 'ALL_SCHOOL':
      return {}; // 查看全校学生（用于抢人功能）
    case 'SPECIFIC_CLASS':
      return { teacherId: selectedTeacherId }; // 查看特定老师的学生
    default:
      return { teacherId: userId };
  }
};
```

#### 功能特性
- **多视图模式**: 我的学生 | 全校大名单 | 特定班级
- **抢人功能**: 安全的师生关系转移机制
- **实时同步**: 师生关系变更的实时通知
- **权限隔离**: 严格的教师权限边界控制

### 3.2 学习管理系统 (LMS)

#### 功能概述
提供完整的教学计划管理、任务发布、学习进度跟踪功能，支持核心教学法和综合成长两大任务体系。

#### 双重任务分类体系

**1. 核心教学法任务库 (38个任务)**
```typescript
interface MethodologyTask {
  educationalDomain: '核心教学法';
  educationalSubcategory: string; // 9大教学法维度
  name: string;
  description: string;
  defaultExp: number;
  difficulty: 1-5;
}

// 9大教学法维度
const TEACHING_DIMENSIONS = [
  '基础学习方法论',      // 5个任务
  '数学思维与解题策略',   // 7个任务
  '语文学科能力深化',    // 6个任务
  '英语应用与输出',      // 2个任务
  '阅读深度与分享',      // 3个任务
  '自主学习与规划',      // 4个任务
  '课堂互动与深度参与',   // 5个任务
  '家庭联结与知识迁移',   // 5个任务
  '高阶输出与创新'       // 1个任务
];
```

**2. 综合成长任务库 (14个任务)**
```typescript
interface GrowthTask {
  educationalDomain: '综合成长';
  category: string; // 4大类重新分组
  subcategory: string; // 具体子类别
  name: string;
  defaultExp: number;
}

// 4大类分组
const GROWTH_CATEGORIES = {
  '阅读广度类': ['年级同步阅读', '课外阅读30分钟', '填写阅读记录单'],
  '整理与贡献类': ['离校前整理', '集体贡献任务', '光盘行动'],
  '互助与创新类': ['帮助同学', '创意表达', '健康活力任务'],
  '家庭联结类': ['家庭阅读', '家务劳动']
};
```

#### 备课系统架构

**发布安全约束:**
```typescript
async publishPlan(request: PublishPlanRequest): Promise<PublishPlanResult> {
  // 🔒 关键安全约束：只能向自己名下的学生发布
  const students = await this.prisma.student.findMany({
    where: {
      schoolId: request.schoolId,
      teacherId: request.teacherId, // 发布者ID锁定
      isActive: true
    }
  });

  // 创建教学计划记录
  const lessonPlan = await this.prisma.lessonPlan.create({
    data: {
      schoolId: request.schoolId,
      teacherId: request.teacherId,
      title: request.title,
      content: request.content,
      date: request.date,
      isActive: true
    }
  });

  // 批量创建学生任务记录
  const taskRecords = students.map(student => ({
    studentId: student.id,
    lessonPlanId: lessonPlan.id,
    // ... 任务数据
  }));

  await this.prisma.taskRecord.createMany({
    data: taskRecords
  });

  // 实时通知相关学生
  this.notifyStudents(students, lessonPlan);
}
```

### 3.3 积分与经验值系统

#### 系统设计理念
基于游戏化学习理念，通过积分和经验值激励学生学习，支持多维度的评价体系。

#### 数据模型设计
```typescript
interface ScoringRecord {
  id: string;
  studentId: string;
  teacherId: string;
  points: number;         // 积分值（可正可负）
  exp: number;           // 经验值（只增不减）
  reason: string;        // 积分原因
  category: string;      // 积分类别
  createdAt: Date;
}

interface Student {
  // ... 其他字段
  points: number;        // 当前总积分
  exp: number;          // 当前总经验值
  level: number;        // 等级 = Math.floor(exp / 100) + 1
}
```

#### 积分类别体系
```typescript
const SCORING_CATEGORIES = {
  'I': '学习成果与高价值奖励',
  'II': '自主管理与习惯养成 (午托篇)',
  'III': '自主管理与学习过程 (晚辅篇)',
  'IV': '学习效率与时间管理',
  'V': '质量、进步与整理',
  'VI': '纪律与惩罚细则',
  'CUSTOM': '自定义类别'
};
```

#### 批量积分操作
```typescript
// 批量积分更新API
router.post('/students/score', async (req, res) => {
  const { studentIds, points, exp, reason } = req.body;

  const results = await Promise.allSettled(
    studentIds.map(studentId =>
      studentService.updateStudentScore(studentId, {
        points,
        exp,
        reason,
        teacherId: req.user.userId
      })
    )
  );

  // 实时更新学生数据
  this.io.emit('student_scores_updated', {
    studentIds,
    updates: results.map(r => r.status === 'fulfilled' ? r.value : null)
  });
});
```

---

## 4. 数据模型设计

### 4.1 数据库架构概览

**ORM框架**: Prisma 5.7.1
**数据库**: PostgreSQL
**命名规范**: snake_case表名 + camelCase字段

### 4.2 核心数据模型

#### 学校管理模型
```prisma
model schools {
  id         String         @id @default(cuid())
  name       String
  planType   String         @default("FREE")
  isActive   Boolean        @default(true)
  createdAt  DateTime       @default(now())
  updatedAt  DateTime       @updatedAt

  // 关联关系
  teachers   teacher[]
  students   student[]
  lessonPlans lessonPlan[]

  @@map("schools")
}
```

#### 教师管理模型
```prisma
model teachers {
  id               String         @id @default(cuid())
  schoolId         String
  primaryClassName String?        // 班主任班级名（宪法要求）
  teacherId        String?
  username         String         @unique
  password         String
  name             String
  displayName      String?
  email            String?
  role             String         @default("TEACHER")
  isActive         Boolean        @default(true)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  // 关联关系
  school           school         @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  students         student[]
  lessonPlans      lessonPlan[]

  @@map("teachers")
}
```

#### 学生管理模型
```prisma
model students {
  id          String    @id @default(cuid())
  schoolId    String
  teacherId   String?   // 师生绑定字段（宪法要求）
  name        String
  className   String?
  avatarUrl   String?
  points      Int       @default(0)
  exp         Int       @default(0)
  level       Int       @default(1)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // 关联关系
  school      school    @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  teacher     teacher?  @relation(fields: [teacherId], references: [id], onDelete: SetNull)
  taskRecords taskRecord[]

  @@map("students")
}
```

#### 教学计划模型
```prisma
model lessonPlans {
  id        String    @id @default(cuid())
  schoolId  String
  teacherId String
  title     String
  content   Json      // 存储课程信息、任务列表等
  date      DateTime
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // 关联关系
  school       school       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  teacher      teacher      @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  taskRecords  taskRecord[]

  @@map("lesson_plans")
}
```

#### 任务记录模型
```prisma
model taskRecords {
  id           String    @id @default(cuid())
  studentId    String
  lessonPlanId String
  taskId       String
  title        String
  type         TaskType  @default(TASK)
  content      Json?
  status       String    @default("PENDING")
  expAwarded   Int       @default(0)
  attempts     Int       @default(0)
  completedAt  DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // 关联关系
  student    student    @relation(fields: [studentId], references: [id], onDelete: Cascade)
  lessonPlan lessonPlan @relation(fields: [lessonPlanId], references: [id], onDelete: Cascade)

  @@map("task_records")
}
```

#### 任务库模型
```prisma
model taskLibrary {
  id                   String   @id @default(cuid())
  category             String   // 运营标签分类（过关页使用）
  educationalDomain    String   @default("基础作业") // 教育体系分类（备课页使用）
  educationalSubcategory String @default("基础核心")
  name                 String
  description          String?
  defaultExp           Int      @default(0)
  type                 String   @default("TASK")
  difficulty           Int?
  isActive             Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@map("task_library")
}
```

### 4.3 数据关系图

```
schools (1) ──────── (N) teachers
  │                       │
  │                       ├── (1:N) students (teacherId绑定)
  │                       │
  │                       └── (1:N) lessonPlans
  │                                   │
  │                                   └── (1:N) taskRecords
  │                                            │
  │                                            └── (N:1) students
  │
  └── (1:N) students (schoolId隔离)
```

### 4.4 数据一致性保证

#### 事务处理
```typescript
// 师生关系转移的事务处理
async transferStudents(studentIds: string[], targetTeacherId: string) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. 更新学生的teacherId
    await tx.student.updateMany({
      where: { id: { in: studentIds } },
      data: { teacherId: targetTeacherId }
    });

    // 2. 记录转移日志
    await tx.transferLog.create({
      data: {
        studentIds,
        fromTeacherId: currentTeacherId,
        toTeacherId: targetTeacherId,
        transferredAt: new Date()
      }
    });

    // 3. 发送通知
    await this.notifyTransfer(studentIds, targetTeacherId);
  });
}
```

---

## 5. 安全架构

### 5.1 认证与授权体系

#### JWT认证实现
```typescript
export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { username, password } = credentials;

    // 数据库验证
    const user = await this.prisma.teacher.findFirst({
      where: { username },
      include: { school: true }
    });

    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({
        userId: user.id,
        username: user.username,
        schoolId: user.schoolId,
        role: user.role
      }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });

      return {
        success: true,
        user: {
          userId: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId
        },
        token,
        expiresIn: this.parseExpiresIn(this.JWT_EXPIRES_IN)
      };
    }

    return { success: false, message: '认证失败' };
  }
}
```

#### 权限中间件
```typescript
export const authenticateToken = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const user = authService.verifyToken(token);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // 将用户信息附加到请求对象
    (req as any).user = user;
    next();
  };
};
```

### 5.2 师生绑定安全模型

#### 数据访问控制
```typescript
export class StudentService {
  private prisma = new PrismaClient();

  async getStudents(query: StudentQuery): Promise<StudentListResponse> {
    const { schoolId, scope, teacherId, userRole } = query;

    // 基于视图模式的访问控制
    let whereCondition: any = {
      schoolId: schoolId,
      isActive: true,
    };

    switch (scope) {
      case 'MY_STUDENTS':
        if (teacherId) {
          whereCondition.teacherId = teacherId; // 只访问自己的学生
        }
        break;

      case 'ALL_SCHOOL':
        if (userRole !== 'ADMIN') {
          throw new Error('权限不足：只有管理员可以查看全校学生');
        }
        // 不添加teacherId条件，显示全校学生
        break;

      case 'SPECIFIC_TEACHER':
        if (teacherId) {
          whereCondition.teacherId = teacherId;
        }
        break;
    }

    const students = await this.prisma.student.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' }
    });

    return {
      success: true,
      data: {
        students,
        total: students.length
      }
    };
  }
}
```

#### 操作权限验证
```typescript
// LMS发布权限验证
export const canPublishLessonPlan = (user: AuthUser, targetTeacherId?: string): boolean => {
  // 1. 必须是教师角色
  if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
    return false;
  }

  // 2. 只能为自己或指定教师发布（如果是指定教师模式）
  if (targetTeacherId && user.userId !== targetTeacherId && user.role !== 'ADMIN') {
    return false;
  }

  return true;
};
```

### 5.3 数据传输安全

#### HTTPS配置
```typescript
// 生产环境HTTPS配置
const app = express();

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

#### 数据验证
```typescript
import { z } from 'zod';

// 请求体验证模式
const CreateStudentSchema = z.object({
  name: z.string().min(1).max(50),
  className: z.string().optional(),
  schoolId: z.string().uuid(),
  teacherId: z.string().uuid()
});

// API路由验证
router.post('/students', async (req, res) => {
  try {
    const validatedData = CreateStudentSchema.parse(req.body);
    // 处理验证后的数据
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: '请求数据格式错误',
      errors: error.errors
    });
  }
});
```

---

## 6. 前端架构详解

### 6.1 组件架构设计

#### 技术栈组合
- **React 19.2.0**: 使用最新的并发特性和Hooks
- **TypeScript 5.9.3**: 严格的类型检查
- **Vite 7.2.4**: 快速的开发构建工具
- **Tailwind CSS**: 实用优先的CSS框架

#### 状态管理架构
```typescript
// 认证上下文 (AuthContext.tsx)
interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  isLoading: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [user, setUser] = useState<AuthUser | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  // 认证逻辑实现
  const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiService.auth.login(credentials);
    if (response.success && response.token) {
      setToken(response.token);
      setUser(response.user || null);
      localStorage.setItem('authToken', response.token);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    return response;
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading: false }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 班级管理上下文
```typescript
// 班级上下文 (ClassContext.tsx)
interface ClassContextType {
  viewMode: 'MY_STUDENTS' | 'ALL_SCHOOL' | 'SPECIFIC_CLASS';
  selectedTeacherId: string | null;
  currentClass: string;
  availableClasses: ClassInfo[];
  switchViewMode: (mode: string, teacherId?: string) => void;
  switchClass: (className: string) => void;
}

export const ClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('MY_STUDENTS');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [currentClass, setCurrentClass] = useState<string>('ALL');
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);

  const switchViewMode = (mode: string, teacherId?: string) => {
    setViewMode(mode as ViewMode);
    if (teacherId) {
      setSelectedTeacherId(teacherId);
    }
  };

  return (
    <ClassContext.Provider value={{
      viewMode,
      selectedTeacherId,
      currentClass,
      availableClasses,
      switchViewMode,
      switchClass: setCurrentClass
    }}>
      {children}
    </ClassContext.Provider>
  );
};
```

### 6.2 核心页面组件

#### 主页组件 (Home.tsx)
```typescript
const Home: React.FC = () => {
  const { token, user } = useAuth();
  const { viewMode, switchViewMode, selectedTeacherId, currentClass } = useClass();
  const navigate = useNavigate();

  // 状态管理
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 数据获取逻辑
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (viewMode === 'MY_STUDENTS' && user?.userId) {
        params.append('scope', 'MY_STUDENTS');
        params.append('teacherId', user.userId);
      } else if (viewMode === 'ALL_SCHOOL') {
        params.append('scope', 'ALL_SCHOOL');
      }

      const response = await apiService.get(`/students?${params}`);
      if (response.success && response.data) {
        setStudents(response.data.students);
      }
    } catch (error) {
      console.error('获取学生数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 交互逻辑
  const handleStudentTouch = (student: Student) => {
    if (isMultiSelectMode) {
      toggleSelection(student.id);
    } else {
      navigate(`/student/${student.id}`);
    }
  };

  const handleLongPress = (student: Student) => {
    // 长按显示积分面板
    setScoringStudent(student);
    setIsSheetOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-500 to-orange-600">
      {/* 头部导航 */}
      <header className="bg-primary px-6 py-6 pb-20">
        <div className="flex justify-between items-center">
          <div>
            <button onClick={() => setIsClassDrawerOpen(true)}>
              <h2 className="text-white text-2xl font-bold">
                {viewMode === 'MY_STUDENTS' ? `${user?.name}的班级` : '全校大名单'}
              </h2>
            </button>
            <p className="text-orange-100 text-sm">
              {students.length} 位学生
            </p>
          </div>
          <button onClick={toggleMultiSelectMode}>
            {isMultiSelectMode ? <CheckSquare size={20} /> : <ListChecks size={20} />}
          </button>
        </div>
      </header>

      {/* 学生网格 */}
      <div className="px-4 -mt-12">
        <div className="bg-white rounded-3xl shadow-xl p-5">
          <div className="grid grid-cols-3 gap-4">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                isSelected={selectedIds.has(student.id)}
                isMultiSelectMode={isMultiSelectMode}
                onTouch={() => handleStudentTouch(student)}
                onLongPress={() => handleLongPress(student)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### 备课页面组件 (PrepView.tsx)
```typescript
const PrepView: React.FC = () => {
  const { token, user } = useAuth();
  const { currentClass, viewMode } = useClass();

  // 状态管理
  const [taskLibrary, setTaskLibrary] = useState<TaskLibraryItem[]>([]);
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    chinese: { unit: "1", lesson: "1", title: "加载中..." },
    math: { unit: "1", lesson: "1", title: "加载中..." },
    english: { unit: "1", title: "Loading..." }
  });
  const [selectedQC, setSelectedQC] = useState<Record<string, string[]>>({
    chinese: [],
    math: [],
    english: []
  });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>({
    isPublishing: false,
    error: null,
    success: false
  });

  // 获取最新教学计划
  const fetchLatestLessonPlan = async () => {
    try {
      const response = await apiService.get('/lms/latest-lesson-plan');
      if (response.success && response.data) {
        const { courseInfo } = response.data;
        setCourseInfo({
          chinese: courseInfo.chinese || { unit: "1", lesson: "1", title: "默认课程" },
          math: courseInfo.math || { unit: "1", lesson: "1", title: "默认课程" },
          english: courseInfo.english || { unit: "1", title: "Default Course" }
        });
      }
    } catch (error) {
      console.error('获取最新教学计划失败:', error);
    }
  };

  // 发布备课计划
  const publishPlan = async () => {
    // 安全检查：必须在我的学生视图下才能发布
    if (viewMode !== 'MY_STUDENTS') {
      setPublishStatus({
        isPublishing: false,
        error: '请切换回【我的学生】视图进行发布',
        success: false
      });
      return;
    }

    setPublishStatus({ isPublishing: true, error: null, success: false });

    try {
      const planData = {
        courseInfo: {
          title: `${new Date().toLocaleDateString()} 备课计划`,
          ...courseInfo
        },
        qcTasks: Object.entries(selectedQC).flatMap(([subject, items]) =>
          items.map(item => ({
            taskName: item,
            category: subject,
            defaultExp: 5
          }))
        ),
        normalTasks: selectedTasks.map(taskName => {
          const task = taskLibrary.find(t => t.name === taskName);
          return {
            taskName,
            category: task?.category || '基础核心',
            defaultExp: task?.defaultExp || 10
          };
        })
      };

      const result = await apiService.post('/lms/publish', planData);

      if (result.success) {
        setPublishStatus({ isPublishing: false, error: null, success: true });
        alert(`备课计划发布成功！影响学生: ${result.data.totalStudents}`);
      }
    } catch (error) {
      setPublishStatus({
        isPublishing: false,
        error: error instanceof Error ? error.message : '发布失败',
        success: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] pb-40">
      {/* 头部 */}
      <header className="px-6 pt-14 pb-4 sticky top-0 bg-[#F2F4F7]/95 backdrop-blur-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">今日备课</h1>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString()} · {viewMode === 'MY_STUDENTS' ? `${user?.name}的班级` : '全校视图'}
            </p>
          </div>
          <button
            onClick={publishPlan}
            disabled={publishStatus.isPublishing || viewMode !== 'MY_STUDENTS'}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold ${
              publishStatus.isPublishing || viewMode !== 'MY_STUDENTS'
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-slate-900 text-white'
            }`}
          >
            {publishStatus.isPublishing ? '发布中...' : '发布'}
          </button>
        </div>
      </header>

      {/* 课程进度 */}
      <div className="px-5 mt-4">
        <div className="bg-white rounded-[24px] p-6 shadow-sm">
          <h3 className="text-xs font-extrabold text-slate-400 mb-5">课程进度</h3>
          {/* 课程信息输入区域 */}
        </div>
      </div>

      {/* 任务选择区域 */}
      <div className="px-5 mt-6">
        <TaskSelector
          taskLibrary={taskLibrary}
          selectedQC={selectedQC}
          selectedTasks={selectedTasks}
          onQCToggle={toggleQC}
          onTaskToggle={toggleTask}
        />
      </div>
    </div>
  );
};
```

### 6.3 通用组件库

#### API服务封装
```typescript
// api.service.ts
export class ApiService {
  private api: AxiosInstance;

  constructor(baseURL: string = '/api') {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // 学生相关API
  students = {
    get: (params?: string) => this.api.get(`/students${params}`),
    create: (data: CreateStudentRequest) => this.api.post('/students', data),
    update: (id: string, data: UpdateStudentRequest) => this.api.patch(`/students/${id}`, data),
    score: (data: ScoreRequest) => this.api.post('/students/score', data),
    transfer: (data: TransferRequest) => this.api.post('/students/transfer', data)
  };

  // LMS相关API
  lms = {
    getTaskLibrary: () => this.api.get('/lms/task-library'),
    publish: (data: PublishRequest) => this.api.post('/lms/publish', data),
    getLatestLessonPlan: () => this.api.get('/lms/latest-lesson-plan'),
    getStudentProgress: (studentId: string) => this.api.get(`/lms/student-progress?studentId=${studentId}`)
  };

  // 认证相关API
  auth = {
    login: (credentials: LoginRequest) => this.api.post('/auth/login', credentials),
    refreshToken: (token: string) => this.api.post('/auth/refresh', { token })
  };
}
```

---

## 7. 后端服务架构

### 7.1 服务层设计

#### 架构原则
- **单一职责**: 每个服务类专注于特定业务领域
- **依赖注入**: 使用自包含的PrismaClient实例
- **错误处理**: 统一的错误处理和日志记录

#### LMSService实现
```typescript
export class LMSService {
  private prisma = new PrismaClient();

  /**
   * 获取任务库
   * 双重分类体系：运营标签 + 教育体系
   */
  async getTaskLibrary(): Promise<TaskLibraryItem[]> {
    try {
      const tasks = await this.prisma.taskLibrary.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' }
      });

      return tasks.map(task => ({
        id: task.id,
        // 🏷️ 运营标签分类（过关页使用）
        category: task.category,

        // 📚 教育体系分类（备课页使用）
        educationalDomain: task.educationalDomain || '基础作业',
        educationalSubcategory: task.educationalSubcategory || task.category,

        name: task.name,
        description: task.description || '',
        defaultExp: task.defaultExp,
        type: task.type,
        difficulty: task.difficulty || 0,
        isActive: task.isActive
      }));
    } catch (error) {
      console.error('获取任务库失败:', error);
      throw new Error('Failed to get task library');
    }
  }

  /**
   * 发布教学计划
   * 安全约束：只能向发布者名下的学生发布
   */
  async publishPlan(request: PublishPlanRequest, io: any): Promise<PublishPlanResult> {
    const { schoolId, teacherId, title, content, tasks, date } = request;

    try {
      // 🔒 安全约束：获取发布者名下的学生
      const students = await this.prisma.student.findMany({
        where: {
          schoolId,
          teacherId, // 关键安全约束
          isActive: true
        }
      });

      if (students.length === 0) {
        throw new Error('没有找到可发布的学生');
      }

      // 创建教学计划
      const lessonPlan = await this.prisma.lessonPlan.create({
        data: {
          schoolId,
          teacherId,
          title,
          content: {
            ...content,
            publisherId: teacherId,
            securityScope: 'TEACHERS_STUDENTS',
            publishedAt: new Date().toISOString()
          },
          date: date || new Date(),
          isActive: true
        }
      });

      // 批量创建任务记录
      const taskRecords = [];
      for (const student of students) {
        for (const task of tasks) {
          taskRecords.push({
            studentId: student.id,
            lessonPlanId: lessonPlan.id,
            taskId: task.id || `custom_${Date.now()}_${Math.random()}`,
            title: task.title,
            type: task.type,
            content: task.content,
            status: 'PENDING',
            expAwarded: task.expAwarded,
            attempts: 0
          });
        }
      }

      await this.prisma.taskRecord.createMany({
        data: taskRecords
      });

      // 📡 实时通知学生
      const studentIds = students.map(s => s.id);
      io.to(studentIds).emit('lesson_plan_published', {
        lessonPlanId: lessonPlan.id,
        title: title,
        tasks: tasks.map(t => t.title),
        publishedAt: lessonPlan.createdAt
      });

      console.log(`✅ [LMS] 教学计划发布成功: ${lessonPlan.id}, 影响学生: ${students.length}人`);

      return {
        success: true,
        lessonPlan: {
          id: lessonPlan.id,
          title: lessonPlan.title,
          date: lessonPlan.date
        },
        taskStats: {
          tasksCreated: taskRecords.length,
          totalStudents: students.length
        }
      };

    } catch (error) {
      console.error('发布教学计划失败:', error);
      throw error;
    }
  }
}
```

#### StudentService实现
```typescript
export class StudentService {
  private prisma = new PrismaClient();

  /**
   * 获取学生列表
   * 支持多视图模式和安全控制
   */
  async getStudents(query: StudentQuery): Promise<StudentListResponse> {
    const { schoolId, scope, teacherId, userRole, classRoom } = query;

    try {
      let whereCondition: any = {
        schoolId: schoolId,
        isActive: true,
      };

      // 基于视图模式的访问控制
      switch (scope) {
        case 'MY_STUDENTS':
          if (teacherId) {
            whereCondition.teacherId = teacherId;
          }
          break;

        case 'ALL_SCHOOL':
          // 全校视图，不限制teacherId
          // 但需要验证用户权限
          if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
            throw new Error('权限不足');
          }
          break;

        case 'SPECIFIC_TEACHER':
          if (teacherId) {
            whereCondition.teacherId = teacherId;
          }
          break;
      }

      // 额外的班级筛选
      if (classRoom && classRoom !== 'ALL') {
        whereCondition.className = classRoom;
      }

      const students = await this.prisma.student.findMany({
        where: whereCondition,
        orderBy: [
          { exp: 'desc' },
          { name: 'asc' }
        ],
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              primaryClassName: true
            }
          }
        }
      });

      // 统计信息
      const total = await this.prisma.student.count({
        where: whereCondition
      });

      return {
        success: true,
        data: {
          students: students.map(student => ({
            ...student,
            level: Math.floor(student.exp / 100) + 1,
            avatarUrl: student.avatarUrl || '/avatar.jpg'
          })),
          total,
          pagination: {
            page: 1,
            limit: total,
            pages: 1
          }
        }
      };

    } catch (error) {
      console.error('获取学生列表失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '获取学生列表失败',
        data: { students: [], total: 0 }
      };
    }
  }

  /**
   * 更新学生积分
   */
  async updateStudentScore(
    studentId: string,
    scoreData: ScoreUpdateData
  ): Promise<Student> {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId }
      });

      if (!student) {
        throw new Error('学生不存在');
      }

      // 更新积分和经验值
      const updatedStudent = await this.prisma.student.update({
        where: { id: studentId },
        data: {
          points: student.points + scoreData.points,
          exp: student.exp + scoreData.exp,
          level: Math.floor((student.exp + scoreData.exp) / 100) + 1
        }
      });

      // 记录积分变更历史
      await this.prisma.scoringRecord.create({
        data: {
          studentId,
          teacherId: scoreData.teacherId,
          points: scoreData.points,
          exp: scoreData.exp,
          reason: scoreData.reason,
          category: scoreData.category
        }
      });

      return updatedStudent;

    } catch (error) {
      console.error('更新学生积分失败:', error);
      throw error;
    }
  }
}
```

### 7.2 路由层设计

#### LMS路由 (lms.routes.ts)
```typescript
import { Router } from 'express';
import { LMSService } from '../services/lms.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const lmsService = new LMSService();

// 应用认证中间件到所有路由
router.use(authenticateToken);

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
    console.error('获取任务库失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get task library',
      error: (error as Error).message
    });
  }
});

// 发布教学计划
router.post('/publish', async (req, res) => {
  try {
    const io = req.app.get('io');
    const user = (req as any).user;

    // 权限检查
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: '权限不足：只有教师可以发布教学计划'
      });
    }

    const { courseInfo, qcTasks, normalTasks, specialTasks } = req.body;

    const publishRequest: PublishPlanRequest = {
      schoolId: user.schoolId,
      teacherId: user.userId, // 使用发布者ID
      title: courseInfo.title,
      content: {
        courseInfo,
        qcTasks,
        normalTasks,
        specialTasks,
        publisherId: user.userId,
        securityScope: 'TEACHERS_STUDENTS',
        publishedAt: new Date().toISOString()
      },
      date: courseInfo.date ? new Date(courseInfo.date) : new Date(),
      tasks: [] // 根据前端数据构建任务数组
    };

    const result = await lmsService.publishPlan(publishRequest, io);

    res.json({
      success: true,
      message: 'Lesson plan published successfully',
      data: result
    });

  } catch (error) {
    console.error('发布教学计划失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish lesson plan',
      error: (error as Error).message
    });
  }
});

export { router as lmsRoutes };
```

#### 学生路由 (student.routes.ts)
```typescript
import { Router } from 'express';
import { StudentService } from '../services/student.service';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const studentService = new StudentService();

// 应用认证中间件
router.use(authenticateToken);

// 获取学生列表
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { scope, classRoom, teacherId } = req.query;

    const query: StudentQuery = {
      schoolId: user.schoolId,
      scope: (scope as string) || 'MY_STUDENTS',
      teacherId: teacherId as string || user.userId,
      userRole: user.role,
      classRoom: classRoom as string
    };

    const result = await studentService.getStudents(query);

    res.json(result);
  } catch (error) {
    console.error('获取学生列表失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get students',
      error: (error as Error).message
    });
  }
});

// 创建学生
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, className } = req.body;

    const studentData = {
      name,
      className: className || `${user.name}的班级`,
      schoolId: user.schoolId,
      teacherId: user.userId // 归属到当前老师
    };

    const result = await studentService.createStudent(studentData);

    res.json({
      success: true,
      data: result,
      message: 'Student created successfully'
    });
  } catch (error) {
    console.error('创建学生失败:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
      error: (error as Error).message
    });
  }
});

export { router as studentRoutes };
```

### 7.3 中间件系统

#### 认证中间件
```typescript
// auth.middleware.ts
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export const authenticateToken = (authService: AuthService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    try {
      const user = authService.verifyToken(token);
      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token',
          code: 'TOKEN_INVALID'
        });
      }

      // 验证用户是否仍然活跃
      // 这里可以添加数据库查询验证用户状态
      (req as AuthenticatedRequest).user = user;
      next();

    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(403).json({
        success: false,
        message: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_ERROR'
      });
    }
  };
};
```

---

## 8. 实时通信系统

### 8.1 Socket.io集成

#### 服务器端配置
```typescript
// socket.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketManager {
  private io: SocketIOServer;
  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? false // 生产环境使用同源策略
          : ["http://localhost:3000"], // 开发环境允许本地连接
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[SOCKET] User connected: ${socket.id}`);

      // 用户认证
      socket.on('authenticate', (token: string) => {
        try {
          const user = jwt.verify(token, process.env.JWT_SECRET!);
          socket.userId = user.userId;
          socket.schoolId = user.schoolId;
          this.userSockets.set(user.userId, socket.id);

          // 加入学校房间
          socket.join(`school:${user.schoolId}`);

          // 加入教师房间（如果是教师）
          if (user.role === 'TEACHER') {
            socket.join(`teacher:${user.userId}`);
          }

          console.log(`[SOCKET] User authenticated: ${user.userId} (${user.role})`);

          socket.emit('authenticated', {
            success: true,
            userId: user.userId,
            role: user.role
          });

        } catch (error) {
          console.error('[SOCKET] Authentication failed:', error);
          socket.emit('authentication_error', {
            success: false,
            message: 'Invalid token'
          });
        }
      });

      // 断开连接
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          console.log(`[SOCKET] User disconnected: ${socket.userId}`);
        }
      });
    });
  }

  /**
   * 发送教学计划发布通知
   */
  notifyLessonPlanPublished(studentIds: string[], lessonPlanData: any) {
    studentIds.forEach(studentId => {
      this.io.to(`student:${studentId}`).emit('lesson_plan_published', {
        type: 'LESSON_PLAN_PUBLISHED',
        data: lessonPlanData,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`[SOCKET] Notified ${studentIds.length} students about new lesson plan`);
  }
}

export default SocketManager;
```

#### 应用集成
```typescript
// app.ts 集成Socket.io
import { createServer } from 'http';
import { SocketManager } from './socket';

export class Application {
  private app: Express;
  private server: HTTPServer;
  private socketManager: SocketManager;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.socketManager = new SocketManager(this.server);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupRoutes() {
    // 将socket实例附加到app，供路由使用
    this.app.set('io', this.socketManager.getIO());

    // 其他路由设置...
  }

  public start(port: number): void {
    this.server.listen(port, () => {
      console.log(`🚀 ArkOK V2 Server started on port ${port}`);
      console.log(`📡 Socket.io server ready for real-time communications`);
    });
  }
}
```

### 8.2 前端Socket客户端

#### Socket服务封装
```typescript
// socket.service.ts
export class SocketService {
  private socket: Socket | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('[SOCKET] No auth token found, skipping socket connection');
      return;
    }

    this.socket = io('/', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // 连接成功
    this.socket.on('connect', () => {
      console.log('[SOCKET] Connected to server');

      // 自动认证
      const token = localStorage.getItem('authToken');
      if (token) {
        this.socket?.emit('authenticate', token);
      }
    });

    // 认证成功
    this.socket.on('authenticated', (data) => {
      console.log('[SOCKET] Authentication successful:', data);
    });

    // 接收教学计划发布通知
    this.socket.on('lesson_plan_published', (data) => {
      console.log('[SOCKET] New lesson plan published:', data);
      this.handleLessonPlanPublished(data);
    });

    // 连接断开
    this.socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected:', reason);
    });
  }

  // 事件处理方法
  private handleLessonPlanPublished(data: any) {
    // 可以使用事件总线或状态管理来通知其他组件
    window.dispatchEvent(new CustomEvent('lesson_plan_published', { detail: data }));
  }

  // 断开连接
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

// 全局Socket服务实例
export const socketService = new SocketService();
```

---

## 9. 部署架构

### 9.1 统一托管部署模式

#### 部署架构图
```
┌─────────────────────────────────────────────────────────┐
│                    负载均衡器                              │
│                 (Nginx / CloudFlare)                     │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS (443)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                ArkOK V2 应用服务器                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Express.js 应用                    │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │        静态文件服务                     │    │    │
│  │  │    React Build Files                   │    │    │
│  │  │    (Frontend Assets)                   │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │        API 路由服务                      │    │    │
│  │  │    /api/* 路由                          │    │    │
│  │  │    Socket.io 端点                       │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL 数据库                          │
│           (Prisma ORM 连接池管理)                        │
└─────────────────────────────────────────────────────────┘
```

#### Docker部署配置
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# 依赖安装阶段
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# 构建后端
WORKDIR /app/server
RUN npm run build

# 构建前端
WORKDIR /app/client
RUN npm run build

# 生产运行阶段
FROM base AS runner
WORKDIR /app

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 arkok

# 复制构建产物
COPY --from=deps --chown=arkok:nodejs /app/server/node_modules ./server/node_modules
COPY --from=builder --chown=arkok:nodejs /app/server/dist ./server/dist
COPY --from=builder --chown=arkok:nodejs /app/server/prisma ./server/prisma
COPY --from=builder --chown=arkok:nodejs /app/client/dist ./client/dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 切换到非root用户
USER arkok

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server/dist/index.js"]
```

#### Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'

services:
  arkok-v2:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://arkok:${DB_PASSWORD}@postgres:5432/arkok_v2
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - arkok-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=arkok_v2
      - POSTGRES_USER=arkok
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - arkok-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - arkok-network

volumes:
  postgres_data:
  redis_data:

networks:
  arkok-network:
    driver: bridge
```

### 9.2 环境配置管理

#### 环境变量配置
```typescript
// config/environment.ts
export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  redisUrl?: string;
  corsOrigin: string[];
  uploadMaxSize: number;
  logLevel: string;
}

export const config: EnvironmentConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL,
  corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760'), // 10MB
  logLevel: process.env.LOG_LEVEL || 'info'
};
```

---

## 10. 开发规范与最佳实践

### 10.1 TypeScript代码规范

#### 严格类型检查配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### 接口设计规范
```typescript
// ✅ 好的接口设计
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

// ✅ 严格的用户类型定义
interface AuthUser {
  readonly userId: string;
  readonly username: string;
  readonly name: string;
  readonly displayName?: string;
  readonly email?: string;
  readonly role: 'TEACHER' | 'ADMIN' | 'STUDENT';
  readonly schoolId: string;
  readonly schoolName?: string;
  readonly primaryClassName?: string;
}

// ✅ 使用联合类型而不是枚举
type ViewMode = 'MY_STUDENTS' | 'ALL_SCHOOL' | 'SPECIFIC_CLASS';
type TaskStatus = 'PENDING' | 'SUBMITTED' | 'REVIEWED' | 'COMPLETED';
type TaskType = 'TASK' | 'QC' | 'SPECIAL';
```

### 10.2 错误处理规范

#### 自定义错误类
```typescript
// errors/base-error.ts
export abstract class BaseError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.context = context;

    // 确保错误堆栈正确
    Error.captureStackTrace(this, this.constructor);
  }
}

// 具体错误类
export class ValidationError extends BaseError {
  constructor(message: string, context?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, context);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message, 404, 'NOT_FOUND', true);
  }
}
```

### 10.3 数据验证规范

#### 请求体验证
```typescript
// validation/schemas.ts
import { z } from 'zod';

// 学生相关验证
export const createStudentSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  className: z.string()
    .max(50, 'Class name must be less than 50 characters')
    .optional(),
  schoolId: z.string().uuid(),
  teacherId: z.string().uuid().optional()
});

// 积分更新验证
export const updateScoreSchema = z.object({
  studentIds: z.array(z.string().uuid()).min(1, 'At least one student ID is required'),
  points: z.number(),
  exp: z.number().min(0, 'Experience points must be non-negative'),
  reason: z.string()
    .min(1, 'Reason is required')
    .max(200, 'Reason must be less than 200 characters'),
  category: z.enum(['I', 'II', 'III', 'IV', 'V', 'VI', 'CUSTOM'], {
    errorMap: () => ({ message: 'Invalid category' })
  })
});
```

---

## 11. 性能优化策略

### 11.1 数据库性能优化

#### 查询优化
```typescript
// ✅ 使用索引优化查询
const getStudentsOptimized = async (schoolId: string, teacherId?: string) => {
  // 使用复合索引：(schoolId, teacherId, isActive)
  return await prisma.student.findMany({
    where: {
      schoolId,
      ...(teacherId && { teacherId }),
      isActive: true
    },
    select: {
      // 只选择需要的字段
      id: true,
      name: true,
      className: true,
      points: true,
      exp: true,
      level: true,
      avatarUrl: true,
      // 包含关联的教师信息（使用select减少数据传输）
      teacher: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { exp: 'desc' }, // 使用索引排序
      { name: 'asc' }
    ],
    // 分页处理
    take: 50,
    skip: 0
  });
};
```

#### 连接池配置
```typescript
// 数据库连接配置
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty'
});
```

### 11.2 缓存策略

#### Redis缓存实现
```typescript
// cache/redis-cache.ts
export class RedisCache {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
}

export const cache = new RedisCache();
```

#### 缓存装饰器
```typescript
// decorators/cache.ts
export function Cache(ttl: number = 3600, keyPrefix: string = '') {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 生成缓存键
      const cacheKey = `${keyPrefix}:${propertyName}:${JSON.stringify(args)}`;

      // 尝试从缓存获取
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // 执行原方法
      const result = await method.apply(this, args);

      // 存入缓存
      await cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

// 使用示例
export class StudentService {
  @Cache(1800, 'students') // 缓存30分钟
  async getStudentsBySchool(schoolId: string): Promise<Student[]> {
    return await this.prisma.student.findMany({
      where: { schoolId, isActive: true },
      orderBy: { name: 'asc' }
    });
  }
}
```

### 11.3 前端性能优化

#### 组件懒加载
```typescript
// 路由懒加载
import { lazy, Suspense } from 'react';

// 懒加载组件
const Home = lazy(() => import('../pages/Home'));
const StudentDetail = lazy(() => import('../pages/StudentDetail'));
const PrepView = lazy(() => import('../pages/PrepView'));

const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student/:id" element={<StudentDetail />} />
        <Route path="/prep" element={<PrepView />} />
      </Routes>
    </Suspense>
  );
};
```

---

## 12. 未来技术演进

### 12.1 微服务架构演进

#### 服务拆分策略
```typescript
// 服务边界定义
interface ServiceBoundaries {
  // 用户服务 - 处理认证、授权、用户管理
  userService: {
    authentication: boolean;
    authorization: boolean;
    userManagement: boolean;
  };

  // 学生服务 - 处理学生数据、积分管理
  studentService: {
    studentCRUD: boolean;
    scoreManagement: boolean;
    progressTracking: boolean;
  };

  // LMS服务 - 处理教学计划、任务管理
  lmsService: {
    lessonPlanning: boolean;
    taskManagement: boolean;
    contentDelivery: boolean;
  };

  // 分析服务 - 处理数据分析、报告生成
  analyticsService: {
    dataAggregation: boolean;
    reportGeneration: boolean;
    insights: boolean;
  };

  // 通知服务 - 处理实时通知、消息推送
  notificationService: {
    realTimeUpdates: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}
```

### 12.2 人工智能集成

#### 智能推荐系统
```typescript
// ai/recommendation-engine.ts
export class RecommendationEngine {
  /**
   * 基于协同过滤的任务推荐
   */
  async getCollaborativeRecommendations(studentId: string): Promise<TaskRecommendation[]> {
    // 获取相似学生的完成情况
    const similarStudents = await this.findSimilarStudents(studentId);

    // 推荐相似学生完成但当前学生未完成的任务
    const recommendations = await this.generateRecommendations(
      studentId,
      similarStudents
    );

    return recommendations;
  }

  /**
   * 混合推荐算法
   */
  async getHybridRecommendations(studentId: string): Promise<TaskRecommendation[]> {
    const studentProfile = await this.getStudentProfile(studentId);

    // 并行获取两种推荐结果
    const [collaborativeRecs, contentBasedRecs] = await Promise.all([
      this.getCollaborativeRecommendations(studentId),
      this.getContentBasedRecommendations(studentProfile)
    ]);

    // 加权合并推荐结果
    const hybridRecommendations = this.combineRecommendations(
      collaborativeRecs,
      contentBasedRecs,
      { collaborative: 0.6, contentBased: 0.4 }
    );

    return hybridRecommendations;
  }
}
```

### 12.3 大数据分析平台

#### 数据仓库架构
```typescript
// analytics/data-warehouse.ts
export class DataWarehouse {
  /**
   * 学生学习行为分析
   */
  async analyzeStudentBehavior(studentId: string, timeRange: TimeRange): Promise<StudentBehaviorAnalysis> {
    const query = `
      WITH daily_activity AS (
        SELECT
          DATE(created_at) as date,
          COUNT(*) as task_count,
          SUM(exp_awarded) as exp_gained,
          AVG(completion_time) as avg_completion_time
        FROM task_records
        WHERE student_id = $1
          AND created_at BETWEEN $2 AND $3
          AND status = 'COMPLETED'
        GROUP BY DATE(created_at)
      )
      SELECT
        COUNT(*) as total_active_days,
        AVG(task_count) as avg_daily_tasks,
        SUM(exp_gained) as total_exp,
        AVG(avg_completion_time) as avg_completion_time
      FROM daily_activity
    `;

    return await this.warehouseClient.query(query, [studentId, timeRange.start, timeRange.end]);
  }
}
```

### 12.4 移动端扩展

#### React Native应用架构
```typescript
// mobile/App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TabNavigator from './navigation/TabNavigator';
import AuthNavigator from './navigation/AuthNavigator';
import { useAuth } from './hooks/useAuth';

const Stack = createNativeStackNavigator();
const queryClient = new QueryClient();

const App: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={TabNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
};

export default App;
```

---

## 总结

ArkOK V2技术架构与功能说明白皮书详细阐述了系统的现代化技术栈选择、核心架构设计、安全机制、性能优化策略和未来演进方向。

### 核心技术亮点：

1. **统一托管架构**: 简化部署运维，提供一致的用户体验
2. **师生绑定安全模型**: 基于角色的细粒度权限控制
3. **双重任务分类体系**: 教育体系与运营标签的完美结合
4. **实时通信系统**: Socket.io驱动的即时数据同步
5. **TypeScript类型安全**: 确保代码质量和开发效率
6. **Prisma ORM集成**: 类型安全的数据库操作
7. **组件化前端架构**: React 19 + 现代化开发工具链

### 系统优势：

- **可扩展性**: 模块化设计支持功能扩展和架构演进
- **安全性**: 多层次的安全防护和权限控制
- **性能**: 数据库优化、缓存策略和前端性能优化
- **可维护性**: 严格的代码规范和完整的错误处理机制
- **用户体验**: 实时数据同步和响应式界面设计

### 技术创新：

- **游戏化学习**: 积分和经验值系统激励学生学习
- **智能推荐**: 基于协同过滤和内容分析的个性化推荐
- **数据驱动**: 完整的学习数据收集和分析能力
- **跨平台**: 统一的Web应用和移动端支持

ArkOK V2不仅是一个功能完备的教育管理平台，更是现代教育科技技术的最佳实践展示，为K-12教育数字化转型提供了完整的技术解决方案。

---

**白皮书版本**: v2.0.0
**最后更新**: 2025-12-18
**技术架构**: 统一托管 + 微服务就绪
**技术栈**: React 19 + TypeScript + Prisma + Express.js
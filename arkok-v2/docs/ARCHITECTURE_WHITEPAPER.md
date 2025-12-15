# 📘 ArkOK V2 智慧教育 SaaS 平台：架构白皮书 & 实施路线图

**版本:** 1.0
**最后更新:** 2025-12-12
**状态:** 第一阶段（地基工程）已完成，即将进入第二阶段（主体结构施工）

---

## 第一部分：项目总览与顶层设计

### 1.1 项目愿景

将现有的 ArkOK 应用（V1）重构为一个现代化、高可用、可扩展的智慧教育 SaaS 平台 (ArkOK V2)。该平台在设计之初即以支撑 **1000+ 校区** 并发使用为目标，同时提供卓越的用户体验和实时的数据交互能力。

### 1.2 核心设计哲学

#### 多租户原生 (SaaS Native)
确保不同校区（租户）之间的数据通过 `schoolId` 在数据库层面严格隔离，为商业化运营奠定基础。

#### 双核驱动架构 (Dual-Core Engine)
- **Node.js 主服务:** 处理高并发业务逻辑（API）、数据库交互（Prisma）和实时消息推送（Socket.io）。
- **Python AI 服务:** 作为独立模块，负责 OCR、错题分析等计算密集型任务，通过内部 API 与主服务通信，避免阻塞。

#### UI/UX 策略 (双轨并行)
- **手机端 (Teacher's Cockpit):** 严格保留并复用 V1 版本已有的 UI 布局和交互习惯。这尊重了用户的肌肉记忆，仅在底层替换为全新的、高性能的数据接口。
- **大屏端 (Commander's Display):** 采用全新的 "星际指挥官" (Cyberpunk / Starship) 风格，注重视觉冲击力、数据可视化和实时动画效果，为线下教学场景提供震撼的展示体验。

---

## 第二部分：技术栈与架构图

### 2.1 技术栈 (Tech Stack)

| 领域 | 技术选型 | 理由 |
|------|----------|------|
| **前端 (Client)** | React 18 + Vite + TypeScript | 业界标准，开发效率与性能兼备。 |
| **样式方案** | Tailwind CSS | 原子化 CSS，确保 UI 一致性与可维护性。 |
| **动画引擎** | Framer Motion | 专为 React 设计，轻松实现复杂、流畅的动画。 |
| **后端 API (Server)** | Node.js + Express + TypeScript | 事件驱动的非阻塞 I/O，完美契合实时应用场景。 |
| **实时通讯** | Socket.io (+ Redis Adapter for scaling) | 成熟的 WebSocket 库，支持按房间（校区）广播。 |
| **AI 引擎** | Python + FastAPI (预留) | 强大的 AI 生态，通过 RESTful API 提供服务。 |
| **数据库 ORM** | Prisma | 强类型安全，自动生成查询，极大提升开发效率。 |
| **数据库** | PostgreSQL | 功能强大，稳定可靠，支持复杂的 JSONB 数据类型。 |
| **部署环境** | Sealos (Kubernetes) | 一站式云操作系统，简化部署，支持弹性伸缩。 |

### 2.2 系统架构图

```mermaid
graph TD
    subgraph "User Devices"
        Mobile[📱 老师手机端]
        BigScreen[🖥️ 班级大屏]
    end

    subgraph "Sealos Cloud Platform"
        Ingress[🌐 公网 Ingress]

        subgraph "Application Services (arkok-v2)"
            Proxy[🚦 智能代理 (Node.js on Port 8000)]
            Frontend[🎨 前端服务 (Vite on Port 5173)]
            Backend[🚀 后端主服务 (Node.js on Port 3000)]
            AI_Worker[🧠 AI 服务 (Python on Port 8001, placeholder)]
        end

        subgraph "Data & Messaging Layer"
            Database[(🐘 PostgreSQL)]
            Messaging[(📡 Redis)]
        end
    end

    Mobile -- HTTPS --> Ingress
    BigScreen -- WSS --> Ingress

    Ingress -- "/ (root)" --> Proxy
    Ingress -- "/api/*" --> Proxy
    Ingress -- "/socket.io/*" --> Proxy

    Proxy -- "UI Requests" --> Frontend
    Proxy -- "/api/*" --> Backend
    Proxy -- "/socket.io/* (WebSocket)" --> Backend

    Backend <--> Database
    Backend <--> Messaging
    Backend -- "AI Task" --> AI_Worker
```

---

## 第三部分：当前实施进度 (截至 2025-12-12)

**状态:** ✅ 第一阶段 (地基工程) 已圆满完成。

### 项目初始化与环境隔离
- ✅ **已完成:** 在 `/home/devbox/project/` 目录下创建了全新的 `arkok-v2` 项目。
- ✅ **已完成:** 所有 V1 版本的旧代码（包括 `快速部署.sh`）均已安全归档至 `_LEGACY_ARCHIVE_DO_NOT_TOUCH` 目录，彻底解决了 AI 上下文污染问题。
- ✅ **已完成:** `server`, `client`, `ai-worker` 三大模块的目录结构和 `package.json` 已创建，所有核心依赖已安装。

### 数据库设计与数据迁移
- ✅ **已完成:** 使用 Prisma 在 `server/prisma/schema.prisma` 中定义了支持多租户的全新数据模型，涵盖 `School`, `User`, `Student`, `TaskRecord` 等核心实体。
- ✅ **已完成:** 已成功执行 `server/prisma/migrate_legacy.ts` 脚本，将旧 `students` 表中的**姓名、班级、积分(score)、经验(total_exp)**等数据无损迁移至新架构，并统一归属到 "Default Migration School"。数据已安全落地。

### 网络配置与服务启动
- ✅ **已完成:** 解决了 Sealos Devbox 环境因缺少 `kubectl` 权限而无法修改 Ingress 的问题。Claude Code 创新性地实施了 **"Plan C - 自建反向代理"** 方案。
- ✅ **已完成:** 创建了 `proxy-server.js` 运行在 8000 端口，作为智能流量分发中心，并将 Sealos Ingress 指向它。
- ✅ **已完成:** 解决了 Tailwind CSS 的版本兼容性问题。
- ✅ **已完成:** 配置了 `dev.sh` 一键启动脚本，支持前后端热重载。

**当前状态:** 运行 `./dev.sh` 后，应用已成功上线，可通过公网域名 `https://esboimzbkure.sealosbja.site` 访问，但显示的是 Vite 默认页面，因为我们还未移植 UI。

---

## 第四部分：核心模块详解

### 4.1 数据库设计 (Prisma Schema)

```prisma
// server/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model School {
  id          String   @id @default(cuid())
  name        String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]
  students    Student[]
  taskRecords TaskRecord[]

  @@map("schools")
}

model User {
  id        String   @id @default(cuid())
  schoolId  String
  username  String   @unique
  email     String?  @unique
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  school    School @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@map("users")
}

model Student {
  id          String   @id @default(cuid())
  schoolId    String
  name        String
  classRoom   String
  avatar      String?
  score       Int      @default(0)
  totalExp    Int      @default(0)
  level       Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  school      School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  taskRecords TaskRecord[]

  @@map("students")
}

model TaskRecord {
  id          String     @id @default(cuid())
  schoolId    String
  studentId   String
  taskType    TaskType
    description String?
  score       Int?
  exp         Int?
  metadata    Json?
  createdAt   DateTime   @default(now())

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  @@map("task_records")
}

enum UserRole {
  ADMIN
  USER
}

enum TaskType {
  HOMEWORK
  EXAM
  PARTICIPATION
  BONUS
}
```

### 4.1 API 响应处理标准 (强制规范)

**原则**: 杜绝 `as any`，实现类型安全的 API 响应处理

#### 4.1.1 标准响应接口
所有 API 响应必须使用统一的 `ApiResponse<T>` 接口：

```typescript
// 标准API响应接口 - 全局统一
export interface ApiResponse<T = any> {
  success: boolean;           // 请求是否成功
  message?: string;           // 可选的错误或成功消息
  data: T;                    // 实际数据载荷，类型安全
  token?: string;             // 认证响应中的JWT令牌
  user?: any;                 // 认证响应中的用户信息
}

// 分页响应接口
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
  };
}
```

#### 4.1.2 强制规定
- **禁止**: 使用 `as any` 或 `unknown` 类型处理 API 响应
- **必须**: 所有 API 调用都有明确的类型定义
- **必须**: 使用类型守卫 (type guards) 进行安全的数据提取

#### 4.1.3 使用示例
```typescript
// ✅ 正确实践 - 类型安全
interface StudentsResponse {
  students: Student[];
  total: number;
}

const response = await apiService.get<StudentsResponse>('/students');
if (response.success) {
  const students = response.data.students; // 类型安全
}

// ❌ 错误实践 - 禁止使用
const response = await apiService.get('/students') as any;
const students = response.data.students; // 危险的断言
```

### 4.2 API 设计规范

所有 API 端点都遵循 `/api/v1/{schoolId}/{resource}` 的命名规范，确保租户隔离。

#### 核心端点示例：

```typescript
// 学生管理
GET    /api/v1/{schoolId}/students          // 获取学生列表
POST   /api/v1/{schoolId}/students          // 创建新学生
GET    /api/v1/{schoolId}/students/{id}     // 获取单个学生
PUT    /api/v1/{schoolId}/students/{id}     // 更新学生信息
DELETE /api/v1/{schoolId}/students/{id}     // 删除学生

// 任务记录
GET    /api/v1/{schoolId}/task-records      // 获取任务记录
POST   /api/v1/{schoolId}/task-records      // 创建任务记录
GET    /api/v1/{schoolId}/task-records/{id} // 获取单个任务记录

// 统计数据
GET    /api/v1/{schoolId}/stats/overview   // 获取概览统计
GET    /api/v1/{schoolId}/stats/leaderboard // 排行榜
```

### 4.3 Socket.io 房间策略

```typescript
// 每个校区作为独立的房间
const schoolRoom = `school:${schoolId}`;

// 教师加入校区房间
socket.join(schoolRoom);

// 向特定校区广播数据更新
io.to(schoolRoom).emit('student-updated', updatedStudent);
io.to(schoolRoom).emit('task-completed', taskRecord);
```

---

## 第五部分：开发规范与最佳实践

### 5.1 目录结构规范

```
arkok-v2/
├── server/                 # Node.js 后端服务
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   ├── services/      # 业务逻辑
│   │   ├── middleware/    # 中间件
│   │   ├── utils/         # 工具函数
│   │   └── types/         # TypeScript 类型定义
│   ├── prisma/           # 数据库相关
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── package.json
├── client/               # React 前端应用
│   ├── src/
│   │   ├── components/   # 可复用组件
│   │   ├── pages/        # 页面组件
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── services/     # API 调用
│   │   └── types/        # TypeScript 类型
│   └── package.json
├── ai-worker/            # Python AI 服务 (预留)
├── docs/                 # 项目文档
└── dev.sh               # 开发环境启动脚本
```

### 5.2 编码规范

#### TypeScript
- 使用严格的 TypeScript 配置 (`strict: true`)
- 所有 API 响应必须定义接口类型
- 避免使用 `any` 类型，优先使用 `unknown` 或具体类型

#### React 组件
- 使用函数式组件 + Hooks
- 遵循单一职责原则，每个组件只做一件事
- 使用 `memo` 优化性能，避免不必要的重渲染

#### API 设计
- 统一的错误处理格式
- 使用 HTTP 状态码表示请求状态
- 支持分页查询 (page, limit)

### 5.3 Git 工作流

```
main (生产分支)
├── develop (开发分支)
│   ├── feature/school-management
│   ├── feature/student-crud
│   └── feature/real-time-sync
└── hotfix/critical-bug-fix
```

---

## 第六部分：部署与运维

### 6.1 Sealos 部署配置

```yaml
# sealos.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arkok-v2
spec:
  replicas: 2
  selector:
    matchLabels:
      app: arkok-v2
  template:
    metadata:
      labels:
        app: arkok-v2
    spec:
      containers:
      - name: arkok-v2
        image: arkok-v2:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: arkok-secrets
              key: database-url
```

### 6.2 环境变量配置

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://your-domain.com
```

### 6.3 监控与日志

- **应用监控:** 使用 PM2 进行进程管理
- **性能监控:** 集成 APM 工具 (如 New Relic 或 DataDog)
- **日志聚合:** 使用 Winston + Elasticsearch
- **错误追踪:** 集成 Sentry

---

## 第七部分：安全策略

### 7.1 身份认证与授权

```typescript
// JWT 认证中间件
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};
```

### 7.2 数据安全

- 所有敏感数据使用 bcrypt 加密存储
- API 请求速率限制 (Rate Limiting)
- SQL 注入防护 (使用 Prisma ORM)
- XSS 防护 (输入验证和输出编码)
- CSRF 防护 (使用 CSRF token)

### 7.3 网络安全

- 强制使用 HTTPS
- 设置安全的 CORS 策略
- 使用 Helmet.js 设置安全头部
- 定期更新依赖包，修复安全漏洞

---

## 第八部分：性能优化

### 8.1 数据库优化

```sql
-- 创建复合索引优化查询
CREATE INDEX idx_students_school_class ON students(school_id, class_room);
CREATE INDEX idx_task_records_school_student ON task_records(school_id, student_id);
CREATE INDEX idx_task_records_created_at ON task_records(created_at DESC);
```

### 8.2 缓存策略

```typescript
// Redis 缓存示例
const getCachedData = async (key: string) => {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
};

const setCachedData = async (key: string, data: any, ttl = 3600) => {
  await redis.setex(key, ttl, JSON.stringify(data));
};
```

### 8.3 前端优化

- 代码分割 (Code Splitting)
- 懒加载 (Lazy Loading)
- 图片优化和 CDN 加速
- Service Worker 缓存策略

---

## 第九部分：测试策略

### 9.1 测试金字塔

```
          E2E Tests (10%)
         /               \
    Integration Tests (20%)
   /                       \
Unit Tests (70%)
```

### 9.2 测试工具栈

- **单元测试:** Jest + React Testing Library
- **集成测试:** Supertest (API 测试)
- **E2E 测试:** Playwright
- **性能测试:** Artillery

### 9.3 测试覆盖率目标

- 单元测试覆盖率: > 80%
- 集成测试覆盖率: > 60%
- 关键路径 E2E 测试: 100%

---

## 第十部分：未来规划与路线图

### 10.1 第二阶段：主体结构施工 (2025-12 ~ 2026-01)

**目标：** 完成 MVP 功能，实现多校区完整闭环

**核心任务：**
- [ ] 手机端 UI 完整移植 (保留 V1 交互习惯)
- [ ] 大屏端 "星际指挥官" UI 设计与实现
- [ ] 完整的 CRUD API 实现
- [ ] 实时数据同步 (Socket.io)
- [ ] 基础的用户认证和权限管理

### 10.2 第三阶段：高级功能开发 (2026-02 ~ 2026-03)

**目标：** AI 功能集成，打造智能化教育平台

**核心任务：**
- [ ] Python AI 服务开发
- [ ] OCR 作业批改功能
- [ ] 智能错题分析
- [ ] 个性化学习推荐
- [ ] 数据可视化看板

### 10.3 第四阶段：商业化准备 (2026-04 ~ 2026-05)

**目标：** 多租户 SaaS 化，支持商业化运营

**核心任务：**
- [ ] 多租户管理后台
- [ ] 计费和订阅系统
- [ ] 数据导入导出工具
- [ ] 性能优化和扩容
- [ ] 安全加固和合规

### 10.4 第五阶段：规模化运营 (2026-06+)

**目标：** 支撑 1000+ 校区，成为行业标杆

**核心任务：**
- [ ] 微服务架构重构
- [ ] 国际化和本地化
- [ ] 开放 API 平台
- [ ] 移动端 App 开发
- [ ] AI 模型优化和训练

---

## 第十一部分：常见问题解答

### Q1: 为什么选择多租户架构而不是为每个学校独立部署？

**A:** 多租户架构具有以下优势：
- **成本效益:** 共享基础设施，降低运营成本
- **维护便利:** 统一更新和升级，无需逐个部署
- **数据洞察:** 跨校区的数据分析能力
- **快速扩展:** 新校区快速上线，无需重新部署

### Q2: 如何保证不同校区数据的隔离性？

**A:** 通过三个层面保证数据隔离：
1. **数据库层:** 使用 `schoolId` 作为外键，所有查询都包含校区过滤
2. **API 层:** 路由设计中包含 `schoolId` 参数，确保 API 调用隔离
3. **应用层:** Socket.io 房间按校区隔离，实时推送不会跨区

### Q3: 为什么选择 Prisma 而不是其他 ORM？

**A:** Prisma 的优势：
- **类型安全:** 自动生成 TypeScript 类型
- **开发效率:** 优秀的 DX 和自动完成
- **数据库迁移:** 内置迁移工具，简化 schema 管理
- **性能优化:** 查询优化和连接池管理

### Q4: 如何处理 AI 服务的高延迟问题？

**A:** 采用异步处理策略：
1. **任务队列:** 使用 Redis 作为任务队列，AI 任务异步处理
2. **WebSocket 推送:** 处理完成后通过 Socket.io 推送结果
3. **超时处理:** 设置合理的超时时间，避免长时间阻塞
4. **降级策略:** AI 服务不可用时提供基础功能

### Q5: 如何保证平台的可扩展性？

**A:** 从多个维度保证可扩展性：
1. **水平扩展:** 无状态的服务设计，支持负载均衡
2. **数据库分片:** 按校区或地区进行数据分片
3. **缓存策略:** 多层缓存减少数据库压力
4. **微服务架构:** 后期可拆分为独立的微服务

---

## 结语

ArkOK V2 不仅仅是一个技术升级，更是对未来教育模式的深度思考和实践。通过现代化的架构设计、智能化的功能集成和可持续的发展规划，我们致力于打造一个真正能够改变教育的平台。

第一阶段的地基工程已经为我们奠定了坚实的基础，接下来我们将按照既定的路线图，稳步推进各个阶段的开发工作。我们相信，在不久的将来，ArkOK V2 将成为智慧教育领域的标杆产品。

**让我们一起，用技术赋能教育，用创新改变未来！** 🚀

---

*本文档将持续更新，记录项目的进展和决策过程。如有任何问题或建议，欢迎提出讨论。*
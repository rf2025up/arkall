# 📜 ArkOK V2 最终技术宪法 (The Constitution)
**版本**: 4.0 (Production Gold)
**核心原则**: 本文档是 ArkOK V2 项目的最高行为准则。任何代码提交、架构决策或 AI 指令，都不得与本文档冲突。

---

## 第一章：架构与部署 (The Bedrock)

### 第1条：统一后端托管
- **(1.1)** 系统必须采用"统一后端托管"模式。Node.js (Express) 服务作为**唯一入口**，监听 **3000** 端口。
- **(1.2)** 后端服务必须同时负责：
    - `a)` 提供 `/api/*` 路径下的所有业务 API。
    - `b)` 托管前端静态资源 (`client/dist`)，并为所有非 API 请求返回 `index.html`。
- **(1.3)** 严禁引入任何形式的独立代理服务器（如 `proxy-server.js`）。

### 第2条：生产环境部署
- **(2.3)** 严禁在生产环境中使用 `ts-node-dev` 或 `vite` 开发服务器。

---

## 第二章：数据库与数据模型 (The Source of Truth)

### 第3条：Schema 即真理
- **(3.1)** `server/prisma/schema.prisma` 是**唯一、绝对**的数据模型定义。
- **(3.2)** **核心模型定义**:
    - **用户模型**: 必须命名为 `Teacher`。包含 `role` (`ADMIN`/`TEACHER`)、`schoolId`、`primaryClassName`。
    - **学生模型**: 必须命名为 `Student`。包含 `teacherId`、`schoolId`、`points` (非`score`)、`exp` (非`total_exp`)、`isActive` (非`deletedAt`)。
- **(3.3)** 所有后端代码在进行数据库操作时，必须严格遵守上述模型名和字段名。

### 第4条：数据库访问规范
- **(4.1)** **服务层独占**: 数据库操作（`PrismaClient` 的使用）**必须且只能**在 `server/src/services/` 目录下的文件中进行。
- **(4.2)** **自包含模式**: 每个 Service 类必须内部自行实例化 `private prisma = new PrismaClient()`。严禁通过构造函数注入。
- **(4.3)** **路由层纯净**: `server/src/routes/` 目录下的文件**严禁**包含任何 `PrismaClient` 实例或直接的数据库查询代码。
- **(4.4)** **PostgreSQL 字段名规范**: 由于 PostgreSQL 对标识符大小写敏感，所有使用原始 SQL (`$queryRaw`) 的查询必须遵守：
    - `a)` **表名**: 使用小写字母，不加引号（例如：`lesson_plans`，而非 `"lesson_plans"`）。
    - `b)` **camelCase 字段名**: 必须使用双引号包裹（例如：`"schoolId"`，`"teacherId"`，`"createdAt"`）。
    - `c)` **类型转换**: JSONB 字段必须添加 `::jsonb` 转换，TIMESTAMP 字段必须添加 `::timestamp` 转换。
    - `d)` **优先 Prisma ORM**: 除非绝对必要，优先使用 Prisma ORM 查询而非原始 SQL。

---

## 第三章：业务逻辑与权限 (The Rules of Engagement)

### 第5条：师生强绑定模型
- **(5.1)** 学生的**核心归属**由 `teacherId` 决定。`className` 仅为显示标签。
- **(5.2)** **老师 (TEACHER)** 权限：
    - `a)` 默认数据视图（"我的学生"）必须强制过滤 `where: { teacherId: currentUser.id }`。
    - `b)` 发布 LMS 任务 (`publishPlan`) 时，必须强制只为 `teacherId === currentUser.id` 的学生创建记录。
- **(5.3)** **校长 (ADMIN)** 权限：
    - `a)` 默认拥有"全校视图"权限，查询时不应受 `teacherId` 限制。
    - `b)` 发布 LMS 任务时，必须"下沉"到具体班级 (`targetClassName`)，严禁在"全校视图"下发布。

### 第6条：任务生命周期
- **(6.1)** **状态类任务 (课程进度)**: 采用"持久化"生命周期。老师不更新，则永久保留。
- **(6.2)** **动作类任务 (核心教法、过程任务、个性化)**: 采用"每日清空"生命周期。每次发布，都先归档（`isCurrent: false`）所有旧的动作类任务。

---

## 第四章：代码质量与开发流程 (The Craftsmanship)

### 第7条：TypeScript 铁律
- **(7.1)** **严禁 `as any`**: 必须定义明确的 `interface` 或 `type`。
- **(7.2)** **API 响应标准化**: 所有前端 API 请求必须通过 `apiService` 发出，并期望返回 `ApiResponse<T>` 结构。
- **(7.3)** **Request 扩展**: 必须通过 `declare global { namespace Express { ... } }` 扩展 `Request` 类型，严禁创建不兼容的 `AuthRequest`。

### 第8条：前端交互规范
- **(8.1)** **API 路径**: 所有前端组件中的 API 调用必须使用**相对路径** (如 `/students`)。`baseURL: '/api'` 的配置由 `api.service.ts` 统一负责。
- **(8.2)** **拒绝暴力刷新**: 严禁使用 `window.location.reload()` 刷新数据。必须通过状态管理（如 `fetchStudents()`）实现无感更新。
- **(8.3)** **UI 还原**: 所有 UI 相关的修复，必须以 `_LEGACY_ARCHIVE_DO_NOT_TOUCH` 中的旧代码和 `ref_images` 中的截图为最高参照。

### 第9条：AI 协作与防丢失协议 (The Protocol)
- **(9.1)** **文档即真理**: 所有开发活动都必须以 `docs/` 目录下的文档为准。
- **(9.2)** **启动自检**: AI 在新会话开始时，必须首先阅读 `ARCHITECTURE_WHITEPAPER.md`, `TASK_PROGRESS.md`, `ARKOK_V2_CONSTITUTION.md`。
- **(9.3)** **重启前强制存档 (Rule #7)**: 在执行 `npm run build` 或 `./dev.sh` 等高风险操作**之前**，必须先更新 `TASK_PROGRESS.md`，记录已完成的修改。这是**最高优先级**的防灾措施。

---

**本宪法自颁布之日起生效，对所有参与本项目的开发者（包括人类与 AI）具有最高约束力。**
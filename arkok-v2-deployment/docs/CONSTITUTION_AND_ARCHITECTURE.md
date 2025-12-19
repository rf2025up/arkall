# ArkOK V2 全局技术架构与业务规范宪法 (2025-12-19 最终版)

## 1. 核心宪法：软件工程最佳实践
本项目严格遵循以下软件工程原则，所有后续开发必须强制执行：

- **SOLID 原则**:
  - **S (单一职责)**: 服务层（Service）处理业务，路由层（Route）处理分发，模型层（Prisma）处理持久化。
  - **D (依赖倒置)**: 模块间通过接口和 Service 实例交互，严禁跨模块直接操作底层 DB。
- **KISS & DRY**: 拒绝过度设计，严禁重复逻辑。
- **YAGNI**: 仅实现当前业务明确需求的功能。

---

## 2. 技术栈与模型规范

### 2.1 核心技术栈
- **后端**: Node.js + Express + TypeScript (strict mode).
- **ORM**: Prisma (强制使用复数模型名).
- **前端**: React + Vite + Tailwind CSS + Lucide Icons.
- **实时性**: Socket.io (带 JWT 认证与房间隔离).

### 2.2 数据库规范 (强制)
- **表命名**: 必须使用复数形式，如 `students`, `task_records`, `lesson_plans`, `teachers`。
- **ID 策略**: 所有 `create` 操作必须由后端手动注入 `id: randomUUID()`，严禁依赖自增。
- **时区处理**: 业务逻辑统一采用北京时间 (UTC+8)，通过显式偏移量 (`+08:00`) 处理日期范围。
- **时间戳**: 每次 `create` 或 `update` 必须手动更新 `updatedAt: new Date()`。

---

## 3. 业务功能模块逻辑

### 3.1 备课发布系统 (LMS Prep)
- **投送范围**: 严格基于“师生绑定”逻辑（`students.teacherId === currentUserId`）。
- **覆盖逻辑 (Override)**: 老师在同一天多次发布时，系统自动 `deleteMany` 清理当日旧的任务记录（保留 `isOverridden: true` 的手动调整记录），防止数据累积。
- **动态注入**: 任务记录中的 `unit` 和 `lesson` 字段由发布时的 `courseInfo` 实时注入，严禁硬编码。
- **物理快照**: 发布成功时同步更新 `students` 表的 `currentUnit`, `currentLesson` 字段，确保列表页即时响应。

### 3.2 过关质检系统 (QC System)
- **状态流转**:
  - 核心接口: `PATCH /api/lms/records/:recordId/status`。
  - 状态机: `PENDING` -> `SUBMITTED` -> `COMPLETED`。
- **击穿式更新**: 为解决生产环境性能/权限损耗，状态更新接口直接在路由层执行精准 `update`。
- **辅导记录**: 每次点击“辅导”按钮触发 `recordAttempt` 接口，`attempts` 计数递增。

### 3.3 全学期过关地图 (Academic Map)
- **聚合逻辑**: 动态读取 `task_records` 中 `type === 'QC'` 的所有历史记录。
- **优先级**: 手动修改进度的 `isOverridden` 标志具有最高优先级，覆盖备课页的统一设置。

---

## 4. 全局字段锁定协议 (Field Mapping)

| 字段名 | 统一标准 | 弃用/严禁 |
| :--- | :--- | :--- |
| `className` | 班级名称 (e.g., "二年级1班") | `class_name`, `grade`, `clazz` |
| `recordId` | `task_records` 表的唯一主键 | `taskId` (指代模板ID时除外) |
| `educationalDomain` | 分类维度 (核心教学法/综合成长/基础作业) | 随意字符串 |
| `teacherId` | 关联教师的唯一标识 | `teacher_id` |

---

## 5. 网络与安全规范

- **CORS 策略**: 必须显式授权 `PATCH` 方法，允许 `Authorization` 和 `Content-Type` 标头。
- **API 标准**:
  - 前端统一使用 `apiService` 封装。
  - 严禁静默失败，所有 API 异常必须通过弹窗（Alert/Toast）展示具体 `response.message` 和 `status`。
- **路由优先级**: 具体的业务路由（如 `/api/lms`）必须置于通配符路由（如 `/api/records`）之前。

---

## 6. 环境与部署指南 (Sealos)

- **源码位置**: `/home/devbox/project/arkok-v2/server` (后端), `/client` (前端)。
- **编译命令**: `npm run build` (内部调用 `tsc`)。
- **运行命令**: `pm2 restart all`。
- **重要提醒**: 修改 `.ts` 路由后必须执行 `build` 并在 `dist` 目录生效，否则会出现 404。

---
*注：此文档为项目最高指导准则，重启环境后应首先加载此文档以恢复上下文。*

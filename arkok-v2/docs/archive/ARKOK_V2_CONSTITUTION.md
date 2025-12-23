# ArkOK V2 全局技术架构与业务规范宪法 (V5.0 Performance & Multi-End)

## 0. 版本说明
- **版本**: V5.0 (2025-12-21)
- **核心升级**: 引入 Prisma 共享单例模式，根治 API 超时；业务逻辑全面转向“极简标签化”驱动；明确多端（家长、大屏）数据同步准则。

---

## 1. 核心宪法：软件工程最佳实践
本项目严格遵循以下软件工程原则，所有后续开发必须强制执行：

- **SOLID 原则**:
  - **S (单一职责)**: 服务层（Service）处理业务，路由层（Route）处理分发，模型层（Prisma）处理持久化。
  - **D (依赖倒置)**: 模块间通过 Service 实例交互，严禁跨模块直接操作底层 DB。
- **KISS & DRY**: 拒绝过度设计，严禁重复逻辑。
- **YAGNI**: 仅实现当前业务明确阶段的需求。

---

## 2. 技术栈与模型规范

### 2.1 核心技术栈
- **后端**: Node.js + Express + TypeScript (Strict Mode).
- **ORM**: Prisma (强制使用复数模型名).
- **前端**: React 19 + Vite + Tailwind CSS + Lucide Icons.
- **实时性**: Socket.io (带 JWT 认证与房间隔离).

### 2.2 数据库规范 (强制)
- **命名规范**: 表名必须使用复数形式 (`students`, `task_records`)。
- **ID 策略**: 所有 `create` 操作必须由后端手动注入 `id: randomUUID()`，严禁依赖数据库自动生成 ID。
- **时区处理**: 业务逻辑统一采用北京时间 (UTC+8)，通过显式偏移量 (`+08:00`) 处理日期范围。
- **时间戳**: 充分利用 Prisma 的 `@updatedAt` 自动更新逻辑。手动维护时必须确保 `updatedAt: new Date()`。

---

## 3. 业务功能模块逻辑

### 3.1 任务分类与汇总逻辑 (极简原则)
- **扁平化管理**: 彻底废弃 `educationalDomain` 分类，统一使用 **Category (标签)**。
- **看板优先级 (QC Map)**: `type: 'QC'` 的任务记录具有“看板优先级”，是 **全学期地图 (Academic Map)** 的唯一数据引擎。
- **全量汇总 (Growth River)**: 所有核心教学法、综合成长、加餐定制统一标识为 `type: 'TASK'`，汇总至学生个人详情页的【任务达人】时间线。
- **成长行为同步**: PK 对决 (`PK`)、挑战 (`CHALLENGE`)、勋章颁发 (`BADGE`) 在产生业务记录的同时，必须产生一条对应的 `task_records` 进行数据汇总。

### 3.2 覆盖逻辑 (Override Policy)
- **发布覆盖**: 老师在同日多次发布时，系统自动清理旧任务记录（保留 `isOverridden: true` 的手动调整记录），防止数据堆积。
- **地图覆盖**: 学生详情页手动修改进度的 `isOverridden` 位具有最高优先级，覆盖备课页逻辑。

---

## 4. 高性能架构锁定协议

### 4.1 数据库访问层 (Database Access)
- **共享连接池 (Singleton)**: **严禁**在 Service 中独立实例化 `new PrismaClient()`。
- **依赖注入**: 整个应用生命周期内仅维护一个 `PrismaClient` 实例，由 `app.ts` 初始化并注入各 Service。
- **严禁越权**: 数据库操作必须 *仅* 在 `server/src/services/` 层进行。

### 4.2 全局字段映射 (Field Mapping)
| 字段名 | 统一标准 | 备注 |
| :--- | :--- | :--- |
| `playerA`, `playerB` | PK 参赛选手的关联名 | 针对 `pk_matches` 模型 |
| `winner` | PK 获胜者的关联名 | 针对 `pk_matches` 模型 |
| `category` | 业务标签 (如 "语文基础过关") | 核心分类字段 |
| `type` | 记录类型 (QC, TASK, HABIT, SPECIAL) | 路由分流与多端展示依据 |

---

## 5. 多端架构支持 (Multi-End System)

### 5.1 家长端 (ArkOK Family) - “一源多端”原则
- **数据一致性**: 家长端直接读取 `task_records`，严禁建立冗余的任务镜像表。
- **分类呈现**: 后端通过 `GROUP BY type, category` 逻辑，支撑家长端对学业、竞技、习惯的精细化查询。

### 5.2 大屏端 (Big Screen) - “事件优先”原则
- **极低延迟**: 所有 PK 结算必须先确保 Socket 信号发出，再完成持久化写入，保障前端战斗动画不因数据库等待而卡顿。

---

## 6. 环境与运维准则 (Sealos)
- **源码位置**: `/home/devbox/project/arkok-v2/` 目录下分为 `server` 与 `client`。
- **编译发布**: 修改路由或模型后，必须执行 `npm run build`。
- **上下文恢复**: 每次 AI Agent 介入任务前，必须首先通读此宪法及相关 PRD 文档。

---
*注：此文档为项目最高指导准则。任何代码提交如违反上述宪法，均视为严重 Bug。*

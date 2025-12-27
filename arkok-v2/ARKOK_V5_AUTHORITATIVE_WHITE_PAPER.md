# ArkOK V2 权威技术白皮书 (V5.0 Performance & Full-Stack Edition)

**版本:** V5.0
**更新日期:** 2025-12-23
**状态:** 唯一权威事实 (SSOT)
**核心准则:** 遵循《技术宪法 V5.0》

---

## 1. 项目概述与灵魂 (Educational Philosophy)

### 1.1 核心价值主张
ArkOK V2 是一套基于**“过程反馈驱动”**的智慧教育 SaaS 平台。我们视**自主学习力**为孩子核心武器，通过反馈驱动和最近发展区理论，鼓励孩子注重过程，持续自我迭代。

### 1.2 系统特性
- **反馈即激励**: 习惯、PK、挑战等所有行为均实时转化为积分与经验。
- **多租户架构**: 基于 `schoolId` 的原生物理隔离，支持商业化大规模扩容。
- **统一托管模式**: 单端口 (3000) 同时承载前端 React 产物与后端 API，彻底规避跨域与部署白屏问题。

---

## 2. V5.0 核心架构设计

### 2.1 高性能 Prisma 单例锁 (Singleton)
为根治 V2.0 时代的数据库连接泄露与 API 10s 超时问题，V5.0 强制执行单例注入准则：
- **严禁**在 Service 层 `new PrismaClient()`。
- **统一注入**: 由 `app.ts` 初始化单一 `Prisma` 实例，通过构造函数注入各 Service 模块。

### 2.2 技术栈全景 (Tech Stack)
- **前端**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons。
- **后端**: Node.js + Express 4.18 + TypeScript (Strict Mode)。
- **持久层**: Prisma 5.7 + PostgreSQL。
- **通讯层**: Socket.io (带房间隔离与 JWT 认证)。

### 2.3 软件工程规范
- **单一职责 (SRP)**: Service 处理业务逻辑，Route 负责分发，Prisma 负责数据。
- **依赖倒置 (DIP)**: 模块间通过 Service 实例交互，严禁跨模块直接操作底层 DB。

---

## 3. 业务功能体系与"成长长河"引擎

### 3.1 核心数据流向：SSOT (单事实来源)
全站 **9 大模块**的数据最终必须**汇流 (Sink)** 入 `task_records` 表，驱动个人详情页"成长长河 (Growth River)"时间线。

#### 3.1.1 完整模块汇流表

| 业务源模块 | 数据源表 | type 字段 | task_category 字段 | 核心准则 | 汇总逻辑 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. LMS 进度系统** | lesson_plans | QC, PROJECT | PROGRESS | 驱动学业进度 | 全学期地图的唯一数据源 |
| **2. 勋章系统** | badges | BADGE | BADGE | 成就感 | 颁发瞬间记录 |
| **3. PK 对决** | pk_matches | PK, PK_RESULT | PK | 强反馈 | 参与记录 + 结算记录 |
| **4. 挑战赛** | challenges | CHALLENGE, SPECIAL | CHALLENGE | 团队协作 | 参加记录 + 完成记录 |
| **5. 习惯打卡** | habit_logs | HABIT | HABIT | 连续粘性 | 每日打卡即生成流水 |
| **6. 个性化辅导** | personalized_tutoring_plans | SPECIAL | SPECIAL | **单态触发** | **仅完成时生成**，不记录进行态 |
| **7. 手动任务** | (teacher 手动创建) | TASK, METHODOLOGY | TASK, METHODOLOGY | 任务反馈 | 汇总至成长时间线 |
| **8. 学生转移** | students | (无) | - | 师生关系变更 | **0 exp**，仅记录转移历史 |
| **9. 其他操作** | - | DAILY | TASK | 日常行为 | 习惯打卡等日常操作 |

#### 3.1.2 Type / Task_Category 双重分类系统

**设计原则**：实现清晰的一一对应映射，避免数据污染。

**Type（8 种精确业务类型）**：
```typescript
enum TaskType {
  QC,           // 质量检查
  PROJECT,      // 项目作业
  TASK,         // 常规任务
  METHODOLOGY,  // 学习方法
  SPECIAL,      // 特殊活动
  CHALLENGE,    // 挑战赛
  BADGE,        // 勋章
  HABIT,        // 习惯打卡
  PK,           // PK 对决参与
  PK_RESULT     // PK 对决结算
}
```

**Task_Category（9 种分类）**：
```typescript
enum TaskCategory {
  PROGRESS,      // 进度类（QC/PROJECT）
  METHODOLOGY,   // 方法类
  TASK,          // 任务类
  SPECIAL,       // 特殊类
  CHALLENGE,     // 挑战类
  PK,            // PK 类
  BADGE,         // 勋章类
  HABIT          // 习惯类
}
```

**映射关系（一一对应）**：
```
QC           → PROGRESS
PROJECT      → PROGRESS
TASK         → TASK
METHODOLOGY  → METHODOLOGY
SPECIAL      → SPECIAL / CHALLENGE
CHALLENGE    → CHALLENGE
PK           → PK
PK_RESULT    → PK
BADGE        → BADGE
HABIT        → HABIT
```

#### 3.1.3 前端面板过滤规则

**个人详情页 (StudentDetail.tsx)**：
- **任务达人面板**：`type ∈ ['TASK', 'METHODOLOGY', 'SPECIAL']`
- **挑战面板**：`type='CHALLENGE' && task_category='CHALLENGE'`（严格匹配，排除 PK/勋章污染）
- **PK 面板**：`type ∈ ['PK', 'PK_RESULT']`
- **勋章面板**：`type='BADGE'`

**家长端 (TodayTimeline.tsx)**：
- 按日期聚合 `task_records`
- 跳过：`task_category ∈ ['PK', 'BADGE', 'HABIT']`（这些从独立表获取）
- 显示卡片类型：`QC_GROUP`, `TASK`, `METHODOLOGY`, `SPECIAL`, `CHALLENGE`, `PLAN_ANNOUNCEMENT`

### 3.2 覆盖逻辑 (Override Policy)
- **同日覆盖**: 老师在同日多次发布备课计划时，系统原子化清理当日旧记录（保留 `isOverridden: true` 的手动微调项）。
- **人工最高优先级**: 详情页手动修改产生的 `isOverridden` 标记将覆盖一切自动化生成逻辑。

---

## 4. 积分与成长体系 (Gamification)

### 4.1 积分 (Points) vs 经验值 (EXP)
- **积分**: 可正可负，用于商城消费或排行，反映当前活跃度。
- **经验值**: **只增不减**，反映学生长期积累的学业高度。
- **等级公式**: `Level = Math.floor(Math.sqrt(EXP) / 10) + 1`（开方算法，非线性增长）

### 4.2 完整加分规则体系（9 大模块）

#### 4.2.1 LMS 进度系统
**数据源**: `curriculum` 表
**Service**: `lms.service.ts:316, 742`

**加分规则**:
```typescript
expAwarded: task.expAwarded  // 从 curriculum 表的 exp 字段获取
```

| 任务类型 | 典型奖励 | 示例 |
|---------|---------|------|
| QC 任务 | 5 exp | "生字词听写", "课文背诵" |
| PROJECT 任务 | 30-50 exp | "阅读理解自主讲解" |

---

#### 4.2.2 勋章系统
**数据源**: `badges` 表
**Service**: `badge.service.ts:403, 506`

**加分规则**:
```typescript
expAwarded: 20  // 固定 20 exp，不可配置
pointsAwarded: 0  // 不奖励 points
```

**特点**: 每个勋章固定奖励 20 exp，在 `task_records` 中创建记录：`type='BADGE'`, `task_category='BADGE'`

**示例**: "获得勋章: 速度之星" → +20 exp

---

#### 4.2.3 PK 对决系统
**数据源**: `pk_matches` 表（metadata 字段）
**Service**: `pkmatch.service.ts:760-823`

**加分规则**:
```typescript
// 获胜方
expReward = metadata.expReward || 50;  // 默认 50 exp
pointsReward = metadata.pointsReward || 20;  // 默认 20 points

// 平局情况
halfExp = Math.floor(expReward / 2);  // 25 exp
halfPoints = Math.floor(pointsReward / 2);  // 10 points
```

**记录创建**:
1. PK 参与记录：`type='PK'`, `expAwarded=0`（仅记录参与）
2. PK 结果记录：`type='PK_RESULT'`, `expAwarded=50/25`（获胜或平局）

**示例**:
- "PK对决获胜: 阅读" → +50 exp, +20 points
- "PK对决平局: 复盘比赛" → +25 exp, +10 points

---

#### 4.2.4 挑战赛系统
**数据源**: `challenges` 表（rewardExp, rewardPoints 字段）
**Service**: `challenge.service.ts:439, 852`

**加分规则**:
```typescript
// 参加挑战
type: 'CHALLENGE',
task_category: 'CHALLENGE',
expAwarded: challenge.rewardExp  // 默认 50 exp

// 完成挑战（额外奖励）
type: 'SPECIAL',
task_category: 'CHALLENGE',
expAwarded: challenge.rewardExp  // 额外 50 exp
```

**特点**: 同一个挑战最多获得 2 次加分（参加 + 完成）

**示例**:
- "参加挑战: 30秒背诵" → +50 exp
- "挑战赛: 30秒背诵" → +50 exp（完成奖励）

---

#### 4.2.5 习惯打卡系统
**数据源**: `habits` 表（expReward, pointsReward 字段）
**Service**: `habit.service.ts:179`

**加分规则**:
```typescript
// 创建习惯时配置
expReward: number  // 默认 5
pointsReward?: number  // 可选

// 打卡时从 habit 获取奖励
expAwarded: habit.expReward
pointsAwarded: habit.pointsReward
```

**典型值**: 默认 5 exp，可配置 10-20 exp

**示例**: "习惯打卡: 字字开花" → +10 exp

---

#### 4.2.6 个性化辅导系统
**数据源**: `personalized_tutoring_plans` 表（expReward, pointsReward 字段）
**Service**: `personalized-tutoring.service.ts:363-383`

**加分规则**:
```typescript
// 创建辅导计划时配置
expReward: 50  // 默认 50
pointsReward: 20  // 默认 20

// 完成辅导时发放
await studentService.updateStudentExp(studentId, plan.expReward, 'personalized_tutoring_complete');
await studentService.updateStudentPoints(studentId, plan.pointsReward, 'personalized_tutoring_complete');
```

**特点**: 完成后直接更新 `students` 表的 `exp` 和 `points` 字段，标记 `expAwarded=true` 和 `pointsAwarded=true`

**示例**: "完成1v1讲解：数学专题" → +50 exp, +20 points

---

#### 4.2.7 手动任务（Teacher 手动创建）
**数据源**: 老师手动创建
**Service**: `lms.service.ts:742`

**加分规则**:
```typescript
// QC 任务
expAwarded: 5  // 固定

// 方法任务
expAwarded: 5-10  // 根据内容决定

// 常规任务
expAwarded: 5-10  // 根据内容决定
```

**典型值**: QC 任务 5 exp，方法任务 5 exp，常规任务 5-10 exp

**示例**:
- "书写工整" → +10 exp
- "课文背诵" → +5 exp
- "用'分步法'讲解数学题" → +5 exp

---

#### 4.2.8 学生转移
**数据源**: `students` 表（转班/转老师）
**Service**: `student.service.ts:1094`

**加分规则**:
```typescript
expAwarded: 0  // 不加分，仅记录
```

**特点**: 仅在 `task_records` 创建记录，不增加 exp 或 points，用于追踪学生转移历史

**示例**: "学生转移到李老师班级" → +0 exp

---

#### 4.2.9 其他操作
**数据源**: 日常行为
**Service**: 各个 service

**加分规则**:
```typescript
// 习惯打卡（每日打卡）
type: 'DAILY',
task_category: 'TASK',
expAwarded: 10  // 固定 10 exp
```

**示例**:
- "桌面整洁" → +10 exp
- "课外阅读30分钟" → +5 exp

---

### 4.3 Points 使用汇总

Points 积分系统相对简单，仅在以下模块中使用：

| 模块 | Points 加分 | 说明 |
|------|------------|------|
| PK 对决获胜 | +20 points | 默认值，可配置 |
| PK 对决平局 | +10 points | 默认值的一半 |
| 个性化辅导完成 | +20 points | 默认值，可配置 |
| **其他模块** | **0 points** | 仅 exp，不奖励 points |

**注意**: 大部分模块只奖励 exp，不奖励 points。Points 主要用于 PK 对决和个性化辅导。

### 4.4 积分类别定义
1. **学习成果类**: 课堂表现、高价值作业。
2. **自主管理类**: 整理、纪律、时间管理。
3. **负向细则**: 迟到、违纪、损坏公物（仅扣除积分，不扣除经验值）。

---

## 5. 数据模型辞典 (Authority Dictionary)

### 5.1 数据库命名准则 (Prisma)
- **强制复数蛇形**: `students`, `task_records`, `lesson_plans`。
- **ID 策略**: 所有操作必须由后端手动注入 `randomUUID()`，严禁依赖 Auto-increment。
- **时区策略**: 强制 UTC+8，日期格式统一为 `YYYY-MM-DD`。

### 5.2 核心模型概览
- **`students`**: 包含 `teacherId` (师生绑定)、`schoolId` (租户隔离)、`exp`、`points`。
- **`task_records`**: 核心流水表，包含 `isOverridden`、`content` (JSON 扩展)。
- **`lesson_plans`**: 教学计划，存储 `content.courseInfo` (学科-单元-课时快照)。

---

## 6. 多端同步规范 (Multi-End System)

### 6.1 家长端 (ArkOK Family) - “一源多端”
- 数据 0 延迟：直接基于 `task_records` 进行 `GROUP BY` 聚合显示，严禁建立冗余镜像表。

### 6.2 大屏端 (Big Screen) - “事件优先”
- Socket 信号必须先于 DB 操作发出，确保大屏特效的极致流畅，避免受到数据库 IO 的拖累。

---

## 7. UI 设计规范 (流光·智简 专家版)

### 7.1 材质与美学
- **玻璃拟态**: 应用 `backdrop-blur-md` 与高质量渐变色板。
- **Header 规范**: 统一垂直高度 `pt-8 pb-5`，圆角 `rounded-b-[30px]`。
- **分区逻辑**: 左侧承载核心身份/标题，右侧承载主操作，底部承载情境上下文。

---

## 8. 环境与部署

- **Sealos 运行环境**: 部署于 Kubernetes 容器，使用环境变量管理数据库连接。
- **构建指令**: 修改后端 Route 或前端 UI 后，必须手动执行 `npm run build` 以产生最新的静态托管资源。

---

## 10. 协同代理架构 (Flexible Proxy V5.0)

### 10.1 定义与核心逻辑
协同代理允许教师在无需切换账号的情况下，安全地代管其他同事的班级业务。

### 10.2 权限双轨制 (Permission Dual-Track)
系统通过 `isProxyMode` 状态精准隔离两套完全不同的业务心智：

| 操作路径 | 状态标识 | 视觉表现 | 核心权能 |
| :--- | :--- | :--- | :--- |
| **首页左上角临时切换** | `isProxyMode: false` | **活力橙 Header** | **抢人视图**: 仅限移入学生，锁定积分、签到与发布权。 |
| **我的页发起协同代理** | `isProxyMode: true` | **商务黑 Header** | **全权代理**: 解锁积分调整、批量签到、备课代发布等所有业务操作。 |

### 10.3 穿透规则 (Penetration Rules)
- **TEACHER (教师)**: 仅能穿透至同校区的其他 `TEACHER`。严禁窥探 `ADMIN` (校长) 视角，防止管理层数据泄露。
- **ADMIN (校长)**: 具备全校区穿透能力，可代管校内所有老师或协同管理其他管理员。

---

---
## 11. 全站性能与丝滑度准则 (V5.1 Performance Patch)

### 11.1 SWR (Stale-While-Revalidate) 渲染心智
- **秒开优先**: 导航回退或二次进入页面时，系统通过 `ApiService` 内存缓存立即渲染数据（Stale），同时在后台发起异步静默刷新（Revalidate）。
- **无感加载**: 只有在初始进入且无缓存时，才允许显示 Loading 骨架屏。

### 11.2 后端 Payload 极简下发
- **Prisma Select 约束**: 学生列表接口强制执行 `select` 过滤，严禁全量下发 `student` 模型。单个学生信息的包大小需控制在 300B 以内。

### 11.3 缓存一致性 (SSOT Invalidation)
- **突变失效原则**: 任何 `POST/PATCH` 操作（如打卡、加分）成功后，必须立即触发对应 GET 路由的缓存失效，确保 SSOT 数据的最终一致性。

---
*本项目正在持续进化，V5.1 性能补丁已由 Antigravity 于 2025-12-23 落地执行。*

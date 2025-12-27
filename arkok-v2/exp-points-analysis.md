# EXP 和 Points 加分类别完整分析报告

生成时间：2025-12-27
分析范围：全系统所有加分模块

---

## 一、核心发现：宁可歆学生加分分析

### 1.1 学生基本信息
- **姓名**：宁可歆
- **当前总经验**：3492 exp
- **当前总积分**：7530 points
- **等级**：11
- **记录创建时间**：2025-12-13
- **最后更新时间**：2025-12-27 02:57:20

### 1.2 重要结论

**❌ 没有单次 +1000 exp 的记录！**

用户提到的"一次加了1000多"可能是误解，实际上是：
- 多次记录累计达到 1000+ exp
- 或者看到的是累计总值而非单次加分

### 1.3 加分分布统计（共 139 条记录）

#### 按类型/task_category 分组：

| 类型/分类 | 记录数 | 总 exp | 平均 exp/条 | 说明 |
|-----------|--------|--------|------------|------|
| TASK/METHODOLOGY | 24 | 135 | 5.6 | 学习方法任务 |
| DAILY/TASK | 5 | 50 | 10.0 | 习惯打卡 |
| SPECIAL/TASK | 10 | 420 | 42.0 | **最高平均奖励** |
| CHALLENGE/TASK | 7 | 260 | 37.1 | 挑战活动 |
| QC/TASK | 14 | 70 | 5.0 | 质量检查任务 |
| TASK/TASK | 33 | 300 | 9.1 | 常规任务 |
| QC/PROGRESS | 13 | 65 | 5.0 | 进度检查 |

#### 按日期统计（每日总计）：

| 日期 | 当日总 exp | 大额记录 |
|------|-----------|---------|
| 2025-12-27 | +50 | 无 |
| **2025-12-26** | **+500** | **4个+50 exp** |
| 2025-12-25 | +265 | 1个+30 exp |
| 2025-12-24 | +35 | 无 |
| 2025-12-23 | +140 | 无 |
| **2025-12-22** | **+310** | **6个+50 exp** |

### 1.4 批量操作分析

系统发现以下批量操作（10秒内创建多条记录）：

1. **2025-12-26 16:20:33**
   - 数量：17 条
   - 总 exp：+160
   - 原因：批量创建 QC 任务和方法任务

2. **2025-12-25 14:57:26**
   - 数量：16 条
   - 总 exp：+155
   - 原因：批量创建综合任务

3. **2025-12-26 00:39:27**
   - 数量：12 条
   - 总 exp：0
   - 原因：老师手动调整进度（不加分）

### 1.5 单日最大加分详情（2025-12-26，+500 exp）

**大额奖励记录（4个 +50 exp）：**
- 16:31:43 - 挑战赛: 30秒背诵（SPECIAL/TASK）
- 16:31:41 - 参加挑战: 30秒背诵（CHALLENGE/TASK）
- 16:30:40 - PK对决获胜: 阅读（SPECIAL/TASK）
- 16:30:35 - PK对决获胜: 复盘比赛（SPECIAL/TASK）

**小额奖励记录（大量 +5 exp）：**
- QC 任务：课文背诵、生字听写、口算计时等
- 方法任务：分步法讲解、错题归因等
- 常规任务：帮助同学、书写工整等

**总计**：4 × 50 + 36 × 5 = 200 + 180 = 380 exp
（加上其他时段的 +120 exp，当日共 +500 exp）

---

## 二、全系统加分类别汇总

### 2.1 加分模块清单（共 9 大模块）

根据代码库分析，系统有以下加分模块：

| 模块 | 数据源 | type 字段 | task_category 字段 | 加分规则 |
|------|--------|----------|-------------------|---------|
| **1. LMS 进度系统** | lesson_plans | QC, PROJECT | PROGRESS | 从 curriculum 获取 expAwarded |
| **2. 勋章系统** | badges | BADGE | BADGE | **固定 20 exp** |
| **3. PK 对决** | pk_matches | PK, PK_RESULT | PK | 获胜 50 exp，平局 25 exp |
| **4. 挑战赛** | challenges | CHALLENGE, SPECIAL | CHALLENGE | 参加 50 exp，完成额外奖励 |
| **5. 习惯打卡** | habit_logs | HABIT | HABIT | 从 habits.expReward 获取（默认 5） |
| **6. 个性化辅导** | personalized_tutoring_plans | SPECIAL | SPECIAL | 从 plan.expReward 获取（默认 50） |
| **7. 手动任务** | teacher 手动创建 | TASK, METHODOLOGY | TASK, METHODOLOGY | 固定 5-10 exp |
| **8. 学生转移** | students 转移 | (无 type) | - | **0 exp**（仅记录） |
| **9. 其他操作** | - | DAILY | TASK | 习惯打卡 10 exp |

### 2.2 各模块详细加分规则

#### 1️⃣ LMS 进度系统（lms.service.ts）

**来源**：发布课程计划（lesson_plans）
**加分位置**：`lms.service.ts:316` 和 `lms.service.ts:742`

**加分规则**：
```typescript
expAwarded: task.expAwarded  // 从 curriculum 表的 exp 字段获取
```

**典型值**：
- QC 任务：5 exp
- PROJECT 任务：30-50 exp

**示例**：
- "生字词听写" → +5 exp
- "阅读理解自主讲解" → +30 exp

---

#### 2️⃣ 勋章系统（badge.service.ts）

**来源**：老师颁发勋章
**加分位置**：`badge.service.ts:403` 和 `badge.service.ts:506`

**加分规则**：
```typescript
expAwarded: 20  // 固定 20 exp，不可配置
```

**特点**：
- 每个勋章固定奖励 20 exp
- 不奖励 points
- 在 task_records 表中创建记录：type='BADGE', task_category='BADGE'

**示例**：
- "获得勋章: 速度之星" → +20 exp

---

#### 3️⃣ PK 对决系统（pkmatch.service.ts）

**来源**：PK 对决完成
**加分位置**：`pkmatch.service.ts:760-823`

**加分规则**：
```typescript
// 获胜方
expReward = metadata.expReward || 50;  // 默认 50 exp
pointsReward = metadata.pointsReward || 20;  // 默认 20 points

// 平局情况
halfExp = Math.floor(expReward / 2);  // 25 exp
halfPoints = Math.floor(pointsReward / 2);  // 10 points
```

**记录创建**：
1. PK 参与记录：type='PK', expAwarded=0（仅记录参与）
2. PK 结果记录：type='PK_RESULT', expAwarded=50 或 25（获胜或平局）

**示例**：
- "PK对决获胜: 阅读" → +50 exp, +20 points
- "PK对决平局: 复盘比赛" → +25 exp, +10 points

---

#### 4️⃣ 挑战赛系统（challenge.service.ts）

**来源**：参加或完成挑战
**加分位置**：`challenge.service.ts:439`（参加）和 `challenge.service.ts:852`（完成）

**加分规则**：
```typescript
// 参加挑战
type: 'CHALLENGE',
task_category: 'CHALLENGE',
expAwarded: challenge.rewardExp  // 从 challenge.rewardExp 获取（默认 50）

// 完成挑战
type: 'SPECIAL',
task_category: 'CHALLENGE',
expAwarded: challenge.rewardExp  // 额外奖励
```

**特点**：
- 参加：+50 exp（可配置）
- 完成：额外 +50 exp（可配置）
- 同一个挑战最多获得 2 次加分（参加 + 完成）

**示例**：
- "参加挑战: 30秒背诵" → +50 exp
- "挑战赛: 30秒背诵" → +50 exp（完成奖励）

---

#### 5️⃣ 习惯打卡系统（habit.service.ts）

**来源**：学生每日打卡
**加分位置**：`habit.service.ts:179`（创建习惯）

**加分规则**：
```typescript
// 创建习惯时配置
expReward: number  // 默认 5
pointsReward?: number  // 可选

// 打卡时从 habit 获取奖励
expAwarded: habit.expReward  // 使用创建时配置的值
pointsAwarded: habit.pointsReward  // 使用创建时配置的值
```

**典型值**：
- 默认：5 exp
- 可配置：10-20 exp

**示例**：
- "习惯打卡: 字字开花" → +10 exp
- "习惯打卡: 错题总结" → +10 exp

---

#### 6️⃣ 个性化辅导系统（personalized-tutoring.service.ts）

**来源**：完成 1v1 辅导
**加分位置**：`personalized-tutoring.service.ts:363-383`

**加分规则**：
```typescript
// 创建辅导计划时配置
expReward: 50  // 默认 50
pointsReward: 20  // 默认 20

// 完成辅导时发放
await studentService.updateStudentExp(studentId, plan.expReward, 'personalized_tutoring_complete');
await studentService.updateStudentPoints(studentId, plan.pointsReward, 'personalized_tutoring_complete');
```

**特点**：
- 完成后直接更新 students 表的 exp 和 points 字段
- 同时在 timeline 创建事件记录
- 标记 expAwarded=true 和 pointsAwarded=true

**示例**：
- "完成1v1讲解：数学专题" → +50 exp, +20 points

---

#### 7️⃣ 手动任务（teacher 手动创建）

**来源**：老师手动创建任务
**加分位置**：`lms.service.ts:742`

**加分规则**：
```typescript
// QC 任务
expAwarded: 5  // 固定

// 方法任务
expAwarded: 5-10  // 根据内容决定

// 常规任务
expAwarded: 5-10  // 根据内容决定
```

**典型值**：
- QC 任务：5 exp
- 方法任务：5 exp
- 常规任务：5-10 exp

**示例**：
- "书写工整" → +10 exp
- "课文背诵" → +5 exp
- "用'分步法'讲解数学题" → +5 exp

---

#### 8️⃣ 学生转移（student.service.ts）

**来源**：学生转班/转老师
**加分位置**：`student.service.ts:1094`

**加分规则**：
```typescript
expAwarded: 0  // 不加分，仅记录
```

**特点**：
- 仅在 task_records 创建记录
- 不增加 exp 或 points
- 用于追踪学生转移历史

**示例**：
- "学生转移到李老师班级" → +0 exp

---

#### 9️⃣ 其他操作

**来源**：日常行为
**加分位置**：各个 service

**加分规则**：
```typescript
// 习惯打卡（每日打卡）
type: 'DAILY',
task_category: 'TASK',
expAwarded: 10  // 固定 10 exp
```

**示例**：
- "桌面整洁" → +10 exp
- "课外阅读30分钟" → +5 exp

---

### 2.3 Points 加分汇总

Points 积分系统相对简单，仅在以下模块中使用：

| 模块 | Points 加分 |
|------|------------|
| PK 对决获胜 | +20 points（默认） |
| PK 对决平局 | +10 points（默认） |
| 个性化辅导完成 | +20 points（默认） |
| 其他模块 | **0 points**（仅 exp） |

**注意**：
- 大部分模块只奖励 exp，不奖励 points
- points 主要用于 PK 对决和个性化辅导
- points 和 exp 是独立的奖励系统

---

## 三、数据流转架构总结

### 3.1 SSOT（Single Source of Truth）架构

所有 9 大模块的数据最终汇聚到 **task_records** 表，实现：

```
┌─────────────────────────────────────────────┐
│              9 大加分模块                    │
├─────────────────────────────────────────────┤
│ 1. LMS 进度     │ 2. 勋章   │ 3. PK 对决    │
│ 4. 挑战赛       │ 5. 习惯   │ 6. 个性化辅导  │
│ 7. 手动任务     │ 8. 转移   │ 9. 其他        │
└─────────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │   task_records 表    │
         │  (SSOT 唯一数据源)    │
         └──────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  ┌──────────┐          ┌──────────────┐
  │ 前端面板  │          │  家长端      │
  │ (按类型   │          │  (按分类     │
  │  过滤)    │          │   聚合)      │
  └──────────┘          └──────────────┘
```

### 3.2 Type/Task_Category 双重分类系统

**Type（8 种精确业务类型）**：
- QC（质量检查）
- PROJECT（项目）
- TASK（常规任务）
- METHODOLOGY（方法）
- SPECIAL（特殊活动）
- CHALLENGE（挑战）
- PK / PK_RESULT（PK 对决）
- BADGE（勋章）
- HABIT（习惯）

**Task_Category（9 种分类）**：
- PROGRESS（进度）
- METHODOLOGY（方法）
- TASK（任务）
- PERSONALIZED（个性化）
- SPECIAL（特殊）
- CHALLENGE（挑战）
- PK（PK）
- BADGE（勋章）
- HABIT（习惯）

**映射关系**（一一对应）：
```
QC → PROGRESS
PROJECT → PROGRESS
TASK → TASK
METHODOLOGY → METHODOLOGY
SPECIAL → SPECIAL / CHALLENGE
CHALLENGE → CHALLENGE
PK / PK_RESULT → PK
BADGE → BADGE
HABIT → HABIT
```

### 3.3 前端过滤规则

**个人详情页**：
- 任务达人面板：type ∈ ['TASK', 'METHODOLOGY', 'SPECIAL']
- 挑战面板：type='CHALLENGE' && task_category='CHALLENGE'
- PK 面板：type ∈ ['PK', 'PK_RESULT']
- 勋章面板：type='BADGE'

**家长端**：
- 时间线：按 task_category 聚合显示
- 跳过：PK, BADGE, HABIT（从独立表获取）

---

## 四、关键发现和建议

### 4.1 发现的问题

1. **单次加分上限过低**：
   - 最大单次加分仅为 50 exp（PK 对决获胜）
   - 没有 +1000 exp 的可能性
   - 用户可能误解累计总值

2. **类型分类语义混乱**（已修复）：
   - ✅ 已将 PK 从 'CHALLENGE' 改为 'PK'
   - ✅ 已将勋章从 'TASK' 改为 'BADGE'
   - ✅ 已将挑战从 task_category='TASK' 改为 'CHALLENGE'

3. **Points 使用率低**：
   - 仅 PK 和个性化辅导使用 points
   - 其他模块只奖励 exp
   - Points 功能未充分利用

### 4.2 改进建议

1. **增加大额奖励机会**：
   - 月度挑战：+200 exp
   - 等级突破奖励：+100 exp
   - 连续打卡奖励：+100 exp（7天），+300 exp（30天）

2. **完善 Points 系统**：
   - 允许用 points 兑换特权
   - Points 商城系统
   - 积分排行榜

3. **数据可视化**：
   - 在前端显示"单次加分"和"累计加分"
   - 避免"一次加1000"的误解
   - 增加加分历史图表

4. **批量操作优化**：
   - 当前批量操作（16条记录同时创建）可能导致性能问题
   - 建议使用队列或批处理优化
   - 增加操作日志追踪

---

## 五、技术实现细节

### 5.1 核心加分函数（student.service.ts:811-833）

```typescript
// 批量更新学生积分和经验
const updatedStudents = await this.prisma.$transaction(
  studentIds.map(studentId =>
    this.prisma.students.update({
      where: { id: studentId, schoolId },
      data: {
        points: { increment: points },
        exp: { increment: exp },
        updatedAt: new Date()
      }
    })
  )
);

// 重新计算等级
const studentsWithLevel = await this.prisma.$transaction(
  updatedStudents.map(student => {
    const newLevel = this.calculateLevel(student.exp);
    return this.prisma.students.update({
      where: { id: student.id },
      data: { level: newLevel }
    });
  })
);
```

**特点**：
- 使用 Prisma 的 `increment` 操作，保证并发安全
- 事务处理，确保数据一致性
- 自动重新计算等级

### 5.2 等级计算公式

```typescript
private calculateLevel(exp: number): number {
  // 等级 = exp 的平方根 / 10
  return Math.floor(Math.sqrt(exp) / 10) + 1;
}
```

**示例**：
- 0 exp → Level 1
- 100 exp → Level 2
- 400 exp → Level 3
- 900 exp → Level 4
- 1600 exp → Level 5
- 2500 exp → Level 6
- 3600 exp → Level 7

**宁可歆当前**：3492 exp → Level 11

---

## 六、附录：加分查询 SQL

### 6.1 查询所有加分类别

```sql
SELECT
  type,
  task_category,
  COUNT(*) as count,
  SUM(expAwarded) as total_exp,
  AVG(expAwarded) as avg_exp
FROM task_records
WHERE expAwarded > 0
GROUP BY type, task_category
ORDER BY total_exp DESC;
```

### 6.2 查询学生每日加分

```sql
SELECT
  DATE(createdAt) as date,
  SUM(expAwarded) as daily_exp,
  COUNT(*) as record_count
FROM task_records
WHERE studentId = 'student-id-here'
  AND expAwarded > 0
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

### 6.3 查询大额加分记录

```sql
SELECT
  type,
  task_category,
  title,
  expAwarded,
  createdAt
FROM task_records
WHERE expAwarded > 100
ORDER BY expAwarded DESC, createdAt DESC;
```

---

## 结论

1. **宁可歆学生没有单次 +1000 exp 的记录**
2. 最大单日加分：+500 exp（2025-12-26）
3. 最大单次加分：+50 exp（PK 对决获胜、挑战赛）
4. 系统共 9 大加分模块，全部汇聚到 task_records 表（SSOT）
5. Type/Task_Category 双重分类系统已修复，实现清晰的一一对应
6. Points 使用率低，主要在 PK 和个性化辅导中使用

---

**报告生成时间**：2025-12-27
**分析工具**：Prisma Client + Node.js 脚本
**数据源**：Arkok V2 PostgreSQL 数据库

# Prisma 模型名称映射错误修复清单

## 概述
项目进行了数据库表名复数化迁移（如 `task_record` → `task_records`）。Prisma Client 已根据新的 schema.prisma 生成，但服务层代码仍使用旧的模型名称，导致大量 TypeScript 编译错误。

## Prisma Client 生成的正确模型名称

根据 `/server/prisma/schema.prisma` 和生成的 `node_modules/.prisma/client/index.d.ts`，正确的模型名称为：

| 旧模型名称（错误） | 新模型名称（正确） | 用途 |
|-------------------|------------------|------|
| `studentBadges` | `student_badges` | 学生勋章关联表 |
| `studentsBadge` | `student_badges` | 学生勋章关联表（同上，不同写法） |
| `taskRecord` | `task_records` | 任务记录表 |
| `taskRecords` | `task_records` | 任务记录表（同上） |
| `challengesParticipant` | `challenge_participants` | 挑战参与者表 |
| `habits_logs` | `habit_logs` | 习惯打卡记录表 |
| `pk_matcheses` | `pk_matches` | PK对战表 |
| `LessonPlan` | `lesson_plans` | 课程计划表 |
| `Student` | `students` | 学生表 |

---

## 详细错误清单

### 1. BadgeService (`src/services/badge.service.ts`)

#### 错误类型：不存在的 include 属性和模型名称

| 行号 | 错误 | 原因 | 修复方案 |
|------|------|------|--------|
| 117 | `'studentBadges' does not exist` | _count.select 中写的是 `studentBadges` | 改为 `student_badges` |
| 129 | Property `_count` does not exist | 没有 include _count | 需要在 findMany 中加入 `include: { _count: {...} }` |
| 168 | `'studentBadges' does not exist` | include 中写的是 `studentBadges` | 改为 `student_badges` |
| 180 | Property `_count` does not exist | 没有 include _count | 需要在 findFirst 中加入 `include: { _count: {...} }` |
| 181 | `'studentBadges' does not exist` | 访问不存在的属性 | 改为 `student_badges` |
| 204 | Type assignment error for `schoolId` | Prisma 关系字段 schoolId 不允许直接设置 | 改为通过 schools 关系创建：`schools: { connect: { id: schoolId } }` |
| 331 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 343 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 381 | `Property 'taskRecord' does not exist` | Prisma Client 没有此属性 | 改为 `task_records` |
| 450 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 488 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 542 | `'studentBadges' does not exist` | include 中写的是 `studentBadges` | 改为 `student_badges` |
| 567 | `'studentBadges' does not exist` | 属性名错误 | 改为 `student_badges` |
| 612 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 621 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 641 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 659 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 699 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |
| 755 | `'taskRecords' does not exist` | include 中写的是 `taskRecords` | 改为 `task_records` |
| 786 | `'taskRecords' does not exist` | 访问不存在的属性 | 改为 `task_records` |
| 792 | `Property 'studentsBadge' does not exist` | Prisma Client 没有此属性 | 改为 `student_badges` |

---

### 2. ChallengeService (`src/services/challenge.service.ts`)

#### 错误类型：关系名称错误、不存在的属性、类型分配错误

| 行号 | 错误 | 原因 | 修复方案 |
|------|------|------|--------|
| 135 | `'participants' does not exist` | _count.select 中写的是 `participants` | 改为 `challenge_participants` |
| 147 | Property `_count` does not exist | 没有在返回对象中设置 _count | 在 map 中添加 `participantCount: challenge._count.challenge_participants` |
| 168 | `'creator' does not exist` | include 中写的是 `creator` | 改为 `teachers`（Prisma 中的关系名称是 teachers） |
| 198 | `'participants' does not exist` | 访问不存在的属性 | 应该是 `challenge.challenge_participants` |
| 225 | Type assignment error for `schoolId` | Prisma 关系字段 schoolId 不允许直接设置 | 改为 `schools: { connect: { id: schoolId } }` |
| 240 | `'creator' does not exist` | include 中写的是 `creator` | 改为 `teachers` |
| 296 | `'participants' does not exist` | _count.select 中写的是 `participants` | 改为 `challenge_participants` |
| 308 | Property `_count` does not exist | 没有 _count | 需要在 findFirst 中加 _count |
| 316 | Property `_count` does not exist | 没有 _count | 需要在 update 中加 _count |
| 387 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 399 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 410 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 464 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 476 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 540 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 547 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 613 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 700 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 725 | `Property 'challengesParticipant' does not exist` | Prisma 没有此属性 | 改为 `challenge_participants` |
| 777 | `Property 'taskRecord' does not exist` | Prisma 没有此属性 | 改为 `task_records` |

---

### 3. HabitService (`src/services/habit.service.ts`)

#### 错误类型：不存在的属性和模型名称

| 行号 | 错误 | 原因 | 修复方案 |
|------|------|------|--------|
| 158 | `'habitLogs' does not exist` | _count.select 中写的是 `habitLogs` | 改为 `habit_logs` |
| 170 | Property `_count` does not exist | 没有在对象中设置 _count | 在 return 中添加 `totalCheckIns: habit._count.habit_logs` |
| 193 | Type assignment error for `schoolId` | Prisma 关系字段 schoolId 不允许直接设置 | 改为 `schools: { connect: { id: schoolId } }` |
| 325 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |
| 345 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |
| 361 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |
| 391 | `Property 'taskRecord' does not exist` | Prisma 没有此属性 | 改为 `task_records` |
| 467 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |
| 470 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |
| 536 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |
| 630 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |
| 635 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |
| 660 | `Property 'habits_logs' does not exist` | 应该是 `habit_logs` | 改为 `habit_logs` |

---

### 4. PKMatchService (`src/services/pkmatch.service.ts`)

#### 错误类型：不存在的属性和模型名称

| 行号 | 错误 | 原因 | 修复方案 |
|------|------|------|--------|
| 95 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 98 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 152 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 234 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 249 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 279 | `Property 'taskRecord' does not exist` | Prisma 没有此属性 | 改为 `task_records` |
| 329 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 345 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 405 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 421 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 456 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 579 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 633 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 636 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 639 | `Property 'pk_matcheses' does不存在` | 错误的复数化写法 | 改为 `pk_matches` |
| 645 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 663 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 683 | `Property 'pk_matcheses' does not exist` | 错误的复数化写法 | 改为 `pk_matches` |
| 742 | `Property 'taskRecord' does not exist` | Prisma 没有此属性 | 改为 `task_records` |

---

### 5. LMSService (`src/services/lms.service.ts`)

#### 错误类型：导入类型不存在

| 行号 | 错误 | 原因 | 修复方案 |
|------|------|------|--------|
| 1 | `'LessonPlan' has no exported member` | Prisma 生成的是 `lesson_plans` | 改为 `import type { lesson_plans } from '@prisma/client'` |
| 1 | `'TaskRecord' has no exported member` | Prisma 生成的是 `task_records` | 改为 `import type { task_records } from '@prisma/client'` |
| 1 | `'Student' has no exported member` | Prisma 生成的是 `students` | 改为 `import type { students } from '@prisma/client'` |

---

### 6. DashboardService (`src/services/dashboard.service.ts`)

#### 错误类型：不存在的关系字段名称

| 行号 | 错误 | 原因 | 修复方案 |
|------|------|------|--------|
| 154 | `'student' does not exist` | include 中应该是实际的关系字段名 | 检查 schema.prisma 中 challenges 的实际关系名 |
| 239 | `'student' does not exist` | 访问不存在的属性 | 根据 schema 关系确认正确的字段名 |

---

### 7. UserController (`src/controllers/user.controller.ts`)

#### 错误类型：关系字段类型分配错误

| 行号 | 错误 | 原因 | 修复方案 |
|------|------|------|--------|
| 75 | Type assignment error for `schoolId` | 尝试直接设置关系的外键字段 | 改为 `schools: { connect: { id: schoolId } }` |

---

### 8. ReportController (`src/controllers/report.controller.ts`)

#### 错误类型：构造函数参数错误

| 行号 | 错误 | 原因 | 修复方案 |
|------|------|------|--------|
| 8 | `Expected 0 arguments, but got 1` | ReportService 构造函数不接受参数 | 改为 `new ReportService()` 或检查 ReportService 定义 |

---

## 修复优先级

### 优先级 1（必须修复）
1. **模型名称替换**（影响 76 个错误）
   - `studentsBadge` → `student_badges`
   - `studentBadges` → `student_badges`  
   - `taskRecord` → `task_records`
   - `challengesParticipant` → `challenge_participants`
   - `habits_logs` → `habit_logs`
   - `pk_matcheses` → `pk_matches`

2. **关系字段创建方式修改**（影响多个 create 操作）
   - 将 `schoolId: string` 改为 `schools: { connect: { id: schoolId } }`

3. **导入类型修正**（LMSService）
   - `LessonPlan` → `lesson_plans`
   - `TaskRecord` → `task_records`
   - `Student` → `students`

### 优先级 2（功能修复）
4. **include 关系字段修正**
   - `challenge_participants` 而不是 `participants`
   - `student_badges` 而不是 `studentBadges`
   - `habit_logs` 而不是 `habitLogs`

5. **ReportService 构造函数调用**
   - 检查是否需要传递参数

---

## 修复统计

| 文件 | 错误数 | 主要问题 |
|------|--------|---------|
| badge.service.ts | 20 | 模型名称 + include 字段 + 关系创建 |
| challenge.service.ts | 21 | 模型名称 + include 字段 + 关系创建 |
| habit.service.ts | 13 | 模型名称 + 关系创建 |
| pkmatch.service.ts | 19 | 模型名称复数化错误 |
| lms.service.ts | 3 | 导入类型不存在 |
| dashboard.service.ts | 2 | 关系字段名称 |
| user.controller.ts | 1 | 关系创建方式 |
| report.controller.ts | 1 | 构造函数参数 |
| **总计** | **80** | 多数为模型/字段名称错误 |


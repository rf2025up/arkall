# Prisma 表名迁移快速修复指南

## 核心问题

项目数据库表名已从单数改为复数（例如 `task_record` → `task_records`），但 TypeScript 代码仍使用旧的模型名称。需要进行以下替换：

## 全局替换清单（按优先级）

### 第1步：模型属性名称替换

在以下文件中执行全局替换：

#### 步骤 1.1 - BadgeService (`src/services/badge.service.ts`)
```
替换:  studentBadges  →  student_badges
替换:  studentsBadge  →  student_badges  
替换:  taskRecords    →  task_records
替换:  taskRecord     →  task_records
```

#### 步骤 1.2 - ChallengeService (`src/services/challenge.service.ts`)
```
替换:  challengesParticipant  →  challenge_participants
替换:  participants          →  challenge_participants（在 include/select 中）
替换:  creator               →  teachers（在 include 中，因为实际关系名是 teachers）
替换:  taskRecord            →  task_records
```

#### 步骤 1.3 - HabitService (`src/services/habit.service.ts`)
```
替换:  habits_logs  →  habit_logs（修正 typo）
替换:  habitLogs    →  habit_logs
替换:  taskRecord   →  task_records
```

#### 步骤 1.4 - PKMatchService (`src/services/pkmatch.service.ts`)
```
替换:  pk_matcheses  →  pk_matches（最常见的错误：复数化两次）
替换:  taskRecord    →  task_records
```

### 第2步：修复关系字段设置方式

在 create/update 操作中，将直接的 `schoolId` 改为关系连接方式：

```typescript
// 错误方式
schools: {
  create: {
    name,
    planType,
    isActive,
    schoolId: schoolId  // ❌ 错误！schoolId 是关系，不能直接赋值
  }
}

// 正确方式
schools: {
  connect: { id: schoolId }  // ✓ 正确！通过 connect 连接现有记录
}
```

**影响的文件：**
- `badge.service.ts` 第 204 行
- `challenge.service.ts` 第 225 行  
- `habit.service.ts` 第 193 行

### 第3步：修复导入类型（LMSService）

```typescript
// 错误
import { LessonPlan, TaskRecord, Student } from '@prisma/client';

// 正确
import type { lesson_plans, task_records, students } from '@prisma/client';
```

### 第4步：修复构造函数调用

#### ReportController (`src/controllers/report.controller.ts` 第 8 行)
```typescript
// 错误
const reportService = new ReportService(this.prisma);

// 正确
const reportService = new ReportService();
// 或确认 ReportService 是否真的需要接收 prisma 参数
```

---

## 自动修复脚本（需要手动执行）

以下是可以在编辑器中执行的查找-替换正则表达式：

### Regex 1: 替换 studentBadges 和 studentsBadge
```
查找：  studentBadges|studentsBadge
替换为：student_badges
```

### Regex 2: 替换 challengesParticipant
```
查找：  challengesParticipant
替换为：challenge_participants
```

### Regex 3: 替换 taskRecord
```
查找：  taskRecord(?!s)
替换为：task_records
```

### Regex 4: 修正 habits_logs 为 habit_logs
```
查找：  habits_logs
替换为：habit_logs
```

### Regex 5: 替换 pk_matcheses
```
查找：  pk_matcheses
替换为：pk_matches
```

---

## 关键改动点汇总

### include 字段映射

| 错误的字段名 | 正确的字段名 |
|------------|-----------|
| `studentBadges` | `student_badges` |
| `participants` | `challenge_participants` |
| `creator` | `teachers` |
| `habitLogs` | `habit_logs` |
| `taskRecords` | `task_records` |

### Prisma Model 名称映射

| 错误的模型名 | 正确的模型名 |
|------------|-----------|
| `studentBadges` | `student_badges` |
| `studentsBadge` | `student_badges` |
| `taskRecord` | `task_records` |
| `challengesParticipant` | `challenge_participants` |
| `habits_logs` | `habit_logs` |
| `pk_matcheses` | `pk_matches` |

### 关系创建修复示例

```typescript
// ❌ 错误：直接赋值外键字段
const badge = await this.prisma.badges.create({
  data: {
    name,
    schoolId: schoolId  // 这样不行！
  }
});

// ✓ 正确：通过关系连接
const badge = await this.prisma.badges.create({
  data: {
    name,
    schools: {           // 使用关系字段名
      connect: { id: schoolId }  // 连接现有的学校
    }
  }
});
```

---

## 验证修复完成

执行以下命令验证所有错误已解决：

```bash
cd /home/devbox/project/arkok-v2/server
npm run build

# 如果编译成功，应该看到：
# > tsc
# （没有错误输出）
```

---

## 相关文件位置

| 文件 | 路径 |
|------|------|
| BadgeService | `server/src/services/badge.service.ts` |
| ChallengeService | `server/src/services/challenge.service.ts` |
| HabitService | `server/src/services/habit.service.ts` |
| PKMatchService | `server/src/services/pkmatch.service.ts` |
| LMSService | `server/src/services/lms.service.ts` |
| SchoolService | `server/src/services/school.service.ts` |
| SocketService | `server/src/services/socket.service.ts` |
| UserController | `server/src/controllers/user.controller.ts` |
| ReportController | `server/src/controllers/report.controller.ts` |
| Prisma Schema | `server/prisma/schema.prisma` |
| Prisma Types | `server/node_modules/.prisma/client/index.d.ts` |

---

## 成功标志

当以下所有条件满足时，迁移完成：

- ✅ `npm run build` 无编译错误
- ✅ 所有 TypeScript 类型检查通过
- ✅ 没有 "does not exist" 的错误提示
- ✅ 没有 "has no exported member" 的错误提示
- ✅ 所有关系字段使用正确的 connect/create 语法

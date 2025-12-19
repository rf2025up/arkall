# ArkOK V2 项目上下文与最新进度 (2025-12-19)

## 1. 核心任务目标
验证 V2 版本全链路业务流：
**教师备课发布** (LessonPlan) -> **学生过关页同步** (TaskRecords with Progress) -> **个人详情页汇总** (Semester Map Summary)

## 2. 关键逻辑达成 (当前状态)
- **动态数据流转**：已修改 `lms.service.ts`，支持从 `courseInfo` 动态提取 `unit` 和 `lesson` 注入到 `task_records.content`。
- **任务分类支持**：备课发布的任务现在根据学科分类（语文、数学、英语）动态绑定对应的教学进度坐标。
- **禁止硬编码**：逻辑已从硬编码 "88" 切换为基于请求参数的动态提取。
- **进度覆盖 (isOverridden)**：系统支持老师手动调整进度覆盖备课计划。

## 3. 已执行的操作
- 修改 `server/src/services/lms.service.ts` 中的 `publishPlan` 方法。
- 完善了 `task_records` 的 `content` 结构，增加 `unit`, `lesson`, `taskName` 字段，以适配学期地图聚合算法。

## 4. 待验证/待处理
- [In Progress] 重新执行 `verify-prepare-qc-sync.ts` 自动化脚本。
- [Pending] 字段审计：统一全局 API 中的 `className` 字段名。
- [Pending] 类型安全：移除 `as any`，定义完善的 Prisma 与 DTO 接口。

## 5. 环境信息
- Port: 3000
- DB: Prisma (Service-held instances)
- Role: Teacher (long), Admin (forbidden from publishing)

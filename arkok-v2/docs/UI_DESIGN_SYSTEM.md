# ArkOK V2 - UI 设计系统 (Design System)

## 核心原则
- 专业、温暖、有活力。
- 采用"现代拟物化 + 卡片式"设计，确保界面清爽、信息层级清晰。

## 1. 颜色规范 (Colors)
- **背景 (Background)**: `#f7f8fa` (`bg-gray-50`)。
- **卡片 (Card)**: `#ffffff` (`bg-white`)。
- **品牌主色 (Brand)**: 橙色渐变，`#f97316` (`bg-orange-500`) 用于强调。
- **主文字 (Text Primary)**: `#1f2937` (`text-gray-800`)。
- **次要文字 (Text Secondary)**: `#6b7280` (`text-gray-500`)。

## 2. 布局与间距 (Layout & Spacing)
- **布局模式**: 卡片式布局，所有内容包裹在卡片内。
- **间距单位**: 遵循 Tailwind 的 `4` 的倍数原则 (1 = 4px)。
- **卡片间距**: `space-y-4` (16px)。
- **内边距**: `p-4` 或 `p-6` (16px / 24px)。

## 🔗 数据闭环与汇总 (双重反馈机制)

### I. 垂直维度面板 (保留现有设计)
为了保证数据的结构化展示，我们将继续保留并优化学生详情页的以下面板：
- **勋章墙**: 展示所有获得的勋章奖牌。
- **习惯统计**: 展示各项习惯的坚持天数。
- **PK对决记录**: 展示历史胜负详情。
- **挑战档案**: 展示个人/全班挑战的成败状态。

### II. 动态聚合流 (`task_records`)
在保留上述面板的同时，我们将所有动作汇总到【任务达人】时间线，作为实时的“动态流水”：
- **PK/挑战/勋章/习惯/QC结算**: 每次操作都会触发产生一条 `SPECIAL` 或 `DAILY` 类型的记录，确保学生一整天的成长在时间线上清晰可见。

## 3. 组件规范 (Components)
- **卡片 (Card)**:
  - `bg-white rounded-2xl shadow-sm border border-gray-100`
- **按钮 (Button)**:
  - 主按钮: `bg-brand text-white font-bold py-3 rounded-xl`
  - 次按钮: `bg-gray-100 text-gray-600 py-3 rounded-xl`
- **图标 (Icon)**:
  - 必须采用"色块+反白图标"样式，如 `<div class="bg-blue-100 text-blue-500">...</div>`。

## 4. 字体规范 (Typography)
- **大标题 (H1)**: `text-xl font-bold`
- **列表标题 (H3)**: `text-base font-bold text-gray-800`
- **正文 (Body)**: `text-sm text-gray-700`
- **辅助说明 (Caption)**: `text-xs text-gray-400`

# ArkOK UI 宪法 V5.0 — "流光·智简"设计语言

> **版本**: V5.0  
> **生效日期**: 2025-12-23  
> **适用范围**: arkok-v2 全端（教师端、家长端、大屏端）

---

## 🎯 设计哲学

**"流光·智简"** 是 ArkOK V2 的核心设计语言，融合以下三大原则：

| 原则 | 描述 |
|------|------|
| **流光** | 优雅的渐变色彩与微动效，营造温暖活力的视觉流动感 |
| **智简** | 信息层级清晰，交互直觉化，减少认知负担 |
| **致敬教育** | 专业、温暖、有活力，让师生家长感受关怀与尊重 |

---

## 🎨 色彩系统

### 主题渐变
```css
/* 品牌主色 - 橙色渐变 */
--brand-gradient: linear-gradient(160deg, #FF8C00 0%, #FF5500 100%);

/* 代理模式 - 深色渐变 */
--proxy-gradient: linear-gradient(135deg, #475569 0%, #1e293b 100%);
```

### 语义色板
| 类型 | 颜色 | Tailwind | 用途 |
|------|------|----------|------|
| 主色 | `#f97316` | `orange-500` | 强调、CTA 按钮 |
| 成功 | `#16a34a` | `green-600` | 签到、完成状态 |
| 警告 | `#d97706` | `amber-600` | 提醒、待处理 |
| 危险 | `#dc2626` | `red-600` | 错误、删除操作 |
| 信息 | `#2563eb` | `blue-600` | 链接、新增操作 |

### 中性色
| 用途 | 颜色 | Tailwind |
|------|------|----------|
| 页面背景 | `#F5F7FA` | 自定义 |
| 卡片背景 | `#FFFFFF` | `white` |
| 主文本 | `#1f2937` | `gray-800` |
| 次文本 | `#6b7280` | `gray-500` |
| 边框 | `#e5e7eb` | `gray-200` |

---

## 📦 组件规范

### 卡片 (Card)
```css
/* 标准卡片 */
.card-standard {
  @apply bg-white rounded-2xl shadow-sm border border-gray-100 p-4;
}

/* 玻璃胶囊卡片 */
.card-glass {
  @apply bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/80;
}
```

### 虚线占位卡片 (新增按钮专用)
```css
.card-dashed {
  @apply rounded-xl border-2 border-dashed border-slate-200 
         bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-300 
         active:scale-95 transition-all duration-300;
}
```

### 按钮 (Button)
| 类型 | 样式规范 |
|------|----------|
| 主按钮 | `bg-orange-500 text-white font-bold py-3 rounded-xl` |
| 次按钮 | `bg-gray-100 text-gray-600 py-3 rounded-xl` |
| 成功按钮 | `bg-green-500 text-white font-bold rounded-2xl` |
| 胶囊按钮 | `px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md` |

### 图标按钮
```css
/* 功能岛图标块 */
.icon-block {
  @apply w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 
         border border-orange-100 flex items-center justify-center shadow-sm;
}
```

---

## ✨ 交互动效

### 悬浮微动效
| 场景 | 动效 |
|------|------|
| 卡片悬浮 | `hover:scale-110 transition-all duration-300` |
| 按钮点击 | `active:scale-95 transition-transform` |
| 图标旋转 | `group-hover:rotate-90 transition-transform duration-300` |
| 透明度渐显 | `opacity-0 group-hover:opacity-100 transition-opacity` |

### 动画时长规范
| 类型 | 时长 | 场景 |
|------|------|------|
| 快速反馈 | `150ms` | 点击态 |
| 标准过渡 | `200-300ms` | 悬浮态、展开态 |
| 入场动画 | `300-500ms` | 弹窗、抽屉 |

---

## 📐 间距与布局

### 间距规范
遵循 Tailwind `4` 的倍数原则 (1 = 4px)：

| 场景 | 间距 | Tailwind |
|------|------|----------|
| 紧凑 | 8px | `gap-2` |
| 标准 | 12px | `gap-3` |
| 宽松 | 16px | `gap-4` / `p-4` |
| 分组 | 24px | `p-6` |

### 圆角规范
| 元素 | 圆角 | Tailwind |
|------|------|----------|
| 小按钮/标签 | 8px | `rounded-lg` |
| 卡片 | 12px | `rounded-xl` |
| 大卡片/弹窗 | 16px | `rounded-2xl` |
| 特大容器 | 24px | `rounded-3xl` |

---

## 🔤 字体规范

| 层级 | 样式 | 用途 |
|------|------|------|
| H1 | `text-xl font-bold` | 页面标题 |
| H2 | `text-lg font-bold` | 抽屉/弹窗标题 |
| H3 | `text-base font-bold text-gray-800` | 列表标题 |
| Body | `text-sm text-gray-700` | 正文内容 |
| Caption | `text-xs text-gray-400` | 辅助说明 |
| Micro | `text-[10px] text-gray-300` | 微小说明 |

---

## 🧩 特殊组件模式

### 新增学生卡片（融入网格式）
```tsx
<button className="flex flex-col items-center p-2 rounded-xl 
  border-2 border-dashed border-slate-200 bg-slate-50/50 
  hover:bg-blue-50/30 hover:border-blue-300 
  active:scale-95 transition-all duration-300 group h-[116px] justify-center">
  
  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center 
    shadow-sm text-slate-300 group-hover:text-blue-500 
    group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
    <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
  </div>
  
  <span className="mt-2 text-xs font-bold text-slate-400 
    group-hover:text-blue-600 transition-colors">
    新增学生
  </span>
</button>
```

---

## ✅ 设计检查清单

在提交 UI 变更前，请确认：

- [ ] 颜色使用符合语义色板
- [ ] 圆角遵循规范（不使用任意值）
- [ ] 按钮有 `active:scale-95` 点击反馈
- [ ] 可交互元素有 `transition-*` 动效
- [ ] 文字层级正确（不滥用 bold）
- [ ] 间距使用 4 的倍数

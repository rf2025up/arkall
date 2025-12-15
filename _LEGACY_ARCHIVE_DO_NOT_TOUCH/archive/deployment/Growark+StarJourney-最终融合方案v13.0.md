# Growark + StarJourney 最终融合方案 v13.0

**制定时间**: 2025-12-10
**方案性质**: 最高决策文件，覆盖之前所有融合方案
**技术基础**: 基于今日4个核心文档的完整设计

---

## 🎯 方案总览

### 核心理念
**保持Growark UI风格不变，无缝集成StarJourney教学管理功能**
- 保留现有图标、布局、用户习惯
- 新增功能使用紫色主题区分（学业vs成长）
- C位相机作为主要功能入口

### 技术架构
```
┌─────────────────────────────────────────────┐
│           React Mobile Frontend            │
│  现有Growark + 新增academic模块             │
├─────────────────────────────────────────────┤
│  Node.js API (3000)  +  Python API (3001)  │
│  现有功能                +  StarJourney     │
├─────────────────────────────────────────────┤
│              PostgreSQL 数据库               │
│  现有表 + lms_* 扩展表（完全隔离）          │
└─────────────────────────────────────────────┘
```

---

## 📱 完整界面设计

### 1. 首页（班级管理）- 保持现状

**布局保持完全不变**，仅增加状态提示：
```
┌─────────────────────────────────────┐
│ 三年级 (2)班        🔔             │
│ 42 位学生 · 今日活跃 38              │
│                                     │
│ [🏆排行榜] [🎖️发勋章] [⚔️PK] [🚩挑战] │
│                                     │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐           │
│ │👤 │ │👤 │ │👤红│ │👤 │           │
│ │张明│ │李华│ │王小│ │赵六│           │
│ │1240│ │1150│ │980 │ │890 │           │
│ └───┘ └───┘ └───┘ └───┘           │
└─────────────────────────────────────┘
```

**新增特性**：
- 学生卡片右上角红点提示（有待过关任务）
- 保持现有4个快捷入口图标

### 2. 备课页 - 新增核心功能

**位置**：底部导航第2个Tab（替换"任务发布"）

```
┌─────────────────────────────────────┐
│ 今日备课                             │
│ ┌─────┬─────┬─────┐               │
│ │数学│语文│英语│ ← 学科切换        │
│ └─────┴─────┴─────┘               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 今日进度                        │ │
│ │ 第 [3] 单元 第 [2] 课           │ │
│ │ 多位数乘法 ← 课程标题           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🛡️ 必做过关项   记入档案         │ │
│ │ [口算达标] [错题订正]            │ │
│ │ + 添加过关项                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📝 作业任务      完成后结算      │ │
│ │ [完成练习册 P12]                │ │
│ │ + 添加任务                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│        [一键发布今日计划]           │
└─────────────────────────────────────┘
```

### 3. 质检/结算页 - 双模式管理

**位置**：底部导航第4个Tab

```
┌─────────────────────────────────────┐
│ 学业管理                             │
│ ┌─────────┬─────────┐             │
│ │过关检查 │一键结算 │ ← Tab切换    │
│ └─────────┴─────────┘             │
│                                     │
│ 过关检查模式:                       │
│ ┌─────────────────────────────────┐ │
│ │ 今日待过关: 3项  全班进度: 45%  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───┐ ┌───────────┐ ┌───────────┐ │
│ │👤 │ │张小明      │ [辅导] [通过]│ │
│ │头像│ │🔥辅导:2次 │           │ │
│ └───┘ └───────────┘ └───────────┘ │
│                                     │
│ ┌───┐ ┌───────────┐ ┌───────────┐ │
│ │👤 │ │李小花      │    已过关   │ │
│ │头像│ │一次过关    │           │ │
│ └───┘ └───────────┘ └───────────┘ │
│                                     │
│ 结算模式:                           │
│ ┌─────────────────────────────────┐ │
│ │        +1,280                   │ │
│ │     今日全班预估产生积分         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🛡️ 过关奖励 (32人)    +640     │ │
│ │ 📝 作业完成 (28人)    +280     │ │
│ └─────────────────────────────────┘ │
│                                     │
│        [确认并发放积分]             │
└─────────────────────────────────────┘
```

### 4. 学生详情页 - 双Tab核心设计

**现有布局保持不变**，内容区域改造为双Tab：

```
┌─────────────────────────────────────┐
│            ┌───┐                   │
│  ┌─────────│👤 │───┐  Lv.5         │
│  │  唐艺馨   │头像│  姜老师班       │
│  └─────────└───┘ 未分队           │
│                                     │
│ ┌──────────┬──────────┐           │
│ │ 🚀 成长激励│📚 学业攻克│ ← Tab切换 │
│ └──────────┴──────────┘           │
│                                     │
│ 成长激励Tab (现有功能保持不变):      │
│ - 所获勋章                           │
│ - 习惯统计                           │
│ - PK记录                             │
│ - 挑战成就                           │
│                                     │
│ 学业攻克Tab (新增功能):              │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 AI实时分析                    │ │
│ │ ┌───┐ 学习状态: 稳步上升 ↗      │ │
│ │ │雷达│ "本周在小数乘法表现优秀，  │ │
│ │ │图 │ 但审题习惯有所波动..."     │ │
│ │ └───┘                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 今日过关            已完成 1/3  │ │
│ │                             │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 背诵《观潮》第三段           │ │ │
│ │ │ 🔥 辅导: 2次     [+] [✓]   │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                             │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 整理错题本         +20分     │ │ │
│ │ │ 自主完成                   │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 错题攻克                        │ │
│ │ ┌─────────────┐ ┌─────────────┐ │ │
│ │ │    📷       │ │    🖨️       │ │ │
│ │ │   录入错题   │ │  生成攻克单  │ │ │
│ │ └─────────────┘ └─────────────┘ │ │
│ │                             │ │
│ │ 本周错题 (5)                  │ │
│ │ [错题1] [错题2] [错题3] [+3]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📜 历史学情报告                  │ │
│ │ ─────────────────────────────  │ │
│ │ 📅 第12周学情诊断  2025/12/03   │ │
│ │    进步明显            >        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 5. 全学期过关地图 - 历史回溯页面

**入口**：学生详情页 → 学业Tab → 历史学情报告

```
┌─────────────────────────────────────┐
│ ← 唐艺馨的学习足迹            本学期 │
│                                     │
│ ┌─────┬─────┬─────┐               │
│ │语文 │数学 │英语 │ ← 学科切换     │
│ └─────┴─────┴─────┘               │
│                                     │
│ 总体进度: 85%    ☑只看未完成       │
│ ┌─────────────────────────────────┐ │
│ │ ████████████████████░░░         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ● 第3课 · 待补过               │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 现代诗二首        2/4 完成  │ │ │
│ │ │                            │ │ │
│ │ │ ✅ 背诵全诗         12/05 完成│ │ │
│ │ │ ⭕ 生字默写 🔥辅导过3次 [补过]│ │ │
│ │ │ ⭕ 诗意理解             [补过]│ │ │
│ │ │ ✅ 课后习题         12/05 完成│ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ● 第2课             ▼ 3/3 全对 │ │
│ │ 走月亮                         │ │
│ │ (已折叠，点击展开详情)           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ● 第1课             ▼ 5/5 全对 │ │
│ │ 观潮                           │ │
│ │ (已折叠，点击展开详情)           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 6. 底部导航 - C位设计

**保持5图标布局，中间突出拍照功能**：

```
┌─────────────────────────────────────┐
│           ┌─────────┐               │
│ [班级] [备课] │ 📷相机 │ [质检] [我的] │
│           └─────────┘               │
│             ↑凸起设计                │
│        橙色渐变 + 阴影               │
└─────────────────────────────────────┘
```

**相机功能界面**：
```
┌─────────────────────────────────────┐
│ ✕        连拍模式 OFF        ⚡    │
│                                     │
│     ┌─────────────────────┐         │
│     │  🪄 AI 识别中...    │         │
│     │  ┌─────────────┐    │         │
│     │  │             │    │         │
│     │  │   取景框     │    │         │
│     │  │             │    │         │
│     │  └─────────────┘    │         │
│     │  ─────────扫描线───   │         │
│     └─────────────────────┘         │
│                                     │
│     对准错题区域，自动识别           │
│                                     │
│ [相册]    ┌─────┐    [空白]         │
│          │ 📷  │                   │
│          └─────┘                   │
└─────────────────────────────────────┘
```

---

## 🎨 UI设计规范

### 颜色主题
```css
:root {
  --primary: #F97316;    /* Growark橙色（保持不变） */
  --ai-purple: #8B5CF6;  /* StarJourney紫色（学业功能） */
  --success: #22C55E;    /* 成功绿色 */
  --warning: #F59E0B;    /* 警告黄色 */
  --danger: #EF4444;     /* 危险红色 */
  --gray-100: #F3F4F6;   /* 背景灰色 */
}
```

### 卡片风格（保持现有设计）
```css
.growark-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  border: 1px solid #F3F4F6;
}

/* 状态边框 */
.status-pending { border-left: 4px solid #F97316; }
.status-passed { border-left: 4px solid #22C55E; }
.status-difficult { border-left: 4px solid #8B5CF6; }
```

### 图标使用（完全保持现有）
- 班级：`fa-chalkboard-user`
- 备课：`fa-pen-to-square`
- 质检：`fa-shield-halved`
- 我的：`fa-user`
- 相机：`fa-camera`

---

## 🔧 核心功能交互设计

### 1. 辅导计数系统
```
交互流程:
1. 老师点击 [辅导] 按钮
2. attempt_count 自动 + 1
3. 显示火焰动画 🔥 + 数字变化
4. 3次尝试后：任务标记为困难（紫色边框）
5. 数据实时同步到数据库

视觉反馈:
- 按钮点击：缩放动画 active:scale-95
- 火焰图标：跳跃动画 flame-anim
- 数字变化：颜色闪烁
```

### 2. 过关操作流程
```
老师操作:
1. 学生完成任务
2. 老师点击 [通过] 按钮
3. 系统自动：状态变更 + 积分奖励
4. 学生卡片：置灰显示 + 完成标记

学生端反馈:
- 实时推送：恭喜完成通知
- 积分到账：+20 积分动画
- 成就解锁：可能的勋章奖励
```

### 3. AI错题录入流程
```
1. 点击底部 📷 相机按钮
2. 进入AI识别界面（取景框 + 扫描线）
3. 对准错题拍照
4. 自动OCR文字识别
5. AI分析：知识点标签 + 出题人揭秘
6. 选择分发学生（支持批量）
7. 自动归类到对应学生的错题本
```

### 4. 一键批量操作
```
一键发布:
- 备课内容 → 推送至所有学生
- 支持预览确认
- 发布后不可修改

一键结算:
- 统计今日完成任务
- 计算积分总额
- 批量发放奖励
- 生成结算报告

一键补过:
- 历史记录中补操作
- 补时间记录
- 相应积分奖励
```

---

## 📊 数据库设计

### 表结构（保持lms_前缀，完全隔离）

```sql
-- 1. 教学计划表
CREATE TABLE lms_daily_plans (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER,           -- 关联现有users表
    date DATE DEFAULT CURRENT_DATE,
    subject VARCHAR(20),          -- 'chinese', 'math', 'english'
    lesson_info JSONB,            -- {unit: "3", lesson: "2", title: "..."}
    config_snapshot JSONB,        -- {qc: ["背诵"], task: ["作业"]}
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 学生记录表（核心）
CREATE TABLE lms_student_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,  -- 关联现有students表
    plan_id INTEGER REFERENCES lms_daily_plans(id),
    task_name VARCHAR(128),
    task_type VARCHAR(20),         -- 'QC'(质检), 'TASK'(任务)
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PASSED', 'COMPLETED'
    attempt_count INTEGER DEFAULT 0,      -- 辅导次数
    is_settled BOOLEAN DEFAULT FALSE,     -- 是否已结算积分
    exp_value INTEGER,            -- 经验值
    date DATE DEFAULT CURRENT_DATE
);

-- 3. 错题元数据表（图片只存一份）
CREATE TABLE lms_mistake_meta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT,
    ocr_text TEXT,
    ai_analysis JSONB,            -- {knowledge_points: [...], analysis: "..."}
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 学生错题关联表
CREATE TABLE lms_student_mistakes (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,  -- 关联现有students表
    mistake_meta_id UUID REFERENCES lms_mistake_meta(id),
    status VARCHAR(20) DEFAULT 'pending', -- pending, mastered
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. 学情报告表
CREATE TABLE lms_academic_reports (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,  -- 关联现有students表
    report_data JSONB,             -- 完整报告数据
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 任务库表（CMS管理）
CREATE TABLE lms_task_library (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50),         -- '基础核心', '数学巩固'...
    name VARCHAR(100),
    default_exp INTEGER,
    tenant_id INTEGER DEFAULT 0   -- 预留多校区
);
```

### 关键索引设计
```sql
-- 性能优化索引
CREATE INDEX idx_student_records_date ON lms_student_records(date);
CREATE INDEX idx_student_records_student ON lms_student_records(student_id);
CREATE INDEX idx_student_records_status ON lms_student_records(status);
CREATE INDEX idx_mistakes_student ON lms_student_mistakes(student_id);
CREATE INDEX idx_daily_plans_teacher_date ON lms_daily_plans(teacher_id, date);
```

---

## 🚀 技术实施策略

### 阶段1：基础建设（1-2周）
```
Week 1:
✅ 创建数据库迁移脚本 lms-v13-migration.sql
✅ 执行数据库扩展（6个核心表）
✅ 建立测试环境验证脚本
✅ 插入测试数据验证关联关系

Week 2:
✅ Python FastAPI项目初始化（端口3001）
✅ 基础CRUD API框架搭建
✅ Node.js API扩展（端口3000集成）
✅ 健康检查和监控配置
```

### 阶段2：核心功能开发（2-3周）
```
Week 3:
🔄 备课页面开发（PrepView组件）
🔄 质检页面开发（QCView组件）
🔄 辅导计数系统实现
🔄 过关状态管理逻辑

Week 4:
🔄 学生详情页双Tab改造
🔄 学业攻克Tab开发
🔄 AI学情雷达组件
🔄 错题管理界面

Week 5:
🔄 相机功能集成
🔄 AI错题识别流程
🔄 数据同步机制
🔄 实时更新系统
```

### 阶段3：高级功能（1-2周）
```
Week 6:
🔄 全学期过关地图
🔄 历史回溯功能
🔄 PDF报告生成
🔄 批量操作优化

Week 7:
🔄 性能优化测试
🔄 用户体验优化
🔄 错误处理完善
🔄 文档编写整理
```

### 阶段4：部署上线（1周）
```
Week 8:
🔄 生产环境部署
🔄 数据迁移验证
🔄 用户培训指导
🔄 监控告警配置
```

---

## 💡 关键技术决策

### 1. 架构隔离原则
- **数据库隔离**：lms_前缀表完全独立
- **API服务隔离**：Python FastAPI独立端口
- **前端模块隔离**：academic模块独立开发
- **功能权限隔离**：学业功能独立权限控制

### 2. 用户体验原则
- **零学习成本**：保持所有现有操作习惯
- **视觉区分**：橙色主题(成长) vs 紫色主题(学业)
- **渐进式增强**：新功能不影响现有功能
- **实时反馈**：所有操作立即视觉反馈

### 3. 性能优化原则
- **懒加载**：大型组件按需加载
- **缓存策略**：常用数据本地缓存
- **批量操作**：减少API调用次数
- **异步处理**：AI分析后台处理

---

## 🛡️ 风险控制措施

### 每阶段验收标准
```
阶段1验收:
✅ 数据库表创建成功，外键约束正确
✅ API服务正常启动，健康检查通过
✅ 基础CRUD操作测试通过

阶段2验收:
✅ 所有新功能界面正常显示
✅ 辅导计数逻辑正确（attempt_count +1）
✅ 状态切换正常（PENDING → PASSED）
✅ 数据实时同步正常

阶段3验收:
✅ 高级功能完整可用
✅ 过关地图数据正确显示
✅ PDF生成功能正常
✅ 批量操作性能达标

阶段4验收:
✅ 生产环境稳定运行
✅ 用户培训完成
✅ 监控告警正常
✅ 回滚方案准备就绪
```

### 回滚机制
```
紧急回滚:
1. 数据库：保留完整备份，支持一键回滚
2. 代码：Git版本控制，快速切换
3. 配置：环境变量备份，快速恢复
4. 服务：独立容器，可单独重启

数据恢复:
1. 每日自动备份
2. 关键操作前手动备份
3. 变更脚本支持回滚操作
4. 数据一致性验证
```

---

## 📋 实施检查清单

### 开发前准备
- [ ] 代码仓库备份
- [ ] 数据库完整备份
- [ ] 现有功能回归测试
- [ ] 开发环境搭建
- [ ] API文档整理

### 开发过程中
- [ ] 每日代码提交
- [ ] 单元测试编写
- [ ] 接口测试验证
- [ ] UI/UX测试确认
- [ ] 性能指标监控

### 上线前检查
- [ ] 完整功能测试
- [ ] 性能压力测试
- [ ] 安全性检查
- [ ] 用户体验测试
- [ ] 文档完整性确认

---

## 🎯 项目成功指标

### 技术指标
- **响应时间**：API < 100ms，页面加载 < 2s
- **可用性**：99.9% 服务可用性
- **数据一致性**：100% 数据同步正确性
- **兼容性**：支持主流浏览器和移动设备

### 业务指标
- **用户采用率**：90%+ 教师主动使用新功能
- **功能完成率**：100% 核心功能正常使用
- **错误率**：< 0.1% 功能错误率
- **用户满意度**：4.5/5.0+ 用户反馈评分

---

**最终说明**：
本方案v13.0基于今日4个核心文档的设计原型，是Growark与StarJourney融合的最高决策文件。所有之前版本的融合方案以此为准，立即停止实施其他方案。方案的核心是在保持Growark原有用户体验不变的前提下，无缝集成StarJourney的教学管理功能，实现"双核驱动"的教育管理生态系统。

---

## 🌐 公网部署技术规范

### 📋 Devbox与Sealos环境配置

#### 系统环境信息
- **主机名**: `devbox`
- **内网IP**: `10.108.51.113`
- **外网IP**: `101.126.39.135`
- **平台**: Sealos Devbox
- **公网域名模式**: `https://[hostname].sealosbja.site`
- **实际公网地址**: `https://esboimzbkure.sealosbja.site`

#### 网络架构特点
```
🌐 Internet
    ↓
Sealos Devbox 内网穿透
    ↓
┌─────────────────────────────────────┐
│           esboimzbkure.sealosbja.site│
├─────────────────┬───────────────────┤
│   端口 3000     │     端口 3001      │
│   Growark       │   StarJourney     │
│   (主服务)      │   (学情管理)      │
└─────────────────┴───────────────────┘
```

#### 服务绑定要求
- **必须绑定 `0.0.0.0`**: 不能绑定 `127.0.0.1` 或 `localhost`
- **网关准备**: 需要2-5分钟时间进行网关配置
- **健康检查**: 网关会定期检查服务健康状态

### 🚀 部署架构与配置

#### 双服务器架构
```javascript
// Growark主服务器 (端口3000)
app.listen(3000, '0.0.0.0', () => {
  console.log('Growark服务运行在端口3000');
});

// StarJourney API服务器 (端口3001)
app.listen(3001, '0.0.0.0', () => {
  console.log('StarJourney服务运行在端口3001');
});
```

#### API集成配置
```javascript
// Growark服务器中的StarJourney API转发
const express = require('express');
const axios = require('axios');

// API转发配置
app.get('/api/mistakes', async (req, res) => {
  try {
    const response = await axios.get(`http://localhost:3001/api/mistakes`, {
      params: req.query,
      timeout: 5000
    });
    res.json(response.data);
  } catch (error) {
    console.error('代理mistakes请求失败:', error.message);
    res.status(500).json({
      success: false,
      error: '服务暂时不可用',
      message: error.message
    });
  }
});
```

### 📱 访问路径映射

| 功能模块 | 本地地址 | 公网地址 | 状态 |
|---------|----------|----------|------|
| 📱 管理端 | http://localhost:3000/admin | https://esboimzbkure.sealosbja.site/app | ✅ |
| 📺 大屏端 | http://localhost:3000/screen | https://esboimzbkure.sealosbja.site/screen | ✅ |
| 👤 学生端 | http://localhost:3000/student | https://esboimzbkure.sealosbja.site/student | ✅ |
| 📊 API接口 | http://localhost:3000/api/* | https://esboimzbkure.sealosbja.site/api/* | ✅ |
| ❤️ 健康检查 | http://localhost:3000/health | https://esboimzbkure.sealosbja.site/health | ✅ |

### 🔧 部署脚本与配置

#### 统一启动脚本
```bash
#!/bin/bash
# start-integrated-system.sh

echo "=== Growark + StarJourney 集成系统启动 ==="

# 启动Growark主服务
cd /home/devbox/project/arkok
NODE_ENV=production node server.js &
GROWARK_PID=$!
echo "Growark服务启动 (PID: $GROWARK_PID, 端口: 3000)"

# 启动StarJourney API服务
cd /home/devbox/project/starj
node star-server.js &
STARJOURNEY_PID=$!
echo "StarJourney服务启动 (PID: $STARJOURNEY_PID, 端口: 3001)"

# 健康检查
sleep 3
curl -s http://localhost:3000/health > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Growark服务健康检查通过"
else
  echo "❌ Growark服务健康检查失败"
fi

curl -s http://localhost:3001/api/health > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ StarJourney服务健康检查通过"
else
  echo "❌ StarJourney服务健康检查失败"
fi

# 显示访问信息
echo ""
echo "=== 系统访问信息 ==="
echo "🏠 公网地址: https://esboimzbkure.sealosbja.site"
echo "📱 管理端: https://esboimzbkure.sealosbja.site/app"
echo "📺 大屏端: https://esboimzbkure.sealosbja.site/screen"
echo "❤️ 健康检查: https://esboimzbkure.sealosbja.site/health"

# 保存PID用于后续管理
echo $GROWARK_PID > /tmp/growark.pid
echo $STARJOURNEY_PID > /tmp/starjourney.pid

echo "=== 集成系统启动完成 ==="
```

#### 环境变量配置
```bash
# arkok/.env
NODE_ENV=production
PORT=3000
DB_HOST=growark-postgresql.ns-bg6fgs6y.svc
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=kngwb5cb

# starj/.env
NODE_ENV=production
PORT=3001
DB_HOST=growark-postgresql.ns-bg6fgs6y.svc
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=kngwb5cb
CORS_ORIGIN=*
```

### 📊 前端构建与部署

#### API地址配置策略
```typescript
// mobile/services/api.ts
// 生产环境API地址（硬编码方式）
const API_BASE_URL = 'https://esboimzbkure.sealosbja.site/api';

// 开发环境API地址（条件判断）
const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000/api';
  }
  return API_BASE_URL;
};
```

#### 构建部署流程
```bash
# 1. 前端代码构建
cd /home/devbox/project/arkok/mobile
npm run build

# 2. 复制构建产物到生产目录
cp -r dist/* ../public/

# 3. 验证部署
curl -I https://esboimzbkure.sealosbja.site/app
```

### 🔄 故障排除指南

#### 服务状态检查
```bash
# 检查进程状态
ps aux | grep -E "(arkok/server|star-server)" | grep -v grep

# 检查端口监听
netstat -tlnp | grep -E ":(3000|3001)"

# 本地健康检查
curl http://localhost:3000/health
curl http://localhost:3001/api/health

# 公网健康检查
curl https://esboimzbkure.sealosbja.site/health
```

#### 常见问题解决
1. **公网无法访问**: 等待2-5分钟网关准备时间
2. **API 404错误**: 检查API转发配置和服务状态
3. **前端功能异常**: 重新构建并部署前端代码
4. **数据不同步**: 检查数据库连接和服务状态

#### 网络配置验证
```bash
# 检查域名解析
nslookup esboimzbkure.sealosbja.site

# 测试连通性
ping esboimzbkure.sealosbja.site

# 验证HTTPS证书
openssl s_client -connect esboimzbkure.sealosbja.site:443
```

### 📈 性能监控与优化

#### 性能指标
- **API响应时间**: < 100ms
- **页面加载时间**: < 2秒
- **并发处理**: 支持多用户同时访问
- **数据同步**: 实时 + 2秒轮询备份

#### 监控配置
```javascript
// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      growark: 'running',
      starjourney: 'running',
      database: 'connected'
    }
  });
});
```

#### 日志管理
```bash
# 日志文件位置
GROWARK_LOG=/home/devbox/project/growark.log
STARJOURNEY_LOG=/home/devbox/project/starjourney.log
INTEGRATED_LOG=/home/devbox/project/integrated.log

# 日志轮转配置
logrotate -f /etc/logrotate.d/growark-starjourney
```

### 🛡️ 安全配置

#### CORS配置
```javascript
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### HTTPS重定向
```javascript
// 强制HTTPS重定向
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

#### 安全头配置
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

### 📞 技术支持

#### 关键文档引用
- **环境配置分析**: `/home/devbox/project/sealos-devbox-配置分析.md`
- **部署指南**: `/home/devbox/project/Growark+StarJourney-公网部署指南.md`
- **状态报告**: `/home/devbox/project/公网部署状态报告.md`
- **问题解决**: `/home/devbox/project/arkok/手机端StarJourney功能部署问题解决方案.md`

#### 联系信息
- **Sealos控制台**: 管理域名和网络配置
- **Devbox文档**: 内网穿透和服务配置指南
- **项目状态**: `/home/devbox/project/star-融合进度跟踪文档.md`

---

**下一步行动**：立即启动阶段1的数据库扩展工作，按照本方案的技术规范和实施计划严格执行。
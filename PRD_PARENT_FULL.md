# 📘 产品需求文档：ArkOK Family (家长端全景版)

**版本**: 2.0.0
**最后更新**: 2025-12-16
**核心目标**: 让教育过程可见，让家校互动高效，让机构口碑裂变。

---

## 1. 产品架构图 (Sitemap)

```mermaid
graph TD
    Entry[入口: 邀请链接/二维码] --> Login[登录/绑定页]
    Login --> Main[主界面 (底部导航)]
    
    subgraph Tab1_Today[Tab 1: 今日动态]
        Timeline[时间轴流]
        Feedback[底部反馈栏]
    end
    
    subgraph Tab2_Growth[Tab 2: 成长档案]
        Overview[综合概览] --> Radar[五维雷达图]
        Overview --> Badges[最新勋章]
        Overview --> AI_Report[AI 学情简报]
        
        Habits[毅力热力图] --> Revive[复活大作战 (裂变)]
        Trend[进击的曲线]
        
        Poster[生成分享海报]
    end
    
    subgraph Tab3_Link[Tab 3: 家校互联]
        Profile[孩子信息]
        MsgCenter[消息通知]
        BadgeWall[勋章墙]
    end
    
    Main --> Tab1_Today
    Main --> Tab2_Growth
    Main --> Tab3_Link
```

---

## 2. 核心业务流程与数据流转 (Data Flow)

### 2.1 下行数据流：自动化动态生成
*   **场景**: 老师在 APP 操作，家长端自动展示。
*   **逻辑**:
    1.  **触发源**: 老师点击“任务过关”、“习惯打卡”、“PK结算”、“颁发勋章”。
    2.  **后端处理**: 业务 Service 更新数据的同时，调用 `TimelineService.createEvent()`。
    3.  **数据落库**: 写入 `TimelineEvent` 表。
    4.  **前端展示**: 家长端 `Today` 页面轮询或下拉刷新，读取该表。

### 2.2 上行数据流：家校反馈闭环
*   **场景**: 家长在“今日动态”底部点赞或留言。
*   **逻辑**:
    1.  **家长操作**: 点击“为孩子点赞”或输入留言发送。
    2.  **后端聚合**: 系统查找或创建当天的 `DailySummary` 记录，更新 `parentLiked` 和 `parentComment` 字段。
    3.  **通知老师**: 写入 `Notification` 表，并在教师端右上角铃铛显示红点。
    4.  **老师已读**: 老师点击消息，标记 `teacherRead = true`，闭环结束。

---

## 3. 功能详细定义 (Functional Specs)

### 3.1 登录与绑定 (Login & Binding)
*   **鉴权模式**: 轻量级无感认证。
*   **输入项**: 
    1.  **学生姓名** (用于定位记录)
    2.  **访问码 (Access Code)** (用于验证身份，默认手机后4位)
    3.  **我是谁** (身份标签：爸爸/妈妈/其他，存入 Token)
*   **技术要求**: 登录成功后签发 **长效 JWT (365天)**，存入 LocalStorage，后续免登。

### 3.2 Tab 1: 今日动态 (Today)
*   **UI 风格**: “物流时间轴”式清单。
*   **内容卡片**:
    *   ✅ **习惯**: 显示习惯名称 + 时间。
    *   📝 **学业**: 显示过关任务名 + 积分 + 老师评语(如有)。
    *   ⚔️ **竞技**: 显示 PK 对手 + 胜负结果。
    *   🏅 **荣誉**: 高亮展示获得的勋章。
*   **底部反馈栏 (Sticky Footer)**:
    *   **点赞按钮**: 文案“为孩子今日表现点赞” -> 点击变色 -> “已收到，谢谢”。
    *   **留言框**: 发送非紧急沟通内容。

### 3.3 Tab 2: 成长档案 (Growth) - **增长核心**
*   **模块 A: 五维雷达图 (Radar)**
    *   维度：习惯力、学业力、竞技力、坚韧力(错题)、活跃度。
    *   数据源：聚合计算近 30 天数据。
*   **模块 B: 毅力热力图 (Habit Heatmap)**
    *   展示近 30 天/本学期的习惯完成度格子。
    *   **裂变触发点 (Growth Loop)**: 
        *   检测到昨日断签 -> 显示“💔 连胜中断”。
        *   出现按钮 **“⛑️ 邀请好友助力复活”**。
        *   点击 -> 生成分享链接 -> 好友点击 -> 集满 5 个 -> 补签成功 (暂不开发到自动修改数据，仅做功能演示即可，复活凭证直接家长微信联系老师，老师手动补签
*   **模块 C: 进击的曲线 (Trend)**
    *   展示累计积分增长趋势，强调复利效应。
*  
*   **全局功能: 生成海报**
    *   将当前页面核心数据截图，生成一张精美海报（用于发朋友圈）。

### 3.4 教师端配套功能
*   **邀请管理**: 学生详情页 -> “生成邀请卡”（含姓名+访问码）。
*   **消息中心**: 首页/我的 -> 右上角铃铛 -> 展示家长点赞/留言列表 -> 支持“一键已读”。

---

## 4. 数据库模型变更 (Schema Changes)

我们需要在 `schema.prisma` 中新增/修改以下模型：

```prisma
// 1. 动态事件流 (每一条记录)
model TimelineEvent {
  id        String   @id @default(uuid())
  studentId String
  type      String   // TASK, HABIT, PK, BADGE
  content   Json     // { title: "背诵古诗", score: 10, ... }
  createdAt DateTime @default(now())
}

// 2. 每日反馈汇总 (每一天的家校互动)
model DailySummary {
  id            String   @id @default(uuid())
  studentId     String
  date          String   // "2023-12-16"
  parentLiked   Boolean  @default(false)
  parentComment String?
  parentIdentity String? // "妈妈"
  teacherRead   Boolean  @default(false) // 老师是否已读
  
  @@unique([studentId, date])
}

// 3. 复活助力活动 (裂变)
model Campaign {
  id           String   @id @default(uuid())
  studentId    String
  type         String   // "REVIVE"
  targetCount  Int      @default(5)
  currentCount Int      @default(0)
  status       String   // ACTIVE, COMPLETED
  createdAt    DateTime @default(now())
}

// 4. 学校配置 (SaaS化)
model School {
  // ... 现有字段
  educationalPhilosophy String? @db.Text // 校区自定义教育理念
}
```

---

## 5. 开发阶段规划 (Roadmap)

*   **Phase 1: 基础建设 (P0)**
    *   完成数据库 Schema 变更。
    *   实现家长端登录 (JWT) 与 教师端邀请卡。
    *   实现 `TimelineService`，打通“操作 -> 动态”的自动化链路。
*   **Phase 2: 核心体验 (P0)**
    *   开发家长端 Tab 1 (今日动态) 与 Tab 2 (图表可视化)。
    *   实现底部点赞/留言与教师端消息中心。
*   **Phase 3: 增长裂变 (P1)**
    *   开发“复活大作战”流程 (发起 -> 落地页 -> 回调)。
    *   开发“AI 简报一键复制”与“海报生成”。

---

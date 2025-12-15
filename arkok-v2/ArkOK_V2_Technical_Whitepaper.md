# 🚀 ArkOK V2：智慧教育 SaaS 平台架构白皮书

**版本:** 2.0.0 (Release)
**日期:** 2025-12-13
**状态:** 🟢 生产就绪 (Production Ready)

---

## 📋 目录

- [第一部分：V1 到 V2 的演变史](#第一部分v1-到-v2-的演变史)
  - [V1 时代的痛点](#v1-时代的痛点)
  - [V2 重构的目标](#v2-重构的目标)
  - [关键里程碑](#关键里程碑)
- [第二部分：V2 顶层技术架构](#第二部分v2-顶层技术架构)
  - [系统拓扑图](#系统拓扑图)
  - [技术栈](#技术栈)
- [第三部分：核心设计规范](#第三部分核心设计规范)
  - [数据库访问规范](#数据库访问规范)
  - [认证与安全规范](#认证与安全规范)
  - [数据流规范](#数据流规范)
- [第四部分：核心功能模块](#第四部分核心功能模块)
  - [班级管理 (Mobile Home)](#班级管理-mobile-home)
  - [双模数据大屏 (Big Screen)](#双模数据大屏-big-screen)
  - [子系统 (Sub-systems)](#子系统-sub-systems)
- [第五部分：部署与运维](#第五部分部署与运维)
  - [极简启动](#极简启动)
  - [生产环境构建](#生产环境构建)
  - [故障排查](#故障排查)
- [第六部分：未来展望](#第六部分未来展望)

---

## 第一部分：V1 到 V2 的演变史

### V1 时代的痛点

ArkOK V1 是一个典型的"单机版原型验证"系统。虽然它拥有优秀的教学交互设计，但技术底层存在严重局限：

- **架构耦合:** 前后端代码纠缠不清，难以独立维护
- **部署困难:** 修改一行前端代码，需要复杂的手动编译和文件拷贝
- **数据孤岛:** 无法支持多学校（多租户），数据难以迁移和备份
- **脆弱的连接:** 缺乏断线重连和健壮的错误处理，网络波动即导致白屏

### V2 重构的目标

我们的目标不是简单的修补，而是**"换心手术"**：保持 V1 优秀的前端体验（UI/UX）不变，将内核彻底替换为企业级 SaaS 架构。

### 关键里程碑

| 阶段 | 关键行动 | 成果 |
|------|----------|------|
| P1: 地基搭建 | 引入 Prisma + PostgreSQL，设计多租户 Schema | 实现了 schoolId 数据隔离，支持无限扩容 |
| P2: 统一托管 | 废弃 Nginx/Proxy，采用 Node.js 单端口托管 | 彻底解决了公网访问白屏、跨域和 CSS 加载失败问题 |
| P3: 认证重铸 | 全局 Axios 拦截器 + JWT 标准化 | 建立了牢不可破的认证链路，解决了"无权访问"的 API 错误 |
| P4: 数据救援 | 编写 CSV 注入脚本与数据唤醒脚本 | 成功找回并激活了 28 名核心学生的历史数据 |
| P5: 灵魂附体 | 像素级复刻 V1 首页 + 双模大屏 | 完美恢复了橙色网格 UI 与长按交互，并上线了"星际战斗"模式 |

---

## 第二部分：V2 顶层技术架构

### 系统拓扑图

ArkOK V2 采用了**"统一后端托管 (Unified Backend Hosting)"**模式。这是在 Sealos 等云原生环境下最稳定、最高效的架构。

```mermaid
graph TD
    User([用户/教师/大屏]) -->|HTTPS| Ingress[Sealos Ingress Gateway]
    Ingress -->|流量转发| Container[ArkOK V2 容器]

    subgraph Container [Port 3000]
        Core[Node.js (Express) 主服务]

        Core -->|1. 静态资源请求 (*)| Static[前端构建产物 (client/dist)]
        Core -->|2. API 请求 (/api/*)| API[业务逻辑层]
        Core -->|3. 实时通信 (/socket.io)| Socket[Socket.io 服务]
    end

    API --> Service[Service 层 (业务逻辑)]
    Service -->|Prisma ORM| DB[(PostgreSQL 数据库)]
    Socket --> Service
```

### 技术栈

#### 前端 (Client)
- **框架:** React 18 + Vite (极速构建)
- **语言:** TypeScript (类型安全)
- **样式:** Tailwind CSS (原子化 CSS 引擎)
- **路由:** React Router v6
- **网络:** Axios (带全局拦截器) + Socket.io-client (实时)
- **动画:** Framer Motion (大屏特效)

#### 后端 (Server)
- **运行时:** Node.js + Express
- **语言:** TypeScript
- **ORM:** Prisma (类型安全的数据库操作)
- **数据库:** PostgreSQL (关系型数据库)
- **认证:** JWT (JSON Web Tokens)

---

## 第三部分：核心设计规范

为了避免代码腐化，V2 制定了严格的开发规范。

### 数据库访问规范 (The "Service-Only" Rule)

**规则:** 严禁在 Controller 或 Route 层直接操作数据库。

**模式:** "自包含服务模式"。每个 Service 类内部自行实例化 PrismaClient，确保连接独立且稳定。

```typescript
// ✅ 正确示范
export class StudentService {
  private prisma = new PrismaClient(); // 自带锅灶
  async getUsers() { return this.prisma.user.findMany(); }
}
```

### 认证与安全规范 (The "Chain of Trust")

1. **存储:** Token 登录后存入 localStorage
2. **携带:** 前端 apiService 拦截器自动在 Header 中附加 Authorization: Bearer <token>
3. **验证:** 后端 AuthMiddleware 拦截所有 /api 请求，解析 Token 并注入 req.user

### 数据流规范 (Data Flow)

```
前端: Component -> apiService -> Backend
后端: Route -> Controller (解析参数) -> Service (业务逻辑/DB操作) -> Controller (返回 JSON)
```

---

## 第四部分：核心功能模块

### 班级管理 (Mobile Home)

**UI:** 橙色主题，3-4 列学生头像网格

**交互:**
- **长按:** 触发加分/扣分 ActionSheet
- **点击:** 进入学生详情页（成长档案）
- **新增:** 模态框表单，创建后无感刷新列表

**数据:** 实时同步，后端推送 SCORE_UPDATE 事件

### 双模数据大屏 (Big Screen)

#### 日常模式 (Monitor)
- **左侧：** 班级积分排行榜（实时更新）
- **右侧：** 最近动态与活动

#### 战斗模式 (Battle)
- **触发条件：** PK 开始或特定挑战达成
- **视觉：** 深色星空背景，霓虹光效，VS 动画

**技术实现:** 前端状态机 (mode: 'MONITOR' | 'BATTLE') + WebSocket 监听

### 子系统 (Sub-systems)

所有子系统均已实现独立的 API 和页面：

- **习惯 (Habits):** 培养学生日常行为习惯
- **勋章 (Badges):** 荣誉激励系统
- **PK (Battles):** 学生间的良性竞争
- **挑战 (Challenges):** 团队或个人任务目标

---

## 第五部分：部署与运维

### 极简启动 (One-Click Start)

在 Sealos 终端中，只需一行命令即可启动整个系统（包含构建前端和启动后端）：

```bash
cd ~/project/arkok-v2
./dev.sh
```

### 生产环境构建

```bash
# 1. 编译前端
cd client && npm run build

# 2. 编译后端 (自动包含在启动脚本中)
# 3. 启动
cd .. && ./dev.sh
```

### 故障排查 (Troubleshooting)

- **白屏/样式丢失:** 运行 `cd client && npm run build` 重新生成静态资源
- **500 错误:** 检查 `docs/CURRENT_STATUS.md`，确认 Service 层是否遵循了 Prisma 初始化规范
- **数据不显示:** 检查数据库中学生 `isActive` 字段是否为 `true`

---

## 第六部分：未来展望

虽然 V2 已经完美交付，但基于这个强大的架构，未来我们还可以做：

- **AI 智能分析:** 接入 Python 服务，分析学生错题和成长轨迹
- **多校区联盟:** 利用 schoolId 架构，实现跨校区 PK
- **家长端小程序:** 复用现有的 API，快速开发微信小程序端

---

**ArkOK V2 不仅仅是一个软件的升级，它是您数字化教学理念的完美载体。**

---

*本文档持续更新中...*

**最后更新:** 2025-12-13
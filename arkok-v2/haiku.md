# ArkOK V2 项目简明指南

## 🎯 项目背景

**ArkOK V2** 是从 V1 版本（单校区应用）全面重构而来的现代化 SaaS 教育平台。

- **目标**: 支持 1000+ 校区并发
- **技术栈**: React 18 + Node.js + PostgreSQL + Socket.io
- **部署**: Sealos (Kubernetes)
- **当前状态**: 核心功能已完成，正在进行 UI 完善

## 📁 项目结构

```
arkok-v2/
├── server/          # Node.js 后端 (Express + Prisma ORM)
├── client/          # React 前端 (Vite + Tailwind)
├── ai-worker/       # Python AI 服务 (预留)
└── docs/            # 技术文档
```

## ✅ 已完成任务

### 1. Home 页面 UI 恢复
- ✅ 从 V1 遗留代码恢复完整的 Home.tsx 布局（包括战队管理、学生网格等）
- ✅ 保留新 V2 数据逻辑（fetchStudents、handleConfirmScore 等）
- ✅ 创建 BottomNav.tsx（底部导航栏）
- ✅ 创建 ActionSheet.tsx（积分操作面板）
- ✅ 更新 Layout.tsx 集成新组件
- **状态**: TypeScript 编译无错误 ✨

### 2. 核心功能已支持
- 学生管理 (CRUD + 积分系统)
- 习惯打卡系统
- 挑战任务系统
- PK 对决系统
- 勋章成就系统
- 实时数据同步 (Socket.io)

## 📋 当前 TODO

### 高优先级
1. **前端构建**: 解决其他页面的 TypeScript 错误（QCView、StudentDetail、BigScreen 等）
2. **联合测试**: 确保 Home 页面与后端 API 正确通信
3. **UI 验收**: 对比原 V1 UI，确保像素级复现

### 中优先级
1. 其他页面的 UI 恢复（如需）
2. 性能优化和测试

## 🚀 部署与启动

### 本地开发

```bash
# 进入项目目录
cd /home/devbox/project/arkok-v2

# 安装依赖
npm install

# 启动（自动构建前端 + 启动后端）
./dev.sh
```

**访问地址**:
- 前端: `http://localhost:5173`
- 后端 API: `http://localhost:3000`

### 公网部署 (Sealos)

#### 重要提示
- **公网 URL 会随 Devbox 实例改变** - 每次创建新实例都需要在 Sealos 控制台查看新 URL
- 该项目原本是 V1 版本（arkok/），采用简单的 server.js 托管模式
- V2 项目架构更复杂，暂未进行完整的公网部署验证

#### 关键配置（参考 V1 部署方案）
- **监听地址**: 必须是 `0.0.0.0`（不能是 localhost）
- **端口**: 3000
- **数据库**: Sealos PostgreSQL（内部集群地址）
- **网关准备时间**: 2-5 分钟

#### 快速部署步骤

1. **确认公网 URL**
   ```bash
   # 在 Sealos Devbox 控制台查看当前实例的公网访问地址
   # 示例格式: https://xxxxxxxxxx.sealosbja.site
   ```

2. **配置环境变量**
   ```bash
   # 编辑服务器环境配置
   # 位置: /home/devbox/project/arkok-v2/server/.env

   NODE_ENV=production
   DATABASE_URL=postgresql://...  # 从 Sealos 复制
   JWT_SECRET=your-strong-secret
   ```

3. **启动服务**
   ```bash
   cd /home/devbox/project/arkok-v2

   # 前台启动（便于查看日志）
   ./dev.sh

   # 或后台启动
   nohup ./dev.sh > server.log 2>&1 &
   ```

4. **验证服务**
   ```bash
   # 本地测试
   curl http://0.0.0.0:3000/health
   curl http://localhost:3000/api/students

   # 公网访问（网关准备 2-5 分钟后）
   https://your-url.sealosbja.site/
   ```

#### 可能的问题排查
- **公网 URL 长时间「准备中」**: 确认监听地址是 `0.0.0.0` 而不是 `localhost`
- **无法连接数据库**: 检查 DATABASE_URL 是否正确（应使用 Sealos 集群内网地址）
- **前端构建失败**: 需要先修复 TypeScript 类型错误（见当前 TODO）

## 🔍 关键文件变更

### 新创建的文件
- `client/src/components/BottomNav.tsx` - 底部导航栏（从遗留代码恢复）
- `client/src/components/ActionSheet.tsx` - 积分操作面板（从遗留代码恢复）

### 修改的文件
- `client/src/pages/Home.tsx` - 完整 UI 恢复 + 新数据逻辑集成
- `client/src/components/Layout.tsx` - 集成 BottomNav 组件

## 🐛 已知问题

1. **构建错误**: 部分页面的 TypeScript 类型检查失败（BigScreen、QCView、StudentDetail）
   - **影响**: 前端无法构建
   - **解决**: 需要修复这些页面的类型定义
   - **优先级**: 高

2. **UI 细节**: 某些交互细节可能需要微调（经过充分测试后）

## 📊 架构对比

| 特性 | V1 | V2 |
|------|----|----|
| 前端框架 | jQuery/Vue | React 18 |
| 后端 | Express 脚本 | 完整 Node.js + Prisma |
| 多租户 | ❌ | ✅ |
| 实时同步 | WebSocket | Socket.io |
| 大屏端 | ❌ | ✅ |
| 目标规模 | 单校区 | 1000+ 校区 |

## 📞 快速参考

```bash
# 开发
./dev.sh                          # 启动服务
npm run build (在 client/)         # 仅构建前端
npm run dev (在 server/)           # 仅启动后端

# 测试
curl http://localhost:3000/health # 健康检查
curl http://localhost:3000/api/students # 学生列表

# 查看日志
tail -f server.log               # 查看启动日志
ps aux | grep "node"             # 查看进程
```

## 🎯 下一步建议

1. **立即**: 修复其他页面的 TypeScript 错误，使项目能成功构建
2. **然后**: 本地测试 Home 页面与数据的交互
3. **最后**: 在公网验证完整功能

## 🌐 公网部署完整指南

详细的部署和运维指南请查看 **DEPLOY_README.md**，包含：
- 核心架构设计（前后端一体化托管）
- 标准操作流程 (SOP)
- 故障排查手册
- 公网访问地址

关键快速命令：
```bash
# 恢复服务
cd /home/devbox/project/arkok-v2 && ./dev.sh

# 修改前端代码后重新部署
cd client && npm run build && cd .. && ./dev.sh

# 验证部署
curl https://esboimzbkure.sealosbja.site/health
```

---

**最后更新**: 2025-12-12
**当前焦点**: UI 恢复 + 构建修复 + 公网部署验证
**项目位置**: `/home/devbox/project/arkok-v2`
**公网地址**: https://esboimzbkure.sealosbja.site

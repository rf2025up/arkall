# 🚀 ArkOK V2 双模大屏系统

**版本**: v2.0.0
**类型**: React + TypeScript + Vite 教育管理系统
**状态**: ✅ 生产就绪，支持公网访问

## 🎯 系统概述

ArkOK V2 是一个现代化的教育管理系统，集成了双模大屏展示、实时数据同步、学情管理等核心功能。系统采用前后端分离架构，部署在 Sealos Devbox 云平台上。

### 核心特性
- 🌟 **双模大屏系统**: 日常监控模式 + 战斗PK模式，智能切换
- 🎮 **实时交互**: Socket.io驱动的实时数据同步和状态更新
- 📱 **响应式设计**: 完美适配桌面端、移动端和大屏设备
- 🎨 **现代UI**: 基于Tailwind CSS的科幻风格界面设计
- ⚡ **高性能**: Vite构建引擎，TypeScript类型安全

---

## 🌐 公网访问部署

### 部署架构
```
🌐 公网访问: https://esboimzbkure.sealosbja.site
    ↓
Sealos Devbox 内网穿透 + 域名映射
    ↓
┌─────────────────────────────────────┐
│         双服务器架构                │
├─────────────────┬───────────────────┤
│     端口 3000    │     端口 5173     │
│   后端API服务    │   前端开发服务    │
│   (Express)     │   (Vite Dev)     │
└─────────────────┴───────────────────┘
```

### 访问地址

#### 🔗 公网访问 (推荐)
- **📱 管理端**: https://esboimzbkure.sealosbja.site/app
- **📺 大屏端**: https://esboimzbkure.sealosbja.site/screen
- **👤 学生端**: https://esboimzbkure.sealosbja.site/student
- **📊 API接口**: https://esboimzbkure.sealosbja.site/api/*

#### 🔧 本地开发
- **📱 前端开发**: http://localhost:5173
- **🔌 后端API**: http://localhost:3000
- **📊 API文档**: http://localhost:3000/api-docs

### 部署配置要点

#### 1. 网络配置
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0', // 必须绑定到0.0.0.0以支持外网访问
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
```

#### 2. 环境变量
```bash
# 后端环境配置 (.env)
NODE_ENV=development
PORT=3000
HOST=0.0.0.0  # 必须绑定到0.0.0.0

# API配置
API_BASE_URL=https://esboimzbkure.sealosbja.site/api
SOCKET_URL=https://esboimzbkure.sealosbja.site
```

#### 3. 服务绑定要求
- **必须绑定到 `0.0.0.0`**: 不能绑定 `127.0.0.1` 或 `localhost`
- **端口监听**: 后端3000，前端5173
- **健康检查**: `/health` 端点用于监控服务状态

---

## 🚀 快速开始

### 开发环境启动

#### 1. 启动后端服务
```bash
cd server
npm install
npm run dev
# 服务运行在 http://localhost:3000
```

#### 2. 启动前端服务
```bash
cd client
npm install
npm run dev
# 服务运行在 http://localhost:5173
```

#### 3. 验证服务
```bash
# 检查后端健康状态
curl http://localhost:3000/health

# 检查前端访问
curl http://localhost:5173
```

### 生产部署

#### 1. 构建前端
```bash
cd client
npm run build
# 构建产物输出到 dist/ 目录
```

#### 2. 部署到公网
```bash
# 使用自动化部署脚本
bash deploy-to-sealos.sh

# 或手动部署
cp -r client/dist/* public/
```

#### 3. 验证公网访问
```bash
# 检查公网健康状态
curl https://esboimzbkure.sealosbja.site/health

# 检查大屏端访问
curl -s -o /dev/null -w "%{http_code}" https://esboimzbkure.sealosbja.site/screen
```

---

## 🛠️ 技术栈

### 前端技术
- **React 18**: 现代化UI框架，支持并发特性
- **TypeScript**: 类型安全的JavaScript超集
- **Vite**: 高性能构建工具，HMR开发体验
- **Tailwind CSS**: 原子化CSS框架
- **Framer Motion**: 流畅的动画库
- **Socket.io Client**: 实时双向通信
- **React Router**: 单页应用路由管理
- **Lucide React**: 现代化图标库

### 后端技术
- **Node.js**: JavaScript运行时环境
- **Express.js**: Web应用框架
- **TypeScript**: 类型安全的服务端开发
- **Socket.io**: 实时WebSocket服务
- **Prisma**: 现代化ORM数据库工具
- **PostgreSQL**: 关系型数据库
- **JWT**: 安全的身份认证
- **Bcrypt**: 密码加密存储

### 部署平台
- **Sealos Devbox**: 云原生开发环境
- **内网穿透**: 自动域名映射和端口转发
- **PostgreSQL集群**: 高可用数据库服务

---

## 🎮 功能模块

### 双模大屏系统
- **日常监控模式**:
  - 📊 实时数据排行榜展示
  - 🏆 PK对战记录与统计
  - 👥 学生状态监控面板
  - 🎖️ 荣誉徽章系统

- **战斗PK模式**:
  - ⚡ 科幻星空背景动画
  - 🎮 3D卡片翻转效果
  - ⚔️ 动态VS对抗界面
  - 🎯 实时战斗状态同步

### 学情管理系统
- **📊 学情概览**: 班级整体数据分析
- **📈 成长管理**: 任务记录与习惯统计
- **📚 学业分析**: 个人学习轨迹跟踪
- **❌ 错题管理**: 智能错题收集与攻克

---

## 🔧 故障排除

### 常见问题

#### Q1: 公网无法访问，显示 "upstream connect error"
**原因**: 后端服务未启动或端口未正确绑定
**解决方案**:
```bash
# 1. 检查后端服务状态
ps aux | grep -E "(arkok|server)" | grep -v grep

# 2. 检查端口监听
netstat -tulpn | grep -E ":(3000|5173)"

# 3. 启动后端服务
cd server && npm run dev

# 4. 确保绑定到0.0.0.0
curl http://localhost:3000/health
```

#### Q2: 前端页面显示空白或404错误
**原因**: Vite配置问题或服务绑定错误
**解决方案**:
```bash
# 1. 检查vite.config.ts配置
cat vite.config.ts | grep -A 10 "server:"

# 2. 确保host配置为0.0.0.0
# 3. 重启前端服务
npm run dev
```

#### Q3: Socket.io连接失败
**原因**: WebSocket代理配置问题
**解决方案**:
```typescript
// vite.config.ts 中的WebSocket代理配置
'/socket.io': {
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true,  // 确保启用WebSocket代理
}
```

### 调试命令

#### 服务状态检查
```bash
# 检查所有相关服务
ps aux | grep -E "(node|npm)" | grep -v grep

# 检查端口占用
netstat -tulpn | grep -E ":(3000|5173)"

# 测试本地连接
curl http://localhost:3000/health
curl http://localhost:5173

# 测试公网连接
curl https://esboimzbkure.sealosbja.site/health
```

#### 日志监控
```bash
# 监控后端日志
tail -f server/logs/app.log

# 监控前端构建日志
# Vite开发服务器日志直接显示在终端
```

---

## 📊 性能优化

### 前端优化
- **代码分割**: React.lazy + Suspense
- **资源优化**: Vite自动压缩和Tree Shaking
- **缓存策略**: 浏览器缓存 + Service Worker
- **图片优化**: WebP格式 + 响应式图片

### 后端优化
- **数据库连接池**: Prisma连接池配置
- **API缓存**: Redis缓存热点数据
- **压缩中间件**: Gzip响应压缩
- **健康检查**: 轻量级健康检查端点

### 部署优化
- **CDN加速**: 静态资源CDN分发
- **负载均衡**: 多实例部署
- **监控告警**: 服务状态实时监控
- **自动扩容**: 基于CPU/内存使用率

---

## 🔄 开发工作流

### 功能开发流程
1. **需求分析** → 功能设计
2. **代码开发** → 本地测试
3. **构建验证** → `npm run build`
4. **部署测试** → `bash deploy-to-sealos.sh`
5. **公网验证** → 功能完整性测试

### 代码规范
- **TypeScript**: 严格模式，完整类型定义
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Git Hooks**: 提交前自动检查

### 分支管理
- **main**: 生产环境分支
- **develop**: 开发环境分支
- **feature/***: 功能开发分支
- **hotfix/***: 紧急修复分支

---

## 📞 技术支持

### 相关文档
- **部署指南**: `../deploy-to-sealos.sh`
- **API文档**: http://localhost:3000/api-docs
- **历史文档**: `../_LEGACY_ARCHIVE_DO_NOT_TOUCH/`

### 联系方式
- **技术维护**: Claude Code AI助手
- **问题反馈**: GitHub Issues
- **紧急响应**: 系统日志监控

### 版本信息
- **当前版本**: v2.0.0
- **最后更新**: 2025-12-12
- **兼容性**: Node.js 18+, React 18+
- **浏览器支持**: Chrome 90+, Firefox 88+, Safari 14+

---

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

---

**🎉 系统已完全部署并支持公网访问！**

**主要访问地址**: https://esboimzbkure.sealosbja.site/screen
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

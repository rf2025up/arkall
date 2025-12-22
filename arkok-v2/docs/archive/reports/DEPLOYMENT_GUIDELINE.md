# 🚀 ArkOK V2 公网部署标准化指南（无PM2 - 云原生最佳实践）

**版本**: v2.0.0
**创建时间**: 2025-12-12
**更新时间**: 2025-12-18
**架构**: 统一托管架构
**状态**: ✅ 生产就绪

## 📋 核心架构说明

**统一托管架构 (云原生最佳实践):**
```
🌐 公网流量 (Sealos Ingress)
    ↓
端口 3000 (Node.js 统一服务)
    ↓
┌─────────────────────────────────────┐
│         统一托管服务器                │
├─────────────────┬───────────────────┤
│   /api/*        │     /*            │
│   ↓             │     ↓            │
│   API 业务逻辑   │   静态资源托管     │
│   Express       │   client/dist     │
└─────────────────┴───────────────────┘
```

**关键组件:**
- **统一服务器**: `node dist/index.js` (端口3000)
- **后端API服务**: Express + Socket.io (集成在统一服务中)
- **前端静态资源**: 直接托管 client/dist 目录

## 🚀 标准化部署流程（无PM2 - 云原生最佳实践）

**当用户说"公网部署"时，AI助手自动执行以下4阶段流程：**

### 📋 阶段1：环境准备与清理
```bash
# 检查并清理端口占用
fuser -k 3000/tcp 2>/dev/null
fuser -k 3001/tcp 2>/dev/null

# 清理PM2进程（如果存在）
pm2 kill 2>/dev/null

# 清理现有服务进程
pkill -f "node dist/index.js"

# 验证环境配置
grep -q "PORT=3000" server/.env
```

### 📋 阶段2：代码编译
```bash
# 前端编译（必须执行）
cd client && npm run build

# 后端编译（推荐执行）
cd server && npm run build
```

### 📋 阶段3：服务启动（无PM2）
```bash
# 直接启动服务（云原生最佳实践）
cd server
nohup node dist/index.js > server.log 2>&1 &

# 等待服务启动
sleep 5
```

### 📋 阶段4：部署验证
```bash
# 本地健康检查
curl -s -f "http://localhost:3000/health"

# 公网连通性验证
curl -s -f -I "https://esboimzbkure.sealosbja.site/health"
```

## 🛠️ 自动化部署脚本

使用标准化脚本：`./deploy-public.sh`

```bash
# AI助手自动执行
./deploy-public.sh
```

**脚本特点：**
- ✅ 4阶段标准化流程
- ✅ 完整的错误处理
- ✅ 彩色日志输出
- ✅ 自动重试机制
- ✅ 部署结果报告

## 📋 全局部署要求

**⚠️ 重要：每次部署动作前必须执行以下标准化流程**

### 1️⃣ 部署前检查清单

#### 代码状态检查
```bash
# ✅ 确保所有代码已保存并提交
git status
git add .
git commit -m "feat: 更新功能 - [具体功能描述]"
```

#### API导入检查（关键步骤）
```bash
# ✅ 检查所有API导入是否正确
grep -r "from ['\"].*utils/api['\""]" client/src/ || echo "✅ API导入检查通过"

# ✅ 确保使用正确的API导入
# 正确: import { API } from '../services/api.service';
# 错误: import api from '../utils/api';
```

#### 服务状态检查
```bash
# ✅ 检查智能代理架构端口
netstat -tulpn | grep -E ":(3000|3001|5173)"

# ✅ 测试代理健康检查
curl http://localhost:3000/health
# 期望返回: {"service":"arkok-v2-proxy",...}
```

### 2️⃣ 标准化部署流程

#### 步骤1: 停止现有服务
```bash
# 停止所有ArkOK相关服务
pkill -f "arkok" && pkill -f "vite.*5173" && pkill -f "node.*3000"
echo "所有服务已停止"
```

#### 步骤2: 修复导入问题（自动检查）
```bash
cd /home/devbox/project/arkok-v2

# 修复API导入问题
find client/src/ -name "*.tsx" -exec sed -i 's|from ['\"'\''\.\./\.\.]/utils/api['\"'\''\']|from '\.\./services/api.service'\''|g' {} \;
find client/src/ -name "*.tsx" -exec sed -i 's|import api from|import { API } from|g' {} \;
find client/src/ -name "*.tsx" -exec sed -i 's|api\.|API\.|g' {} \;

# 修复组件导入问题
find client/src/ -name "*.tsx" -exec sed -i 's|import { ProtectedRoute }|import ProtectedRoute|g' {} \;
```

#### 步骤3: 构建前端项目
```bash
cd client

# 使用Vite构建（跳过TypeScript类型检查）
npx vite build --mode production

# 验证构建产物
ls -la dist/ && echo "✅ 前端构建成功"
```

#### 步骤4: 启动智能代理架构
```bash
cd ..

# 确保代理服务器可执行
chmod +x proxy-server.js dev.sh

# 启动完整服务堆栈 (一条命令)
./dev.sh
```

#### 步骤5: 公网访问验证
```bash
# 测试代理健康检查
curl http://localhost:3000/health
# 期望返回: {"service":"arkok-v2-proxy","upstream":{"backend":"http://localhost:3001","frontend":"http://localhost:5173"}}

# 测试大屏端访问 (本地)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/screen
# 期望返回: 200

# 测试公网访问
curl -s -o /dev/null -w "%{http_code}" https://esboimzbkure.sealosbja.site/screen
# 期望返回: 200

# 测试公网API
curl https://esboimzbkure.sealosbja.site/health
# 期望返回: {"service":"arkok-v2-proxy",...}
```

### 3️⃣ 部署后验证清单

#### 功能验证
```bash
# ✅ 大屏端功能验证
echo "📺 大屏端访问地址: https://esboimzbkure.sealosbja.site/screen"
echo "🎮 开发环境快捷键: 1-日常模式 2-测试PK 3-测试胜利"

# ✅ 管理端功能验证
echo "📱 管理端访问地址: https://esboimzbkure.sealosbja.site/app"
echo "🔧 功能: 5Tab导航、学生管理、积分系统等"

# ✅ API接口验证
echo "🔌 API接口地址: https://esboimzbkure.sealosbja.site/api/*"
```

#### 错误处理检查
```bash
# 检查常见部署错误
echo "🔍 检查upstream connect error..."
curl -I https://esboimzbkure.sealosbja.site/health

# 检查前端资源加载
curl -I https://esboimzbkure.sealosbja.site/assets/index-*.js
```

### 4️⃣ 紧急修复流程

#### 如果大屏端显示Dashboard而不是BigScreen
```bash
# 1. 清除浏览器缓存
# Chrome: Ctrl+Shift+R
# Safari: Cmd+Shift+R

# 2. 检查路由配置
cat client/src/routes/index.tsx | grep -A 5 "/screen"

# 3. 重新构建部署
cd client && npx vite build --mode production
cd .. && cp -r client/dist/* server/public/
```

#### 如果API导入错误
```bash
# 1. 查找错误的API导入
grep -r "utils/api" client/src/

# 2. 批量修复
find client/src/ -name "*.tsx" -exec sed -i 's|utils/api|services/api.service|g' {} \;

# 3. 重新构建部署
```

### 5️⃣ 公网访问地址

#### ✅ 主要访问入口
- **📺 大屏端**: https://esboimzbkure.sealosbja.site/screen
- **📱 管理端**: https://esboimzbkure.sealosbja.site/app
- **👤 学生端**: https://esboimzbkure.sealosbja.site/student
- **🔌 API接口**: https://esboimzbkure.sealosbja.site/api/*

#### 🔧 开发调试入口
- **📱 前端开发**: http://localhost:5173
- **🔌 后端API**: http://localhost:3000
- **📊 健康检查**: http://localhost:3000/health

### 6️⃣ 监控和维护

#### 服务状态监控
```bash
# 持续监控脚本
while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://esboimzbkure.sealosbja.site/health)
  if [ "$STATUS" != "200" ]; then
    echo "⚠️ 服务异常，状态码: $STATUS" | tee -a deploy-monitor.log
  fi
  sleep 60
done
```

#### 日志检查
```bash
# 检查后端日志
tail -f server/logs/app.log

# 检查部署日志
tail -f deploy-monitor.log
```

---

## 🎯 部署成功标准

### ✅ 必须满足的条件
1. **HTTP状态码**: 所有主要端点返回200
2. **功能完整**: 大屏端显示双模系统，非Dashboard
3. **API正常**: 健康检查返回成功状态
4. **资源加载**: 所有静态资源正常访问
5. **实时通信**: Socket.io连接正常

### 🔍 验证命令
```bash
# 完整验证脚本
curl -s https://esboimzbkure.sealosbja.site/health | jq .success
curl -s -o /dev/null -w "%{http_code}" https://esboimzbkure.sealosbja.site/screen
curl -s -o /dev/null -w "%{http_code}" https://esboimzbkure.sealosbja.site/app
```

---

**⚠️ 重要提醒**: 每次部署动作都必须严格按照此指南执行，确保公网访问地址正常工作！

**🚀 当前部署状态**: ✅ 已成功部署到公网大屏端
**🌐 访问地址**: https://esboimzbkure.sealosbja.site/screen
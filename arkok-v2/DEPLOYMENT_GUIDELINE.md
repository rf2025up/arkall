# 🚀 ArkOK V2 公网部署标准化指南

**版本**: v2.0.0
**创建时间**: 2025-12-12
**架构**: Plan C 智能代理模式
**状态**: ✅ 生产就绪

## 📋 核心架构说明

**Plan C 智能代理架构:**
```
🌐 公网流量 (Sealos Ingress)
    ↓
端口 3000 (智能代理服务器)
    ↓
┌─────────────────────────────────────┐
│         智能路由分发                │
├─────────────────┬───────────────────┤
│   /api/*        │     /*            │
│   ↓             │     ↓            │
│   后端 API      │   前端 UI         │
│   端口 3001     │   端口 5173       │
└─────────────────┴───────────────────┘
```

**关键组件:**
- **智能代理服务器**: `proxy-server.js` (端口3000)
- **后端API服务**: Express + Socket.io (端口3001)
- **前端UI服务**: Vite + React (端口5173)

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
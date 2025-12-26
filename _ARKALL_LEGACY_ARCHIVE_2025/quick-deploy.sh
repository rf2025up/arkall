#!/bin/bash

set -e

echo "🚀 ArkOK V2 快速公网部署脚本"
echo "================================"

# 1. 检查当前工作目录
if [ ! -d "arkok-v2" ]; then
    echo "❌ 错误：请在项目根目录执行此脚本"
    exit 1
fi

# 2. 停止现有服务
echo "🛑 停止现有服务..."
pkill -f "arkok" && pkill -f "vite.*5173" && pkill -f "node.*3000" 2>/dev/null || true
sleep 2

# 3. 修复API导入问题
echo "🔧 修复API导入问题..."
cd arkok-v2

find client/src/ -name "*.tsx" -exec sed -i 's|from ['\"'\''\.\./\.\.]/utils/api['\"'\''\']|from '\.\./services/api.service'\''|g' {} \;
find client/src/ -name "*.tsx" -exec sed -i 's|import api from|import { API } from|g' {} \;
find client/src/ -name "*.tsx" -exec sed -i 's|api\.|API\.|g' {} \;

# 4. 构建前端
echo "🏗️ 构建前端项目..."
cd client
npm install
npx vite build --mode production

if [ ! -d "dist" ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

echo "✅ 前端构建成功"

# 5. 复制构建文件
echo "📁 复制构建文件..."
cd ..
mkdir -p server/public
cp -r client/dist/* server/public/

# 6. 启动服务
echo "🚀 启动智能代理服务..."
chmod +x proxy-server.js dev.sh

# 使用PM2启动服务（如果可用）
if command -v pm2 &> /dev/null; then
    pm2 start dev.sh --name arkok-v2
    echo "✅ 使用PM2启动服务"
else
    nohup ./dev.sh > app.log 2>&1 &
    echo "✅ 使用后台进程启动服务"
fi

# 7. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 8. 健康检查
echo "🔍 执行健康检查..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ 本地服务启动成功"
else
    echo "❌ 本地服务启动失败"
    exit 1
fi

echo ""
echo "🎉 部署完成！"
echo "================================"
echo "📺 大屏端: https://esboimzbkure.sealosbja.site/screen"
echo "📱 管理端: https://esboimzbkure.sealosbja.site/app"
echo "👤 学生端: https://esboimzbkure.sealosbja.site/student"
echo "🔌 API接口: https://esboimzbkure.sealosbja.site/api/*"
echo ""
echo "🔧 本地调试:"
echo "   前端: http://localhost:5173"
echo "   API: http://localhost:3000"
echo "   健康检查: http://localhost:3000/health"
#!/bin/bash

# ArkOK V2 统一后端托管架构启动脚本（无PM2 - 云原生最佳实践）
# 本地开发环境启动 - 单一入口点
# 说明: 用于本地开发和调试，公网部署请使用 ./deploy-public.sh

echo "🚀 Starting ArkOK V2 (Unified Backend Hosting - No PM2)..."
echo "==========================================================="

# 清理现有进程
echo "🧹 清理现有进程..."
pkill -f "node.*server" || true
pkill -f "ts-node-dev" || true
pkill -f "node dist/index.js" || true
pm2 kill 2>/dev/null || true
sleep 2

# 检查前端是否已构建
if [ ! -d "client/dist" ]; then
    echo "📦 Frontend not built. Building now..."
    cd client && npm run build && cd ..
    if [ $? -ne 0 ]; then
        echo "❌ Frontend build failed!"
        exit 1
    fi
    echo "✅ Frontend built successfully"
fi

# 启动统一后端服务 (端口3000)
echo "🌐 Starting unified backend service on port 3000..."
cd server && npm run start
#!/bin/bash

# ArkOK V2 统一后端托管架构启动脚本
# 生产/演示模式 - 单一入口点

echo "🚀 Starting ArkOK V2 (Unified Backend Hosting)..."
echo "==============================================="

# Kill existing node processes
pkill -f "node.*server" || true
pkill -f "ts-node-dev" || true
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
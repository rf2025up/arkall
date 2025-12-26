#!/bin/bash

set -e

echo "🐳 Docker 公网部署方案"
echo "================================"

# 1. 构建Docker镜像
echo "🏗️ 构建Docker镜像..."
docker build -t arkok-v2:latest .

# 2. 标记镜像
echo "🏷️ 标记镜像..."
docker tag arkok-v2:latest registry.cn-hangzhou.aliyuncs.com/arkok/arkok-v2:latest

# 3. 推送到镜像仓库（需要登录）
echo "📤 推送镜像到仓库..."
echo "⚠️ 请确保已登录阿里云镜像仓库:"
echo "   docker login --username=your-username registry.cn-hangzhou.aliyuncs.com"

# docker push registry.cn-hangzhou.aliyuncs.com/arkok/arkok-v2:latest

echo "🔧 Kubernetes 部署配置已准备: arkok-deployment.yaml"
echo "📋 请通过 Sealos 控制台应用配置文件"
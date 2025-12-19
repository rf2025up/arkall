#!/bin/bash

# ArkOK V2 一键部署脚本
# 作者：Claude Code Assistant
# 日期：$(date +%Y-%m-%d)

echo "🚀 ArkOK V2 开始部署..."
echo "================================"

# 检查系统要求
echo "📋 检查系统要求..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi
echo "✅ Node.js 版本: $(node -v)"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi
echo "✅ npm 版本: $(npm -v)"

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    npm install -g pm2
fi
echo "✅ PM2 已安装"

# 停止现有进程
echo "🛑 停止现有 ArkOK 进程..."
pm2 delete arkok-v2-server 2>/dev/null || true
pm2 delete arkok-v2-client 2>/dev/null || true

# 部署后端
echo "🔧 部署后端服务..."
cd server

# 安装后端依赖
echo "📦 安装后端依赖..."
npm install

# 生成Prisma客户端
echo "🗄️ 生成数据库客户端..."
npx prisma generate

# 数据库迁移（如果需要）
# npx prisma migrate deploy

# 构建后端
echo "🔨 构建后端代码..."
npm run build

# 复制环境变量示例
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚙️ 已创建 .env 文件，请根据需要修改配置"
fi

# 启动后端服务
echo "🚀 启动后端服务..."
pm2 start dist/index.js --name "arkok-v2-server"

cd ..

# 部署前端
echo "🎨 部署前端应用..."
cd client

# 安装前端依赖
echo "📦 安装前端依赖..."
npm install

# 构建前端
echo "🔨 构建前端代码..."
npm run build

# 启动前端开发服务器
echo "🚀 启动前端开发服务器..."
pm2 start "npm run dev" --name "arkok-v2-client"

cd ..

echo "================================"
echo "✅ ArkOK V2 部署完成！"
echo ""
echo "📱 访问地址："
echo "   前端应用: http://localhost:5173"
echo "   后端API: http://localhost:3000"
echo "   健康检查: http://localhost:3000/health"
echo ""
echo "🔑 默认账户："
echo "   教师: long / 123456"
echo "   管理员: admin / 123456"
echo ""
echo "📋 管理命令："
echo "   查看状态: pm2 status"
echo "   查看日志: pm2 logs"
echo "   重启服务: pm2 restart all"
echo "   停止服务: pm2 delete all"
echo ""
echo "🔧 配置文件："
echo "   后端环境变量: server/.env"
echo "   数据库配置: server/prisma/schema.prisma"
echo ""

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo "📊 服务状态："
pm2 status

echo ""
echo "🎉 部署脚本执行完成！"
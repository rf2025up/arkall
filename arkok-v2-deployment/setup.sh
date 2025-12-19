#!/bin/bash

# ArkOK V2 环境初始化脚本
# 用于在新的Ubuntu/Debian系统上安装所有必要的依赖

echo "🔧 ArkOK V2 环境初始化"
echo "================================"

# 更新系统包
echo "📦 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装基础工具
echo "🔨 安装基础工具..."
sudo apt install -y curl wget git vim nano build-essential

# 安装Node.js 18
echo "📥 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证Node.js安装
echo "✅ 验证 Node.js 安装..."
node --version
npm --version

# 安装PM2
echo "📦 安装 PM2..."
sudo npm install -g pm2

# 安装PostgreSQL
echo "🗄️ 安装 PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# 启动PostgreSQL服务
echo "🚀 启动 PostgreSQL 服务..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 设置PostgreSQL
echo "🔐 配置 PostgreSQL..."
sudo -u postgres psql -c "CREATE USER arkok_user WITH PASSWORD 'arkok_password';"
sudo -u postgres psql -c "CREATE DATABASE arkok_db OWNER arkok_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE arkok_db TO arkok_user;"

# 安装Git
echo "📥 安装 Git..."
sudo apt install -y git

# 验证安装
echo "✅ 验证所有组件安装..."
echo "Node.js: $(node -v)"
echo "npm: $(npm -v)"
echo "PM2: $(pm2 -v)"
echo "PostgreSQL: $(psql --version)"
echo "Git: $(git --version)"

echo ""
echo "================================"
echo "✅ 环境初始化完成！"
echo ""
echo "📋 PostgreSQL 配置信息："
echo "   数据库: arkok_db"
echo "   用户: arkok_user"
echo "   密码: arkok_password"
echo ""
echo "🔧 下一步："
echo "   1. 下载 ArkOK V2 部署包"
echo "   2. 解压并运行 ./deployment.sh"
echo ""
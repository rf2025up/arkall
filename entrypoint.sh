#!/bin/bash

app_env=${1:-development}

# ============================================================================
# Growark Server 启动脚本
# 版本: v1.2
# 最后更新: 2025-11-25
# ============================================================================

# 切换到 arkok 项目目录
PROJECT_DIR="/home/devbox/project/arkok"
echo "═══════════════════════════════════════════════════════════════"
echo "  Growark Server 启动程序"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "项目目录: $PROJECT_DIR"
echo ""

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 错误: 项目目录不存在"
    echo ""
    echo "请确认:"
    echo "  1. 项目是否已正确部署到 $PROJECT_DIR"
    echo "  2. 项目目录名称是否为 'arkok'"
    echo ""
    echo "如果项目目录名称不同，请修改 entrypoint.sh 中的 PROJECT_DIR 变量"
    exit 1
fi

cd "$PROJECT_DIR" || {
    echo "❌ 错误: 无法切换到项目目录 $PROJECT_DIR"
    exit 1
}

echo "✅ 项目目录检查通过"
echo ""

# 检查 .env 文件是否存在
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 错误: 未找到 .env 配置文件"
    echo ""
    echo "请确保在以下位置创建 .env 文件:"
    echo "  $PROJECT_DIR/.env"
    echo ""
    echo "配置文件应包含以下内容:"
    echo "  DB_HOST=您的数据库主机地址"
    echo "  DB_PORT=5432"
    echo "  DB_NAME=postgres"
    echo "  DB_USER=postgres"
    echo "  DB_PASSWORD=您的数据库密码"
    echo "  PORT=3000"
    echo ""
    echo "参考文档: /home/devbox/project/启动公网.md"
    exit 1
fi

echo "✅ 配置文件检查通过"
echo ""

# 加载环境变量并显示配置信息
echo "正在加载环境变量配置..."
source .env

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  数据库连接配置"
echo "═══════════════════════════════════════════════════════════════"
echo "  主机:   $DB_HOST"
echo "  端口:   $DB_PORT"
echo "  数据库: $DB_NAME"
echo "  用户:   $DB_USER"
echo "  密码:   $(if [ -n "$DB_PASSWORD" ]; then echo "****"; fi)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ============================================================================
# 启动服务器
# ============================================================================

echo "═══════════════════════════════════════════════════════════════"
echo "  启动服务器"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Define build target
build_target="server"

# Development environment commands
dev_commands() {
    echo "环境模式: 开发环境 (development)"
    echo "启动命令: NODE_ENV=development node ${build_target}.js"
    echo ""
    echo "⏳ 正在启动服务器..."
    echo ""
    NODE_ENV=development node "${build_target}.js"
}

# Production environment commands
prod_commands() {
    echo "环境模式: 生产环境 (production)"
    echo "启动命令: NODE_ENV=production node ${build_target}.js"
    echo ""
    echo "⏳ 正在启动服务器..."
    echo ""
    NODE_ENV=production node "${build_target}.js"
}

# 显示访问信息（在服务器启动后显示）
show_access_info() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  服务器已启动！"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "📍 服务器监听地址: http://0.0.0.0:${PORT:-3000}"
    echo ""
    echo "🔌 公网访问地址（通过 Devbox 内网穿透）:"
    echo "   请等待 2-5 分钟，然后在 Devbox 控制台查看公网地址"
    echo ""
    echo "🔗 应用访问路径:"
    echo "   📱 手机端:     http://公网地址/app"
    echo "   📺 大屏端:     http://公网地址/screen"
    echo "   👤 管理端:     http://公网地址/admin"
    echo ""
    echo "📡 API 接口:"
    echo "   📊 学生数据:   http://公网地址/api/students"
    echo "   ❤️  健康检查:  http://公网地址/health"
    echo "🔌 WebSocket:    ws://公网地址/ws"
    echo ""
    echo "📚 文档:"
    echo "   📖 API 文档:   http://公网地址/api-docs"
    echo ""
    echo "⚠️  重要提示:"
    echo "   1. 首次启动请等待 2-5 分钟（网关准备时间）"
    echo "   2. 如页面空白或 404，请检查 /arkok/public/assets/ 目录"
    echo "   3. 详细说明请参考: /home/devbox/project/启动公网.md"
    echo ""
}

# 检查环境变量以确定运行环境
if [ "$app_env" = "production" ] || [ "$app_env" = "prod" ] ; then
    echo "运行环境: 生产环境"
    prod_commands &
else
    echo "运行环境: 开发环境"
    dev_commands &
fi

# 等待服务器启动
sleep 3

# 显示访问信息
show_access_info

# 等待后台进程
wait

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  服务器已停止"
echo "═══════════════════════════════════════════════════════════════"
echo ""

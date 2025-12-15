#!/bin/bash

# ============================================================================
# Growark + StarJourney 集成系统启动脚本
# 版本: v1.0
# 最后更新: 2025-12-09
# 功能: 同时启动Growark(3000)和StarJourney(3001)服务器
# ============================================================================

app_env=${1:-development}
PROJECT_DIR="/home/devbox/project"

echo "═══════════════════════════════════════════════════════════════"
echo "  Growark + StarJourney 集成系统启动程序"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "项目目录: $PROJECT_DIR"
echo "运行环境: $app_env"
echo ""

# 检查项目目录
if [ ! -d "$PROJECT_DIR/arkok" ] || [ ! -d "$PROJECT_DIR/starj" ]; then
    echo "❌ 错误: 项目目录不完整"
    echo "  缺少: $PROJECT_DIR/arkok 或 $PROJECT_DIR/starj"
    exit 1
fi

echo "✅ 项目目录检查通过"
echo ""

# 函数：启动Growark服务器
start_growark() {
    echo "🚀 启动 Growark 服务器 (端口 3000)..."
    cd "$PROJECT_DIR/arkok"

    if [ ! -f ".env" ]; then
        echo "❌ 错误: 未找到 Growark .env 配置文件"
        exit 1
    fi

    # 后台启动Growark服务器
    NODE_ENV=$app_env node server.js > ../growark.log 2>&1 &
    GROWARK_PID=$!
    echo "✅ Growark 服务器已启动 (PID: $GROWARK_PID)"

    # 等待启动
    sleep 3

    # 健康检查
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ Growark 健康检查通过"
    else
        echo "❌ Growark 健康检查失败"
        kill $GROWARK_PID 2>/dev/null
        exit 1
    fi
}

# 函数：启动StarJourney服务器
start_starjourney() {
    echo "🚀 启动 StarJourney 服务器 (端口 3001)..."
    cd "$PROJECT_DIR/starj"

    # 检查依赖
    if [ ! -f "package.json" ] && [ ! -f "../package.json" ]; then
        echo "⚠️  警告: 未找到StarJourney package.json，尝试使用全局依赖"
    fi

    # 后台启动StarJourney服务器
    node star-server.js > ../starjourney.log 2>&1 &
    STARJOURNEY_PID=$!
    echo "✅ StarJourney 服务器已启动 (PID: $STARJOURNEY_PID)"

    # 等待启动
    sleep 3

    # 健康检查
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo "✅ StarJourney 健康检查通过"
    else
        echo "❌ StarJourney 健康检查失败"
        kill $STARJOURNEY_PID 2>/dev/null
        exit 1
    fi
}

# 函数：显示访问信息
show_access_info() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  🎉 集成系统启动成功！"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "📍 本地访问地址:"
    echo "   📱 管理端:     http://localhost:3000/admin"
    echo "   📺 大屏端:     http://localhost:3000/screen"
    echo "   👤 学生端:     http://localhost:3000/student"
    echo "   🧪 集成测试:   http://localhost:3000/growark-starjourney-integration-test.html"
    echo ""
    echo "🔌 API 接口:"
    echo "   📊 Growark:   http://localhost:3000/api/*"
    echo "   🎯 StarJourney: http://localhost:3001/api/*"
    echo "   ❤️  健康检查:  http://localhost:3000/health"
    echo ""
    echo "🌐 公网访问地址:"
    echo "   ✅ 已确认: https://esboimzbkure.sealosbja.site"
    echo ""
    echo "🔗 公网访问路径:"
    echo "   📱 管理端:     https://esboimzbkure.sealosbja.site/admin"
    echo "   📺 大屏端:     https://esboimzbkure.sealosbja.site/screen"
    echo "   📱 手机端:     https://esboimzbkure.sealosbja.site/app"
    echo "   👤 学生端:     https://esboimzbkure.sealosbja.site/student"
    echo "   🧪 集成测试:   https://esboimzbkure.sealosbja.site/growark-starjourney-integration-test.html"
    echo ""
    echo "📱 学情管理功能:"
    echo "   1. 打开管理端 → 点击学生卡片"
    echo "   2. 或点击右上角 📖 学情管理按钮"
    echo "   3. 查看三Tab界面：学情概览 + 成长管理 + 学业分析"
    echo ""
    echo "📋 进程信息:"
    echo "   Growark PID:     $GROWARK_PID"
    echo "   StarJourney PID:  $STARJOURNEY_PID"
    echo ""
    echo "📝 日志文件:"
    echo "   Growark:        $PROJECT_DIR/growark.log"
    echo "   StarJourney:     $PROJECT_DIR/starjourney.log"
    echo ""
    echo "⚠️  停止服务命令:"
    echo "   kill $GROWARK_PID $STARJOURNEY_PID"
    echo ""
}

# 函数：清理进程
cleanup() {
    echo ""
    echo "🛑 正在停止服务器..."
    if [ ! -z "$GROWARK_PID" ]; then
        kill $GROWARK_PID 2>/dev/null
        echo "✅ Growark 服务器已停止"
    fi
    if [ ! -z "$STARJOURNEY_PID" ]; then
        kill $STARJOURNEY_PID 2>/dev/null
        echo "✅ StarJourney 服务器已停止"
    fi
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

# 启动服务器
echo "正在启动集成系统..."
echo ""

start_growark
start_starjourney

# 显示访问信息
show_access_info

# 等待进程
echo "⏳ 服务器运行中，按 Ctrl+C 停止..."
wait

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  服务器已停止"
echo "═══════════════════════════════════════════════════════════════"
echo ""
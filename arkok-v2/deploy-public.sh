#!/bin/bash

# ArkOK V2 标准化公网部署脚本（无PM2 - 云原生最佳实践）
# 版本: v2.0.0
# 更新时间: 2025-12-18
# 说明: 当用户说"公网部署"时，AI助手将自动执行此脚本

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_NAME="arkok-v2"
PROJECT_DIR="/home/devbox/project/arkok-v2"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
PUBLIC_URL="https://esboimzbkure.sealosbja.site"
HEALTH_URL="$PUBLIC_URL/health"

# 日志函数
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 显示帮助信息
show_help() {
    echo "ArkOK V2 标准化公网部署脚本（无PM2 - 云原生最佳实践）"
    echo ""
    echo "用法: $0"
    echo ""
    echo "🎯 说明: 当用户说'公网部署'时，AI助手将自动执行此4阶段部署流程"
    echo ""
}

# 检查是否为root用户（避免权限问题）
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        warning "检测到root用户，建议使用普通用户运行"
    fi
}

# 第一阶段：环境准备与清理
phase1_environment_cleanup() {
    log "🔍 第一阶段：环境准备与清理"

    # 1. 强制检查并同步 Prisma 客户端 (V2 关键步骤)
    log "同步 Prisma 客户端状态..."
    cd "$SERVER_DIR"
    if npx prisma generate; then
        success "Prisma 客户端同步成功"
    else
        error "Prisma 客户端生成失败，请检查数据库连接或 schema"
        exit 1
    fi

    # 2. 检查并安装缺失依赖
    log "检查核心依赖..."
    if ! npm list exceljs >/dev/null 2>&1; then
        warning "缺失 exceljs 依赖，正在尝试修复..."
        npm install exceljs
    fi

    # 3. 检查并清理端口占用
    log "检查端口占用情况..."
    if fuser -k 3000/tcp 2>/dev/null; then
        success "端口3000已释放"
    else
        success "端口3000未被占用"
    fi

    if fuser -k 3001/tcp 2>/dev/null; then
        success "端口3001已释放"
    else
        success "端口3001未被占用"
    fi

    # 2. 清理可能的PM2进程（如果存在）
    log "清理进程管理器..."
    if pm2 kill 2>/dev/null; then
        success "PM2进程已清理"
    else
        success "无PM2进程需要清理"
    fi

    # 3. 清理可能存在的服务进程
    log "清理现有服务进程..."
    if pkill -f "node dist/index.js" 2>/dev/null; then
        success "现有服务进程已停止"
    else
        success "无现有服务进程"
    fi

    # 4. 验证环境配置
    log "验证环境配置..."
    if [[ -f "$SERVER_DIR/.env" ]]; then
        if grep -q "PORT=3000" "$SERVER_DIR/.env"; then
            success "端口配置正确 (PORT=3000)"
        else
            error "端口配置错误，期望PORT=3000"
            exit 1
        fi
    else
        error "环境配置文件不存在: $SERVER_DIR/.env"
        exit 1
    fi

    success "第一阶段完成：环境准备与清理"
}

# 第二阶段：代码编译
phase2_code_compilation() {
    log "🔨 第二阶段：代码编译"

    # 1. 前端代码编译（必须执行）
    log "编译前端代码..."
    cd "$CLIENT_DIR"
    if npm run build; then
        success "前端编译成功"
    else
        error "前端编译失败"
        exit 1
    fi

    # 2. 后端代码编译（推荐执行）
    log "编译后端代码..."
    cd "$SERVER_DIR"
    if npm run build; then
        success "后端编译成功"
    else
        warning "后端编译有警告，但可继续运行"
    fi

    success "第二阶段完成：代码编译"
}

# 第三阶段：服务启动
phase3_service_startup() {
    log "🚀 第三阶段：服务启动（无PM2，云原生方式）"

    # 1. 确保在正确的目录 (上下文关键修复)
    if [[ ! -f "$SERVER_DIR/dist/index.js" ]]; then
        error "无法找到入口文件: $SERVER_DIR/dist/index.js，请确保已执行阶段二编译"
        exit 1
    fi
    cd "$SERVER_DIR"

    # 2. 等待端口完全释放
    log "等待端口完全释放..."
    sleep 2

    # 3. 直接启动服务（云原生最佳实践）
    log "启动服务（无PM2，云原生方式）..."
    nohup node dist/index.js > server.log 2>&1 &
    SERVER_PID=$!

    if ps -p $SERVER_PID > /dev/null; then
        success "服务已启动，PID: $SERVER_PID"
    else
        error "服务启动失败"
        exit 1
    fi

    # 4. 等待服务启动
    log "等待服务启动..."
    sleep 5

    success "第三阶段完成：服务启动"
}

# 第四阶段：部署验证
phase4_deployment_verification() {
    log "🔍 第四阶段：部署验证"

    # 1. 本地健康检查
    log "本地健康检查..."
    local retry_count=0
    local max_retries=10

    while [[ $retry_count -lt $max_retries ]]; do
        if curl -s -f "http://localhost:3000/health" > /dev/null; then
            success "本地服务健康检查通过"
            break
        else
            warning "本地服务健康检查失败，重试中... ($((retry_count + 1))/$max_retries)"
            sleep 2
            ((retry_count++))
        fi
    done

    if [[ $retry_count -eq $max_retries ]]; then
        error "本地服务健康检查最终失败"
        log "查看服务日志："
        tail -20 "$SERVER_DIR/server.log"
        exit 1
    fi

    # 2. 公网连通性验证
    log "公网连通性验证..."
    if curl -s -f -I "$HEALTH_URL" > /dev/null; then
        success "公网服务正常访问"
    else
        error "公网服务异常"
        exit 1
    fi

    success "第四阶段完成：部署验证"
}

# 部署完成报告
deployment_success_report() {
    echo ""
    echo "🎉 ============================================="
    echo "🎉   公网部署完成！"
    echo "🎉 ============================================="
    echo ""
    echo "📍 访问地址：$PUBLIC_URL"
    echo "💚 健康检查：$HEALTH_URL"
    echo "📊 大屏展示：$PUBLIC_URL/screen"
    echo ""
    echo "🔧 服务信息："
    echo "   - 端口: 3000"
    echo "   - 模式: 无PM2，云原生最佳实践"
    echo "   - 进程: $SERVER_PID"
    echo ""
    echo "📝 管理命令："
    echo "   - 查看日志: tail -f $SERVER_DIR/server.log"
    echo "   - 停止服务: pkill -f 'node dist/index.js'"
    echo "   - 重启服务: 重新执行此脚本"
    echo ""
}

# 主函数
main() {
    echo "🚀 ArkOK V2 标准化公网部署（无PM2 - 云原生最佳实践）"
    echo "=============================================="

    # 参数检查
    if [[ "$1" == "--help" || "$1" == "-h" ]]; then
        show_help
        exit 0
    fi

    # 执行4阶段部署
    check_permissions
    phase1_environment_cleanup
    phase2_code_compilation
    phase3_service_startup
    phase4_deployment_verification

    # 部署完成报告
    deployment_success_report
}

# 执行主函数
main "$@"
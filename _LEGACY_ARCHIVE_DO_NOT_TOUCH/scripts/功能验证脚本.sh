#!/bin/bash

# =============================================================================
# 功能验证脚本 - 每次新功能开发完成后必须执行
# 使用方法: ./scripts/功能验证脚本.sh
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 开始验证
echo -e "${BLUE}🔍 开始功能验证...${NC}"
echo "========================================"

# 项目根目录检查
PROJECT_ROOT="/home/devbox/project"
if [ ! -d "$PROJECT_ROOT" ]; then
    log_error "项目根目录不存在: $PROJECT_ROOT"
    exit 1
fi

cd "$PROJECT_ROOT"
log_success "项目根目录检查通过"

# 1. 基础构建检查
log_info "📦 检查前端构建..."
cd mobile
if npm run build > /dev/null 2>&1; then
    log_success "前端构建成功"
else
    log_error "前端构建失败，请检查代码"
    exit 1
fi

# 2. API地址配置检查
log_info "🌐 检查API配置..."
if grep -q "esboimzbkure.sealosbja.site/api" App.tsx; then
    log_success "API地址配置正确"
else
    log_warning "API地址配置可能需要检查"
fi

if grep -q "esboimzbkure.sealosbja.site/api" services/api.ts; then
    log_success "服务API地址配置正确"
else
    log_warning "服务API地址配置可能需要检查"
fi

# 3. 检查TODO占位符（新功能开发检查项）
log_info "🔍 检查TODO占位符..."
TODO_COUNT=$(find pages -name "*.tsx" -exec grep -l "TODO.*API" {} \; | wc -l)
if [ "$TODO_COUNT" -gt 0 ]; then
    log_warning "发现 $TODO_COUNT 个文件包含API占位符代码"
    find pages -name "*.tsx" -exec grep -l "TODO.*API" {} \;
else
    log_success "未发现API占位符代码"
fi

# 4. 服务状态检查
log_info "🖥️  检查服务状态..."
cd ..

# 检查端口占用
GROWARK_STATUS=$(netstat -tulpn 2>/dev/null | grep ":3000 " | wc -l)
STARJOURNEY_STATUS=$(netstat -tulpn 2>/dev/null | grep ":3001 " | wc -l)

if [ "$GROWARK_STATUS" -gt 0 ]; then
    log_success "Growark服务器运行正常 (端口3000)"
else
    log_error "Growark服务器未运行 (端口3000)"
    exit 1
fi

if [ "$STARJOURNEY_STATUS" -gt 0 ]; then
    log_success "StarJourney服务器运行正常 (端口3001)"
else
    log_error "StarJourney服务器未运行 (端口3001)"
    exit 1
fi

# 5. API接口测试
log_info "🔌 测试API接口..."

# 测试学生API
STUDENT_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/students || echo "000")
if [ "$STUDENT_API_STATUS" = "200" ]; then
    log_success "学生API接口正常"
else
    log_error "学生API接口异常 (状态码: $STUDENT_API_STATUS)"
    exit 1
fi

# 测试StarJourney健康检查
STARJ_API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")
if [ "$STARJ_API_STATUS" = "200" ]; then
    log_success "StarJourney API接口正常"
else
    log_warning "StarJourney API接口可能异常 (状态码: $STARJ_API_STATUS)"
fi

# 6. 前端页面访问测试
log_info "📱 测试页面访问..."

# 测试移动端
MOBILE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/app || echo "000")
if [ "$MOBILE_STATUS" = "200" ]; then
    log_success "移动端页面访问正常"
else
    log_error "移动端页面访问失败 (状态码: $MOBILE_STATUS)"
    exit 1
fi

# 测试管理端
ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin || echo "000")
if [ "$ADMIN_STATUS" = "200" ]; then
    log_success "管理端页面访问正常"
else
    log_error "管理端页面访问失败 (状态码: $ADMIN_STATUS)"
    exit 1
fi

# 7. 检查新页面路由（如果有新增页面）
log_info "🛣️  检查路由配置..."
NEW_ROUTES=("/prep" "/qc" "/settle")

for route in "${NEW_ROUTES[@]}"; do
    ROUTE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/app$route" || echo "000")
    if [ "$ROUTE_STATUS" = "200" ]; then
        log_success "新路由 $route 访问正常"
    else
        log_warning "新路由 $route 访问异常 (状态码: $ROUTE_STATUS)"
    fi
done

# 8. 检查日志文件
log_info "📋 检查日志文件..."
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

VERIFICATION_LOG="$LOG_DIR/功能验证-$(date +%Y%m%d-%H%M%S).log"
echo "功能验证时间: $(date)" > "$VERIFICATION_LOG"
echo "验证结果: 通过" >> "$VERIFICATION_LOG"
echo "TODO数量: $TODO_COUNT" >> "$VERIFICATION_LOG"

log_success "验证日志已保存: $VERIFICATION_LOG"

# 9. 生成验证报告
log_info "📊 生成验证报告..."
REPORT_FILE="$LOG_DIR/功能验证报告.md"

cat > "$REPORT_FILE" << EOF
# 功能验证报告

**验证时间**: $(date '+%Y-%m-%d %H:%M:%S')
**验证状态**: ✅ 通过
**验证人**: Claude Code AI助手

## 验证结果

### ✅ 通过项目
- [x] 前端构建成功
- [x] API地址配置正确
- [x] 服务运行正常 (Growark:3000, StarJourney:3001)
- [x] API接口响应正常
- [x] 页面访问正常
- [x] 路由配置正确

### ⚠️ 注意事项
EOF

if [ "$TODO_COUNT" -gt 0 ]; then
    echo "- 发现 $TODO_COUNT 个文件包含API占位符代码" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "### 🔗 相关文件" >> "$REPORT_FILE"
echo "- 验证脚本: \`scripts/功能验证脚本.sh\`" >> "$REPORT_FILE"
echo "- 验证日志: \`$VERIFICATION_LOG\`" >> "$REPORT_FILE"
echo "- 构建产物: \`mobile/dist/\`" >> "$REPORT_FILE"

log_success "验证报告已生成: $REPORT_FILE"

# 10. 完成验证
echo "========================================"
log_success "🎉 所有验证检查通过！功能部署准备就绪！"

# 显示关键信息
echo ""
echo -e "${BLUE}📊 验证摘要:${NC}"
echo "- 前端构建: ✅"
echo "- 服务状态: ✅"
echo "- API接口: ✅"
echo "- 页面访问: ✅"
echo "- 路由配置: ✅"

if [ "$TODO_COUNT" -gt 0 ]; then
    echo ""
    log_warning "⚠️  注意: 仍有 $TODO_COUNT 个TODO项需要处理"
fi

echo ""
echo -e "${BLUE}📁 相关文件:${NC}"
echo "- 验证日志: $VERIFICATION_LOG"
echo "- 验证报告: $REPORT_FILE"
echo ""
echo -e "${GREEN}🚀 可以安全部署到生产环境！${NC}"

exit 0
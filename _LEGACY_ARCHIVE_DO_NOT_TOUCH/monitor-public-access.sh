#!/bin/bash

# StarJourney 公网访问监控脚本
# 持续检查公网部署状态

echo "🌐 StarJourney 公网部署监控"
echo "⏰ 开始时间: $(date)"
echo "📍 监控地址: https://esboimzbkure.sealosbja.site"
echo ""

# 配置参数
PUBLIC_URL="https://esboimzbkure.sealosbja.site"
HEALTH_ENDPOINT="/health"
CHECK_INTERVAL=30  # 检查间隔(秒)
MAX_WAIT_TIME=600   # 最大等待时间(秒)

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查函数
check_public_access() {
    local response=$(curl -s --max-time 10 --connect-timeout 5 "${PUBLIC_URL}${HEALTH_ENDPOINT}" 2>/dev/null)
    local exit_code=$?

    if [ $exit_code -eq 0 ] && [[ $response == *"healthy"* ]]; then
        return 0  # 成功
    else
        return 1  # 失败
    fi
}

# 主监控循环
echo -e "${BLUE}🔍 开始监控公网访问状态...${NC}"
echo ""

start_time=$(date +%s)
attempt=1
success=false

while [ $success = false ]; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))

    # 检查是否超时
    if [ $elapsed -gt $MAX_WAIT_TIME ]; then
        echo -e "${RED}❌ 超时: 已等待 ${MAX_WAIT_TIME} 秒，公网访问仍未就绪${NC}"
        echo ""
        echo "🔧 故障排除建议:"
        echo "1. 检查 Sealos 控制台状态"
        echo "2. 确认服务正常运行"
        echo "3. 尝试重启服务"
        echo ""
        echo "📱 本地访问仍然可用:"
        echo "   管理端: http://localhost:3000/admin"
        echo "   健康检查: http://localhost:3000/health"
        exit 1
    fi

    echo -e "${YELLOW}🔍 尝试 $attempt (已等待 ${elapsed} 秒):${NC} 检查公网访问..."

    if check_public_access; then
        success=true
        echo -e "${GREEN}✅ 公网访问成功！${NC}"
        echo ""
        echo "🎉 StarJourney 已成功部署到公网！"
        echo ""
        echo "📱 访问地址:"
        echo "   🌐 管理端: ${PUBLIC_URL}/admin"
        echo "   📺 大屏端: ${PUBLIC_URL}/screen"
        echo "   👤 学生端: ${PUBLIC_URL}/student"
        echo "   🧪 测试页面: ${PUBLIC_URL}/growark-starjourney-integration-test.html"
        echo ""
        echo "📊 API接口:"
        echo "   ❤️ 健康检查: ${PUBLIC_URL}/health"
        echo "   📚 API文档: ${PUBLIC_URL}/api-docs"
        echo ""
        echo "🎯 StarJourney 功能使用:"
        echo "   1. 打开管理端 → 点击学生卡片"
        echo "   2. 或点击右上角 📖 学情管理按钮"
        echo "   3. 体验三Tab界面: 学情概览 + 成长管理 + 学业分析"
        echo ""
        echo -e "${GREEN}🕐 就绪时间: $(date)${NC}"
        echo -e "${GREEN}⏱️ 总耗时: ${elapsed} 秒${NC}"
        break
    else
        echo -e "${YELLOW}   ⏳ 公网还在准备中...${NC}"
        echo "   等待时间: ${elapsed}/${MAX_WAIT_TIME} 秒"

        # 显示本地服务状态
        local_growark=$(curl -s --max-time 3 http://localhost:3000/health 2>/dev/null)
        local_starjourney=$(curl -s --max-time 3 http://localhost:3001/api/health 2>/dev/null)

        if [[ $local_growark == *"healthy"* ]]; then
            echo -e "   ${GREEN}✅ 本地Growark服务正常${NC}"
        else
            echo -e "   ${RED}❌ 本地Growark服务异常${NC}"
        fi

        if [[ $local_starjourney == *"正常"* ]]; then
            echo -e "   ${GREEN}✅ 本地StarJourney服务正常${NC}"
        else
            echo -e "   ${RED}❌ 本地StarJourney服务异常${NC}"
        fi
    fi

    echo ""
    attempt=$((attempt + 1))

    if [ $success = false ]; then
        echo "⏳ 等待 ${CHECK_INTERVAL} 秒后再次检查..."
        sleep $CHECK_INTERVAL
    fi
done

# 成功后的验证
echo ""
echo -e "${BLUE}🔍 执行最终验证...${NC}"

# 验证关键端点
endpoints=(
    "${PUBLIC_URL}/health"
    "${PUBLIC_URL}/api/students"
    "${PUBLIC_URL}/api-docs"
)

echo "📊 验证关键端点:"
for endpoint in "${endpoints[@]}"; do
    response=$(curl -s --max-time 5 "$endpoint" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✅ ${endpoint}${NC}"
    else
        echo -e "   ${RED}❌ ${endpoint}${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎊 StarJourney 公网部署完成！${NC}"
echo -e "${GREEN}🌐 系统已完全就绪，可开始正常使用！${NC}"
echo ""
echo "📞 如需技术支持，请查看:"
echo "   📖 配置分析: /home/devbox/project/sealos-devbox-配置分析.md"
echo "   📋 部署文档: /home/devbox/project/Growark+StarJourney-公网部署指南.md"
echo "   📊 状态报告: /home/devbox/project/公网部署状态报告.md"
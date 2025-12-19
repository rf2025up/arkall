#!/bin/bash

# ArkOK V2 需求自动记录脚本
# 功能：自动记录用户需求和修改请求，确保重启后不丢失上下文
# 使用：当AI助手接收到修改需求时自动调用

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目信息
PROJECT_DIR="/home/devbox/project/arkok-v2"
REQUIREMENT_LOG="$PROJECT_DIR/docs/REQUIREMENT_LOG.md"
TASK_PROGRESS="$PROJECT_DIR/docs/TASK_PROGRESS.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE_ID=$(date '+%Y%m%d_%H%M%S')

# 日志函数
log() {
    echo -e "${BLUE}[$TIMESTAMP] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 显示帮助信息
show_help() {
    echo "ArkOK V2 需求自动记录脚本"
    echo ""
    echo "用法: $0 [选项] \"需求描述\""
    echo ""
    echo "选项:"
    echo "  -t, --type TYPE        需求类型 (bugfix|feature|refactor|deploy|other)"
    echo "  -p, --priority PRIORITY 优先级 (high|medium|low)"
    echo "  -s, --scope SCOPE      影响范围 (frontend|backend|fullstack|docs)"
    echo "  -r, --requester USER   提出者 (默认: user)"
    echo "  -h, --help             显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 \"修复QC页面点击头像不显示任务列表的问题\""
    echo "  $0 -t bugfix -p high -s frontend \"QC页面头像点击功能异常\""
}

# 默认值
REQUIREMENT_TYPE="feature"
PRIORITY="medium"
SCOPE="fullstack"
REQUESTER="user"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            REQUIREMENT_TYPE="$2"
            shift 2
            ;;
        -p|--priority)
            PRIORITY="$2"
            shift 2
            ;;
        -s|--scope)
            SCOPE="$2"
            shift 2
            ;;
        -r|--requester)
            REQUESTER="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
        *)
            REQUIREMENT_DESC="$1"
            shift
            ;;
    esac
done

# 检查必需参数
if [[ -z "$REQUIREMENT_DESC" ]]; then
    echo "❌ 错误: 必须提供需求描述"
    show_help
    exit 1
fi

# 创建需求ID
REQUIREMENT_ID="REQ-$(date '+%Y%m%d')-$(date '+%H%M%S')"

# 确保目录存在
mkdir -p "$(dirname "$REQUIREMENT_LOG")"

# 函数：添加需求到需求日志
add_requirement_to_log() {
    local entry="---
## 📋 需求记录 #${REQUIREMENT_ID}

**时间**: $TIMESTAMP
**ID**: $REQUIREMENT_ID
**类型**: $REQUIREMENT_TYPE
**优先级**: $PRIORITY
**范围**: $SCOPE
**提出者**: $REQUESTER
**状态**: 🟡 待处理

### 📝 需求描述
$REQUIREMENT_DESC

### 🎯 初步分析
*等待AI助手分析...*

### 📊 执行状态
- **记录时间**: $TIMESTAMP
- **分析状态**: 待分析
- **执行状态**: 待开始
- **完成状态**: 未完成

---

"

    # 如果文件不存在，创建文件头
    if [[ ! -f "$REQUIREMENT_LOG" ]]; then
        cat > "$REQUIREMENT_LOG" << 'EOF'
# 📋 ArkOK V2 需求记录日志

> **目的**: 记录所有用户需求和修改请求，确保重启后不丢失上下文
> **创建时间**: 2025-12-18
> **维护**: AI助手自动记录

## 🎯 使用说明

当用户提出任何修改需求时，AI助手必须立即执行：
```bash
./record-requirement.sh "需求描述"
```

---

## 📚 需求历史记录

EOF
    fi

    # 添加新需求到文件开头（最新的在上面）
    local temp_file=$(mktemp)
    {
        echo "$entry"
        sed '/^---$/,$d' "$REQUIREMENT_LOG"
    } > "$temp_file"
    mv "$temp_file" "$REQUIREMENT_LOG"
}

# 函数：更新任务进度
update_task_progress() {
    local update_entry="### 🔄 新需求记录 - $TIMESTAMP

**需求ID**: $REQUIREMENT_ID
**需求描述**: $REQUIREMENT_DESC
**需求类型**: $REQUIREMENT_TYPE
**优先级**: $PRIORITY
**影响范围**: $SCOPE
**提出者**: $REQUESTER

**当前状态**: 需求已记录，等待分析和执行
**下一步行动**: AI助手需要分析需求并制定执行计划

---

"

    # 如果任务进度文件存在，在开头添加
    if [[ -f "$TASK_PROGRESS" ]]; then
        local temp_file=$(mktemp)
        {
            echo "$update_entry"
            cat "$TASK_PROGRESS"
        } > "$temp_file"
        mv "$temp_file" "$TASK_PROGRESS"
    fi
}

# 函数：生成需求分析报告
generate_analysis_report() {
    local report_file="$PROJECT_DIR/docs/REQUIREMENT_ANALYSIS_${DATE_ID}.md"

    cat > "$report_file" << EOF
# 📊 需求分析报告

**需求ID**: $REQUIREMENT_ID
**分析时间**: $TIMESTAMP
**分析者**: AI助手

## 📋 需求详情

**原始描述**: $REQUIREMENT_DESC
**类型**: $REQUIREMENT_TYPE
**优先级**: $PRIORITY
**范围**: $SCOPE

## 🎯 AI助手分析

*需要AI助手根据需求描述进行详细分析*

## 🚀 执行计划

*需要AI助手制定具体的执行步骤*

## 📈 执行进度

- [x] 需求记录
- [ ] 需求分析
- [ ] 执行计划制定
- [ ] 开始执行
- [ ] 执行完成
- [ ] 验证测试

EOF

    echo "📊 分析报告已生成: $report_file"
}

# 主执行流程
main() {
    log "📋 开始记录需求..."

    # 1. 添加需求到需求日志
    add_requirement_to_log
    success "需求已记录到需求日志"

    # 2. 更新任务进度
    update_task_progress
    success "任务进度已更新"

    # 3. 生成分析报告
    generate_analysis_report
    success "分析报告已生成"

    # 4. 输出结果
    echo ""
    echo "🎉 ================================================"
    echo "🎉   需求记录完成！"
    echo "🎉 ================================================"
    echo ""
    echo "📋 需求ID: $REQUIREMENT_ID"
    echo "📝 需求描述: $REQUIREMENT_DESC"
    echo "🎯 需求类型: $REQUIREMENT_TYPE"
    echo "⚡ 优先级: $PRIORITY"
    echo "🌐 影响范围: $SCOPE"
    echo ""
    echo "📁 相关文件:"
    echo "   - 需求日志: $REQUIREMENT_LOG"
    echo "   - 任务进度: $TASK_PROGRESS"
    echo "   - 分析报告: docs/REQUIREMENT_ANALYSIS_${DATE_ID}.md"
    echo ""
    echo "🤖 AI助手下一步行动:"
    echo "   1. 分析需求影响范围"
    echo "   2. 制定执行计划"
    echo "   3. 开始执行修改"
    echo ""
}

# 执行主函数
main "$@"
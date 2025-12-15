#!/bin/bash

# 类型定义缺失检测机制
# 用于识别项目中缺失的类型定义，确保没有遗漏的接口定义

echo "🔍 TypeScript 类型定义缺失检测开始..."
echo "=========================================="

# 检查目录
SRC_DIR="src"
OUTPUT_FILE="/tmp/type-def-audit.log"

# 清空输出文件
> "$OUTPUT_FILE"

# 1. 检查隐式 any 使用
echo "1. 检查隐式 any 类型使用..."
ANY_COUNT=$(grep -r ": any" "$SRC_DIR" --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l)
if [ $ANY_COUNT -gt 0 ]; then
    echo "⚠️  发现 $ANY_COUNT 处显式 any 类型：" | tee -a "$OUTPUT_FILE"
    grep -r ": any" "$SRC_DIR" --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -10 | tee -a "$OUTPUT_FILE"
    echo ""
fi

# 2. 检查可能缺失的接口定义
echo "2. 检查可能缺失的接口定义..."
echo "正在分析常见的类型缺失模式..." | tee -a "$OUTPUT_FILE"

# 检查函数参数类型缺失
PARAM_TYPES_MISSING=$(grep -r "function.*(" "$SRC_DIR" --include="*.ts" -A 3 | grep -E "^\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:" | grep -v ":" | wc -l)
if [ $PARAM_TYPES_MISSING -gt 0 ]; then
    echo "⚠️  发现 $PARAM_TYPES_MISSING 处函数参数可能缺少类型定义" | tee -a "$OUTPUT_FILE"
fi

# 检查对象属性访问模式
PROPERTY_ACCESS_PATTERNS=$(grep -r "\..*\..*:" "$SRC_DIR" --include="*.ts" | head -20)
if [ -n "$PROPERTY_ACCESS_PATTERNS" ]; then
    echo "🔍 检查对象属性访问模式：" | tee -a "$OUTPUT_FILE"
    echo "$PROPERTY_ACCESS_PATTERNS" | head -10 | tee -a "$OUTPUT_FILE"
    echo ""
fi

# 3. 检查接口定义覆盖率
echo "3. 检查接口定义覆盖率..." | tee -a "$OUTPUT_FILE"

# 统计接口定义数量
INTERFACE_COUNT=$(grep -r "interface\s+" "$SRC_DIR" --include="*.ts" | wc -l)
TYPE_COUNT=$(grep -r "type\s+" "$SRC_DIR" --include="*.ts" | wc -l)

echo "✅ 已定义接口数量: $INTERFACE_COUNT" | tee -a "$OUTPUT_FILE"
echo "✅ 已定义类型数量: $TYPE_COUNT" | tee -a "$OUTPUT_FILE"

# 4. 检查常见的类型定义缺失模式
echo "4. 检查常见类型定义缺失模式..." | tee -a "$OUTPUT_FILE"

# 检查数据库模型相关的类型定义
PRISMA_MODELS=$(grep -r "\.findMany\|\.findFirst\|\.create\|\.update" "$SRC_DIR" --include="*.ts" | wc -l)
echo "📊 Prisma 操作使用数量: $PRISMA_MODELS" | tee -a "$OUTPUT_FILE"

# 检查是否有对应的模型类型
if [ $PRISMA_MODELS -gt 0 ]; then
    MODEL_TYPES=$(grep -r "import.*@prisma/client" "$SRC_DIR" --include="*.ts" | wc -l)
    echo "📊 Prisma 客户端导入数量: $MODEL_TYPES" | tee -a "$OUTPUT_FILE"

    if [ $MODEL_TYPES -eq 0 ]; then
        echo "⚠️  警告: 发现 Prisma 操作但未导入客户端！" | tee -a "$OUTPUT_FILE"
    fi
fi

# 5. 检查第三方库类型定义
echo "5. 检查第三方库类型定义..." | tee -a "$OUTPUT_FILE"

# 检查 @types 包使用
TYPES_PACKAGES=$(ls node_modules/@types 2>/dev/null | wc -l)
echo "📦 已安装 @types 包数量: $TYPES_PACKAGES" | tee -a "$OUTPUT_FILE"

# 6. 生成类型定义建议
echo "6. 生成类型定义建议..." | tee -a "$OUTPUT_FILE"

# 分析缺失的接口定义
MISSING_INTERFACES=""

# 检查是否有 Express 相关的请求处理但没有正确的类型定义
EXPRESS_ROUTES=$(grep -r "app\.\(get\|post\|put\|delete\)" "$SRC_DIR" --include="*.ts" | wc -l)
if [ $EXPRESS_ROUTES -gt 0 ]; then
    REQUEST_USAGE=$(grep -r "req\." "$SRC_DIR" --include="*.ts" | wc -l)
    echo "📊 Express 路由数量: $EXPRESS_ROUTES" | tee -a "$OUTPUT_FILE"
    echo "📊 Request 对象使用次数: $REQUEST_USAGE" | tee -a "$OUTPUT_FILE"

    if [ $REQUEST_USAGE -gt 0 ]; then
        echo "💡 建议: 确保所有 Express Request 扩展都在 src/types/express/index.d.ts 中定义" | tee -a "$OUTPUT_FILE"
    fi
fi

# 7. 检查类型导入使用情况
echo "7. 检查类型导入使用情况..." | tee -a "$OUTPUT_FILE"

TYPE_IMPORTS=$(grep -r "import.*{.*}.*from.*'\.\/'" "$SRC_DIR" --include="*.ts" | grep -v "node_modules" | wc -l)
echo "📊 本地类型导入数量: $TYPE_IMPORTS" | tee -a "$OUTPUT_FILE"

# 8. 生成改进建议报告
echo "" | tee -a "$OUTPUT_FILE"
echo "📋 类型定义改进建议：" | tee -a "$OUTPUT_FILE"
echo "==================================" | tee -a "$OUTPUT_FILE"

if [ $ANY_COUNT -gt 0 ]; then
    echo "1. 优先级: 高 - 替换 $ANY_COUNT 处显式 any 类型为具体接口定义" | tee -a "$OUTPUT_FILE"
fi

if [ $INTERFACE_COUNT -lt 20 ]; then
    echo "2. 优先级: 中 - 考虑增加更多接口定义以提高类型覆盖率" | tee -a "$OUTPUT_FILE"
fi

if [ $PARAM_TYPES_MISSING -gt 0 ]; then
    echo "3. 优先级: 高 - 修复函数参数类型缺失问题" | tee -a "$OUTPUT_FILE"
fi

if [ $MODEL_TYPES -eq 0 ] && [ $PRISMA_MODELS -gt 0 ]; then
    echo "4. 优先级: 严重 - 立即导入 Prisma 客户端" | tee -a "$OUTPUT_FILE"
fi

# 9. 输出最终报告
echo "" | tee -a "$OUTPUT_FILE"
echo "=========================================="
echo "🎯 类型定义审计完成"
echo "=========================================="

# 显示关键指标
echo "📊 审计结果摘要：" | tee -a "$OUTPUT_FILE"
echo "- 显式 any 类型: $ANY_COUNT" | tee -a "$OUTPUT_FILE"
echo "- 接口定义数量: $INTERFACE_COUNT" | tee -a "$OUTPUT_FILE"
echo "- 类型定义数量: $TYPE_COUNT" | tee -a "$OUTPUT_FILE"
echo "- Prisma 操作: $PRISMA_MODELS" | tee -a "$OUTPUT_FILE"
echo "- Express 路由: $EXPRESS_ROUTES" | tee -a "$OUTPUT_FILE"

# 计算类型安全评分
TOTAL_SCORE=100
PENALTY_ANY=$((ANY_COUNT * 5))
PENALTY_MISSING_PARAMS=$((PARAM_TYPES_MISSING * 3))
FINAL_SCORE=$((TOTAL_SCORE - PENALTY_ANY - PENALTY_MISSING_PARAMS))

if [ $FINAL_SCORE -lt 0 ]; then
    FINAL_SCORE=0
fi

echo ""
echo "📈 类型安全评分: $FINAL_SCORE/100" | tee -a "$OUTPUT_FILE"

if [ $FINAL_SCORE -ge 80 ]; then
    echo "✅ 评级: 优秀" | tee -a "$OUTPUT_FILE"
elif [ $FINAL_SCORE -ge 60 ]; then
    echo "⚠️  评级: 良好，建议改进" | tee -a "$OUTPUT_FILE"
else
    echo "🚨 评级: 需要立即改进" | tee -a "$OUTPUT_FILE"
fi

echo ""
echo "📄 详细报告已保存到: $OUTPUT_FILE"

# 如果评分低于60，返回错误状态
if [ $FINAL_SCORE -lt 60 ]; then
    echo ""
    echo "❌ 类型定义质量不达标，请优先改进后再次检查"
    exit 1
fi

echo "✅ 类型定义质量检查通过"
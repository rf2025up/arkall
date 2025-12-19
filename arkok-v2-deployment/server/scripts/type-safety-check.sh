#!/bin/bash

# TypeScript 类型安全检查脚本
# 用于确保代码符合类型安全最高准则

echo "🏛️ TypeScript 类型安全检查开始..."
echo "=========================================="

# 检查编译是否通过
echo "1. 检查 TypeScript 编译..."
npm run build > /tmp/ts-compile.log 2>&1
COMPILE_EXIT_CODE=$?

if [ $COMPILE_EXIT_CODE -ne 0 ]; then
    echo "❌ 编译失败！发现以下 TypeScript 错误："
    echo "------------------------------------------"
    cat /tmp/ts-compile.log | grep "error TS"
    echo "------------------------------------------"
    echo "🚫 严重违规：存在编译错误，违反了类型安全最高准则！"
    echo "📋 请立即修复所有错误后再次运行检查。"
    echo "📚 参考 docs/ARCHITECTURE_V2.md 中的 TypeScript 类型安全准则"
    exit 1
else
    echo "✅ TypeScript 编译通过 (Found 0 errors)"
fi

# 检查是否存在 any 类型的使用
echo ""
echo "2. 检查 'any' 类型使用..."
ANY_COUNT=$(grep -r ": any" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l)
if [ $ANY_COUNT -gt 0 ]; then
    echo "⚠️  发现 $ANY_COUNT 处 'any' 类型使用："
    grep -r ": any" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | head -10
    echo ""
    echo "⚠️  警告：建议将 'any' 替换为具体类型定义"
fi

# 检查是否存在 @ts-ignore
echo ""
echo "3. 检查 '@ts-ignore' 使用..."
TS_IGNORE_COUNT=$(grep -r "@ts-ignore" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules" | wc -l)
if [ $TS_IGNORE_COUNT -gt 0 ]; then
    echo "🚫 发现 $TS_IGNORE_COUNT 处 '@ts-ignore' 使用："
    grep -r "@ts-ignore" src/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
    echo ""
    echo "🚫 严重违规：严禁使用 '@ts-ignore' 绕过类型检查！"
    exit 1
else
    echo "✅ 未发现 '@ts-ignore' 使用"
fi

# 检查错误处理是否符合类型安全
echo ""
echo "4. 检查错误处理类型安全..."
CATCH_ERROR_ISSUES=$(grep -r "catch.*error.*:" src/ --include="*.ts" -A2 | grep -E "(error\.message|error\.name|error\.stack)" | grep -v "instanceof Error" | wc -l)
if [ $CATCH_ERROR_ISSUES -gt 0 ]; then
    echo "⚠️  发现 $CATCH_ERROR_ISSUES 处可能不安全的错误处理："
    grep -r "catch.*error.*:" src/ --include="*.ts" -A2 | grep -E "(error\.message|error\.name|error\.stack)" | grep -v "instanceof Error" | head -5
    echo ""
    echo "⚠️  建议使用 'instanceof Error' 进行类型守卫"
fi

echo ""
echo "=========================================="
echo "🎉 TypeScript 类型安全检查完成！"

if [ $COMPILE_EXIT_CODE -eq 0 ] && [ $TS_IGNORE_COUNT -eq 0 ]; then
    echo "✅ 符合类型安全最高准则"
    echo "🚀 代码质量优秀，可以安全合并"
else
    echo "❌ 发现类型安全问题，请立即修复"
    exit 1
fi

# 清理临时文件
rm -f /tmp/ts-compile.log
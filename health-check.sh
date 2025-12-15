#!/bin/bash

echo "🚀 ArkOK V2 健康检查脚本"
echo "================================"
echo ""

# 检查服务进程
echo "📊 服务状态检查:"
if pgrep -f "node.*arkok" > /dev/null; then
    echo "✅ Node.js 服务进程: 运行中"
else
    echo "❌ Node.js 服务进程: 未运行"
fi

# 检查端口占用
echo ""
echo "🔌 端口占用检查:"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "✅ 端口 3000 (后端): 已监听"
else
    echo "❌ 端口 3000 (后端): 未监听"
fi

if netstat -tlnp 2>/dev/null | grep -q ":5173"; then
    echo "✅ 端口 5173 (前端): 已监听"
else
    echo "❌ 端口 5173 (前端): 未监听"
fi

# 检查公网访问
echo ""
echo "🌐 公网访问检查:"

echo "测试前端访问..."
if curl -s "https://esboimzbkure.sealosbja.site" | grep -q "ArkOK V2"; then
    echo "✅ 前端页面: 可正常访问"
else
    echo "❌ 前端页面: 访问失败"
fi

echo "测试 API 端点..."
if curl -s "https://esboimzbkure.sealosbja.site/health" | grep -q "healthy"; then
    echo "✅ 健康检查 API: 正常"
else
    echo "❌ 健康检查 API: 失败"
fi

if curl -s "https://esboimzbkure.sealosbja.site/api/schools" | grep -q "Demo School"; then
    echo "✅ 学校数据 API: 正常"
else
    echo "❌ 学校数据 API: 失败"
fi

# 检查文件状态
echo ""
echo "📁 关键文件检查:"

if [ -f "arkok-v2/server/src/app.ts" ]; then
    echo "✅ 后端主文件: 存在"
else
    echo "❌ 后端主文件: 不存在"
fi

if [ -f "client/dist/index.html" ]; then
    echo "✅ 前端构建文件: 存在"
else
    echo "❌ 前端构建文件: 不存在"
fi

if [ -f "bja.sealos.run_ns-bg6fgs6y_devbox" ]; then
    echo "✅ SSH 密钥文件: 存在"
else
    echo "❌ SSH 密钥文件: 不存在"
fi

# 检查文档
echo ""
echo "📚 文档状态检查:"

if [ -f "PROJECT_PROGRESS.md" ]; then
    echo "✅ 项目进度文档: 已保存"
else
    echo "❌ 项目进度文档: 未保存"
fi

if [ -f "RESUME_WORK.md" ]; then
    echo "✅ 快速恢复指南: 已保存"
else
    echo "❌ 快速恢复指南: 未保存"
fi

if [ -d "arkok-v2/docs" ]; then
    echo "✅ 技术文档: 目录存在"
else
    echo "❌ 技术文档: 目录不存在"
fi

echo ""
echo "================================"
echo "🎯 检查完成！"

# 记录检查时间
echo "📅 检查时间: $(date)"
echo ""
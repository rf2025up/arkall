#!/bin/bash

# 快速部署脚本 - Growark + StarJourney
# 版本: v2.0
# 创建时间: 2025-12-10

echo "🚀 开始快速部署..."
echo "⏰ 时间: $(date)"
echo "📍 项目: /home/devbox/project/arkok"

# 1. 停止当前服务
echo ""
echo "📛 停止当前服务..."
SERVICE_PID=$(pgrep -f "arkok/server.js")
if [ ! -z "$SERVICE_PID" ]; then
    kill $SERVICE_PID
    echo "✅ 已停止服务进程: $SERVICE_PID"
    sleep 3
else
    echo "ℹ️  没有找到运行中的服务"
fi

# 2. 构建前端
echo ""
echo "🔨 构建前端代码..."
cd /home/devbox/project/arkok/mobile
if npm run build; then
    echo "✅ 前端构建成功"
else
    echo "❌ 前端构建失败"
    exit 1
fi

# 3. 部署文件
echo ""
echo "📁 部署构建文件..."
# 复制主要文件
cp dist/assets/main-*.js ../public/assets/
cp dist/assets/client-*.js ../public/assets/
cp dist/assets/bigscreen-*.js ../public/assets/
cp dist/index.html ../public/

# 4. 添加版本号强制刷新缓存
VERSION=$(date +%Y%m%d%H%M)
cd /home/devbox/project/arkok/public
sed -i "s|.js\"|.js?v=$VERSION\"|g" index.html
sed -i "s|.css\"|.css?v=$VERSION\"|g" index.html
echo "✅ 已添加版本号: v$VERSION"

# 5. 启动服务
echo ""
echo "🔄 启动公网服务..."
cd /home/devbox/project
nohup ./entrypoint.sh production > server.log 2>&1 &
NEW_PID=$!
echo "✅ 服务已启动，PID: $NEW_PID"

# 6. 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 30

# 7. 验证部署
echo ""
echo "🔍 验证部署状态..."

# 检查进程
if ps aux | grep -q "$NEW_PID.*arkok/server.js"; then
    echo "✅ 服务进程运行正常"
else
    echo "❌ 服务进程异常"
    tail -20 server.log
    exit 1
fi

# 健康检查
echo "🏥 执行健康检查..."
if curl -s https://esboimzbkure.sealosbja.site/health | grep -q "healthy"; then
    echo "✅ 健康检查通过"
else
    echo "⚠️  健康检查失败，可能是网络延迟，请稍后再试"
fi

# 页面访问测试
echo "📱 测试页面访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://esboimzbkure.sealosbja.site/app)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 主页面访问正常"
else
    echo "⚠️  主页面返回状态码: $HTTP_CODE"
fi

# 8. 完成
echo ""
echo "🎉 部署完成！"
echo "🌐 公网地址: https://esboimzbkure.sealosbja.site/app"
echo "📝 备课页面: https://esboimzbkure.sealosbja.site/prep"
echo "🛡️ 质检页面: https://esboimzbkure.sealosbja.site/qc"
echo "📺 大屏展示: https://esboimzbkure.sealosbja.site/screen"
echo "❤️  健康检查: https://esboimzbkure.sealosbja.site/health"
echo "📋 服务日志: /home/devbox/project/server.log"
echo "⏰ 完成时间: $(date)"
echo ""
echo "💡 提示: 如看不到更新，请按 Ctrl+F5 强制刷新浏览器缓存"
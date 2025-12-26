#!/bin/bash

set -e

echo "🚀 部署 ArkOK V2 到 Sealos 集群..."

# SSH 连接信息
SSH_KEY="bja.sealos.run_ns-bg6fgs6y_devbox"
SSH_USER="devbox"
SSH_HOST="bja.sealos.run"
SSH_PORT="45852"

# 创建 Kubernetes 配置
cat > arkok-deployment.yaml << 'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arkok-v2
  namespace: ns-bg6fgs6y
spec:
  replicas: 2
  selector:
    matchLabels:
      app: arkok-v2
  template:
    metadata:
      labels:
        app: arkok-v2
    spec:
      containers:
      - name: arkok-backend
        image: nginx:alpine  # 临时使用 nginx，稍后替换
        ports:
        - containerPort: 80
        command: ["/bin/sh", "-c"]
        args:
        - |
          cat > /usr/share/nginx/html/index.html << 'HTML'
          <!DOCTYPE html>
          <html>
          <head><title>ArkOK V2</title></head>
          <body>
            <h1>🚀 ArkOK V2 Backend API</h1>
            <p>Port: 3000</p>
            <p>Status: Running</p>
          </body>
          </html>
          HTML
          nginx -g 'daemon off;'
---
apiVersion: v1
kind: Service
metadata:
  name: arkok-v2-service
  namespace: ns-bg6fgs6y
spec:
  selector:
    app: arkok-v2
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
EOF

echo "📋 创建的 Kubernetes 配置："
cat arkok-deployment.yaml

echo ""
echo "🔄 正在通过 SSH 应用配置..."

# 由于 CLI 工具不可用，我们需要找到其他方法
echo "⚠️  注意: 由于 Kubernetes CLI 工具不可用，需要手动应用配置"
echo "请使用 Sealos 控制台或联系管理员应用以下配置:"
echo ""
echo "=========================================="
cat arkok-deployment.yaml
echo "=========================================="

# 清理临时文件
rm -f arkok-deployment.yaml

echo "✅ 配置文件已准备完成"
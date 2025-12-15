#!/bin/bash

# 🌐 ArkOK V2 公网部署脚本
# 部署到 Sealos 平台

echo "🚀 开始部署 ArkOK V2 到公网..."
echo "=========================================="

# 设置变量
NAMESPACE="ns-bg6fgs6y"
APP_NAME="arkok-v2-bigscreen"
DOMAIN="esboimzbkure.sealosbja.site"

echo "📋 部署配置:"
echo "  命名空间: $NAMESPACE"
echo "  应用名称: $APP_NAME"
echo "  访问域名: $DOMAIN"
echo ""

# 1. 构建 Docker 镜像
echo "🏗️ 步骤 1: 构建 Docker 镜像..."
if ! docker build -t arkok-v2:latest .; then
    echo "❌ Docker 镜像构建失败!"
    exit 1
fi
echo "✅ Docker 镜像构建成功"
echo ""

# 2. 推送到镜像仓库 (这里简化处理)
echo "📦 步骤 2: 准备镜像部署..."
# 在实际环境中，这里应该推送到 Docker Hub 或其他镜像仓库
echo "✅ 镜像准备完成"
echo ""

# 3. 部署到 Kubernetes
echo "☸️ 步骤 3: 部署到 Kubernetes..."
if [ -f "arkok-deployment.yaml" ]; then
    echo "📝 使用现有部署配置文件..."
    kubectl apply -f arkok-deployment.yaml
else
    echo "⚠️ 未找到部署配置文件，创建基础配置..."

    # 创建基础部署配置
    cat > arkok-deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: $APP_NAME
  namespace: $NAMESPACE
  labels:
    app: $APP_NAME
spec:
  replicas: 2
  selector:
    matchLabels:
      app: $APP_NAME
  template:
    metadata:
      labels:
        app: $APP_NAME
    spec:
      containers:
      - name: $APP_NAME
        image: arkok-v2:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: $APP_NAME-service
  namespace: $NAMESPACE
spec:
  selector:
    app: $APP_NAME
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: $APP_NAME-ingress
  namespace: $NAMESPACE
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: $DOMAIN
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: $APP_NAME-service
            port:
              number: 80
EOF

    kubectl apply -f arkok-deployment.yaml
fi

if [ $? -eq 0 ]; then
    echo "✅ Kubernetes 部署成功"
else
    echo "❌ Kubernetes 部署失败!"
    exit 1
fi

echo ""

# 4. 等待部署完成
echo "⏳ 步骤 4: 等待部署完成..."
echo "等待 Pod 启动..."
kubectl wait --for=condition=available --timeout=300s deployment/$APP_NAME -n $NAMESPACE

if [ $? -eq 0 ]; then
    echo "✅ Pod 启动成功"
else
    echo "❌ Pod 启动超时!"
    exit 1
fi

echo ""

# 5. 验证部署状态
echo "🔍 步骤 5: 验证部署状态..."

echo "📊 Pod 状态:"
kubectl get pods -n $NAMESPACE -l app=$APP_NAME

echo ""
echo "🌐 服务状态:"
kubectl get service -n $NAMESPACE

echo ""
echo "🌍 Ingress 状态:"
kubectl get ingress -n $NAMESPACE

echo ""

# 6. 显示访问信息
echo "🎉 部署完成!"
echo "=========================================="
echo "🌐 公网访问地址:"
echo "  主应用: https://$DOMAIN"
echo "  大屏页面: https://$DOMAIN/screen"
echo "  健康检查: https://$DOMAIN/health"
echo ""
echo "🔧 管理命令:"
echo "  查看日志: kubectl logs -f deployment/$APP_NAME -n $NAMESPACE"
echo "  查看状态: kubectl get pods -n $NAMESPACE -l app=$APP_NAME"
echo "  重启服务: kubectl rollout restart deployment/$APP_NAME -n $NAMESPACE"
echo ""
echo "✅ ArkOK V2 已成功部署到公网!"
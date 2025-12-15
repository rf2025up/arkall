# 🌐 ArkOK V2 Sealos 架构部署指南

**版本:** 1.0
**更新时间:** 2025-12-12
**部署环境:** Sealos Kubernetes

---

## 🎯 架构概述

基于 Sealos Kubernetes 平台的高可用、可扩展架构，支持多租户 SaaS 模式。

### 系统架构图

```mermaid
graph TD
    Ingress[🌐 公网 Ingress on Sealos]

    subgraph "Application Services (arkok-v2)"
        Frontend[🎨 前端服务 (Vite on Port 5173)]
        Backend[🚀 后端主服务 (Node.js on Port 3000)]
    end

    Ingress -- "/ (root and other UI paths)" --> Frontend
    Ingress -- "/api/*" --> Backend
    Ingress -- "/socket.io/*" --> Backend

    subgraph "Internal Cluster Services"
        Database[(🐘 PostgreSQL Cluster)]
        Cache[(📡 Redis Cluster)]
        Storage[📁 Persistent Storage]
    end

    Backend <--> Database
    Backend <--> Cache
    Backend <--> Storage

    subgraph "External Services"
        AI_Service[🧠 AI Service (Python)]
        CDN[🚀 Content Delivery Network]
        Monitoring[📊 Monitoring Stack]
    end

    Backend --> AI_Service
    Frontend --> CDN
    subgraph "Monitoring & Logging"
        Prometheus[📈 Prometheus]
        Grafana[📊 Grafana]
        ELK[📋 ELK Stack]
    end

    Backend --> Prometheus
    Frontend --> Prometheus
    Prometheus --> Grafana
    Backend --> ELK
```

---

## 🔧 Sealos 部署配置

### 1. 应用部署配置

```yaml
# arkok-v2-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arkok-v2
  namespace: ns-bg6fgs6y
  labels:
    app: arkok-v2
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: arkok-v2
  template:
    metadata:
      labels:
        app: arkok-v2
        version: v1.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      containers:
      - name: arkok-v2-backend
        image: your-registry/arkok-v2:latest
        ports:
        - containerPort: 3000
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: arkok-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: arkok-secrets
              key: redis-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: arkok-secrets
              key: jwt-secret
        - name: CORS_ORIGIN
          value: "https://esboimzbkure.sealosbja.site"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
        - name: logs
          mountPath: /app/logs
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: arkok-uploads-pvc
      - name: logs
        persistentVolumeClaim:
          claimName: arkok-logs-pvc
      imagePullSecrets:
      - name: registry-secret
```

### 2. 服务配置

```yaml
# arkok-v2-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: arkok-v2-service
  namespace: ns-bg6fgs6y
  labels:
    app: arkok-v2
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
spec:
  selector:
    app: arkok-v2
  ports:
  - name: http
    port: 80
    targetPort: 3000
    protocol: TCP
  type: ClusterIP
```

### 3. Ingress 配置

```yaml
# arkok-v2-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: arkok-v2-ingress
  namespace: ns-bg6fgs6y
  annotations:
    kubernetes.io/ingress.class: "nginx"
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - esboimzbkure.sealosbja.site
    secretName: arkok-tls
  rules:
  - host: esboimzbkure.sealosbja.site
    http:
      paths:
      # API 路由
      - path: /api(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: arkok-v2-service
            port:
              number: 80
      # WebSocket 路由
      - path: /socket.io(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: arkok-v2-service
            port:
              number: 80
      # 健康检查路由
      - path: /health(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: arkok-v2-service
            port:
              number: 80
      # 静态资源和前端路由
      - path: /(.*)
        pathType: Prefix
        backend:
          service:
            name: arkok-v2-service
            port:
              number: 80
```

---

## 🔐 密钥配置

### 1. Secrets 配置

```yaml
# arkok-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: arkok-secrets
  namespace: ns-bg6fgs6y
type: Opaque
data:
  # Base64 编码的敏感信息
  database-url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc0BkYi5leGFtcGxlLmNvbS81NDMyL2Fya29r
  redis-url: cmVkaXM6Ly86cGFzc3dvcmRAcmVkaXMuZXhhbXBsZS5jb20vMA==
  jwt-secret: c3VwZXItc2VjcmV0LWp3dC1rZXktMjAyNA==
```

### 2. ConfigMap 配置

```yaml
# arkok-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: arkok-config
  namespace: ns-bg6fgs6y
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
  RATE_LIMIT_WINDOW: "900000"
  RATE_LIMIT_MAX: "100"
```

---

## 💾 存储配置

### 1. 持久化卷声明

```yaml
# arkok-pvcs.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: arkok-uploads-pvc
  namespace: ns-bg6fgs6y
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: "sealos-csi-default"

---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: arkok-logs-pvc
  namespace: ns-bg6fgs6y
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: "sealos-csi-default"
```

---

## 📊 监控配置

### 1. ServiceMonitor

```yaml
# arkok-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: arkok-v2-monitor
  namespace: ns-bg6fgs6y
  labels:
    app: arkok-v2
spec:
  selector:
    matchLabels:
      app: arkok-v2
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
    scrapeTimeout: 10s
```

### 2. 告警规则

```yaml
# arkok-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: arkok-v2-alerts
  namespace: ns-bg6fgs6y
spec:
  groups:
  - name: arkok-v2
    rules:
    - alert: ArkOKDown
      expr: up{job="arkok-v2"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "ArkOK V2 service is down"
        description: "ArkOK V2 service has been down for more than 5 minutes"

    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }} errors per second"
```

---

## 🚀 部署脚本

### 1. 一键部署脚本

```bash
#!/bin/bash
# deploy.sh

set -e

NAMESPACE="ns-bg6fgs6y"
REGISTRY="your-registry.com"
VERSION=${VERSION:-"latest"}

echo "🚀 开始部署 ArkOK V2 到 Sealos..."

# 检查 kubectl 连接
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ 无法连接到 Kubernetes 集群"
    exit 1
fi

# 构建镜像
echo "📦 构建 Docker 镜像..."
docker build -t $REGISTRY/arkok-v2:$VERSION .

# 推送镜像
echo "📤 推送镜像到仓库..."
docker push $REGISTRY/arkok-v2:$VERSION

# 创建命名空间（如果不存在）
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# 应用配置
echo "🔧 应用 Kubernetes 配置..."
kubectl apply -f - <<EOF
$(envsubst < arkok-secrets.yaml)
$(envsubst < arkok-config.yaml)
$(envsubst < arkok-pvcs.yaml)
$(envsubst < arkok-v2-deployment.yaml)
$(envsubst < arkok-v2-service.yaml)
$(envsubst < arkok-v2-ingress.yaml)
$(envsubst < arkok-servicemonitor.yaml)
$(envsubst < arkok-alerts.yaml)
EOF

# 等待部署完成
echo "⏳ 等待部署完成..."
kubectl rollout status deployment/arkok-v2 -n $NAMESPACE --timeout=300s

# 获取访问地址
echo "✅ 部署完成！"
echo "🌐 访问地址: https://esboimzbkure.sealosbja.site"
echo "📊 监控地址: https://grafana.sealosbja.site"

# 显示服务状态
echo "📋 服务状态:"
kubectl get pods,svc,ingress -n $NAMESPACE
```

### 2. 更新脚本

```bash
#!/bin/bash
# update.sh

set -e

NAMESPACE="ns-bg6fgs6y"
REGISTRY="your-registry.com"
VERSION=${1:-"latest"}

echo "🔄 更新 ArkOK V2 到版本: $VERSION"

# 构建新镜像
echo "📦 构建新镜像..."
docker build -t $REGISTRY/arkok-v2:$VERSION .

# 推送镜像
echo "📤 推送镜像..."
docker push $REGISTRY/arkok-v2:$VERSION

# 更新部署
echo "🔧 更新部署..."
kubectl set image deployment/arkok-v2 arkok-v2-backend=$REGISTRY/arkok-v2:$VERSION -n $NAMESPACE

# 等待更新完成
echo "⏳ 等待更新完成..."
kubectl rollout status deployment/arkok-v2 -n $NAMESPACE --timeout=300s

echo "✅ 更新完成！"
```

---

## 🔍 故障排查

### 1. 常见问题

#### Pod 启动失败
```bash
# 查看 Pod 状态
kubectl get pods -n ns-bg6fgs6y

# 查看 Pod 详细信息
kubectl describe pod <pod-name> -n ns-bg6fgs6y

# 查看 Pod 日志
kubectl logs <pod-name> -n ns-bg6fgs6y

# 进入 Pod 调试
kubectl exec -it <pod-name> -n ns-bg6fgs6y -- /bin/bash
```

#### 服务无法访问
```bash
# 检查服务状态
kubectl get svc -n ns-bg6fgs6y

# 检查 Ingress 状态
kubectl get ingress -n ns-bg6fgs6y

# 查看 Ingress 日志
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# 测试内部连通性
kubectl run test-pod --image=curlimages/curl -it --rm -- /bin/sh
curl http://arkok-v2-service/health
```

#### 数据库连接问题
```bash
# 检查数据库连接
kubectl exec -it <pod-name> -n ns-bg6fgs6y -- /bin/bash
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => {
  console.log('✅ 数据库连接成功');
  prisma.\$disconnect();
}).catch(err => {
  console.error('❌ 数据库连接失败:', err);
});
"
```

### 2. 性能调试

#### 查看 Pod 资源使用
```bash
# 查看 Pod 资源使用情况
kubectl top pods -n ns-bg6fgs6y

# 查看节点资源使用
kubectl top nodes
```

#### 查看应用指标
```bash
# 获取 Prometheus 指标
curl http://esboimzbkure.sealosbja.site/metrics
```

---

## 📈 扩展策略

### 1. 水平扩展

```bash
# 扩展副本数
kubectl scale deployment arkok-v2 --replicas=5 -n ns-bg6fgs6y

# 自动扩展配置
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: arkok-v2-hpa
  namespace: ns-bg6fgs6y
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: arkok-v2
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 2. 垂直扩展

```yaml
# 更新资源限制
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

---

## 🔄 CI/CD 集成

### GitHub Actions 配置

```yaml
# .github/workflows/deploy.yml
name: Deploy to Sealos

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm ci
        cd server && npm ci
        cd ../client && npm ci

    - name: Run tests
      run: npm test

    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Configure kubectl
      uses: azure/k8s-set-context@v3
      with:
        method: kubeconfig
        kubeconfig: ${{ secrets.KUBECONFIG }}

    - name: Deploy to Sealos
      run: |
        chmod +x deploy.sh
        ./deploy.sh
```

---

## 📞 支持联系方式

- **Sealos 文档**: https://sealos.io/docs
- **ArkOK V2 仓库**: https://github.com/your-org/arkok-v2
- **技术支持**: dev@arkok.com
- **问题反馈**: https://github.com/your-org/arkok-v2/issues

---

*最后更新: 2025-12-12*
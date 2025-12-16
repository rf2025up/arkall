#!/bin/bash

# 🚨 ArkOK V2 503 错误快速修复脚本
# 适用于 upstream connection failure (error 111) 的情况

echo "🔧 开始快速修复 upstream 连接失败错误..."
echo "================================================"
echo "错误分析: error 111 = Connection refused"
echo "诊断结果: 后端服务进程完全没有运行"
echo "================================================"

NAMESPACE="ns-bg6fgs6y"
DEPLOYMENT_NAME="arkok-v2-bigscreen"

# 步骤 1: 检查集群连接
echo "📍 步骤 1: 检查 Kubernetes 集群连接..."
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ 无法连接到 Kubernetes 集群"
    echo "请检查 kubectl 配置"
    exit 1
fi
echo "✅ Kubernetes 集群连接正常"
echo ""

# 步骤 2: 检查命名空间
echo "📍 步骤 2: 检查命名空间..."
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "❌ 命名空间 $NAMESPACE 不存在"
    echo "创建命名空间..."
    kubectl create namespace $NAMESPACE
fi
echo "✅ 命名空间 $NAMESPACE 存在"
echo ""

# 步骤 3: 检查 Pod 状态
echo "📍 步骤 3: 检查 Pod 状态..."
echo "当前 Pod 状态:"
kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME

# 获取 Pod 状态详情
POD_STATUS=$(kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME -o jsonpath='{.items[0].status.phase}' 2>/dev/null)

if [ "$POD_STATUS" = "Running" ]; then
    echo "✅ Pod 正在运行"
    echo "检查 Pod 详细状态..."
    kubectl describe pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME
else
    echo "❌ Pod 状态异常: $POD_STATUS"
    echo "查看最近的错误事件:"
    kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -10
fi
echo ""

# 步骤 4: 查看 Pod 日志
echo "📍 步骤 4: 查看 Pod 日志..."
echo "最近 50 行日志:"
kubectl logs -n $NAMESPACE -l app=$DEPLOYMENT_NAME --tail=50
echo ""

# 步骤 5: 检查服务状态
echo "📍 步骤 5: 检查服务状态..."
echo "Service 状态:"
kubectl get svc -n $NAMESPACE
echo ""
echo "Ingress 状态:"
kubectl get ingress -n $NAMESPACE
echo ""

# 步骤 6: 尝试重启服务
echo "📍 步骤 6: 尝试重启服务..."
echo "重启 Deployment..."
kubectl rollout restart deployment/$DEPLOYMENT_NAME -n $NAMESPACE

# 等待重启完成
echo "等待重启完成..."
kubectl rollout status deployment/$DEPLOYMENT_NAME -n $NAMESPACE --timeout=300s

if [ $? -eq 0 ]; then
    echo "✅ 服务重启成功"
else
    echo "❌ 服务重启失败"
    echo "查看详细错误:"
    kubectl describe deployment/$DEPLOYMENT_NAME -n $NAMESPACE
fi
echo ""

# 步骤 7: 验证服务状态
echo "📍 步骤 7: 验证服务状态..."
echo "重启后的 Pod 状态:"
kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT_NAME

# 测试内部连通性
echo "测试内部连通性..."
kubectl run test-pod --image=curlimages/curl --rm -i --restart=Never -- \
  curl -f http://$DEPLOYMENT_NAME-service/health

echo ""
echo "🎯 修复完成！"
echo "================================================"
echo "📋 检查清单:"
echo "1. Pod 是否正在运行？"
echo "2. 服务是否可以访问？"
echo "3. 公网地址是否恢复正常？"
echo ""
echo "🌐 测试地址:"
echo "健康检查: https://esboimzbkure.sealosbja.site/health"
echo "主应用: https://esboimzbkure.sealosbja.site"
echo ""
echo "📞 如果问题仍然存在，请查看详细日志或联系技术支持"
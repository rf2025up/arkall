# 🔧 ArkOK V2 公网部署故障排查指南

> **目的**: 快速诊断和解决公网部署访问问题
> **创建时间**: 2025-12-16
> **适用场景**: 公网地址无法访问时

---

## 🚨 当前问题诊断

### 📋 问题现象 (2025-12-16 00:44 更新)
- **用户反馈**: 公网地址返回 503 Service Unavailable
- **错误信息**:
  ```
  GET https://esboimzbkure.sealosbja.site/ 503 (Service Unavailable)
  GET https://esboimzbkure.sealosbja.site/favicon.ico 503 (Service Unavailable)
  ```
- **最后检查时间**: 2025-12-16 00:44
- **本地环境**: ✅ 正常运行 (http://localhost:3000)
- **诊断**: Ingress 正常，后端 Pod 未运行或崩溃

### 🔍 初步诊断
**可能原因**:
1. **Kubernetes Pod 未运行**
2. **Ingress 配置问题**
3. **域名解析问题**
4. **SSL 证书问题**
5. **资源不足导致服务崩溃**

---

## 🛠️ 排查步骤清单

### 步骤 1: 检查 Kubernetes 集群连接

```bash
# 检查集群连接状态
kubectl cluster-info

# 检查命名空间
kubectl get namespace ns-bg6fgs6y

# 如果集群连接失败，需要重新配置 kubectl
```

### 步骤 2: 检查 Pod 状态

```bash
# 查看 Pod 状态
kubectl get pods -n ns-bg6fgs6y

# 查看 Pod 详细信息
kubectl describe pods -n ns-bg6fgs6y

# 查看最近的事件
kubectl get events -n ns-bg6fgs6y --sort-by='.lastTimestamp'
```

### 步骤 3: 检查服务状态

```bash
# 检查 Service
kubectl get svc -n ns-bg6fgs6y

# 检查 Ingress
kubectl get ingress -n ns-bg6fgs6y

# 查看 Ingress 详细配置
kubectl describe ingress -n ns-bg6fgs6y
```

### 步骤 4: 检查应用日志

```bash
# 查看 Pod 日志
kubectl logs -f deployment/arkok-v2-bigscreen -n ns-bg6fgs6y

# 查看所有 Pod 的日志
kubectl logs -l app=arkok-v2-bigscreen -n ns-bg6fgs6y --tail=100
```

### 步骤 5: 网络连通性测试

```bash
# 进入 Pod 内部测试
kubectl exec -it deployment/arkok-v2-bigscreen -n ns-bg6fgs6y -- /bin/sh

# 在 Pod 内测试本地服务
curl http://localhost:3000/health

# 测试 Ingress Controller
kubectl exec -it -n ingress-nginx deployment/ingress-nginx-controller -- curl http://arkok-v2-service/health
```

---

## 🔄 常见问题解决方案

### 问题 1: Pod 处于 CrashLoopBackOff

**症状**: Pod 不断重启
```bash
# 解决方案
kubectl delete deployment arkok-v2-bigscreen -n ns-bg6fgs6y
# 重新部署
kubectl apply -f arkok-deployment.yaml
```

### 问题 2: 镜像拉取失败

**症状**: ImagePullBackOff 错误
```bash
# 检查镜像仓库访问
docker pull your-registry/arkok-v2:latest

# 如果镜像不存在，需要重新构建和推送
docker build -t your-registry/arkok-v2:latest .
docker push your-registry/arkok-v2:latest
```

### 问题 3: Ingress 无法访问

**症状**: 502 Bad Gateway 或 503 Service Unavailable
```bash
# 检查 Ingress Controller
kubectl get pods -n ingress-nginx

# 重启 Ingress Controller
kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx
```

### 问题 4: 域名解析问题

**症状**: 域名无法解析
```bash
# 检查 DNS 解析
nslookup esboimzbkure.sealosbja.site

# 检查 Ingress 配置中的域名是否正确
kubectl get ingress arkok-v2-bigscreen-ingress -n ns-bg6fgs6y -o yaml
```

### 问题 5: 资源不足

**症状**: Pod 因资源不足被杀死
```bash
# 检查节点资源使用
kubectl top nodes

# 检查 Pod 资源使用
kubectl top pods -n ns-bg6fgs6y

# 增加资源限制
kubectl patch deployment arkok-v2-bigscreen -n ns-bg6fgs6y -p '{"spec":{"template":{"spec":{"containers":[{"name":"arkok-v2-bigscreen","resources":{"limits":{"memory":"2Gi","cpu":"1000m"},"requests":{"memory":"1Gi","cpu":"500m"}}}]}}}'
```

---

## 🚀 紧急恢复方案

### 方案 1: 快速重启服务

```bash
# 重启 Deployment
kubectl rollout restart deployment/arkok-v2-bigscreen -n ns-bg6fgs6y

# 等待重启完成
kubectl rollout status deployment/arkok-v2-bigscreen -n ns-bg6fgs6y
```

### 方案 2: 重新部署应用

```bash
# 删除现有部署
kubectl delete -f arkok-deployment.yaml

# 重新应用配置
kubectl apply -f arkok-deployment.yaml

# 等待部署完成
kubectl wait --for=condition=available --timeout=300s deployment/arkok-v2-bigscreen -n ns-bg6fgs6y
```

### 方案 3: 扩容保证可用性

```bash
# 增加副本数
kubectl scale deployment arkok-v2-bigscreen --replicas=3 -n ns-bg6fgs6y

# 启用自动扩缩容
kubectl autoscale deployment arkok-v2-bigscreen --min=2 --max=5 --cpu-percent=70 -n ns-bg6fgs6y
```

---

## 📞 需要外部支持的场景

### 需要联系 Sealos 平台管理员

1. **集群级别问题**:
   - 整个 Kubernetes 集群不可用
   - 网络策略阻断了外部访问
   - 存储卷问题导致数据丢失

2. **域名和证书问题**:
   - SSL 证书过期或配置错误
   - 域名被恶意劫持
   - DNS 解析服务异常

### 联系信息

- **Sealos 文档**: https://sealos.io/docs
- **技术支持**: 通过 Sealos 平台控制台提交工单
- **紧急联系**: 查看 Sealos 平台提供的支持联系方式

---

## 📊 监控和预防

### 设置监控告警

```yaml
# 创建 ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: arkok-v2-monitor
  namespace: ns-bg6fgs6y
spec:
  selector:
    matchLabels:
      app: arkok-v2-bigscreen
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

### 定期健康检查

```bash
# 创建定时检查脚本
cat > health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="https://esboimzbkure.sealosbja.site/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "❌ 健康检查失败: HTTP $RESPONSE"
    # 发送告警通知
    # 可以接入钉钉、企业微信等通知
else
    echo "✅ 健康检查通过"
fi
EOF

# 设置定时任务
echo "*/5 * * * * /path/to/health-check.sh" | crontab -
```

---

## 📋 故障排查检查清单

### 快速诊断清单
- [ ] Kubernetes 集群连接正常？
- [ ] Pod 状态为 Running？
- [ ] Service 端口配置正确？
- [ ] Ingress 配置正确？
- [ ] 域名可以解析？
- [ ] 应用日志无错误？
- [ ] 网络连通性正常？

### 恢复验证清单
- [ ] Pod 重新启动成功？
- [ ] Service 可以访问？
- [ ] Ingress 路由正常？
- [ ] 公网地址可以打开？
- [ ] 健康检查返回 200？
- [ ] WebSocket 连接正常？
- [ ] 数据库连接正常？

---

**🎯 目标**: 确保公网服务的高可用性和快速故障恢复**

*最后更新: 2025-12-16*
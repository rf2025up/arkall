# 🔧 503 错误手动修复指南

> **问题**: https://esboimzbkure.sealosbja.site 返回 503 Service Unavailable
> **诊断**: Ingress 正常，后端 Pod 未运行
> **最后更新**: 2025-12-16 00:46

---

## 🎯 问题分析

### 📊 错误信息 (2025-12-16 00:48 更新)
```
upstream connect error or disconnect/reset before headers. retried and the latest reset reason: remote connection failure, transport failure reason: delayed connect error: 111
Failed to load resource: the server responded with a status of 503 ()
```

### 🔍 状态分析
- ✅ **Kubernetes 集群**: 正常运行
- ✅ **Ingress/路由**: 正常工作 (可以到达集群)
- ✅ **Service发现**: Service 正常创建
- ❌ **后端服务**: Pod 完全不存在或无法连接
- ❌ **网络连接**: upstream 连接失败 (error 111)

**关键诊断**: `error 111` 通常表示 "Connection refused"，说明后端服务进程完全没有运行。

---

## 🛠️ 修复步骤

### 方法 1: 通过 Sealos 控制台修复 (最推荐)

1. **登录 Sealos 控制台**
   - 访问您的 Sealos 平台控制台
   - 导航到 `ns-bg6fgs6y` 命名空间

2. **检查 Deployment 状态**
   - 找到 `arkok-v2-bigscreen` Deployment
   - 查看副本数和运行状态
   - **重点检查**: 副本数是否为 0 或 Pod 是否处于 `CrashLoopBackOff`

3. **查看 Pod 状态和日志**
   - 如果没有 Pod，说明 Deployment 未成功创建
   - 如果有 Pod 但处于错误状态，查看详细日志
   - **关键错误**: 寻找启动失败、内存不足、镜像拉取失败等信息

4. **立即修复**
   - **如果没有 Pod**: 重新创建 Deployment
   - **如果有 Pod 但崩溃**: 查看日志后重启
   - **如果是镜像问题**: 更新镜像版本或重新构建

### 方法 2: 快速检查和修复 (error 111 特定方案)

**Step 1: 检查服务是否存在**
```bash
# 检查 Deployment
kubectl get deployment arkok-v2-bigscreen -n ns-bg6fgs6y

# 检查 Service
kubectl get svc arkok-v2-bigscreen-service -n ns-bg6fgs6y

# 检查 Pod
kubectl get pods -n ns-bg6fgs6y -l app=arkok-v2-bigscreen
```

**Step 2: 如果没有 Pod，重新创建**
```bash
# 完全删除并重新创建
kubectl delete deployment arkok-v2-bigscreen -n ns-bg6fgs6y --ignore-not-found
kubectl apply -f k8s-deployment.yaml

# 等待 Pod 创建
kubectl wait --for=condition=available --timeout=300s deployment/arkok-v2-bigscreen -n ns-bg6fgs6y
```

**Step 3: 如果有 Pod 但连接失败**
```bash
# 查看详细错误日志
kubectl logs -f deployment/arkok-v2-bigscreen -n ns-bg6fgs6y

# 进入 Pod 调试
kubectl exec -it deployment/arkok-v2-bigscreen -n ns-bg6fgs6y -- /bin/sh

# 在 Pod 内测试本地服务
curl -f http://localhost:3000/health
```

### 方法 2: 使用 kubectl (如果有权限)

```bash
# 1. 配置 kubectl (需要从 Sealos 控制台获取)
# 在 Sealos 控制台中找到"集群管理" -> "kubectl 配置"
# 下载并配置 kubeconfig 文件

# 2. 检查服务状态
kubectl get pods -n ns-bg6fgs6y
kubectl get deployment arkok-v2-bigscreen -n ns-bg6fgs6y

# 3. 查看错误日志
kubectl logs -f deployment/arkok-v2-bigscreen -n ns-bg6fgs6y

# 4. 重启服务
kubectl rollout restart deployment/arkok-v2-bigscreen -n ns-bg6fgs6y

# 5. 等待重启完成
kubectl rollout status deployment/arkok-v2-bigscreen -n ns-bg6fgs6y
```

### 方法 3: 重新部署应用

```bash
# 1. 删除现有部署
kubectl delete -f k8s-deployment.yaml

# 2. 重新部署
kubectl apply -f k8s-deployment.yaml

# 3. 等待部署完成
kubectl wait --for=condition=available --timeout=300s deployment/arkok-v2-bigscreen -n ns-bg6fgs6y
```

---

## 🔍 常见 503 原因和解决方案

### 原因 1: Pod 资源不足
**症状**: Pod 处于 Pending 或被系统杀死
```bash
# 解决方案：增加资源限制
kubectl patch deployment arkok-v2-bigscreen -n ns-bg6fgs6y -p '{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "arkok-v2-bigscreen",
          "resources": {
            "requests": {"memory": "1Gi", "cpu": "500m"},
            "limits": {"memory": "2Gi", "cpu": "1000m"}
          }
        }]
      }
    }
  }
}'
```

### 原因 2: 应用启动失败
**症状**: Pod 反复重启 (CrashLoopBackOff)
```bash
# 解决方案：查看启动日志
kubectl logs deployment/arkok-v2-bigscreen -n ns-bg6fgs6y --tail=100

# 常见启动失败原因：
# - 数据库连接失败
# - 环境变量配置错误
# - 镜像版本不匹配
```

### 原因 3: 健康检查失败
**症状**: Pod 运行但健康检查不通过
```bash
# 解决方案：检查健康检查配置
kubectl get deployment arkok-v2-bigscreen -n ns-bg6fgs6y -o yaml

# 临时禁用健康检查（如果需要）
kubectl patch deployment arkok-v2-bigscreen -n ns-bg6fgs6y -p '{
  "spec": {
    "template": {
      "spec": {
        "containers": [{
          "name": "arkok-v2-bigscreen",
          "livenessProbe": null,
          "readinessProbe": null
        }]
      }
    }
  }
}'
```

### 原因 4: 数据库连接问题
**症状**: 应用启动但无法连接数据库
```bash
# 解决方案：检查数据库配置
kubectl get secret arkok-secrets -n ns-bg6fgs6y -o yaml

# 检查数据库连接字符串
echo "cG9zdGdyZXNxbDovL3VzZXI6cGFzc3dvcmRAZ3Jvd2Fyay1wb3N0Z3Jlc3FsLm5zLWJnNmZnczZ5LnN2Yy9wb3N0Z3Jlc3M=" | base64 -d
```

---

## 📋 验证修复结果

### 修复后检查清单
```bash
# 1. 检查 Pod 状态
kubectl get pods -n ns-bg6fgs6y

# 2. 检查服务状态
kubectl get svc -n ns-bg6fgs6y

# 3. 测试内部访问
kubectl run test-pod --image=curlimages/curl --rm -i --restart=Never -- \
  curl -f http://arkok-v2-bigscreen-service/health

# 4. 检查外部访问
curl -I https://esboimzbkure.sealosbja.site/health
```

### 成功指标
- ✅ Pod 状态为 `Running`
- ✅ 健康检查返回 200
- ✅ 外部访问正常
- ✅ 应用日志无错误

---

## 🚨 紧急联系支持

### 如果以上方法都无法解决

1. **收集诊断信息**:
   ```bash
   kubectl get events -n ns-bg6fgs6y --sort-by='.lastTimestamp' | tail -20
   kubectl describe deployment arkok-v2-bigscreen -n ns-bg6fgs6y
   kubectl top nodes  # 如果有权限
   ```

2. **联系 Sealos 技术支持**:
   - 通过 Sealos 控制台提交工单
   - 提供详细的错误信息和日志

3. **临时解决方案**:
   - 使用本地环境测试: http://localhost:3000
   - 等待技术支持响应

---

## 📞 技术支持联系方式

- **Sealos 官方文档**: https://sealos.io/docs
- **Sealos GitHub**: https://github.com/labring/sealos
- **技术社区**: https://github.com/labring/sealos/issues

---

**🎯 目标**: 快速恢复公网访问服务，确保 ArkOK V2 正常运行**

*最后更新: 2025-12-16*
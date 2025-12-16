# 🔧 SSH 连接 Sealos 集群修复指南

> **问题**: SSH 密钥文件缺失或权限错误
> **目标**: 成功连接到 Sealos 集群进行 503 错误修复

---

## 🚨 当前 SSH 问题

```
Warning: Identity file bja.sealos.run_ns-bg6fgs6y_devbox not accessible: No such file or directory.
devbox@bja.sealos.run: Permission denied (publickey).
```

**问题分析**:
1. SSH 密钥文件不存在
2. 需要获取正确的密钥文件
3. 可能需要从 Sealos 控制台重新下载

---

## 🛠️ 解决方案

### 方案 1: 从 Sealos 控制台下载 SSH 密钥

1. **登录 Sealos 控制台**
   - 访问您的 Sealos 平台控制台
   - 进入集群管理页面

2. **下载 SSH 密钥**
   - 找到 "SSH 连接" 或 "密钥管理"
   - 下载对应 `ns-bg6fgs6y` 命名空间的 SSH 密钥
   - 文件名通常是 `id_rsa` 或类似名称

3. **保存密钥到正确位置**
   ```bash
   # 将下载的密钥文件保存为
   mv ~/Downloads/id_rsa bja.sealos.run_ns-bg6fgs6y_devbox

   # 设置正确权限
   chmod 600 bja.sealos.run_ns-bg6fgs6y_devbox
   ```

### 方案 2: 使用 Sealos CLI 配置 kubectl

1. **检查 Sealos CLI 是否可以访问集群**
   ```bash
   sealos inspect
   ```

2. **配置 kubectl**
   ```bash
   # Sealos 通常会自动配置 kubectl
   # 尝试直接使用 kubectl
   kubectl cluster-info

   # 如果失败，查看 Sealos 配置
   sealos gen
   ```

### 方案 3: 通过 Sealos Web 终端

1. **使用 Sealos Web Terminal**
   - 在 Sealos 控制台中找到 "Terminal"
   - 这通常是一个基于 Web 的 kubectl 终端
   - 可以直接执行 kubectl 命令

2. **执行修复命令**
   ```bash
   # 检查服务状态
   kubectl get pods -n ns-bg6fgs6y
   kubectl get deployment arkok-v2-bigscreen -n ns-bg6fgs6y

   # 重新创建服务
   kubectl delete deployment arkok-v2-bigscreen -n ns-bg6fgs6y --ignore-not-found
   kubectl apply -f k8s-deployment.yaml

   # 等待服务启动
   kubectl wait --for=condition=available --timeout=300s deployment/arkok-v2-bigscreen -n ns-bg6fgs6y
   ```

---

## 🎯 修复 503 错误的具体步骤

### 一旦可以访问集群，立即执行以下命令：

#### Step 1: 检查当前状态
```bash
kubectl get pods -n ns-bg6fgs6y
kubectl get deployment arkok-v2-bigscreen -n ns-bg6fgs6y
kubectl get svc -n ns-bg6fgs6y
```

#### Step 2: 查看 Pod 状态和日志
```bash
# 如果有 Pod，查看日志
kubectl logs -f deployment/arkok-v2-bigscreen -n ns-bg6fgs6y

# 如果没有 Pod，检查 Deployment
kubectl describe deployment arkok-v2-bigscreen -n ns-bg6fgs6y
```

#### Step 3: 重新创建服务
```bash
# 完全删除现有资源
kubectl delete deployment arkok-v2-bigscreen -n ns-bg6fgs6y --ignore-not-found
kubectl delete service arkok-v2-bigscreen-service -n ns-bg6fgs6y --ignore-not-found

# 重新创建
kubectl apply -f k8s-deployment.yaml

# 等待启动完成
kubectl wait --for=condition=available --timeout=300s deployment/arkok-v2-bigscreen -n ns-bg6fgs6y
```

#### Step 4: 验证修复结果
```bash
# 检查服务状态
kubectl get pods -n ns-bg6fgs6y -l app=arkok-v2-bigscreen

# 测试内部连接
kubectl run test-pod --image=curlimages/curl --rm -i --restart=Never -- \
  curl -f http://arkok-v2-bigscreen-service/health

# 检查外部访问
curl -I https://esboimzbkure.sealosbja.site/health
```

---

## 📋 成功标志

修复成功后应该看到：
- ✅ Pod 状态为 `Running`
- ✅ 健康检查返回 200
- ✅ 公网地址可以访问
- ✅ upstream 连接错误消失

---

## 🚨 如果所有 SSH 方法都失败

### 联系 Sealos 技术支持
- 通过 Sealos 控制台提交工单
- 提供 503 错误信息和您的用户名
- 说明 SSH 连接问题

### 使用 Sealos Web 终端
- 大多数 Sealos 平台都提供 Web Terminal
- 可以绕过 SSH 密钥问题直接执行 kubectl 命令

### 临时解决方案
- 继续使用本地环境测试: http://localhost:3000
- 所有功能都已更新到本地环境
- 待集群连接恢复后再部署到公网

---

**🎯 优先推荐**: 先尝试 Sealos Web Terminal，这样可以最快地修复 503 错误！

*最后更新: 2025-12-16*
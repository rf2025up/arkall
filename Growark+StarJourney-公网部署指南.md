# Growark + StarJourney 公网部署指南

## 🚀 快速部署说明

### 当前状态
- ✅ **集成系统**：`http://localhost:3000` + `http://localhost:3001` - 双服务器运行
- ✅ **Growark服务**：学生管理、积分系统、班级管理 - 正常运行
- ✅ **StarJourney API**：错题记录、过关管理、学情统计 - 正常运行
- ✅ **功能集成**：三Tab学情管理界面、实时数据同步 - 全部可用

### 🎯 最新部署方式 (推荐)

#### 🚀 标准启动方法（2025-12-10更新）

**统一启动脚本**：`start-integrated-system.sh`
```bash
# 标准启动流程（从项目根目录执行）
cd /home/devbox/project
./start-integrated-system.sh

# 后台启动（生产环境）
nohup ./start-integrated-system.sh > integrated.log 2>&1 &
```

**脚本功能**：
- ✅ 自动启动双服务器架构
  - Growark服务器 (端口3000)
  - StarJourney服务器 (端口3001)
- ✅ 智能健康检查验证
  - 本地API健康检查: http://localhost:3000/health
  - StarJourney API检查: http://localhost:3001/api/health
- ✅ 完整访问地址提供
  - 本地访问: http://localhost:3000/app
  - 公网访问: https://esboimzbkure.sealosbja.site/app
- ✅ 进程管理和日志记录
- ✅ 优雅的错误处理和清理

#### 🔄 废弃的启动方法
以下启动方法已废弃，统一使用根目录标准启动：
- ❌ `arkok/start-starjourney-integrated.sh` - 路径检查复杂
- ❌ `start-starjourney-integrated.sh` - 目录依赖问题
- ❌ `./entrypoint.sh` - 单服务器启动
- ❌ 手动分别启动两个服务

### 🌐 公网访问方案

#### 方案1：Sealos Devbox 自动部署 (推荐)
如果您使用的是Sealos Devbox环境，系统会自动配置公网访问：

1. **查看当前公网地址**：
```bash
# 查看系统自动分配的公网域名
echo "当前公网访问地址: $(hostname).sealosbja.site"
```

2. **无需重启**：新功能已经集成到现有代码中，**不需要重启**即可在公网看到

3. **确认访问**：
   - 手机端：`https://[您的域名]/admin`
   - 大屏端：`https://[您的域名]/screen`
   - 学情管理：点击首页右上角 📖 图标

#### 方案2：手动配置端口转发
如果需要手动配置：

```bash
# 查看当前端口占用
netstat -tulpn | grep -E ":300[01]"

# 确认服务正在运行
curl http://localhost:3000/health
curl http://localhost:3001/api/health
```

## 📱 新功能使用指南

### 1. 学情管理入口
在首页右上角，您会看到两个按钮：
- 📋 **多选模式**：原有的批量选择功能
- 📖 **学情管理**：新增的StarJourney功能

### 2. 学情管理界面
打开后您会看到三个标签页：

#### 📊 学情概览 (默认)
- **班级统计**：总人数、错题总数、任务记录、待完成任务
- **需要关注的学生**：按紧急程度排序
- **状态良好学生**：无错题无待完成任务的学生

#### 📈 成长管理
- **快速操作**：创建过关任务、记录错题
- **任务管理**：记录辅导尝试、标记通过
- **批量操作**：一键通过所有QC任务

#### 📚 学业分析
- **个人详细数据**：错题详情、过关记录
- **辅导尝试记录**：显示尝试次数和困难任务
- **统计分析**：成功率、平均尝试次数等

### 3. 移动端操作
- **手机端**：点击右上角 📖 图标
- **快速双击**：快速双击学生卡片（300ms内）
- **蓝色按钮**：点击学生卡片右下角蓝色按钮

## 🔧 故障排除

### 如果看不到新功能：

1. **检查代码版本**：
```bash
cd /home/devbox/project/arkok
ls -la mobile/components/StarJourneyModal.tsx
```

2. **检查服务状态**：
```bash
# 检查Growark服务
curl http://localhost:3000/health

# 检查StarJourney服务
curl http://localhost:3001/api/health
```

3. **清除浏览器缓存**：
- 手机端：打开浏览器设置 → 清除缓存和Cookie
- 电脑端：F12 → Application → Clear Storage

### 如果公网无法访问：

1. **检查域名配置**：
```bash
# 检查Sealos环境
echo $HOSTNAME
echo "访问地址: https://$HOSTNAME.sealosbja.site/admin"
```

2. **重启服务**（仅作为最后手段）：
```bash
# 停止服务
pkill -f "node.*server.js"

# 重新启动
cd /home/devbox/project/arkok
./start-starjourney-integrated.sh
```

## 🎯 功能验证

### 测试新功能：

1. **基础功能测试**：
   - 打开学情管理
   - 查看班级统计数据
   - 点击学生查看详细信息

2. **进阶功能测试**：
   - 创建过关任务
   - 记录辅导尝试
   - 上传错题记录

3. **数据同步测试**：
   - 在不同标签页间切换
   - 检查数据是否实时更新
   - 验证状态指示器

## 📞 技术支持

### 常见问题：

**Q: 为什么看不到新增的学情管理按钮？**
A: 可能是浏览器缓存问题，请清除缓存后刷新页面

**Q: 公网访问地址是多少？**
A: Sealos会自动分配域名，通常是 `https://[hostname].sealosbja.site`

**Q: 需要重启服务器吗？**
A: 不需要，新功能是热部署的，现有服务自动包含新功能

**Q: 移动端操作不灵敏？**
A: 尝试使用快速双击（300ms内）或点击蓝色按钮

### 联系方式：
- 技术文档：查看项目根目录下的 `star-融合进度跟踪文档.md`
- 系统状态：查看 `star-融合计划文档.md`

---

---

## 🚨 重要提示 (2025-12-10更新)

**当前确认的公网地址**: `https://esboimzbkure.sealosbja.site` ⭐ **已验证可用**

**快速部署命令**（每次修改功能后执行）：
```bash
# 标准快速部署
cd /home/devbox/project/arkok/mobile
npm run build
cp -r dist/* ../public/

# 验证部署
curl -s -o /dev/null -w "%{http_code}" https://esboimzbkure.sealosbja.site/app
```

**或使用自动化脚本**：
```bash
# 一键快速部署
./scripts/部署到生产环境.sh
```

---

## 📋 项目结构说明

**StarJourney + Growark 融合系统**架构：
```
/home/devbox/project/
├── arkok/                      # Growark主项目目录
│   ├── server.js              # Growark服务器（端口3000）
│   ├── public/                # 生产静态文件目录
│   │   ├── index.html         # 手机端（/app路径）
│   │   ├── assets/            # 编译资源
│   │   └── bigscreen/         # 大屏端（/screen路径）
│   ├── mobile/                # 手机端源码
│   │   ├── src/               # React源代码
│   │   ├── dist/              # 构建输出
│   │   └── package.json
│   └── package.json
├── starj/                      # StarJourney独立服务
│   └── star-server.js          # StarJourney API服务器（端口3001）
├── start-integrated-system.sh  # 🚀 统一启动脚本
└── entrypoint.sh              # 单服务器启动脚本（废弃）
```

---

## 🔧 部署技术规范

### 构建和部署流程

#### 1. 前端构建
```bash
cd /home/devbox/project/arkok/mobile
npm run build
# 输出: mobile/dist/ 目录
```

#### 2. 生产部署
```bash
# 将构建产物复制到生产目录
cp -r mobile/dist/* ../public/

# 验证关键文件
ls -la public/index.html public/assets/
```

#### 3. 服务启动
```bash
# 标准启动方式（推荐）
cd /home/devbox/project
./start-integrated-system.sh
```

### 环境配置要点

#### 服务器绑定要求
- **必须绑定**: `0.0.0.0` 而非 `localhost`
- **Sealos配置**: 系统自动配置反向代理
- **端口映射**: 3000端口 → 公网访问

#### 数据库连接
```bash
# 数据库配置文件
arkok/.env
DB_HOST=growark-postgresql.ns-bg6fgs6y.svc
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=kngwb5cb
```

---

**最后更新**: 2025-12-10 12:45
**版本**: v3.0 - 根目录启动方法标准化
**重大更新**:
- ✅ 标准启动脚本统一 (start-integrated-system.sh)
- ✅ 废弃复杂路径检查启动方法
- ✅ 启动公网文档合并归档
- ✅ 以star项目文档为准
- ✅ 公网部署自动化
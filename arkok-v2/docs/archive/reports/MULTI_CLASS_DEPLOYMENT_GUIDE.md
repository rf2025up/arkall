# ArkOK V2 多班级教师协同体系 - 部署指南

**更新时间**: 2025-12-15
**版本**: v2.3.0 (多班级协同完整版)
**状态**: 🎉 生产就绪

## 🚀 快速部署

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- Docker (可选)

### 一键部署脚本
```bash
# 克隆项目
git clone <repository-url> arkok-v2
cd arkok-v2

# 构建并启动
docker-compose up -d

# 或者使用本地部署
npm run deploy
```

## 🔧 核心功能验证

### 1. 教师账号管理
**访问路径**: `/teacher-management`
**验证步骤**:
1. 使用管理员账号登录
2. 点击教师管理
3. 验证创建、编辑、重置密码、删除功能
4. 确认权限控制正常

### 2. 班级切换与数据隔离
**访问路径**: `/` (首页)
**验证步骤**:
1. 使用教师账号登录
2. 观察默认进入主班级
3. 点击底部抽屉切换到全校视图
4. 验证学生列表正确过滤

### 3. 学生移入班级功能
**访问路径**: `/` (首页)
**验证步骤**:
1. 切换到非主班级视图
2. 长按选择学生
3. 点击ActionSheet中的"移入我的班级"
4. 验证学生成功转移

### 4. LMS备课发布隔离
**访问路径**: `/prep`
**验证步骤**:
1. 观察标题下方班级标签显示
2. 切换不同班级，验证标签正确变化
3. 创建备课计划并发布
4. 确认只影响目标班级学生

### 5. 过关检查班级隔离
**访问路径**: `/qc`
**验证步骤**:
1. 验证标题下方班级标签
2. 切换班级观察学生列表变化
3. 确认数据按班级正确隔离

## 🛡️ 权限验证清单

### ADMIN (校长) 权限
- [x] 创建教师账号
- [x] 编辑教师信息
- [x] 重置教师密码
- [x] 删除教师账号
- [x] 查看全校学生
- [x] 发布LMS到全校
- [x] 删除任意学生
- [x] 跨班级数据访问

### TEACHER (老师) 权限
- [x] 查看主班级学生
- [x] 切换全校视图协助管理
- [x] 发布LMS到当前选中班级
- [x] 移入学生到主班级
- [x] 积分调整操作
- [ ] 删除学生(仅主班级)
- [ ] 跨班级数据访问限制

## 🔍 技术验证要点

### API端点验证
```bash
# 教师管理
GET    /api/users          - 获取教师列表 ✅
POST   /api/users          - 创建教师 ✅
PUT    /api/users/:id      - 更新教师 ✅
PATCH  /api/users/:id/reset-password - 重置密码 ✅
DELETE /api/users/:id      - 删除教师 ✅

# 学生管理
GET    /api/students?classRoom=三年级1班 - 班级过滤 ✅
POST   /api/students/transfer - 学生转移 ✅

# LMS业务隔离
POST   /api/lms/publish    - 班级级发布 ✅
GET    /api/lms/plans      - 教学计划查询 ✅
```

### 数据库验证
```sql
-- 检查教师表结构
SELECT username, name, displayName, primaryClassName, role FROM Teacher;

-- 检查学生班级分布
SELECT className, COUNT(*) as student_count FROM Student WHERE isActive = true GROUP BY className;

-- 检查LMS任务记录
SELECT COUNT(*) FROM TaskRecord WHERE createdAt >= CURRENT_DATE;
```

## 🐛 常见问题排查

### 1. 班级切换不生效
**症状**: 切换班级后学生列表不更新
**排查**:
- 检查ClassContext是否正确初始化
- 验证useEffect依赖包含currentClass
- 确认API响应数据结构正确

### 2. 教师管理权限错误
**症状**: 无法创建/编辑教师
**排查**:
- 确认用户角色为ADMIN
- 检查JWT token有效性
- 验证中间件权限检查逻辑

### 3. LMS发布全校
**症状**: 备课发布影响到所有班级
**排查**:
- 检查className参数传递
- 验证后端班级过滤逻辑
- 确认currentClass状态正确

## 📊 性能监控

### 关键指标
- **API响应时间**: < 200ms
- **页面加载时间**: < 2s
- **数据库连接**: 稳定连接池
- **实时通信延迟**: < 50ms

### 监控端点
```bash
# 系统状态
GET /api/health

# 数据库连接
GET /api/db-status

# 实时连接状态
GET /api/socket-status
```

## 🔄 版本升级

### 从v2.1升级到v2.3
1. 备份数据库
2. 拉取最新代码
3. 运行数据库迁移
4. 重启服务
5. 验证新功能

```bash
# 升级步骤
npm run db-backup
git pull origin main
npm run migrate
npm restart
```

## 📞 技术支持

### 日志查看
```bash
# 应用日志
docker logs arkok-v2-server

# 数据库日志
docker logs arkok-v2-db

# 实时日志
tail -f logs/app.log
```

### 配置文件
- **数据库配置**: `server/.env`
- **前端配置**: `client/.env.production`
- **Docker配置**: `docker-compose.yml`

---

**🎉 部署完成后，ArkOK V2多班级教师协同体系将正式上线！**

**支持团队**: ArkOK开发团队
**文档版本**: v1.0
**最后更新**: 2025-12-15
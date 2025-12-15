# StarJourney 生产环境部署指南

## 📋 目录

- [系统要求](#系统要求)
- [部署架构](#部署架构)
- [部署步骤](#部署步骤)
- [配置说明](#配置说明)
- [监控和告警](#监控和告警)
- [故障排除](#故障排除)
- [维护操作](#维护操作)

## 🖥️ 系统要求

### 硬件要求

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2核 | 4核 |
| 内存 | 4GB | 8GB |
| 存储 | 20GB | 50GB SSD |
| 网络 | 100Mbps | 1Gbps |

### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Node.js**: v16.x 或更高版本
- **PostgreSQL**: v12+ 或更高版本
- **Nginx** (可选，用于反向代理)

### 端口要求

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | Growark | 主应用服务 |
| 3001 | StarJourney | LMS服务 |
| 5432 | PostgreSQL | 数据库 |
| 9090 | Prometheus | 监控（可选） |
| 9093 | AlertManager | 告警（可选） |

## 🏗️ 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                        │
│                        (Nginx/AWS ALB)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌──────────────┐   ┌─────────────┐
│ Growark │    │ StarJourney  │   │ PostgreSQL  │
│ (3000)  │    │ (3001)       │   │ (5432)      │
└─────────┘    └──────────────┘   └─────────────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      │
    ┌─────────────────┼─────────────────┐
    │                 │                 │
    ▼                 ▼                 ▼
┌─────────┐    ┌──────────────┐   ┌─────────────┐
│Monitor  │    │ AlertManager │   │  Backup     │
│Service │    │ Service      │   │  Storage    │
└─────────┘    └──────────────┘   └─────────────┘
```

## 🚀 部署步骤

### 1. 准备部署环境

```bash
# 1. 下载部署脚本
git clone <repository> /tmp/starj-deploy
cd /tmp/starj-deploy

# 2. 设置执行权限
chmod +x deploy/deploy-production.sh
chmod +x deploy/migrate-database.sh
chmod +x deploy/monitoring.sh

# 3. 创建部署用户
sudo useradd -r -s /bin/false starj
sudo mkdir -p /opt/starj-production
sudo chown starj:starj /opt/starj-production
```

### 2. 配置环境变量

```bash
# 复制环境配置模板
sudo cp deploy/production.env /opt/starj-production/config/.env

# 编辑配置文件
sudo nano /opt/starj-production/config/.env
```

**关键配置项：**
```bash
# 数据库配置
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 安全配置
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your_super_secret_key

# 监控配置
METRICS_ENABLED=true
ERROR_LOG_FILE=/var/log/starj/error.log
```

### 3. 数据库迁移

```bash
# 备份现有数据库
sudo ./deploy/migrate-database.sh --backup

# 执行迁移
sudo ./deploy/migrate-database.sh --migrate

# 验证迁移结果
sudo ./deploy/migrate-database.sh --verify
```

### 4. 部署应用

```bash
# 执行完整部署
sudo ./deploy/deploy-production.sh
```

部署脚本将自动完成：
- 应用文件部署
- 系统服务创建
- 日志轮转配置
- 监控脚本设置
- 服务启动和验证

### 5. 配置反向代理（可选）

**Nginx配置示例：**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. 配置监控和告警

```bash
# 部署监控系统
sudo ./deploy/monitoring.sh

# 启动监控服务
sudo systemctl start starj-performance-monitor
sudo systemctl start starj-business-monitor
sudo systemctl start starj-log-analyzer
```

## ⚙️ 配置说明

### 环境变量详解

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | 数据库连接 | `postgresql://...` |
| `CORS_ORIGIN` | 允许的跨域源 | `https://domain.com` |
| `JWT_SECRET` | JWT密钥 | `your-secret-key` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `MAX_BATCH_SIZE` | 批处理大小 | `1000` |

### 数据库连接池配置

```bash
# 连接池大小配置
DB_MAX_CONNECTIONS=20
DB_MIN_CONNECTIONS=5
DB_IDLE_TIMEOUT=30000

# SSL配置
DB_SSL=false
```

### 性能优化配置

```bash
# 请求超时设置
REQUEST_TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=5000
HEADERS_TIMEOUT=60000

# 速率限制
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 监控和告警

### 监控指标

#### 系统指标
- CPU使用率
- 内存使用率
- 磁盘使用率
- 网络I/O

#### 应用指标
- API响应时间
- 请求成功率
- 并发连接数
- 错误率

#### 业务指标
- 活跃用户数
- 任务完成率
- 数据库连接数
- 任务库数据完整性

### 告警规则

| 告警类型 | 阈值 | 级别 |
|----------|------|------|
| CPU使用率 | >80% | 警告 |
| 内存使用率 | >80% | 警告 |
| 磁盘使用率 | >85% | 严重 |
| API响应时间 | >5s | 警告 |
| 服务不可用 | 1分钟 | 严重 |
| 数据库连接失败 | 1分钟 | 严重 |

### 监控命令

```bash
# 查看服务状态
sudo systemctl status starj

# 查看实时日志
sudo journalctl -u starj -f

# 查看性能监控日志
sudo journalctl -u starj-performance-monitor -f

# 查看系统指标
tail -f /var/log/starj/metrics.log

# 查看业务指标
tail -f /var/log/starj/business-metrics.log
```

## 🔧 故障排除

### 常见问题

#### 1. 服务启动失败

**问题**: 服务无法启动
```bash
# 检查服务状态
sudo systemctl status starj

# 查看错误日志
sudo journalctl -u starj -n 50

# 检查配置文件
sudo node -c /opt/starj-production/star-server.js
```

**解决方案**:
- 检查环境变量配置
- 验证数据库连接
- 检查端口占用
- 确认文件权限

#### 2. 数据库连接失败

**问题**: 数据库连接超时
```bash
# 测试数据库连接
psql -h host -U user -d dbname -c "SELECT 1;"

# 检查连接池状态
sudo -u starj psql -c "SELECT * FROM pg_stat_activity;"
```

**解决方案**:
- 检查数据库服务状态
- 验证连接参数
- 调整连接池大小
- 检查网络连接

#### 3. API响应慢

**问题**: API响应时间过长
```bash
# 检查API健康状态
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3001/api/health"

# 分析慢查询
sudo -u postgres psql -d dbname -c "
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
"
```

**解决方案**:
- 检查数据库查询性能
- 优化索引
- 调整连接池配置
- 启用查询缓存

#### 4. 内存泄漏

**问题**: 内存使用持续增长
```bash
# 监控内存使用
top -p $(pgrep starj)

# 检查Node.js进程内存
node --inspect -p $(pgrep starj)
```

**解决方案**:
- 重启服务
- 检查代码内存泄漏
- 调整V8内存限制
- 启用内存监控

### 日志分析

#### 错误日志分析
```bash
# 查看错误统计
grep -c "ERROR" /var/log/starj/starj.log

# 查看最近错误
tail -100 /var/log/starj/starj.log | grep "ERROR"

# 分析错误模式
grep "ERROR" /var/log/starj/starj.log | awk '{print $NF}' | sort | uniq -c
```

#### 性能日志分析
```bash
# 分析响应时间趋势
awk -F',' '{print $1, $5}' /var/log/starj/metrics.log | tail -100

# 查看峰值时间
awk -F',' '$5 > 3.0 {print $1, $5}' /var/log/starj/metrics.log
```

## 🔧 维护操作

### 定期维护

#### 每日维护
```bash
# 检查服务状态
sudo systemctl is-active starj

# 检查日志文件大小
du -sh /var/log/starj/*

# 检查数据库大小
sudo -u postgres psql -c "
SELECT pg_size_pretty(pg_database_size('postgres'));
"
```

#### 每周维护
```bash
# 清理旧日志
sudo find /var/log/starj -name "*.log" -mtime +7 -delete

# 数据库维护
sudo -u postgres psql -c "VACUUM ANALYZE;"

# 更新系统包
sudo apt update && sudo apt upgrade -y
```

#### 每月维护
```bash
# 完整数据库备份
pg_dump -h host -U user -d dbname > backup_$(date +%Y%m).sql

# 性能分析
sudo -u postgres psql -c "
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public';
"
```

### 备份和恢复

#### 数据库备份
```bash
# 创建完整备份
sudo ./deploy/migrate-database.sh --backup

# 压缩备份文件
gzip backup_*.sql

# 上传到云存储
aws s3 cp backup_*.sql.gz s3://backup-bucket/
```

#### 数据恢复
```bash
# 停止服务
sudo systemctl stop starj

# 恢复数据库
sudo ./deploy/migrate-database.sh --rollback backup_file.sql.gz

# 启动服务
sudo systemctl start starj

# 验证恢复
curl -f "http://localhost:3001/api/health"
```

### 版本升级

#### 升级步骤
```bash
# 1. 备份当前版本
sudo ./deploy/migrate-database.sh --backup

# 2. 下载新版本
git fetch origin
git checkout new-version

# 3. 执行数据库迁移
sudo ./deploy/migrate-database.sh --migrate

# 4. 部署新版本
sudo ./deploy/deploy-production.sh

# 5. 验证升级
sudo systemctl status starj
curl -f "http://localhost:3001/api/health"
```

#### 回滚操作
```bash
# 1. 停止服务
sudo systemctl stop starj

# 2. 恢复数据库
sudo ./deploy/migrate-database.sh --rollback backup_file.sql.gz

# 3. 恢复应用
sudo rm -rf /opt/starj-production/*
sudo cp -r /opt/starj-backups/previous_version/* /opt/starj-production/

# 4. 启动服务
sudo systemctl start starj
```

## 📞 技术支持

### 联系方式
- **技术支持邮箱**: support@starj.com
- **紧急联系人**: +86-xxx-xxxx-xxxx

### 支持时间
- **工作日**: 9:00-18:00
- **紧急支持**: 7x24小时

### 支持内容
- 部署指导
- 故障排除
- 性能优化
- 安全加固
- 版本升级

---

**文档版本**: v1.0
**最后更新**: 2025-12-11
**维护团队**: StarJourney 技术团队
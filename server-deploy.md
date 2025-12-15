# 🖥️ 传统服务器公网部署方案

## 📋 前置要求

### 服务器配置
- **操作系统**: Ubuntu 20.04+ / CentOS 8+
- **内存**: 最低 2GB，推荐 4GB+
- **CPU**: 最低 2核心，推荐 4核心+
- **存储**: 最低 20GB
- **网络**: 公网IP，开放 80/443 端口

### 软件依赖
```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Nginx
sudo apt update
sudo apt install nginx

# 安装 PM2
sudo npm install -g pm2

# 安装 Git
sudo apt install git
```

## 🚀 部署步骤

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd arkok-v2
```

### 2. 配置环境变量
```bash
# 创建环境配置文件
cp server/.env.example server/.env

# 编辑配置文件
nano server/.env
```

### 3. 构建项目
```bash
# 安装依赖
npm install
cd client && npm install && cd ..

# 构建前端
cd client && npm run build && cd ..

# 复制构建文件
cp -r client/dist/* server/public/
```

### 4. 配置 Nginx
```nginx
# /etc/nginx/sites-available/arkok-v2
server {
    listen 80;
    server_name your-domain.com;

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
}
```

### 5. 启动服务
```bash
# 使用 PM2 启动
pm2 start dev.sh --name arkok-v2

# 设置开机自启
pm2 startup
pm2 save
```

### 6. 配置 SSL（可选）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com
```

## 🔧 监控和维护

### 日志监控
```bash
# PM2 日志
pm2 logs arkok-v2

# Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 性能监控
```bash
# 系统资源
htop

# PM2 监控
pm2 monit
```

### 自动重启
```bash
# PM2 自动重启配置
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```
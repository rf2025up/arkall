# ArkOK V2 完整本地部署包

## 📋 包含内容

### 🎯 核心部署文件
```
arkok-v2-deployment/
├── 📁 client/                    # 前端应用
│   ├── 📁 src/                   # React源代码
│   ├── 📁 public/                # 静态资源
│   ├── 📄 package.json           # 前端依赖
│   ├── 📄 vite.config.ts         # 构建配置
│   └── 📄 tsconfig.json           # TypeScript配置
│
├── 📁 server/                    # 后端服务
│   ├── 📁 src/                   # Node.js源代码
│   ├── 📁 prisma/                # 数据库schema
│   ├── 📄 package.json           # 后端依赖
│   ├── 📄 tsconfig.json           # TypeScript配置
│   └── 📄 .env.example           # 环境变量示例
│
├── 📁 docs/                      # 技术文档
│   ├── 📄 ARCHITECTURE_WHITEPAPER.md
│   ├── 📄 DEVELOPMENT_RULES.md
│   ├── 📄 gemini3修改总结.md
│   └── 📄 PUBLIC_DEPLOYMENT.md
│
├── 📄 deployment.sh              # 一键部署脚本
├── 📄 setup.sh                   # 环境初始化脚本
├── 📄 README.md                   # 部署说明
└── 📄 REQUIREMENTS.txt            # 系统要求
```

### 🔧 系统要求
- Node.js 18+
- PostgreSQL 13+
- PM2 进程管理器
- Git

### 🚀 快速部署步骤

#### 1. 环境准备
```bash
# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装PM2
sudo npm install -g pm2

# 安装PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### 2. 部署ArkOK V2
```bash
# 解压部署包
tar -xzf arkok-v2-deployment-YYYYMMDD.tar.gz
cd arkok-v2-deployment

# 运行一键部署脚本
chmod +x deployment.sh
./deployment.sh
```

### 📱 访问地址
- 前端应用：http://localhost:5173
- 后端API：http://localhost:3000
- 管理面板：http://localhost:3000/health

### 🔑 默认账户
- 教师账户：long/123456
- 管理员：admin/123456

## 📞 技术支持
如遇部署问题，请查看：
1. docs/ 目录下的技术文档
2. deployment.log 部署日志
3. pm2 logs 查看运行状态
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// 导入必要的路由
const { UserRoutes } = require('./dist/routes/user.routes');
const studentRoutes = require('./dist/routes/student.routes').default;

class SimpleApp {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.prisma = new PrismaClient();

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    }));

    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // 将服务实例附加到app上
    this.app.set('prisma', this.prisma);

    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({ success: true, message: 'Server is running' });
    });

    // 添加UserRoutes - 手动实例化
    const AuthService = require('./dist/services/auth.service').default;
    const authService = new AuthService(this.prisma);

    try {
      const userRoutes = new UserRoutes(authService, this.prisma);
      this.app.use('/api/users', userRoutes.getRoutes());
      console.log('✅ UserRoutes registered successfully');
    } catch (error) {
      console.error('❌ Failed to register UserRoutes:', error);
    }

    // 学生路由 - 包含classes接口
    try {
      this.app.use('/api/students', studentRoutes.getRoutes());
      console.log('✅ StudentRoutes registered successfully');
    } catch (error) {
      console.error('❌ Failed to register StudentRoutes:', error);
    }

    // API 404处理
    this.app.use('/api/*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  async start(port = 3000) {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');

      this.server.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Test Server running on port ${port}`);
        console.log(`📋 Health check: http://0.0.0.0:${port}/health`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// 启动测试服务器
const testApp = new SimpleApp();
testApp.start();
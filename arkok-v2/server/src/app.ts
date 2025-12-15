import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { lmsRoutes } from './routes/lms.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { schoolRoutes } from './routes/school.routes';
import { healthRoutes } from './routes/health.routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketHandlers } from './utils/socketHandlers';
import AuthService from './services/auth.service';
import StudentService from './services/student.service';
import SocketService from './services/socket.service';
import HabitService from './services/habit.service';
import ChallengeService from './services/challenge.service';
import PKMatchService from './services/pkmatch.service';
import BadgeService from './services/badge.service';
import AuthRoutes from './routes/auth.routes';
import StudentRoutes from './routes/student.routes';
import HabitRoutes from './routes/habit.routes';
import ChallengeRoutes from './routes/challenge.routes';
import PKMatchRoutes from './routes/pkmatch.routes';
import BadgeRoutes from './routes/badge.routes';
import mistakesRoutes from './routes/mistakes.routes';
import recordsRoutes from './routes/records.routes';
import { UserRoutes } from './routes/user.routes';
import reportRoutes from './routes/report.routes';
import path from 'path';

// 加载环境变量
dotenv.config();

export class App {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;
  public prisma: PrismaClient;
  public authService: AuthService;
  public studentService: StudentService;
  public socketService: SocketService;
  public habitService: HabitService;
  public challengeService: ChallengeService;
  public pkMatchService: PKMatchService;
  public badgeService: BadgeService;
  
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.prisma = new PrismaClient();
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*", // 开发环境允许所有来源
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // 初始化服务
    this.authService = new AuthService(this.prisma);
    this.studentService = new StudentService(this.io);
    this.socketService = new SocketService(this.io, this.authService);
    this.habitService = new HabitService(this.io);
    this.challengeService = new ChallengeService(this.io);
    this.pkMatchService = new PKMatchService(this.io);
    this.badgeService = new BadgeService(this.io);
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocketIO();
  }

  private initializeMiddlewares(): void {
    // CORS配置
    this.app.use(cors({
      origin: "*", // 开发环境允许所有来源
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true
    }));

    // JSON解析
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // 请求日志
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // 将服务实例附加到app上，供路由使用
    this.app.set('io', this.io);
    this.app.set('prisma', this.prisma);
    this.app.set('authService', this.authService);
    this.app.set('studentService', this.studentService);
    this.app.set('socketService', this.socketService);
    this.app.set('habitService', this.habitService);
    this.app.set('challengeService', this.challengeService);
    this.app.set('pkMatchService', this.pkMatchService);
    this.app.set('badgeService', this.badgeService);
    
    // 健康检查路由
    this.app.use('/health', healthRoutes);

    // 认证路由
    const authRoutes = new AuthRoutes(this.authService);
    this.app.use('/api/auth', authRoutes.getRoutes());

    // 学生管理路由
    const studentRoutes = new StudentRoutes(this.studentService, this.authService);
    this.app.use('/api/students', studentRoutes.getRoutes());

    // 习惯管理路由
    const habitRoutes = new HabitRoutes(this.habitService, this.authService);
    this.app.use('/api/habits', habitRoutes.getRoutes());

    // 挑战管理路由
    const challengeRoutes = new ChallengeRoutes(this.challengeService, this.authService);
    this.app.use('/api/challenges', challengeRoutes.getRoutes());

    // PK对战管理路由
    const pkMatchRoutes = new PKMatchRoutes(this.pkMatchService);
    this.app.use('/api/pkmatches', pkMatchRoutes.getRoutes());

    // 勋章管理路由
    const badgeRoutes = new BadgeRoutes(this.badgeService);
    this.app.use('/api/badges', badgeRoutes.getRoutes());

    // 教师管理路由
    const userRoutes = new UserRoutes(this.authService, this.prisma);
    this.app.use('/api/users', userRoutes.getRoutes());

    // 报告和AI提示词路由
    this.app.use('/api/reports', reportRoutes);

    // 旧版API路由（保持兼容性）
    this.app.use('/api/schools', schoolRoutes);
    this.app.use('/api/lms', lmsRoutes);
    this.app.use('/api/score', studentRoutes.getRoutes());
    this.app.use('/api/dashboard', dashboardRoutes);

    // 错题和记录API路由
    this.app.use('/api/mistakes', mistakesRoutes);
    this.app.use('/api/records', recordsRoutes);

  
    // 静态文件服务 - 提供前端应用
    const clientPath = path.resolve(__dirname, '../../client/dist');
    console.log('🔍 Static files being served from:', clientPath);
    console.log('📁 Static path exists:', require('fs').existsSync(clientPath));
    this.app.use(express.static(clientPath));

    
    // 移动端调试页面 (必须在通配符路由之前)
    this.app.get('/debug-mobile', (req, res) => {
      res.sendFile(path.join(__dirname, '../debug-mobile.html'));
    });

    // 前端路由支持 - 所有非API请求都返回index.html
    this.app.get('*', (req, res, next) => {
      // 排除特定路由
      if (req.path.startsWith('/api/') ||
          req.path.startsWith('/socket.io/') ||
          req.path === '/health' ||
          req.path === '/debug-mobile') {
        return next();
      }

      // 返回前端的index.html
      res.sendFile(path.join(clientPath, 'index.html'));
    });

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

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeSocketIO(): void {
    // 初始化 Socket 认证
    this.socketService.initializeAuthentication();

    // 初始化连接处理器
    this.socketService.initializeConnectionHandlers();

    // 保持旧的 Socket 处理器兼容性
    setupSocketHandlers(this.io);

    console.log('🔌 Socket.io 服务已初始化，支持 JWT 认证和学校房间管理');
  }

  // 广播助手方法
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
    console.log(`📡 Broadcasted event: ${event}`);
  }

  // 向特定房间广播
  public broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
    console.log(`📡 Broadcasted to room ${room}: ${event}`);
  }

  // 获取连接统计
  public getConnectionStats(): { connected: number; rooms: string[] } {
    return {
      connected: this.io.engine.clientsCount,
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      // 测试数据库连接
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');

      // 启动服务器，监听在 0.0.0.0
      this.server.listen(port, '0.0.0.0', () => {
        console.log(`🚀 ArkOK V2 Server running on port ${port}`);
        console.log(`📋 Health check: http://0.0.0.0:${port}/health`);
        console.log(`🔌 WebSocket server ready`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    console.log('🛑 Shutting down server...');

    return new Promise((resolve) => {
      this.server.close(async () => {
        try {
          await this.prisma.$disconnect();
          console.log('✅ Database disconnected');
          console.log('✅ Server stopped successfully');
          resolve();
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          resolve();
        }
      });
    });
  }
}
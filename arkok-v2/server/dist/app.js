"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const lms_routes_1 = require("./routes/lms.routes");
const dashboard_routes_1 = require("./routes/dashboard.routes");
const school_routes_1 = require("./routes/school.routes");
const health_routes_1 = require("./routes/health.routes");
const errorHandler_1 = require("./middleware/errorHandler");
const socketHandlers_1 = require("./utils/socketHandlers");
const auth_service_1 = __importDefault(require("./services/auth.service"));
const student_service_1 = __importDefault(require("./services/student.service"));
const socket_service_1 = __importDefault(require("./services/socket.service"));
const habit_service_1 = __importDefault(require("./services/habit.service"));
const challenge_service_1 = __importDefault(require("./services/challenge.service"));
const pkmatch_service_1 = __importDefault(require("./services/pkmatch.service"));
const badge_service_1 = __importDefault(require("./services/badge.service"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const habit_routes_1 = __importDefault(require("./routes/habit.routes"));
const challenge_routes_1 = __importDefault(require("./routes/challenge.routes"));
const pkmatch_routes_1 = __importDefault(require("./routes/pkmatch.routes"));
const badge_routes_1 = __importDefault(require("./routes/badge.routes"));
const mistakes_routes_1 = __importDefault(require("./routes/mistakes.routes"));
const records_routes_1 = __importDefault(require("./routes/records.routes"));
const user_routes_1 = require("./routes/user.routes");
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const path_1 = __importDefault(require("path"));
// 加载环境变量
dotenv_1.default.config();
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.prisma = new client_1.PrismaClient();
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: "*", // 开发环境允许所有来源
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        // 初始化服务
        this.authService = new auth_service_1.default(this.prisma);
        this.studentService = new student_service_1.default(this.io);
        this.socketService = new socket_service_1.default(this.io, this.authService);
        this.habitService = new habit_service_1.default(this.io);
        this.challengeService = new challenge_service_1.default(this.io);
        this.pkMatchService = new pkmatch_service_1.default(this.io);
        this.badgeService = new badge_service_1.default(this.io);
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeSocketIO();
    }
    initializeMiddlewares() {
        // CORS配置
        this.app.use((0, cors_1.default)({
            origin: "*", // 开发环境允许所有来源
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        }));
        // JSON解析
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
        // 请求日志
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    initializeRoutes() {
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
        this.app.use('/health', health_routes_1.healthRoutes);
        // 认证路由
        const authRoutes = new auth_routes_1.default(this.authService);
        this.app.use('/api/auth', authRoutes.getRoutes());
        // 学生管理路由
        const studentRoutes = new student_routes_1.default(this.studentService, this.authService);
        this.app.use('/api/students', studentRoutes.getRoutes());
        // 习惯管理路由
        const habitRoutes = new habit_routes_1.default(this.habitService, this.authService);
        this.app.use('/api/habits', habitRoutes.getRoutes());
        // 挑战管理路由
        const challengeRoutes = new challenge_routes_1.default(this.challengeService, this.authService);
        this.app.use('/api/challenges', challengeRoutes.getRoutes());
        // PK对战管理路由
        const pkMatchRoutes = new pkmatch_routes_1.default(this.pkMatchService);
        this.app.use('/api/pkmatches', pkMatchRoutes.getRoutes());
        // 勋章管理路由
        const badgeRoutes = new badge_routes_1.default(this.badgeService);
        this.app.use('/api/badges', badgeRoutes.getRoutes());
        // 教师管理路由
        const userRoutes = new user_routes_1.UserRoutes(this.authService, this.prisma);
        this.app.use('/api/users', userRoutes.getRoutes());
        // 报告和AI提示词路由
        this.app.use('/api/reports', report_routes_1.default);
        // 旧版API路由（保持兼容性）
        this.app.use('/api/schools', school_routes_1.schoolRoutes);
        this.app.use('/api/lms', lms_routes_1.lmsRoutes);
        this.app.use('/api/score', studentRoutes.getRoutes());
        this.app.use('/api/dashboard', dashboard_routes_1.dashboardRoutes);
        // 错题和记录API路由
        this.app.use('/api/mistakes', mistakes_routes_1.default);
        this.app.use('/api/records', records_routes_1.default);
        // 静态文件服务 - 提供前端应用
        const clientPath = path_1.default.resolve(__dirname, '../../client/dist');
        console.log('🔍 Static files being served from:', clientPath);
        console.log('📁 Static path exists:', require('fs').existsSync(clientPath));
        this.app.use(express_1.default.static(clientPath));
        // 移动端调试页面 (必须在通配符路由之前)
        this.app.get('/debug-mobile', (req, res) => {
            res.sendFile(path_1.default.join(__dirname, '../debug-mobile.html'));
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
            res.sendFile(path_1.default.join(clientPath, 'index.html'));
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
    initializeErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    initializeSocketIO() {
        // 初始化 Socket 认证
        this.socketService.initializeAuthentication();
        // 初始化连接处理器
        this.socketService.initializeConnectionHandlers();
        // 保持旧的 Socket 处理器兼容性
        (0, socketHandlers_1.setupSocketHandlers)(this.io);
        console.log('🔌 Socket.io 服务已初始化，支持 JWT 认证和学校房间管理');
    }
    // 广播助手方法
    broadcast(event, data) {
        this.io.emit(event, data);
        console.log(`📡 Broadcasted event: ${event}`);
    }
    // 向特定房间广播
    broadcastToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
        console.log(`📡 Broadcasted to room ${room}: ${event}`);
    }
    // 获取连接统计
    getConnectionStats() {
        return {
            connected: this.io.engine.clientsCount,
            rooms: Array.from(this.io.sockets.adapter.rooms.keys())
        };
    }
    async start(port = 3000) {
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
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    async stop() {
        console.log('🛑 Shutting down server...');
        return new Promise((resolve) => {
            this.server.close(async () => {
                try {
                    await this.prisma.$disconnect();
                    console.log('✅ Database disconnected');
                    console.log('✅ Server stopped successfully');
                    resolve();
                }
                catch (error) {
                    console.error('❌ Error during shutdown:', error);
                    resolve();
                }
            });
        });
    }
}
exports.App = App;

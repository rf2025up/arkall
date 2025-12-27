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
const prisma_1 = __importDefault(require("./utils/prisma"));
const path_1 = __importDefault(require("path"));
// Services
const auth_service_1 = __importDefault(require("./services/auth.service"));
const student_service_1 = __importDefault(require("./services/student.service"));
const lms_service_1 = require("./services/lms.service");
const socket_service_1 = __importDefault(require("./services/socket.service"));
const habit_service_1 = __importDefault(require("./services/habit.service"));
const challenge_service_1 = __importDefault(require("./services/challenge.service"));
const pkmatch_service_1 = __importDefault(require("./services/pkmatch.service"));
const badge_service_1 = __importDefault(require("./services/badge.service"));
const report_service_1 = require("./services/report.service");
const school_service_1 = __importDefault(require("./services/school.service"));
const dashboard_service_1 = __importDefault(require("./services/dashboard.service"));
const personalized_tutoring_service_1 = require("./services/personalized-tutoring.service");
const platform_service_1 = __importDefault(require("./services/platform.service"));
const reward_service_1 = require("./services/reward.service");
// Routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const habit_routes_1 = __importDefault(require("./routes/habit.routes"));
const challenge_routes_1 = __importDefault(require("./routes/challenge.routes"));
const pkmatch_routes_1 = __importDefault(require("./routes/pkmatch.routes"));
const badge_routes_1 = __importDefault(require("./routes/badge.routes"));
const lms_routes_1 = require("./routes/lms.routes");
const report_routes_1 = require("./routes/report.routes");
const user_routes_1 = require("./routes/user.routes");
const mistakes_routes_1 = require("./routes/mistakes.routes");
const records_routes_1 = require("./routes/records.routes");
const school_routes_1 = __importDefault(require("./routes/school.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const personalized_tutoring_routes_1 = require("./routes/personalized-tutoring.routes");
const health_routes_1 = require("./routes/health.routes");
const parent_routes_1 = __importDefault(require("./routes/parent.routes"));
const checkin_routes_1 = __importDefault(require("./routes/checkin.routes"));
const platform_routes_1 = __importDefault(require("./routes/platform.routes"));
const reward_routes_1 = __importDefault(require("./routes/reward.routes"));
// Middleware & Utils
const errorHandler_1 = require("./middleware/errorHandler");
const socketHandlers_1 = require("./utils/socketHandlers");
// 加载环境变量
dotenv_1.default.config();
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.prisma = prisma_1.default;
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PATCH"],
                credentials: true
            }
        });
        // 1. 初始化所有单例服务
        this.authService = new auth_service_1.default(this.prisma);
        this.studentService = new student_service_1.default(this.prisma, this.io);
        this.socketService = new socket_service_1.default(this.io, this.authService);
        this.habitService = new habit_service_1.default(this.prisma, this.io);
        this.challengeService = new challenge_service_1.default(this.prisma, this.io);
        this.pkMatchService = new pkmatch_service_1.default(this.prisma, this.io);
        this.badgeService = new badge_service_1.default(this.prisma, this.io);
        this.rewardService = new reward_service_1.RewardService(this.prisma);
        this.lmsService = new lms_service_1.LMSService(this.prisma, this.rewardService, this.io);
        this.reportService = new report_service_1.ReportService(this.prisma);
        this.schoolService = new school_service_1.default(this.prisma);
        this.dashboardService = new dashboard_service_1.default(this.prisma);
        this.tutoringService = new personalized_tutoring_service_1.PersonalizedTutoringService(this.prisma);
        this.platformService = new platform_service_1.default(this.prisma);
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeSocketIO();
    }
    initializeMiddlewares() {
        this.app.use((0, cors_1.default)({
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true
        }));
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    initializeRoutes() {
        // 兼容性设置
        this.app.set('io', this.io);
        this.app.set('prisma', this.prisma);
        this.app.set('authService', this.authService);
        // 挂载路由类
        this.app.use('/health', health_routes_1.healthRoutes);
        this.app.use('/api/auth', new auth_routes_1.default(this.authService).getRoutes());
        this.app.use('/api/students', new student_routes_1.default(this.studentService, this.authService).getRoutes());
        this.app.use('/api/habits', new habit_routes_1.default(this.habitService, this.authService).getRoutes());
        this.app.use('/api/challenges', new challenge_routes_1.default(this.challengeService, this.authService).getRoutes());
        this.app.use('/api/pkmatches', new pkmatch_routes_1.default(this.pkMatchService, this.authService).getRoutes());
        this.app.use('/api/badges', new badge_routes_1.default(this.badgeService, this.authService).getRoutes());
        this.app.use('/api/users', new user_routes_1.UserRoutes(this.authService, this.prisma).getRoutes());
        this.app.use('/api/reports', new report_routes_1.ReportRoutes(this.reportService, this.authService, this.prisma).getRoutes());
        this.app.use('/api/lms', new lms_routes_1.LMSRoutes(this.lmsService, this.authService, this.prisma).getRoutes());
        this.app.use('/api/mistakes', new mistakes_routes_1.MistakesRoutes(this.authService).getRoutes());
        this.app.use('/api/records', new records_routes_1.RecordsRoutes(this.lmsService, this.authService).getRoutes());
        // 边缘路由类化挂载
        this.app.use('/api/schools', new school_routes_1.default(this.schoolService, this.authService).getRoutes());
        this.app.use('/api/dashboard', new dashboard_routes_1.default(this.dashboardService, this.authService).getRoutes());
        this.app.use('/api/platform', new platform_routes_1.default(this.platformService, this.authService).getRoutes());
        this.app.use('/api/personalized-tutoring', new personalized_tutoring_routes_1.PersonalizedTutoringRoutes(this.tutoringService, this.authService).getRoutes());
        // 家长端路由
        this.app.use('/api/parent', parent_routes_1.default);
        // 积分经验配置路由
        this.app.use('/api/reward', reward_routes_1.default);
        // 签到路由
        this.app.use('/api/checkins', new checkin_routes_1.default(this.authService).getRoutes());
        // 静态文件与前端路由
        const clientPath = path_1.default.resolve(__dirname, '../../client/dist');
        this.app.use(express_1.default.static(clientPath));
        this.app.get('/debug-mobile', (req, res) => res.sendFile(path_1.default.join(__dirname, '../debug-mobile.html')));
        this.app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/') || req.path === '/health')
                return next();
            res.sendFile(path_1.default.join(clientPath, 'index.html'));
        });
        this.app.use('/api/*', (req, res) => {
            res.status(404).json({ success: false, message: 'API endpoint not found', path: req.originalUrl, method: req.method });
        });
    }
    initializeErrorHandling() {
        this.app.use(errorHandler_1.errorHandler);
    }
    initializeSocketIO() {
        this.socketService.initializeAuthentication();
        this.socketService.initializeConnectionHandlers();
        (0, socketHandlers_1.setupSocketHandlers)(this.io);
        console.log('🔌 Socket.io 服务已初始化');
    }
    async start(port = 3000) {
        try {
            await this.prisma.$connect();
            console.log('✅ Database connected successfully');
            this.server.listen(port, '0.0.0.0', () => {
                console.log(`🚀 ArkOK V2 Server running on port ${port}`);
            });
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }
    /**
     * 停止服务（用于安全退出）
     */
    async stop() {
        try {
            if (this.server) {
                this.server.close();
            }
            await this.prisma.$disconnect();
            console.log('✅ Server and database disconnected');
        }
        catch (error) {
            console.error('❌ Error during shutdown:', error);
        }
    }
}
exports.App = App;
exports.default = App;
//# sourceMappingURL=app.js.map
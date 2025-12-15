"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const dotenv_1 = __importDefault(require("dotenv"));
// 加载环境变量
dotenv_1.default.config();
const PORT = parseInt(process.env.PORT || '3000', 10);
async function startServer() {
    try {
        console.log('🚀 Starting ArkOK V2 Server...');
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔌 Port: ${PORT}`);
        const app = new app_1.App();
        await app.start(PORT);
        // 优雅关闭处理
        process.on('SIGTERM', async () => {
            console.log('\n🛑 SIGTERM received, shutting down gracefully...');
            await app.stop();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            console.log('\n🛑 SIGINT received, shutting down gracefully...');
            await app.stop();
            process.exit(0);
        });
        // 未捕获异常处理
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// 启动服务器
startServer();
//# sourceMappingURL=index.js.map
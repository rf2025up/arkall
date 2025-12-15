"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
// 基础健康检查
router.get('/', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        service: 'arkok-v2-server',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// 详细健康检查（包含数据库连接状态）
router.get('/detailed', async (req, res) => {
    try {
        // 这里可以添加数据库连接检查
        const dbStatus = 'connected'; // 实际应用中应该检查真实的数据库连接
        res.json({
            success: true,
            status: 'healthy',
            service: 'arkok-v2-server',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development',
            database: {
                status: dbStatus,
                // 可以添加更多数据库状态信息
            },
            websocket: {
                status: 'ready'
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

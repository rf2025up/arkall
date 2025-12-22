"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MistakesRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * 错题管理路由 (V5.0)
 */
class MistakesRoutes {
    constructor(authService) {
        this.authService = authService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        // 应用认证中间件
        this.router.use((0, auth_middleware_1.authenticateToken)(this.authService));
        // 获取错题 (目前返回空)
        this.router.get('/', async (req, res) => {
            res.json({
                success: true,
                data: [],
                message: '错题数据获取成功'
            });
        });
    }
    getRoutes() {
        return this.router;
    }
}
exports.MistakesRoutes = MistakesRoutes;
//# sourceMappingURL=mistakes.routes.js.map
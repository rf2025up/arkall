"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
class UserRoutes {
    constructor(authService, prisma) {
        this.authService = authService;
        this.prisma = prisma;
    }
    getRoutes() {
        const router = (0, express_1.Router)();
        const userController = new user_controller_1.UserController();
        // 认证中间件
        const authenticateToken = (req, res, next) => {
            const authHeader = req.headers.authorization;
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                res.status(401).json({
                    success: false,
                    message: '访问令牌缺失',
                    code: 'TOKEN_MISSING'
                });
                return;
            }
            const user = this.authService.verifyToken(token);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: '无效的访问令牌',
                    code: 'TOKEN_INVALID'
                });
                return;
            }
            req.user = user;
            next();
        };
        // 管理员权限检查中间件
        const requireAdmin = (req, res, next) => {
            const user = req.user;
            if (!user || user.role !== 'ADMIN') {
                res.status(403).json({
                    success: false,
                    message: '权限不足，需要管理员权限',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
                return;
            }
            next();
        };
        // 所有用户路由都需要认证和管理员权限
        router.use(authenticateToken);
        router.use(requireAdmin);
        // POST /api/users - 创建教师账号 (仅 Admin)
        router.post('/', userController.createTeacher);
        // GET /api/users - 获取教师列表 (仅 Admin)
        router.get('/', userController.getTeachers);
        // PUT /api/users/:id - 更新教师信息 (仅 Admin)
        router.put('/:id', userController.updateTeacher);
        // PATCH /api/users/:id/reset-password - 重置教师密码 (仅 Admin)
        router.patch('/:id/reset-password', userController.resetPassword);
        // DELETE /api/users/:id - 删除教师账号 (仅 Admin)
        router.delete('/:id', userController.deleteTeacher);
        return router;
    }
}
exports.UserRoutes = UserRoutes;
exports.default = UserRoutes;

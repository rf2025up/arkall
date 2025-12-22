"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
class UserRoutes {
    constructor(authService, prisma) {
        this.authService = authService;
        this.prisma = prisma;
    }
    getRoutes() {
        const router = (0, express_1.Router)();
        const userController = new user_controller_1.UserController(this.prisma);
        // 所有用户路由都需要认证和管理员权限
        router.use((0, auth_middleware_1.authenticateToken)(this.authService));
        router.use(auth_middleware_1.requireAdmin);
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
//# sourceMappingURL=user.routes.js.map
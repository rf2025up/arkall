import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthService, AuthUser } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';

export class UserRoutes {
  constructor(private authService: AuthService, private prisma: PrismaClient) { }

  getRoutes(): Router {
    const router = Router();
    const userController = new UserController(this.prisma);

    // 所有用户路由都需要认证和管理员权限
    router.use(authenticateToken(this.authService));
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

export default UserRoutes;
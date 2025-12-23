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

    // 所有用户路由都需要认证
    router.use(authenticateToken(this.authService));

    // POST /api/users - 创建教师账号 (仅 Admin)
    router.post('/', requireAdmin, userController.createTeacher);

    // GET /api/users - 获取教师列表 (Admin 和 Teacher 均可，通过 controller 控制 schoolId 隔离)
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
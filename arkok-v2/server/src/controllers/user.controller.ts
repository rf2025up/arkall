import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthUser } from '../services/auth.service';

export interface CreateTeacherRequest {
  username: string;
  password: string;
  displayName?: string;
  primaryClassName?: string;
  email?: string;
  name: string;
}

export class UserController {
  private prisma = new PrismaClient();

  /**
   * 创建教师账号 (仅 Admin)
   */
  createTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      const { username, password, displayName, primaryClassName, email, name }: CreateTeacherRequest = req.body;

      // 验证必填字段
      if (!username || !name) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '用户名和姓名为必填项'
          }
        });
      }

      // 检查用户名是否已存在
      const existingUser = await this.prisma.teacher.findFirst({
        where: { username }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: '用户名已存在'
          }
        });
      }

      // 检查邮箱是否已存在（如果提供）
      if (email) {
        const existingEmail = await this.prisma.teacher.findFirst({
          where: { email }
        });

        if (existingEmail) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'CONFLICT',
              message: '邮箱已被使用'
            }
          });
        }
      }

      // 默认密码设置为 "0000" 并加密
      const defaultPassword = '0000';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // 创建教师账号
      const newTeacher = await this.prisma.teacher.create({
        data: {
          username,
          password: hashedPassword,
          name,
          displayName: displayName || name,
          email,
          role: 'TEACHER',
          primaryClassName,
          schoolId: user.schoolId
        },
        select: {
          id: true,
          username: true,
          name: true,
          displayName: true,
          email: true,
          role: true,
          primaryClassName: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(201).json({
        success: true,
        data: newTeacher,
        message: '教师账号创建成功'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取教师列表 (仅 Admin)
   */
  getTeachers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      const { page = 1, limit = 20, search } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // 构建查询条件
      const where: any = {
        schoolId: user.schoolId
      };

      // 添加搜索条件
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { username: { contains: search as string, mode: 'insensitive' } },
          { displayName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      // 获取总数
      const total = await this.prisma.teacher.count({ where });

      // 获取教师列表
      const teachers = await this.prisma.teacher.findMany({
        where,
        select: {
          id: true,
          username: true,
          name: true,
          displayName: true,
          email: true,
          role: true,
          primaryClassName: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      });

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: teachers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 更新教师信息 (仅 Admin)
   */
  updateTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      const { id } = req.params;
      const { displayName, primaryClassName, email, name }: Partial<CreateTeacherRequest> = req.body;

      // 验证教师是否存在且属于同一学校
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          id,
          schoolId: user.schoolId
        }
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '教师不存在'
          }
        });
      }

      // 如果要更新邮箱，检查是否已存在
      if (email && email !== teacher.email) {
        const existingEmail = await this.prisma.teacher.findFirst({
          where: { email }
        });

        if (existingEmail) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'CONFLICT',
              message: '邮箱已被使用'
            }
          });
        }
      }

      // 更新教师信息
      const updatedTeacher = await this.prisma.teacher.update({
        where: { id },
        data: {
          displayName: displayName || undefined,
          primaryClassName: primaryClassName || undefined,
          email: email || undefined,
          name: name || undefined
        },
        select: {
          id: true,
          username: true,
          name: true,
          displayName: true,
          email: true,
          role: true,
          primaryClassName: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.json({
        success: true,
        data: updatedTeacher,
        message: '教师信息更新成功'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 重置教师密码 (仅 Admin)
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      const { id } = req.params;

      // 验证教师是否存在且属于同一学校
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          id,
          schoolId: user.schoolId
        }
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '教师不存在'
          }
        });
      }

      // 重置密码为 "0000"
      const hashedPassword = await bcrypt.hash('0000', 10);

      await this.prisma.teacher.update({
        where: { id },
        data: { password: hashedPassword }
      });

      res.json({
        success: true,
        message: '密码重置成功，新密码为：0000'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 删除教师账号 (仅 Admin)
   */
  deleteTeacher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as AuthUser;
      const { id } = req.params;

      // 验证教师是否存在且属于同一学校
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          id,
          schoolId: user.schoolId
        }
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '教师不存在'
          }
        });
      }

      // 防止删除管理员自己
      if (teacher.id === user.userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: '不能删除自己的账号'
          }
        });
      }

      // 删除教师（级联删除相关数据）
      await this.prisma.teacher.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: '教师账号删除成功'
      });
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
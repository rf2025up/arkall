import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'arkok-v2-super-secret-jwt-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUser {
  userId: string;
  username: string;
  name: string;
  displayName?: string;
  email?: string;
  role: string;
  schoolId: string;
  schoolName?: string;
  primaryClassName?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  expiresIn?: number;
  message?: string;
}

export class AuthService {
  private prisma = new PrismaClient();

  /**
   * 用户登录验证
   */
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const { username, password } = loginData;

    try {
      // 首先尝试数据库用户验证（支持所有老师账号）
      const dbUser = await this.prisma.teachers.findFirst({
        where: { username },
        include: {
          schools: true
        }
      });

      if (dbUser) {
        // 验证密码
        let passwordValid = false;

        // 特殊处理admin账号（兼容历史数据）
        if (username === 'admin' && password === '123456') {
          passwordValid = dbUser.password === '123456' || await bcrypt.compare(password, dbUser.password);
        } else {
          // 其他账号使用bcrypt验证
          passwordValid = await bcrypt.compare(password, dbUser.password);
        }

        if (passwordValid) {
          // 生成 JWT 令牌
          const token = jwt.sign(
            {
              userId: dbUser.id,
              username: dbUser.username,
              name: dbUser.name,
              displayName: dbUser.displayName,
              email: dbUser.email,
              role: dbUser.role,
              schoolId: dbUser.schoolId,
              schoolName: dbUser.schools?.name,
              primaryClassName: dbUser.primaryClassName
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN } as SignOptions
          );

          const expiresIn = this.parseExpiresIn(JWT_EXPIRES_IN);

          return {
            success: true,
            user: {
              userId: dbUser.id,
              username: dbUser.username,
              name: dbUser.name,
              displayName: dbUser.displayName || undefined,
              email: dbUser.email || undefined,
              role: dbUser.role,
              schoolId: dbUser.schoolId,
              schoolName: dbUser.schools?.name || undefined,
              primaryClassName: dbUser.primaryClassName || undefined
            },
            token,
            expiresIn
          };
        }
      }

      // 兼容性：如果没有找到数据库用户，尝试admin硬编码逻辑
      if (username === 'admin' && password === '123456') {
        // 查找或创建默认用户
        let user = await this.prisma.teachers.findFirst({
          where: { username },
          include: {
            schools: true
          }
        });

        if (!user) {
          // 如果用户不存在，创建默认用户
          // 首先查找或创建默认学校
          let school = await this.prisma.schools.findFirst({
            where: { name: 'Default Migration School' }
          });

          if (!school) {
            school = await this.prisma.schools.create({
              data: {
                id: require('crypto').randomUUID(),
                name: 'Default Migration School',
                planType: 'FREE',
                isActive: true,
                updatedAt: new Date()
              }
            });
          }

          // 创建默认用户
          user = await this.prisma.teachers.create({
            data: {
              id: require('crypto').randomUUID(),
              username,
              password: '123456', // 实际应用中应该加密
              name: '管理员',
              email: 'admin@arkok.com',
              role: 'ADMIN',
              schoolId: school.id,
              updatedAt: new Date()
            },
            include: {
              schools: true
            }
          });
        }

        if (!user) {
          return {
            success: false,
            message: '用户创建失败'
          };
        }

        // 生成 JWT 令牌
        const token = jwt.sign(
          {
            userId: user.id,
            username: user.username,
            name: user.name,
            displayName: user.displayName,
            email: user.email,
            role: user.role,
            schoolId: user.schoolId,
            schoolName: user.schools?.name,
            primaryClassName: user.primaryClassName
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN } as SignOptions
        );

        const expiresIn = this.parseExpiresIn(JWT_EXPIRES_IN);

        return {
          success: true,
          user: {
            userId: user.id,
            username: user.username,
            name: user.name,
            displayName: user.displayName || undefined,
            email: user.email || undefined,
            role: user.role,
            schoolId: user.schoolId,
            schoolName: user.schools?.name || undefined,
            primaryClassName: user.primaryClassName || undefined
          },
          token,
          expiresIn
        };
      }

      return {
        success: false,
        message: '用户名或密码错误'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '登录过程中发生错误'
      };
    }
  }

  /**
   * 验证 JWT 令牌
   */
  verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      return {
        userId: decoded.userId,
        username: decoded.username,
        name: decoded.name,
        displayName: decoded.displayName,
        email: decoded.email,
        role: decoded.role,
        schoolId: decoded.schoolId,
        schoolName: decoded.schoolName,
        primaryClassName: decoded.primaryClassName
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * 解析过期时间为秒数
   */
  private parseExpiresIn(expiresIn: string): number {
    if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn.slice(0, -1));
      return days * 24 * 60 * 60;
    } else if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn.slice(0, -1));
      return hours * 60 * 60;
    } else if (expiresIn.endsWith('m')) {
      const minutes = parseInt(expiresIn.slice(0, -1));
      return minutes * 60;
    } else if (expiresIn.endsWith('s')) {
      return parseInt(expiresIn.slice(0, -1));
    }

    // 默认返回 7 天的秒数
    return 7 * 24 * 60 * 60;
  }

  /**
   * 刷新令牌
   */
  async refreshToken(oldToken: string): Promise<LoginResponse> {
    try {
      const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true }) as any;

      if (!decoded.userId || !decoded.schoolId) {
        return {
          success: false,
          message: '无效的令牌'
        };
      }

      // 验证用户是否仍然存在
      const user = await this.prisma.teachers.findFirst({
        where: { id: decoded.userId },
        include: {
          schools: true
        }
      });

      if (!user) {
        return {
          success: false,
          message: '用户不存在或已被禁用'
        };
      }

      // 生成新的令牌
      const newToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          name: user.name,
          displayName: user.displayName,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.schools?.name,
          primaryClassName: user.primaryClassName
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as SignOptions
      );

      const expiresIn = this.parseExpiresIn(JWT_EXPIRES_IN);

      return {
        success: true,
        user: {
          userId: user.id,
          username: user.username,
          name: user.name,
          displayName: user.displayName || undefined,
          email: user.email || undefined,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.schools?.name || undefined,
          primaryClassName: user.primaryClassName || undefined
        },
        token: newToken,
        expiresIn
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: '令牌刷新失败'
      };
    }
  }

  /**
   * 用户注册（预留功能）
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    schoolName: string;
  }): Promise<LoginResponse> {
    // 预留注册功能的实现
    return {
      success: false,
      message: '注册功能暂未开放'
    };
  }
}

export default AuthService;
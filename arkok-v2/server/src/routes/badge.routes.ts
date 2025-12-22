import { Router, Request, Response } from 'express';
import {
  BadgeService,
  BadgeQuery,
  CreateBadgeRequest,
  UpdateBadgeRequest,
  AwardBadgeRequest
} from '../services/badge.service';
import { authenticateToken, AuthRequest, validateUser } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';

export interface BadgeResponse {
  success: boolean;
  message?: string;
  data?: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 勋章管理相关路由
 */
export class BadgeRoutes {
  private router: Router;

  constructor(private badgeService: BadgeService, private authService: AuthService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/badges:
     *   get:
     *     summary: 获取勋章列表
     *     tags: [Badges]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: schoolId
     *         required: true
     *         schema:
     *           type: string
     *         description: 学校ID
     *       - in: query
     *         name: search
     *         schema:
     *           type: string
     *         description: 搜索关键词
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *         description: 勋章类别
     *       - in: query
     *         name: isActive
     *         schema:
     *           type: boolean
     *         description: 是否启用
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *         description: 页码
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 20
     *         description: 每页数量
     *     responses:
     *       200:
     *         description: 获取勋章列表成功
     */
    this.router.get('/', authenticateToken(this.authService), validateUser, this.getBadges.bind(this));
    this.router.get('/:id', authenticateToken(this.authService), validateUser, this.getBadgeById.bind(this));
    this.router.post('/', authenticateToken(this.authService), validateUser, this.createBadge.bind(this));
    this.router.put('/:id', authenticateToken(this.authService), validateUser, this.updateBadge.bind(this));
    this.router.delete('/:id', authenticateToken(this.authService), validateUser, this.deleteBadge.bind(this));
    this.router.post('/award', authenticateToken(this.authService), validateUser, this.awardBadge.bind(this));
    this.router.delete('/revoke', authenticateToken(this.authService), validateUser, this.revokeBadge.bind(this));
    this.router.get('/student/:studentId', authenticateToken(this.authService), validateUser, this.getStudentBadges.bind(this));
    this.router.get('/available/:studentId', authenticateToken(this.authService), validateUser, this.getAvailableBadges.bind(this));
    this.router.get('/stats', authenticateToken(this.authService), validateUser, this.getBadgeStats.bind(this));
  }

  /**
   * 获取勋章列表
   */
  private async getBadges(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId, search, category, isActive, page, limit } = req.query;
      const query: BadgeQuery = {
        schoolId: schoolId as string,
        search: search as string,
        category: category as string,
        isActive: isActive === 'true',
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      if (!schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.badgeService.getBadges(query);

      const response: BadgeResponse = {
        success: true,
        message: '获取勋章列表成功',
        data: result.badges,
        pagination: result.pagination
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get badges error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取勋章列表失败'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取单个勋章详情
   */
  private async getBadgeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const badge = await this.badgeService.getBadgeById(id, schoolId as string);

      const response: BadgeResponse = {
        success: true,
        message: '获取勋章详情成功',
        data: badge
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get badge by id error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取勋章详情失败'
      };
      res.status(error instanceof Error && error.message === '勋章不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 创建新勋章
   */
  private async createBadge(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateBadgeRequest = req.body;

      // 验证请求数据
      if (!data.name || !data.category || !data.schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '勋章名称、类别和学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const badge = await this.badgeService.createBadge(data);

      const response: BadgeResponse = {
        success: true,
        message: '创建勋章成功',
        data: badge
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create badge error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '创建勋章失败'
      };
      res.status(error instanceof Error && error.message === '勋章名称已存在' ? 409 : 500).json(response);
    }
  }

  /**
   * 更新勋章信息
   */
  private async updateBadge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateBadgeRequest = { ...req.body, id };

      if (!data.schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const badge = await this.badgeService.updateBadge(data);

      const response: BadgeResponse = {
        success: true,
        message: '更新勋章成功',
        data: badge
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Update badge error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '更新勋章失败'
      };
      res.status(error instanceof Error && error.message === '勋章名称已存在' ? 409 : 500).json(response);
    }
  }

  /**
   * 删除勋章（软删除）
   */
  private async deleteBadge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { schoolId } = req.body;

      if (!schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      await this.badgeService.deleteBadge(id, schoolId);

      const response: BadgeResponse = {
        success: true,
        message: '删除勋章成功'
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Delete badge error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '删除勋章失败'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 授予学生勋章
   */
  private async awardBadge(req: Request, res: Response): Promise<void> {
    try {
      const data: AwardBadgeRequest = req.body;

      // 验证请求数据
      if (!data.studentId || !data.badgeId || !data.schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学生ID、勋章ID和学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const studentBadge = await this.badgeService.awardBadge({
        ...data,
        awardedBy: req.user?.userId
      });

      const response: BadgeResponse = {
        success: true,
        message: '授予勋章成功',
        data: studentBadge
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Award badge error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '授予勋章失败'
      };
      const statusCode = error instanceof Error &&
        ['勋章不存在或已停用', '学生不存在', '学生已获得过该勋章'].includes(error.message) ? 400 : 500;
      res.status(statusCode).json(response);
    }
  }

  /**
   * 取消学生勋章
   */
  private async revokeBadge(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, badgeId, schoolId } = req.body;

      if (!studentId || !badgeId || !schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学生ID、勋章ID和学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      await this.badgeService.revokeBadge(studentId, badgeId, schoolId);

      const response: BadgeResponse = {
        success: true,
        message: '取消勋章成功'
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Revoke badge error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '取消勋章失败'
      };
      const statusCode = error instanceof Error && ['勋章不存在', '学生不存在'].includes(error.message) ? 404 : 500;
      res.status(statusCode).json(response);
    }
  }

  /**
   * 获取学生勋章列表
   */
  private async getStudentBadges(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const studentBadges = await this.badgeService.getStudentBadges(studentId, schoolId as string);

      const response: BadgeResponse = {
        success: true,
        message: '获取学生勋章列表成功',
        data: studentBadges
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get student badges error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取学生勋章列表失败'
      };
      res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 获取可获得的勋章
   */
  private async getAvailableBadges(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const availableBadges = await this.badgeService.getAvailableBadges(studentId, schoolId as string);

      const response: BadgeResponse = {
        success: true,
        message: '获取可获得的勋章成功',
        data: availableBadges
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get available badges error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取可获得的勋章失败'
      };
      res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 获取勋章统计信息
   */
  private async getBadgeStats(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: BadgeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const stats = await this.badgeService.getBadgeStats(schoolId as string);

      const response: BadgeResponse = {
        success: true,
        message: '获取勋章统计成功',
        data: stats
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get badge stats error:', error);
      const response: BadgeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取勋章统计失败'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取路由器实例
   */
  public getRoutes(): Router {
    return this.router;
  }
}

export default BadgeRoutes;
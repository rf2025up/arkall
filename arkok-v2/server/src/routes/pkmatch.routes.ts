import { Router, Request, Response } from 'express';
import {
  PKMatchService,
  PKMatchQuery,
  CreatePKMatchRequest,
  UpdatePKMatchRequest
} from '../services/pkmatch.service';
import { authenticateToken, AuthRequest, validateUser } from '../middleware/auth.middleware';
import { AuthService } from '../services/auth.service';

export interface PKMatchResponse {
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
 * PK对战管理相关路由
 */
export class PKMatchRoutes {
  private router: Router;

  constructor(private pkMatchService: PKMatchService, private authService: AuthService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/pkmatches:
     *   get:
     *     summary: 获取PK对战列表
     *     tags: [PK Matches]
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
     *         name: status
     *         schema:
     *           type: string
     *         description: 对战状态
     *       - in: query
     *         name: studentId
     *         schema:
     *           type: string
     *         description: 学生ID
     *       - in: query
     *         name: topic
     *         schema:
     *           type: string
     *         description: 对战主题
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
     *         description: 获取PK对战列表成功
     */
    this.router.get('/', authenticateToken(this.authService), validateUser, this.getPKMatches.bind(this));
    this.router.get('/:id', authenticateToken(this.authService), validateUser, this.getPKMatchById.bind(this));
    this.router.post('/', authenticateToken(this.authService), validateUser, this.createPKMatch.bind(this));
    this.router.put('/:id', authenticateToken(this.authService), validateUser, this.updatePKMatch.bind(this));
    this.router.delete('/:id', authenticateToken(this.authService), validateUser, this.deletePKMatch.bind(this));
    this.router.get('/stats/:studentId', authenticateToken(this.authService), validateUser, this.getStudentPKStats.bind(this));
    this.router.get('/leaderboard', authenticateToken(this.authService), validateUser, this.getPKLeaderboard.bind(this));
    this.router.get('/stats', authenticateToken(this.authService), validateUser, this.getPKStats.bind(this));
  }

  /**
   * 获取PK对战列表
   */
  private async getPKMatches(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId, search, status, page, limit } = req.query;
      const query: PKMatchQuery = {
        schoolId: schoolId as string,
        search: search as string,
        status: status as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      if (!query.schoolId) {
        const response: PKMatchResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.pkMatchService.getPKMatches(query);

      const response: PKMatchResponse = {
        success: true,
        message: '获取PK对战列表成功',
        data: result.matches,
        pagination: result.pagination
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get PK matches error:', error);
      const response: PKMatchResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取PK对战列表失败'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取单个PK对战详情
   */
  private async getPKMatchById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: PKMatchResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const match = await this.pkMatchService.getPKMatchById(id, schoolId as string);

      const response: PKMatchResponse = {
        success: true,
        message: '获取PK对战详情成功',
        data: match
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get PK match by id error:', error);
      const response: PKMatchResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取PK对战详情失败'
      };
      res.status(error instanceof Error && error.message === 'PK对战不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 创建新PK对战
   */
  private async createPKMatch(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePKMatchRequest = req.body;

      // 验证请求数据
      if (!data.studentA || !data.studentB || !data.topic || !data.schoolId) {
        const response: PKMatchResponse = {
          success: false,
          message: '学生A、学生B、对战主题和学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      // 检查不能自己和自己对战
      if (data.studentA === data.studentB) {
        const response: PKMatchResponse = {
          success: false,
          message: '学生不能自己与自己对战'
        };
        res.status(400).json(response);
        return;
      }

      const match = await this.pkMatchService.createPKMatch(data);

      const response: PKMatchResponse = {
        success: true,
        message: '创建PK对战成功',
        data: match
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create PK match error:', error);
      const response: PKMatchResponse = {
        success: false,
        message: error instanceof Error ? error.message : '创建PK对战失败'
      };
      const statusCode = error instanceof Error &&
        ['学生A不存在或不属于该学校', '学生B不存在或不属于该学校', '已有进行中的对战'].includes(error.message) ? 400 : 500;
      res.status(statusCode).json(response);
    }
  }

  /**
   * 更新PK对战信息
   */
  private async updatePKMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdatePKMatchRequest = { ...req.body, id };

      if (!data.schoolId) {
        const response: PKMatchResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const match = await this.pkMatchService.updatePKMatch(data);

      const response: PKMatchResponse = {
        success: true,
        message: '更新PK对战成功',
        data: match
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Update PK match error:', error);
      const response: PKMatchResponse = {
        success: false,
        message: error instanceof Error ? error.message : '更新PK对战失败'
      };
      const statusCode = error instanceof Error &&
        ['PK对战不存在', '获胜者必须是对战参与者'].includes(error.message) ? 400 : 500;
      res.status(statusCode).json(response);
    }
  }

  /**
   * 删除PK对战
   */
  private async deletePKMatch(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { schoolId } = req.body;

      if (!schoolId) {
        const response: PKMatchResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      await this.pkMatchService.deletePKMatch(id, schoolId);

      const response: PKMatchResponse = {
        success: true,
        message: '删除PK对战成功'
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Delete PK match error:', error);
      const response: PKMatchResponse = {
        success: false,
        message: error instanceof Error ? error.message : '删除PK对战失败'
      };
      const statusCode = error instanceof Error &&
        ['PK对战不存在', '无法删除进行中的对战'].includes(error.message) ? 400 : 500;
      res.status(statusCode).json(response);
    }
  }

  /**
   * 获取学生PK统计
   */
  private async getStudentPKStats(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: PKMatchResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const stats = await this.pkMatchService.getStudentPKStats(studentId, schoolId as string);

      const response: PKMatchResponse = {
        success: true,
        message: '获取学生PK统计成功',
        data: stats
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get student PK stats error:', error);
      const response: PKMatchResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取学生PK统计失败'
      };
      res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 获取PK排行榜
   */
  private async getPKLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId, limit = 10 } = req.query;

      if (!schoolId) {
        const response: PKMatchResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const leaderboard = await this.pkMatchService.getPKLeaderboard(schoolId as string, Number(limit));

      const response: PKMatchResponse = {
        success: true,
        message: '获取PK排行榜成功',
        data: leaderboard
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get PK leaderboard error:', error);
      const response: PKMatchResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取PK排行榜失败'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取PK统计信息
   */
  private async getPKStats(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: PKMatchResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const stats = await this.pkMatchService.getPKStats(schoolId as string);

      const response: PKMatchResponse = {
        success: true,
        message: '获取PK统计成功',
        data: stats
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get PK stats error:', error);
      const response: PKMatchResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取PK统计失败'
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

export default PKMatchRoutes;
import { Router, Request, Response } from 'express';
import {
  ChallengeService,
  ChallengeQuery,
  CreateChallengeRequest,
  UpdateChallengeRequest,
  JoinChallengeRequest,
  UpdateChallengeParticipantRequest
} from '../services/challenge.service';
import { AuthService } from '../services/auth.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

export interface ChallengeResponse {
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
 * 挑战管理相关路由
 */
export class ChallengeRoutes {
  private router: Router;

  constructor(private challengeService: ChallengeService, private authService: AuthService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/challenges:
     *   get:
     *     summary: 获取挑战列表
     *     tags: [Challenges]
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
     *         name: type
     *         schema:
     *           type: string
     *         description: 挑战类型
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *         description: 挑战状态
     *       - in: query
     *         name: creatorId
     *         schema:
     *           type: string
     *         description: 创建者ID
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
     *         description: 获取挑战列表成功
     */
    this.router.get('/', authenticateToken(this.authService), this.getChallenges.bind(this));

    /**
     * @swagger
     * /api/challenges/{id}:
     *   get:
     *     summary: 获取单个挑战详情
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 挑战ID
     *       - in: query
     *         name: schoolId
     *         required: true
     *         schema:
     *           type: string
     *         description: 学校ID
     *     responses:
     *       200:
     *         description: 获取挑战详情成功
     */
    this.router.get('/:id', authenticateToken(this.authService), this.getChallengeById.bind(this));

    /**
     * @swagger
     * /api/challenges:
     *   post:
     *     summary: 创建新挑战
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [title, type, schoolId, creatorId]
     *             properties:
     *               title:
     *                 type: string
     *                 description: 挑战标题
     *               description:
     *                 type: string
     *                 description: 挑战描述
     *               type:
     *                 type: string
     *                 description: 挑战类型
     *               schoolId:
     *                 type: string
     *                 description: 学校ID
     *               creatorId:
     *                 type: string
     *                 description: 创建者ID
     *               startDate:
     *                 type: string
     *                 format: date-time
     *                 description: 开始时间
     *               endDate:
     *                 type: string
     *                 format: date-time
     *                 description: 结束时间
     *               rewardPoints:
     *                 type: integer
     *                 description: 完成奖励积分
     *               rewardExp:
     *                 type: integer
     *                 description: 完成奖励经验
     *               maxParticipants:
     *                 type: integer
     *                 description: 最大参与人数
     *               metadata:
     *                 type: object
     *                 description: 挑战元数据
     *     responses:
     *       201:
     *         description: 创建挑战成功
     */
    this.router.post('/', authenticateToken(this.authService), this.createChallenge.bind(this));

    /**
     * @swagger
     * /api/challenges/{id}:
     *   put:
     *     summary: 更新挑战信息
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 挑战ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               title:
     *                 type: string
     *                 description: 挑战标题
     *               description:
     *                 type: string
     *                 description: 挑战描述
     *               type:
     *                 type: string
     *                 description: 挑战类型
     *               status:
     *                 type: string
     *                 description: 挑战状态
     *               startDate:
     *                 type: string
     *                 format: date-time
     *                 description: 开始时间
     *               endDate:
     *                 type: string
     *                 format: date-time
     *                 description: 结束时间
     *               rewardPoints:
     *                 type: integer
     *                 description: 完成奖励积分
     *               rewardExp:
     *                 type: integer
     *                 description: 完成奖励经验
     *               maxParticipants:
     *                 type: integer
     *                 description: 最大参与人数
     *               metadata:
     *                 type: object
     *                 description: 挑战元数据
     *               isActive:
     *                 type: boolean
     *                 description: 是否启用
     *               schoolId:
     *                 type: string
     *                 description: 学校ID
     *     responses:
     *       200:
     *         description: 更新挑战成功
     */
    this.router.put('/:id', authenticateToken(this.authService), this.updateChallenge.bind(this));

    /**
     * @swagger
     * /api/challenges/{id}:
     *   delete:
     *     summary: 删除挑战（软删除）
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: 挑战ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [schoolId]
     *             properties:
     *               schoolId:
     *                 type: string
     *                 description: 学校ID
     *     responses:
     *       200:
     *         description: 删除挑战成功
     */
    this.router.delete('/:id', authenticateToken(this.authService), this.deleteChallenge.bind(this));

    /**
     * @swagger
     * /api/challenges/join:
     *   post:
     *     summary: 学生参加挑战
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [challengeId, studentId, schoolId]
     *             properties:
     *               challengeId:
     *                 type: string
     *                 description: 挑战ID
     *               studentId:
     *                 type: string
     *                 description: 学生ID
     *               schoolId:
     *                 type: string
     *                 description: 学校ID
     *     responses:
     *       201:
     *         description: 参加挑战成功
     */
    this.router.post('/join', authenticateToken(this.authService), this.joinChallenge.bind(this));

    /**
     * @swagger
     * /api/challenges/participant:
     *   put:
     *     summary: 更新挑战参与者状态
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [challengeId, studentId, schoolId]
     *             properties:
     *               challengeId:
     *                 type: string
     *                 description: 挑战ID
     *               studentId:
     *                 type: string
     *                 description: 学生ID
     *               schoolId:
     *                 type: string
     *                 description: 学校ID
     *               status:
     *                 type: string
     *                 description: 参与状态
     *               result:
     *                 type: string
     *                 description: 参与结果
     *               score:
     *                 type: integer
     *                 description: 得分
     *               notes:
     *                 type: string
     *                 description: 备注
     *     responses:
     *       200:
     *         description: 更新参与者状态成功
     */
    this.router.put('/participant', authenticateToken(this.authService), this.updateChallengeParticipant.bind(this));

    /**
     * @swagger
     * /api/challenges/participant/batch:
     *   post:
     *     summary: 批量更新挑战参与者结果
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [challengeId, schoolId, updates]
     *             properties:
     *               challengeId:
     *                 type: string
     *               schoolId:
     *                 type: string
     *               updates:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                      studentId: { type: string }
     *                      result: { type: string }
     *                      notes: { type: string }
     *     responses:
     *       200:
     *         description: 批量更新成功
     */
    this.router.post('/participant/batch', authenticateToken(this.authService), this.batchUpdateParticipants.bind(this));

    /**
     * @swagger
     * /api/challenges/{challengeId}/participants:
     *   get:
     *     summary: 获取挑战参与者列表
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: challengeId
     *         required: true
     *         schema:
     *           type: string
     *         description: 挑战ID
     *       - in: query
     *         name: schoolId
     *         required: true
     *         schema:
     *           type: string
     *         description: 学校ID
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
     *         description: 获取参与者列表成功
     */
    this.router.get('/:challengeId/participants', authenticateToken(this.authService), this.getChallengeParticipants.bind(this));

    /**
     * @swagger
     * /api/challenges/stats/{studentId}:
     *   get:
     *     summary: 获取学生挑战统计
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: studentId
     *         required: true
     *         schema:
     *           type: string
     *         description: 学生ID
     *       - in: query
     *         name: schoolId
     *         required: true
     *         schema:
     *           type: string
     *         description: 学校ID
     *     responses:
     *       200:
     *         description: 获取学生挑战统计成功
     */
    this.router.get('/stats/:studentId', authenticateToken(this.authService), this.getStudentChallengeStats.bind(this));

    /**
     * @swagger
     * /api/challenges/stats:
     *   get:
     *     summary: 获取挑战统计信息
     *     tags: [Challenges]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: schoolId
     *         required: true
     *         schema:
     *           type: string
     *         description: 学校ID
     *     responses:
     *       200:
     *         description: 获取挑战统计成功
     */
    this.router.get('/stats', authenticateToken(this.authService), this.getChallengeStats.bind(this));
  }

  /**
   * 获取挑战列表
   */
  private async getChallenges(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId, search, type, status, creatorId, page, limit } = req.query;
      const query: ChallengeQuery = {
        schoolId: schoolId as string,
        search: search as string,
        type: type as string,
        status: status as string,
        creatorId: creatorId as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      };

      if (!schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.challengeService.getChallenges(query);

      const response: ChallengeResponse = {
        success: true,
        message: '获取挑战列表成功',
        data: result.challenges,
        pagination: result.pagination
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get challenges error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取挑战列表失败'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取单个挑战详情
   */
  private async getChallengeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const challenge = await this.challengeService.getChallengeById(id, schoolId as string);

      const response: ChallengeResponse = {
        success: true,
        message: '获取挑战详情成功',
        data: challenge
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get challenge by id error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取挑战详情失败'
      };
      res.status(error instanceof Error && error.message === '挑战不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 创建新挑战
   */
  private async createChallenge(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateChallengeRequest = req.body;

      // 验证请求数据
      if (!data.title || !data.type || !data.schoolId || !data.creatorId) {
        const response: ChallengeResponse = {
          success: false,
          message: '挑战标题、类型、学校ID和创建者ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const challenge = await this.challengeService.createChallenge(data);

      const response: ChallengeResponse = {
        success: true,
        message: '创建挑战成功',
        data: challenge
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create challenge error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '创建挑战失败'
      };
      res.status(error instanceof Error && error.message === '创建者不存在或不属于该学校' ? 404 : 500).json(response);
    }
  }

  /**
   * 更新挑战信息
   */
  private async updateChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateChallengeRequest = { ...req.body, id };

      if (!data.schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const challenge = await this.challengeService.updateChallenge(data);

      const response: ChallengeResponse = {
        success: true,
        message: '更新挑战成功',
        data: challenge
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Update challenge error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '更新挑战失败'
      };
      res.status(error instanceof Error && error.message === '挑战不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 删除挑战（软删除）
   */
  private async deleteChallenge(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { schoolId } = req.body;

      if (!schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      await this.challengeService.deleteChallenge(id, schoolId);

      const response: ChallengeResponse = {
        success: true,
        message: '删除挑战成功'
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Delete challenge error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '删除挑战失败'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 学生参加挑战
   */
  private async joinChallenge(req: Request, res: Response): Promise<void> {
    try {
      const data: JoinChallengeRequest = req.body;

      // 验证请求数据
      if (!data.challengeId || !data.studentId || !data.schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '挑战ID、学生ID和学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const participant = await this.challengeService.joinChallenge(data);

      const response: ChallengeResponse = {
        success: true,
        message: '参加挑战成功',
        data: participant
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Join challenge error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '参加挑战失败'
      };
      const statusCode = error instanceof Error &&
        ['挑战不存在或已停用', '学生不存在', '挑战尚未开始', '挑战已结束', '已参加该挑战', '挑战参与人数已满'].includes(error.message) ? 400 : 500;
      res.status(statusCode).json(response);
    }
  }

  /**
   * 更新挑战参与者状态
   */
  private async updateChallengeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const data: UpdateChallengeParticipantRequest = req.body;

      // 验证请求数据
      if (!data.challengeId || !data.studentId || !data.schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '挑战ID、学生ID和学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const participant = await this.challengeService.updateChallengeParticipant(data);

      const response: ChallengeResponse = {
        success: true,
        message: '更新参与者状态成功',
        data: participant
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Update challenge participant error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '更新参与者状态失败'
      };
      res.status(error instanceof Error && ['挑战不存在', '参与记录不存在'].includes(error.message) ? 404 : 500).json(response);
    }
  }

  /**
   * 批量更新挑战参与者结果
   */
  private async batchUpdateParticipants(req: Request, res: Response): Promise<void> {
    try {
      const { challengeId, schoolId, updates } = req.body;

      if (!challengeId || !schoolId || !updates) {
        const response: ChallengeResponse = {
          success: false,
          message: '参数缺失'
        };
        res.status(400).json(response);
        return;
      }

      const results = await this.challengeService.batchUpdateParticipants(challengeId, schoolId, updates);

      const response: ChallengeResponse = {
        success: true,
        message: '批量更新成功',
        data: results
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Batch update participants error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '更新失败'
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取挑战参与者列表
   */
  private async getChallengeParticipants(req: Request, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const { schoolId, page = 1, limit = 20 } = req.query;

      if (!schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.challengeService.getChallengeParticipants(
        challengeId,
        schoolId as string,
        Number(page),
        Number(limit)
      );

      const response: ChallengeResponse = {
        success: true,
        message: '获取参与者列表成功',
        data: result.participants,
        pagination: result.pagination
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get challenge participants error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取参与者列表失败'
      };
      res.status(error instanceof Error && error.message === '挑战不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 获取学生挑战统计
   */
  private async getStudentChallengeStats(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const stats = await this.challengeService.getStudentChallengeStats(studentId, schoolId as string);

      const response: ChallengeResponse = {
        success: true,
        message: '获取学生挑战统计成功',
        data: stats
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get student challenge stats error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取学生挑战统计失败'
      };
      res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
    }
  }

  /**
   * 获取挑战统计信息
   */
  private async getChallengeStats(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId } = req.query;

      if (!schoolId) {
        const response: ChallengeResponse = {
          success: false,
          message: '学校ID不能为空'
        };
        res.status(400).json(response);
        return;
      }

      const stats = await this.challengeService.getChallengeStats(schoolId as string);

      const response: ChallengeResponse = {
        success: true,
        message: '获取挑战统计成功',
        data: stats
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get challenge stats error:', error);
      const response: ChallengeResponse = {
        success: false,
        message: error instanceof Error ? error.message : '获取挑战统计失败'
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

export default ChallengeRoutes;
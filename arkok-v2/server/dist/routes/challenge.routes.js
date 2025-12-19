"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * 挑战管理相关路由
 */
class ChallengeRoutes {
    constructor(challengeService, authService) {
        this.challengeService = challengeService;
        this.authService = authService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
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
        this.router.get('/', (0, auth_middleware_1.authenticateToken)(this.authService), this.getChallenges.bind(this));
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
        this.router.get('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), this.getChallengeById.bind(this));
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
        this.router.post('/', (0, auth_middleware_1.authenticateToken)(this.authService), this.createChallenge.bind(this));
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
        this.router.put('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), this.updateChallenge.bind(this));
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
        this.router.delete('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), this.deleteChallenge.bind(this));
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
        this.router.post('/join', (0, auth_middleware_1.authenticateToken)(this.authService), this.joinChallenge.bind(this));
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
        this.router.put('/participant', (0, auth_middleware_1.authenticateToken)(this.authService), this.updateChallengeParticipant.bind(this));
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
        this.router.get('/:challengeId/participants', (0, auth_middleware_1.authenticateToken)(this.authService), this.getChallengeParticipants.bind(this));
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
        this.router.get('/stats/:studentId', (0, auth_middleware_1.authenticateToken)(this.authService), this.getStudentChallengeStats.bind(this));
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
        this.router.get('/stats', (0, auth_middleware_1.authenticateToken)(this.authService), this.getChallengeStats.bind(this));
    }
    /**
     * 获取挑战列表
     */
    async getChallenges(req, res) {
        try {
            const query = req.query;
            if (!query.schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const result = await this.challengeService.getChallenges(query);
            const response = {
                success: true,
                message: '获取挑战列表成功',
                data: result.challenges,
                pagination: result.pagination
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get challenges error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取挑战列表失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 获取单个挑战详情
     */
    async getChallengeById(req, res) {
        try {
            const { id } = req.params;
            const { schoolId } = req.query;
            if (!schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const challenge = await this.challengeService.getChallengeById(id, schoolId);
            const response = {
                success: true,
                message: '获取挑战详情成功',
                data: challenge
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get challenge by id error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取挑战详情失败'
            };
            res.status(error instanceof Error && error.message === '挑战不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 创建新挑战
     */
    async createChallenge(req, res) {
        try {
            const data = req.body;
            // 验证请求数据
            if (!data.title || !data.type || !data.schoolId || !data.creatorId) {
                const response = {
                    success: false,
                    message: '挑战标题、类型、学校ID和创建者ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const challenge = await this.challengeService.createChallenge(data);
            const response = {
                success: true,
                message: '创建挑战成功',
                data: challenge
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Create challenge error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '创建挑战失败'
            };
            res.status(error instanceof Error && error.message === '创建者不存在或不属于该学校' ? 404 : 500).json(response);
        }
    }
    /**
     * 更新挑战信息
     */
    async updateChallenge(req, res) {
        try {
            const { id } = req.params;
            const data = { ...req.body, id };
            if (!data.schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const challenge = await this.challengeService.updateChallenge(data);
            const response = {
                success: true,
                message: '更新挑战成功',
                data: challenge
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Update challenge error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '更新挑战失败'
            };
            res.status(error instanceof Error && error.message === '挑战不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 删除挑战（软删除）
     */
    async deleteChallenge(req, res) {
        try {
            const { id } = req.params;
            const { schoolId } = req.body;
            if (!schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            await this.challengeService.deleteChallenge(id, schoolId);
            const response = {
                success: true,
                message: '删除挑战成功'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Delete challenge error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '删除挑战失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 学生参加挑战
     */
    async joinChallenge(req, res) {
        try {
            const data = req.body;
            // 验证请求数据
            if (!data.challengeId || !data.studentId || !data.schoolId) {
                const response = {
                    success: false,
                    message: '挑战ID、学生ID和学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const participant = await this.challengeService.joinChallenge(data);
            const response = {
                success: true,
                message: '参加挑战成功',
                data: participant
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Join challenge error:', error);
            const response = {
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
    async updateChallengeParticipant(req, res) {
        try {
            const data = req.body;
            // 验证请求数据
            if (!data.challengeId || !data.studentId || !data.schoolId) {
                const response = {
                    success: false,
                    message: '挑战ID、学生ID和学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const participant = await this.challengeService.updateChallengeParticipant(data);
            const response = {
                success: true,
                message: '更新参与者状态成功',
                data: participant
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Update challenge participant error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '更新参与者状态失败'
            };
            res.status(error instanceof Error && ['挑战不存在', '参与记录不存在'].includes(error.message) ? 404 : 500).json(response);
        }
    }
    /**
     * 获取挑战参与者列表
     */
    async getChallengeParticipants(req, res) {
        try {
            const { challengeId } = req.params;
            const { schoolId, page = 1, limit = 20 } = req.query;
            if (!schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const result = await this.challengeService.getChallengeParticipants(challengeId, schoolId, Number(page), Number(limit));
            const response = {
                success: true,
                message: '获取参与者列表成功',
                data: result.participants,
                pagination: result.pagination
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get challenge participants error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取参与者列表失败'
            };
            res.status(error instanceof Error && error.message === '挑战不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 获取学生挑战统计
     */
    async getStudentChallengeStats(req, res) {
        try {
            const { studentId } = req.params;
            const { schoolId } = req.query;
            if (!schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const stats = await this.challengeService.getStudentChallengeStats(studentId, schoolId);
            const response = {
                success: true,
                message: '获取学生挑战统计成功',
                data: stats
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get student challenge stats error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取学生挑战统计失败'
            };
            res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 获取挑战统计信息
     */
    async getChallengeStats(req, res) {
        try {
            const { schoolId } = req.query;
            if (!schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const stats = await this.challengeService.getChallengeStats(schoolId);
            const response = {
                success: true,
                message: '获取挑战统计成功',
                data: stats
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get challenge stats error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取挑战统计失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 获取路由器实例
     */
    getRoutes() {
        return this.router;
    }
}
exports.ChallengeRoutes = ChallengeRoutes;
exports.default = ChallengeRoutes;
//# sourceMappingURL=challenge.routes.js.map
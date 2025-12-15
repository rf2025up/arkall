"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PKMatchRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * PK对战管理相关路由
 */
class PKMatchRoutes {
    constructor(pkMatchService) {
        this.pkMatchService = pkMatchService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
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
        this.router.get('/', auth_middleware_1.authenticateToken, this.getPKMatches.bind(this));
        /**
         * @swagger
         * /api/pkmatches/{id}:
         *   get:
         *     summary: 获取单个PK对战详情
         *     tags: [PK Matches]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: PK对战ID
         *       - in: query
         *         name: schoolId
         *         required: true
         *         schema:
         *           type: string
         *         description: 学校ID
         *     responses:
         *       200:
         *         description: 获取PK对战详情成功
         */
        this.router.get('/:id', auth_middleware_1.authenticateToken, this.getPKMatchById.bind(this));
        /**
         * @swagger
         * /api/pkmatches:
         *   post:
         *     summary: 创建新PK对战
         *     tags: [PK Matches]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [studentA, studentB, topic, schoolId]
         *             properties:
         *               studentA:
         *                 type: string
         *                 description: 学生A的ID
         *               studentB:
         *                 type: string
         *                 description: 学生B的ID
         *               topic:
         *                 type: string
         *                 description: 对战主题
         *               schoolId:
         *                 type: string
         *                 description: 学校ID
         *               metadata:
         *                 type: object
         *                 description: 对战元数据
         *     responses:
         *       201:
         *         description: 创建PK对战成功
         */
        this.router.post('/', auth_middleware_1.authenticateToken, this.createPKMatch.bind(this));
        /**
         * @swagger
         * /api/pkmatches/{id}:
         *   put:
         *     summary: 更新PK对战信息
         *     tags: [PK Matches]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: PK对战ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               topic:
         *                 type: string
         *                 description: 对战主题
         *               status:
         *                 type: string
         *                 description: 对战状态
         *               winnerId:
         *                 type: string
         *                 description: 获胜者ID
         *               metadata:
         *                 type: object
         *                 description: 对战元数据
         *               schoolId:
         *                 type: string
         *                 description: 学校ID
         *     responses:
         *       200:
         *         description: 更新PK对战成功
         */
        this.router.put('/:id', auth_middleware_1.authenticateToken, this.updatePKMatch.bind(this));
        /**
         * @swagger
         * /api/pkmatches/{id}:
         *   delete:
         *     summary: 删除PK对战
         *     tags: [PK Matches]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: PK对战ID
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
         *         description: 删除PK对战成功
         */
        this.router.delete('/:id', auth_middleware_1.authenticateToken, this.deletePKMatch.bind(this));
        /**
         * @swagger
         * /api/pkmatches/stats/{studentId}:
         *   get:
         *     summary: 获取学生PK统计
         *     tags: [PK Matches]
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
         *         description: 获取学生PK统计成功
         */
        this.router.get('/stats/:studentId', auth_middleware_1.authenticateToken, this.getStudentPKStats.bind(this));
        /**
         * @swagger
         * /api/pkmatches/leaderboard:
         *   get:
         *     summary: 获取PK排行榜
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
         *         name: limit
         *         schema:
         *           type: integer
         *           default: 10
         *         description: 返回数量限制
         *     responses:
         *       200:
         *         description: 获取PK排行榜成功
         */
        this.router.get('/leaderboard', auth_middleware_1.authenticateToken, this.getPKLeaderboard.bind(this));
        /**
         * @swagger
         * /api/pkmatches/stats:
         *   get:
         *     summary: 获取PK统计信息
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
         *     responses:
         *       200:
         *         description: 获取PK统计成功
         */
        this.router.get('/stats', auth_middleware_1.authenticateToken, this.getPKStats.bind(this));
    }
    /**
     * 获取PK对战列表
     */
    async getPKMatches(req, res) {
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
            const result = await this.pkMatchService.getPKMatches(query);
            const response = {
                success: true,
                message: '获取PK对战列表成功',
                data: result.matches,
                pagination: result.pagination
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get PK matches error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取PK对战列表失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 获取单个PK对战详情
     */
    async getPKMatchById(req, res) {
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
            const match = await this.pkMatchService.getPKMatchById(id, schoolId);
            const response = {
                success: true,
                message: '获取PK对战详情成功',
                data: match
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get PK match by id error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取PK对战详情失败'
            };
            res.status(error instanceof Error && error.message === 'PK对战不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 创建新PK对战
     */
    async createPKMatch(req, res) {
        try {
            const data = req.body;
            // 验证请求数据
            if (!data.studentA || !data.studentB || !data.topic || !data.schoolId) {
                const response = {
                    success: false,
                    message: '学生A、学生B、对战主题和学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            // 检查不能自己和自己对战
            if (data.studentA === data.studentB) {
                const response = {
                    success: false,
                    message: '学生不能自己与自己对战'
                };
                res.status(400).json(response);
                return;
            }
            const match = await this.pkMatchService.createPKMatch(data);
            const response = {
                success: true,
                message: '创建PK对战成功',
                data: match
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Create PK match error:', error);
            const response = {
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
    async updatePKMatch(req, res) {
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
            const match = await this.pkMatchService.updatePKMatch(data);
            const response = {
                success: true,
                message: '更新PK对战成功',
                data: match
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Update PK match error:', error);
            const response = {
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
    async deletePKMatch(req, res) {
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
            await this.pkMatchService.deletePKMatch(id, schoolId);
            const response = {
                success: true,
                message: '删除PK对战成功'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Delete PK match error:', error);
            const response = {
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
    async getStudentPKStats(req, res) {
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
            const stats = await this.pkMatchService.getStudentPKStats(studentId, schoolId);
            const response = {
                success: true,
                message: '获取学生PK统计成功',
                data: stats
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get student PK stats error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取学生PK统计失败'
            };
            res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 获取PK排行榜
     */
    async getPKLeaderboard(req, res) {
        try {
            const { schoolId, limit = 10 } = req.query;
            if (!schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const leaderboard = await this.pkMatchService.getPKLeaderboard(schoolId, Number(limit));
            const response = {
                success: true,
                message: '获取PK排行榜成功',
                data: leaderboard
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get PK leaderboard error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取PK排行榜失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 获取PK统计信息
     */
    async getPKStats(req, res) {
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
            const stats = await this.pkMatchService.getPKStats(schoolId);
            const response = {
                success: true,
                message: '获取PK统计成功',
                data: stats
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get PK stats error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取PK统计失败'
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
exports.PKMatchRoutes = PKMatchRoutes;
exports.default = PKMatchRoutes;

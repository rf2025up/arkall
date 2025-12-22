"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * 习惯管理相关路由
 */
class HabitRoutes {
    constructor(habitService, authService) {
        this.habitService = habitService;
        this.authService = authService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        /**
         * @swagger
         * /api/habits:
         *   get:
         *     summary: 获取习惯列表
         *     tags: [Habits]
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
         *         description: 获取习惯列表成功
         */
        this.router.get('/', (0, auth_middleware_1.authenticateToken)(this.authService), this.getHabits.bind(this));
        /**
         * @swagger
         * /api/habits/{id}:
         *   get:
         *     summary: 获取单个习惯详情
         *     tags: [Habits]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: 习惯ID
         *       - in: query
         *         name: schoolId
         *         required: true
         *         schema:
         *           type: string
         *         description: 学校ID
         *     responses:
         *       200:
         *         description: 获取习惯详情成功
         */
        this.router.get('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), this.getHabitById.bind(this));
        /**
         * @swagger
         * /api/habits:
         *   post:
         *     summary: 创建新习惯
         *     tags: [Habits]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [name, schoolId, expReward]
         *             properties:
         *               name:
         *                 type: string
         *                 description: 习惯名称
         *               description:
         *                 type: string
         *                 description: 习惯描述
         *               icon:
         *                 type: string
         *                 description: 习惯图标
         *               expReward:
         *                 type: integer
         *                 description: 打卡奖励经验值
         *               pointsReward:
         *                 type: integer
         *                 description: 打卡奖励积分
         *               schoolId:
         *                 type: string
         *                 description: 学校ID
         *     responses:
         *       201:
         *         description: 创建习惯成功
         */
        this.router.post('/', (0, auth_middleware_1.authenticateToken)(this.authService), this.createHabit.bind(this));
        /**
         * @swagger
         * /api/habits/{id}:
         *   put:
         *     summary: 更新习惯信息
         *     tags: [Habits]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: 习惯ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               name:
         *                 type: string
         *                 description: 习惯名称
         *               description:
         *                 type: string
         *                 description: 习惯描述
         *               icon:
         *                 type: string
         *                 description: 习惯图标
         *               expReward:
         *                 type: integer
         *                 description: 打卡奖励经验值
         *               pointsReward:
         *                 type: integer
         *                 description: 打卡奖励积分
         *               isActive:
         *                 type: boolean
         *                 description: 是否启用
         *               schoolId:
         *                 type: string
         *                 description: 学校ID
         *     responses:
         *       200:
         *         description: 更新习惯成功
         */
        this.router.put('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), this.updateHabit.bind(this));
        /**
         * @swagger
         * /api/habits/{id}:
         *   delete:
         *     summary: 删除习惯（软删除）
         *     tags: [Habits]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: 习惯ID
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
         *         description: 删除习惯成功
         */
        this.router.delete('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), this.deleteHabit.bind(this));
        /**
         * @swagger
         * /api/habits/checkin:
         *   post:
         *     summary: 学生习惯打卡
         *     tags: [Habits]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [habitId, studentId, schoolId]
         *             properties:
         *               habitId:
         *                 type: string
         *                 description: 习惯ID
         *               studentId:
         *                 type: string
         *                 description: 学生ID
         *               schoolId:
         *                 type: string
         *                 description: 学校ID
         *               notes:
         *                 type: string
         *                 description: 备注
         *     responses:
         *       201:
         *         description: 打卡成功
         */
        this.router.post('/checkin', (0, auth_middleware_1.authenticateToken)(this.authService), this.checkInHabit.bind(this));
        /**
         * @swagger
         * /api/habits/logs:
         *   get:
         *     summary: 获取习惯打卡记录
         *     tags: [Habits]
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
         *         name: habitId
         *         schema:
         *           type: string
         *         description: 习惯ID
         *       - in: query
         *         name: studentId
         *         schema:
         *           type: string
         *         description: 学生ID
         *       - in: query
         *         name: startDate
         *         schema:
         *           type: string
         *           format: date
         *         description: 开始日期
         *       - in: query
         *         name: endDate
         *         schema:
         *           type: string
         *           format: date
         *         description: 结束日期
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
         *         description: 获取打卡记录成功
         */
        this.router.get('/logs', (0, auth_middleware_1.authenticateToken)(this.authService), this.getHabitLogs.bind(this));
        /**
         * @swagger
         * /api/habits/stats/{studentId}:
         *   get:
         *     summary: 获取学生习惯打卡统计
         *     tags: [Habits]
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
         *         description: 获取学生习惯统计成功
         */
        this.router.get('/stats/:studentId', (0, auth_middleware_1.authenticateToken)(this.authService), this.getStudentHabitStats.bind(this));
        /**
         * @swagger
         * /api/habits/stats:
         *   get:
         *     summary: 获取习惯统计信息
         *     tags: [Habits]
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
         *         description: 获取习惯统计成功
         */
        this.router.get('/stats', (0, auth_middleware_1.authenticateToken)(this.authService), this.getHabitStats.bind(this));
    }
    /**
     * 获取习惯列表
     */
    async getHabits(req, res) {
        try {
            const { schoolId, search, isActive, page, limit } = req.query;
            const query = {
                schoolId: schoolId,
                search: search,
                isActive: isActive === 'true',
                page: page ? parseInt(page) : undefined,
                limit: limit ? parseInt(limit) : undefined,
            };
            if (!schoolId) {
                const response = {
                    success: false,
                    message: '学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const result = await this.habitService.getHabits(query);
            const response = {
                success: true,
                message: '获取习惯列表成功',
                data: result.habits,
                pagination: result.pagination
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get habits error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取习惯列表失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 获取单个习惯详情
     */
    async getHabitById(req, res) {
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
            const habit = await this.habitService.getHabitById(id, schoolId);
            const response = {
                success: true,
                message: '获取习惯详情成功',
                data: habit
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get habit by id error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取习惯详情失败'
            };
            res.status(error instanceof Error && error.message === '习惯不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 创建新习惯
     */
    async createHabit(req, res) {
        try {
            const data = req.body;
            // 验证请求数据
            if (!data.name || !data.schoolId || data.expReward === undefined) {
                const response = {
                    success: false,
                    message: '习惯名称、学校ID和经验奖励不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const habit = await this.habitService.createHabit(data);
            const response = {
                success: true,
                message: '创建习惯成功',
                data: habit
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Create habit error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '创建习惯失败'
            };
            res.status(error instanceof Error && error.message === '习惯名称已存在' ? 409 : 500).json(response);
        }
    }
    /**
     * 更新习惯信息
     */
    async updateHabit(req, res) {
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
            const habit = await this.habitService.updateHabit(data);
            const response = {
                success: true,
                message: '更新习惯成功',
                data: habit
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Update habit error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '更新习惯失败'
            };
            res.status(error instanceof Error && error.message === '习惯名称已存在' ? 409 : 500).json(response);
        }
    }
    /**
     * 删除习惯（软删除）
     */
    async deleteHabit(req, res) {
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
            await this.habitService.deleteHabit(id, schoolId);
            const response = {
                success: true,
                message: '删除习惯成功'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Delete habit error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '删除习惯失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 学生习惯打卡
     */
    async checkInHabit(req, res) {
        try {
            const data = req.body;
            // 验证请求数据
            if (!data.habitId || !data.studentId || !data.schoolId) {
                const response = {
                    success: false,
                    message: '习惯ID、学生ID和学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const result = await this.habitService.checkInHabit(data, req.user?.userId || 'system');
            const response = {
                success: true,
                message: '打卡成功',
                data: result
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Check in habit error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '打卡失败'
            };
            const statusCode = error instanceof Error &&
                ['习惯不存在或已停用', '学生不存在', '今日已打卡，请明天再来'].includes(error.message) ? 400 : 500;
            res.status(statusCode).json(response);
        }
    }
    /**
     * 获取习惯打卡记录
     */
    async getHabitLogs(req, res) {
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
            const result = await this.habitService.getHabitLogs(query);
            const response = {
                success: true,
                message: '获取打卡记录成功',
                data: result.habitLogs,
                pagination: result.pagination
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get habit logs error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取打卡记录失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 获取学生习惯打卡统计
     */
    async getStudentHabitStats(req, res) {
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
            const stats = await this.habitService.getStudentHabitStats(studentId, schoolId);
            const response = {
                success: true,
                message: '获取学生习惯统计成功',
                data: stats
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get student habit stats error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取学生习惯统计失败'
            };
            res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 获取习惯统计信息
     */
    async getHabitStats(req, res) {
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
            const stats = await this.habitService.getHabitStats(schoolId);
            const response = {
                success: true,
                message: '获取习惯统计成功',
                data: stats
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get habit stats error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取习惯统计失败'
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
exports.HabitRoutes = HabitRoutes;
exports.default = HabitRoutes;
//# sourceMappingURL=habit.routes.js.map
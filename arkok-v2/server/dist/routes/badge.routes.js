"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * 勋章管理相关路由
 */
class BadgeRoutes {
    constructor(badgeService, authService) {
        this.badgeService = badgeService;
        this.authService = authService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
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
        this.router.get('/', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.getBadges.bind(this));
        this.router.get('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.getBadgeById.bind(this));
        this.router.post('/', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.createBadge.bind(this));
        this.router.put('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.updateBadge.bind(this));
        this.router.delete('/:id', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.deleteBadge.bind(this));
        this.router.post('/award', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.awardBadge.bind(this));
        this.router.delete('/revoke', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.revokeBadge.bind(this));
        this.router.get('/student/:studentId', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.getStudentBadges.bind(this));
        this.router.get('/available/:studentId', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.getAvailableBadges.bind(this));
        this.router.get('/stats', (0, auth_middleware_1.authenticateToken)(this.authService), auth_middleware_1.validateUser, this.getBadgeStats.bind(this));
    }
    /**
     * 获取勋章列表
     */
    async getBadges(req, res) {
        try {
            const { schoolId, search, category, isActive, page, limit } = req.query;
            const query = {
                schoolId: schoolId,
                search: search,
                category: category,
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
            const result = await this.badgeService.getBadges(query);
            const response = {
                success: true,
                message: '获取勋章列表成功',
                data: result.badges,
                pagination: result.pagination
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get badges error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取勋章列表失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 获取单个勋章详情
     */
    async getBadgeById(req, res) {
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
            const badge = await this.badgeService.getBadgeById(id, schoolId);
            const response = {
                success: true,
                message: '获取勋章详情成功',
                data: badge
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get badge by id error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取勋章详情失败'
            };
            res.status(error instanceof Error && error.message === '勋章不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 创建新勋章
     */
    async createBadge(req, res) {
        try {
            const data = req.body;
            // 验证请求数据
            if (!data.name || !data.category || !data.schoolId) {
                const response = {
                    success: false,
                    message: '勋章名称、类别和学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const badge = await this.badgeService.createBadge(data);
            const response = {
                success: true,
                message: '创建勋章成功',
                data: badge
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Create badge error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '创建勋章失败'
            };
            res.status(error instanceof Error && error.message === '勋章名称已存在' ? 409 : 500).json(response);
        }
    }
    /**
     * 更新勋章信息
     */
    async updateBadge(req, res) {
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
            const badge = await this.badgeService.updateBadge(data);
            const response = {
                success: true,
                message: '更新勋章成功',
                data: badge
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Update badge error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '更新勋章失败'
            };
            res.status(error instanceof Error && error.message === '勋章名称已存在' ? 409 : 500).json(response);
        }
    }
    /**
     * 删除勋章（软删除）
     */
    async deleteBadge(req, res) {
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
            await this.badgeService.deleteBadge(id, schoolId);
            const response = {
                success: true,
                message: '删除勋章成功'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Delete badge error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '删除勋章失败'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 授予学生勋章
     */
    async awardBadge(req, res) {
        try {
            const data = req.body;
            // 验证请求数据
            if (!data.studentId || !data.badgeId || !data.schoolId) {
                const response = {
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
            const response = {
                success: true,
                message: '授予勋章成功',
                data: studentBadge
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Award badge error:', error);
            const response = {
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
    async revokeBadge(req, res) {
        try {
            const { studentId, badgeId, schoolId } = req.body;
            if (!studentId || !badgeId || !schoolId) {
                const response = {
                    success: false,
                    message: '学生ID、勋章ID和学校ID不能为空'
                };
                res.status(400).json(response);
                return;
            }
            await this.badgeService.revokeBadge(studentId, badgeId, schoolId);
            const response = {
                success: true,
                message: '取消勋章成功'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Revoke badge error:', error);
            const response = {
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
    async getStudentBadges(req, res) {
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
            const studentBadges = await this.badgeService.getStudentBadges(studentId, schoolId);
            const response = {
                success: true,
                message: '获取学生勋章列表成功',
                data: studentBadges
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get student badges error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取学生勋章列表失败'
            };
            res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 获取可获得的勋章
     */
    async getAvailableBadges(req, res) {
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
            const availableBadges = await this.badgeService.getAvailableBadges(studentId, schoolId);
            const response = {
                success: true,
                message: '获取可获得的勋章成功',
                data: availableBadges
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get available badges error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取可获得的勋章失败'
            };
            res.status(error instanceof Error && error.message === '学生不存在' ? 404 : 500).json(response);
        }
    }
    /**
     * 获取勋章统计信息
     */
    async getBadgeStats(req, res) {
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
            const stats = await this.badgeService.getBadgeStats(schoolId);
            const response = {
                success: true,
                message: '获取勋章统计成功',
                data: stats
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get badge stats error:', error);
            const response = {
                success: false,
                message: error instanceof Error ? error.message : '获取勋章统计失败'
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
exports.BadgeRoutes = BadgeRoutes;
exports.default = BadgeRoutes;
//# sourceMappingURL=badge.routes.js.map
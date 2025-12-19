"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * 学生管理路由
 */
class StudentRoutes {
    constructor(studentService, authService) {
        this.studentService = studentService;
        this.router = (0, express_1.Router)();
        this.authService = authService;
        this.initializeRoutes();
    }
    initializeRoutes() {
        // 所有路由都需要认证
        this.router.use((0, auth_middleware_1.authenticateToken)(this.authService));
        /**
         * @swagger
         * /api/students:
         *   get:
         *     summary: 获取学生列表
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: className
         *         schema:
         *           type: string
         *         description: 班级筛选
         *       - in: query
         *         name: search
         *         schema:
         *           type: string
         *         description: 搜索关键词（姓名或班级）
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
         *         description: 获取学生列表成功
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "获取学生列表成功"
         *                 data:
         *                   type: object
         *                   properties:
         *                     students:
         *                       type: array
         *                       items:
         *                         type: object
         *                         properties:
         *                           id:
         *                             type: string
         *                           name:
         *                             type: string
         *                           className:
         *                             type: string
         *                           score:
         *                             type: number
         *                           totalExp:
         *                             type: number
         *                           level:
         *                             type: integer
         *                           avatar:
         *                             type: string
         *                     pagination:
         *                       type: object
         *                       properties:
         *                         page:
         *                           type: integer
         *                         limit:
         *                           type: integer
         *                         total:
         *                           type: integer
         *                         totalPages:
         *                           type: integer
         *       401:
         *         description: 用户未认证
         */
        this.router.get('/', this.getStudents.bind(this));
        /**
         * @swagger
         * /api/students/{id}:
         *   get:
         *     summary: 获取单个学生详情
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: 学生ID
         *     responses:
         *       200:
         *         description: 获取学生详情成功
         *       404:
         *         description: 学生不存在
         *       401:
         *         description: 用户未认证
         */
        /**
         * @swagger
         * /api/students/{id}/profile:
         *   get:
         *     summary: 获取学生完整档案（聚合所有相关数据）
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: 学生ID
         *     responses:
         *       200:
         *         description: 获取学生档案成功
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "获取学生档案成功"
         *                 data:
         *                   type: object
         *                   properties:
         *                     student:
         *                       type: object
         *                       description: 学生基础信息
         *                     taskRecords:
         *                       type: array
         *                       description: 任务记录列表
         *                     pkRecords:
         *                       type: array
         *                       description: PK对战记录
         *                     pkStats:
         *                       type: object
         *                       description: PK统计数据
         *                     taskStats:
         *                       type: object
         *                       description: 任务统计数据
         *                     timelineData:
         *                       type: array
         *                       description: 时间轴数据
         *                     summary:
         *                       type: object
         *                       description: 综合统计信息
         *       404:
         *         description: 学生不存在
         *       401:
         *         description: 用户未认证
         */
        this.router.get('/:id/profile', this.getStudentProfile.bind(this));
        /**
         * @swagger
         * /api/students/classes:
         *   get:
         *     summary: 获取班级列表
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: 班级列表
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                 data:
         *                   type: array
         *                   items:
         *                     type: object
         *                     properties:
         *                       className:
         *                         type: string
         *                       studentCount:
         *                         type: integer
         *       401:
         *         description: 用户未认证
         */
        this.router.get('/classes', this.getClasses.bind(this));
        /**
         * @swagger
         * /api/students/{id}:
         *   get:
         *     summary: 获取单个学生详情
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: 学生ID
         *     responses:
         *       200:
         *         description: 获取学生详情成功
         *       404:
         *         description: 学生不存在
         *       401:
         *         description: 用户未认证
         */
        this.router.get('/:id', this.getStudentById.bind(this));
        /**
         * @swagger
         * /api/students:
         *   post:
         *     summary: 创建新学生
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [name, className]
         *             properties:
         *               name:
         *                 type: string
         *                 example: "张三"
         *                 description: 学生姓名
         *               className:
         *                 type: string
         *                 example: "三年级1班"
         *                 description: 班级
         *               avatar:
         *                 type: string
         *                 example: "https://example.com/avatar.jpg"
         *                 description: 头像URL
         *               initialScore:
         *                 type: number
         *                 example: 0
         *                 description: 初始积分
         *               initialExp:
         *                 type: number
         *                 example: 0
         *                 description: 初始经验值
         *     responses:
         *       201:
         *         description: 创建学生成功
         *       400:
         *         description: 请求数据无效
         *       401:
         *         description: 用户未认证
         *       403:
         *         description: 权限不足
         */
        this.router.post('/', auth_middleware_1.requireTeacher, this.createStudent.bind(this));
        /**
         * @swagger
         * /api/students/{id}:
         *   put:
         *     summary: 更新学生信息
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: 学生ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               name:
         *                 type: string
         *                 example: "李四"
         *               className:
         *                 type: string
         *                 example: "三年级2班"
         *               avatar:
         *                 type: string
         *               score:
         *                 type: number
         *               totalExp:
         *                 type: number
         *     responses:
         *       200:
         *         description: 更新学生成功
         *       404:
         *         description: 学生不存在
         *       401:
         *         description: 用户未认证
         *       403:
         *         description: 权限不足
         */
        this.router.put('/:id', auth_middleware_1.requireTeacher, this.updateStudent.bind(this));
        /**
         * @swagger
         * /api/students/{id}:
         *   delete:
         *     summary: 删除学生（软删除）
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: path
         *         name: id
         *         required: true
         *         schema:
         *           type: string
         *         description: 学生ID
         *     responses:
         *       200:
         *         description: 删除学生成功
         *       404:
         *         description: 学生不存在
         *       401:
         *         description: 用户未认证
         *       403:
         *         description: 权限不足
         */
        this.router.delete('/:id', auth_middleware_1.requireAdmin, this.deleteStudent.bind(this));
        /**
         * @swagger
         * /api/students/transfer:
         *   post:
         *     summary: 转班（支持Admin和Teacher）
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [studentIds, targetClassName]
         *             properties:
         *               studentIds:
         *                 type: array
         *                 items:
         *                   type: string
         *                 example: ["student1", "student2"]
         *                 description: 学生ID列表
         *               targetClassName:
         *                 type: string
         *                 example: "三年级1班"
         *                 description: 目标班级名称
         *     responses:
         *       200:
         *         description: 转班成功
         *       400:
         *         description: 请求数据无效
         *       401:
         *         description: 用户未认证
         *       403:
         *         description: 权限不足
         */
        this.router.post('/transfer', auth_middleware_1.requireTeacher, this.transferStudents.bind(this));
        /**
         * @swagger
         * /api/students/score:
         *   post:
         *     summary: 批量添加积分/经验
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [studentIds, points, exp, reason]
         *             properties:
         *               studentIds:
         *                 type: array
         *                 items:
         *                   type: string
         *                 example: ["student1", "student2"]
         *                 description: 学生ID列表
         *               points:
         *                 type: number
         *                 example: 10
         *                 description: 积分变化（正数为增加，负数为扣除）
         *               exp:
         *                 type: number
         *                 example: 50
         *                 description: 经验值变化
         *               reason:
         *                 type: string
         *                 example: "完成作业"
         *                 description: 变化原因
         *               metadata:
         *                 type: object
         *                 description: 额外元数据
         *     responses:
         *       200:
         *         description: 添加积分成功
         *       400:
         *         description: 请求数据无效
         *       401:
         *         description: 用户未认证
         *       403:
         *         description: 权限不足
         */
        this.router.post('/score', auth_middleware_1.requireTeacher, this.addScore.bind(this));
        /**
         * @swagger
         * /api/students/leaderboard:
         *   get:
         *     summary: 获取学生排行榜
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     parameters:
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           default: 10
         *         description: 返回数量限制
         *     responses:
         *       200:
         *         description: 获取排行榜成功
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "获取排行榜成功"
         *                 data:
         *                   type: object
         *                   properties:
         *                     leaderboard:
         *                       type: array
         *                       items:
         *                         type: object
         *                         properties:
         *                           rank:
         *                             type: integer
         *                           id:
         *                             type: string
         *                           name:
         *                             type: string
         *                           className:
         *                             type: string
         *                           score:
         *                             type: number
         *                           totalExp:
         *                             type: number
         *                           level:
         *                             type: integer
         *       401:
         *         description: 用户未认证
         */
        this.router.get('/leaderboard', this.getLeaderboard.bind(this));
        /**
         * @swagger
         * /api/students/stats/class:
         *   get:
         *     summary: 获取班级统计
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: 获取班级统计成功
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 message:
         *                   type: string
         *                   example: "获取班级统计成功"
         *                 data:
         *                   type: object
         *                   properties:
         *                     stats:
         *                       type: array
         *                       items:
         *                         type: object
         *                         properties:
         *                           className:
         *                             type: string
         *                           studentCount:
         *                             type: integer
         *                           totalScore:
         *                             type: number
         *                           totalExp:
         *                             type: number
         *                           averageScore:
         *                             type: number
         *                           averageExp:
         *                             type: number
         *       401:
         *         description: 用户未认证
         */
        this.router.get('/stats/class', this.getClassStats.bind(this));
        /**
         * @swagger
         * /api/students/classes:
         *   get:
         *     summary: 获取班级列表（用于班级切换）
         *     tags: [Students]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: 获取班级列表成功
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: true
         *                 data:
         *                   type: array
         *                   items:
         *                     type: object
         *                     properties:
         *                       className:
         *                         type: string
         *                       studentCount:
         *                         type: integer
         *       401:
         *         description: 用户未认证
         */
          }
    /**
     * 获取学生列表 - 强制重写修复
     */
    async getStudents(req, res) {
        try {
            // --- 在这里注入日志 ---
            console.log("--- [DEBUG] GET /api/students endpoint hit ---");
            console.log("Authenticated User:", req.user); // 检查用户是否被正确识别
            console.log("School ID from user:", req.user?.schoolId);
            console.log("Request query params:", req.query);
            // 🆕 从认证用户获取信息
            const user = req.user;
            const query = {
                schoolId: req.schoolId,
                className: req.query.className,
                search: req.query.search,
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                // 🆕 修复：从认证用户获取teacherId和role
                teacherId: user?.userId || req.query.teacherId,
                scope: req.query.scope,
                userRole: user?.role,
                requesterId: user?.userId
            };
            console.log(`[DEBUG] Query object sent to service:`, query);
            // 🚨 临时调试：添加 teacherId 诊断日志
            if (!query.teacherId) {
                console.log(`[DEBUG] ❌ CRITICAL: teacherId is missing from query!`);
                console.log(`[DEBUG] Available query params:`, Object.keys(req.query));
            }
            else {
                console.log(`[DEBUG] ✅ teacherId is present: ${query.teacherId}`);
            }
            const result = await this.studentService.getStudents(query);
            console.log(`[DEBUG] Service returned:`, result);
            console.log(`[DEBUG] Number of students in result:`, result?.students?.length);
            console.log(`[DEBUG] Students data preview:`, result?.students?.slice(0, 2));
            res.status(200).json({
                success: true,
                message: '获取学生列表成功',
                data: result
            });
            console.log(`[DEBUG] Response sent to frontend successfully`);
            // --- 日志结束 ---
        }
        catch (error) {
            // --- 捕获并打印错误 ---
            console.error("--- [DEBUG] Backend: FAILED to get students! ---", error);
            if (error instanceof Error) {
                console.error("Error stack:", error.stack);
                console.error("Error message:", error.message);
            }
            res.status(500).json({
                success: false,
                message: '获取学生列表过程中发生错误',
                error: error.message
            });
        }
    }
    /**
     * 获取单个学生详情
     */
    async getStudentById(req, res) {
        try {
            const { id } = req.params;
            const student = await this.studentService.getStudentById(id, req.schoolId);
            res.status(200).json({
                success: true,
                message: '获取学生详情成功',
                data: student
            });
        }
        catch (error) {
            console.error('Get student by id error:', error);
            if (error instanceof Error && error.message === '学生不存在') {
                res.status(404).json({
                    success: false,
                    message: '学生不存在'
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: '获取学生详情过程中发生错误'
                });
            }
        }
    }
    /**
     * 获取学生完整档案（聚合所有相关数据）
     */
    async getStudentProfile(req, res) {
        try {
            const { id } = req.params;
            const profile = await this.studentService.getStudentProfile(id, req.schoolId, req.user.role, req.user.userId);
            res.status(200).json({
                success: true,
                message: '获取学生档案成功',
                data: profile
            });
        }
        catch (error) {
            console.error('Get student profile error:', error);
            if (error instanceof Error && error.message === '学生不存在') {
                res.status(404).json({
                    success: false,
                    message: '学生不存在'
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: '获取学生档案过程中发生错误'
                });
            }
        }
    }
    /**
     * 创建新学生 - 强制重写修复
     */
    async createStudent(req, res) {
        try {
            // --- 在这里注入防御性日志 ---
            console.log("--- [BACKEND DEBUG] Received POST /api/students request ---");
            console.log("Request Body:", req.body);
            console.log("Authenticated User:", req.user);
            console.log("School ID from request:", req.schoolId);
            console.log("Request Headers:", req.headers);
            console.log(`🔧 Controller: Creating student with data:`, req.body);
            // 强制要求明确指定 teacherId，不允许降级处理
            if (!req.body.teacherId) {
                return res.status(400).json({
                    success: false,
                    message: '必须指定归属老师 (teacherId)',
                    error: 'teacherId is required'
                });
            }
            const data = {
                name: req.body.name,
                className: req.body.className, // 移除className违宪用法，强制使用正确字段名
                schoolId: req.schoolId,
                teacherId: req.body.teacherId // 🆕 强制要求明确的师生关系
            };
            console.log("Processed data object:", data);
            const student = await this.studentService.createStudent(data);
            return res.status(201).json({
                success: true,
                message: '创建学生成功',
                data: student
            });
        }
        catch (error) {
            console.error('❌ Create student error:', error);
            return res.status(500).json({
                success: false,
                message: '创建学生过程中发生错误',
                error: error.message
            });
        }
    }
    /**
     * 更新学生信息
     */
    async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const data = {
                id,
                schoolId: req.schoolId,
                ...req.body
            };
            const student = await this.studentService.updateStudent(data);
            res.status(200).json({
                success: true,
                message: '更新学生成功',
                data: student
            });
        }
        catch (error) {
            console.error('Update student error:', error);
            res.status(500).json({
                success: false,
                message: '更新学生过程中发生错误'
            });
        }
    }
    /**
     * 删除学生（软删除）
     */
    async deleteStudent(req, res) {
        try {
            const { id } = req.params;
            await this.studentService.deleteStudent(id, req.schoolId);
            res.status(200).json({
                success: true,
                message: '删除学生成功'
            });
        }
        catch (error) {
            console.error('Delete student error:', error);
            res.status(500).json({
                success: false,
                message: '删除学生过程中发生错误'
            });
        }
    }
    /**
     * 🆕 师生关系转移 - 从"转班"升级为"抢人"
     */
    async transferStudents(req, res) {
        try {
            // 🆕 参数变更：从 targetClassName 改为 targetTeacherId
            const { studentIds, targetTeacherId } = req.body;
            const user = req.user;
            if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
                res.status(400).json({
                    success: false,
                    message: '学生ID列表不能为空'
                });
                return;
            }
            if (!targetTeacherId || targetTeacherId.trim() === '') {
                res.status(400).json({
                    success: false,
                    message: '目标老师ID不能为空'
                });
                return;
            }
            // 🆕 调用新的师生关系转移方法
            const result = await this.studentService.transferStudents(studentIds, targetTeacherId.trim(), req.schoolId, user.username);
            res.status(200).json({
                success: true,
                message: `成功将 ${result.length} 名学生移入老师名下`,
                data: result
            });
        }
        catch (error) {
            console.error('Transfer students error:', error);
            res.status(500).json({
                success: false,
                message: '师生关系转移过程中发生错误'
            });
        }
    }
    /**
     * 批量添加积分/经验
     */
    async addScore(req, res) {
        try {
            const data = {
                ...req.body,
                schoolId: req.schoolId
            };
            const updatedStudents = await this.studentService.addScore(data, req.user.username);
            res.status(200).json({
                success: true,
                message: '添加积分成功',
                data: updatedStudents
            });
        }
        catch (error) {
            console.error('Add score error:', error);
            if (error instanceof Error && error.message.includes('学生不存在')) {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: '添加积分过程中发生错误'
                });
            }
        }
    }
    /**
     * 获取学生排行榜
     */
    async getLeaderboard(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const leaderboard = await this.studentService.getLeaderboard(req.schoolId, limit);
            res.status(200).json({
                success: true,
                message: '获取排行榜成功',
                data: leaderboard
            });
        }
        catch (error) {
            console.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: '获取排行榜过程中发生错误'
            });
        }
    }
    /**
     * 获取班级统计
     */
    async getClassStats(req, res) {
        try {
            const stats = await this.studentService.getClassStats(req.schoolId);
            res.status(200).json({
                success: true,
                message: '获取班级统计成功',
                data: stats
            });
        }
        catch (error) {
            console.error('Get class stats error:', error);
            res.status(500).json({
                success: false,
                message: '获取班级统计过程中发生错误'
            });
        }
    }
    /**
     * 获取班级列表（用于班级切换）
     */
    async getClasses(req, res) {
        try {
            // 🆕 从认证用户获取schoolId，而不是从req.schoolId
            const user = req.user;
            console.log('[DEBUG] getClasses - User:', user);
            if (!user || !user.schoolId) {
                console.error('[ERROR] getClasses - No user or schoolId found');
                res.status(400).json({
                    success: false,
                    message: '用户信息不完整'
                });
                return;
            }
            console.log('[DEBUG] getClasses - SchoolId:', user.schoolId);
            const classes = await this.studentService.getClasses(user.schoolId);
            res.status(200).json({
                success: true,
                message: '获取班级列表成功',
                data: classes
            });
        }
        catch (error) {
            console.error('Get classes error:', error);
            res.status(500).json({
                success: false,
                message: '获取班级列表过程中发生错误'
            });
        }
    }
    /**
     * 获取路由器实例
     */
    getRoutes() {
        return this.router;
    }
}
exports.StudentRoutes = StudentRoutes;
exports.default = StudentRoutes;
//# sourceMappingURL=student.routes.js.map
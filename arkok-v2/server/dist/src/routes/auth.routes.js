"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
/**
 * 认证相关路由
 */
class AuthRoutes {
    constructor(authService) {
        this.authService = authService;
        this.router = (0, express_1.Router)();
        this.initializeRoutes();
    }
    initializeRoutes() {
        /**
         * @swagger
         * /api/auth/login:
         *   post:
         *     summary: 用户登录
         *     tags: [Authentication]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [username, password]
         *             properties:
         *               username:
         *                 type: string
         *                 example: admin
         *                 description: 用户名
         *               password:
         *                 type: string
         *                 example: "123456"
         *                 description: 密码
         *     responses:
         *       200:
         *         description: 登录成功
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
         *                   example: "登录成功"
         *                 data:
         *                   type: object
         *                   properties:
         *                     user:
         *                       type: object
         *                       properties:
         *                         userId:
         *                           type: string
         *                         username:
         *                           type: string
         *                         email:
         *                           type: string
         *                         role:
         *                           type: string
         *                         schoolId:
         *                           type: string
         *                         schoolName:
         *                           type: string
         *                     token:
         *                       type: string
         *                     expiresIn:
         *                       type: number
         *       401:
         *         description: 登录失败
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                   example: false
         *                 message:
         *                   type: string
         *                   example: "用户名或密码错误"
         *                 code:
         *                   type: string
         *                   example: "INVALID_CREDENTIALS"
         */
        this.router.post('/login', this.login.bind(this));
        /**
         * @swagger
         * /api/auth/refresh:
         *   post:
         *     summary: 刷新令牌
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [token]
         *             properties:
         *               token:
         *                 type: string
         *                 description: 旧的 JWT 令牌
         *     responses:
         *       200:
         *         description: 令牌刷新成功
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
         *                   example: "令牌刷新成功"
         *                 data:
         *                   type: object
         *                   properties:
         *                     user:
         *                       type: object
         *                     token:
         *                       type: string
         *                     expiresIn:
         *                       type: number
         *       401:
         *         description: 令牌无效
         */
        this.router.post('/refresh', this.refreshToken.bind(this));
        /**
         * @swagger
         * /api/auth/verify:
         *   post:
         *     summary: 验证令牌
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             required: [token]
         *             properties:
         *               token:
         *                 type: string
         *                 description: JWT 令牌
         *     responses:
         *       200:
         *         description: 令牌有效
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
         *                   example: "令牌有效"
         *                 data:
         *                   type: object
         *                   properties:
         *                     user:
         *                       type: object
         *                     valid:
         *                       type: boolean
         *                       example: true
         *       401:
         *         description: 令牌无效
         */
        this.router.post('/verify', this.verifyToken.bind(this));
        /**
         * @swagger
         * /api/auth/me:
         *   get:
         *     summary: 获取当前用户信息
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: 获取用户信息成功
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
         *                   example: "获取用户信息成功"
         *                 data:
         *                   type: object
         *                   properties:
         *                     user:
         *                       type: object
         *       401:
         *         description: 用户未认证
         */
        this.router.get('/me', (0, auth_middleware_1.authenticateToken)(this.authService), this.getCurrentUser.bind(this));
        /**
         * @swagger
         * /api/auth/logout:
         *   post:
         *     summary: 用户登出
         *     tags: [Authentication]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: 登出成功
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
         *                   example: "登出成功"
         */
        this.router.post('/logout', (0, auth_middleware_1.authenticateToken)(this.authService), this.logout.bind(this));
    }
    /**
     * 用户登录
     */
    async login(req, res) {
        try {
            const loginData = req.body;
            // 验证请求数据
            if (!loginData.username || !loginData.password) {
                const response = {
                    success: false,
                    message: '用户名和密码不能为空'
                };
                res.status(400).json(response);
                return;
            }
            // 调用认证服务
            const authResult = await this.authService.login(loginData);
            if (authResult.success && authResult.user && authResult.token) {
                const response = {
                    success: true,
                    message: '登录成功',
                    user: authResult.user,
                    token: authResult.token,
                    expiresIn: authResult.expiresIn,
                    data: {
                        user: authResult.user,
                        token: authResult.token,
                        expiresIn: authResult.expiresIn
                    }
                };
                res.status(200).json(response);
            }
            else {
                const response = {
                    success: false,
                    message: authResult.message || '登录失败'
                };
                res.status(401).json(response);
            }
        }
        catch (error) {
            console.error('Login error:', error);
            const response = {
                success: false,
                message: '登录过程中发生错误'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 刷新令牌
     */
    async refreshToken(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                const response = {
                    success: false,
                    message: '令牌不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const refreshResult = await this.authService.refreshToken(token);
            if (refreshResult.success && refreshResult.user && refreshResult.token) {
                const response = {
                    success: true,
                    message: '令牌刷新成功',
                    user: refreshResult.user,
                    token: refreshResult.token,
                    expiresIn: refreshResult.expiresIn,
                    data: {
                        user: refreshResult.user,
                        token: refreshResult.token,
                        expiresIn: refreshResult.expiresIn
                    }
                };
                res.status(200).json(response);
            }
            else {
                const response = {
                    success: false,
                    message: refreshResult.message || '令牌刷新失败'
                };
                res.status(401).json(response);
            }
        }
        catch (error) {
            console.error('Token refresh error:', error);
            const response = {
                success: false,
                message: '令牌刷新过程中发生错误'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 验证令牌
     */
    async verifyToken(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                const response = {
                    success: false,
                    message: '令牌不能为空'
                };
                res.status(400).json(response);
                return;
            }
            const user = this.authService.verifyToken(token);
            if (user) {
                const response = {
                    success: true,
                    message: '令牌有效',
                    data: {
                        user,
                        valid: true
                    }
                };
                res.status(200).json(response);
            }
            else {
                const response = {
                    success: false,
                    message: '令牌无效或已过期'
                };
                res.status(401).json(response);
            }
        }
        catch (error) {
            console.error('Token verification error:', error);
            const response = {
                success: false,
                message: '令牌验证过程中发生错误'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 获取当前用户信息
     */
    async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                const response = {
                    success: false,
                    message: '用户未认证'
                };
                res.status(401).json(response);
                return;
            }
            const response = {
                success: true,
                message: '获取用户信息成功',
                user: req.user,
                data: {
                    user: req.user
                }
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Get current user error:', error);
            const response = {
                success: false,
                message: '获取用户信息过程中发生错误'
            };
            res.status(500).json(response);
        }
    }
    /**
     * 用户登出
     */
    async logout(req, res) {
        try {
            // 在实际应用中，可以在这里将令牌加入黑名单
            // 目前只是返回成功响应
            const response = {
                success: true,
                message: '登出成功'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Logout error:', error);
            const response = {
                success: false,
                message: '登出过程中发生错误'
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
exports.AuthRoutes = AuthRoutes;
exports.default = AuthRoutes;
//# sourceMappingURL=auth.routes.js.map
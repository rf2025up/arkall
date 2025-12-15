"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'arkok-v2-super-secret-jwt-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 用户登录验证
     */
    async login(loginData) {
        const { username, password } = loginData;
        try {
            // 硬编码的用户验证（临时实现）
            if (username === 'admin' && password === '123456') {
                // 查找或创建默认用户
                let user = await this.prisma.teacher.findFirst({
                    where: { username },
                    include: {
                        school: true
                    }
                });
                if (!user) {
                    // 如果用户不存在，创建默认用户
                    // 首先查找或创建默认学校
                    let school = await this.prisma.school.findFirst({
                        where: { name: 'Default Migration School' }
                    });
                    if (!school) {
                        school = await this.prisma.school.create({
                            data: {
                                name: 'Default Migration School',
                                planType: 'FREE',
                                isActive: true
                            }
                        });
                    }
                    // 创建默认用户
                    user = await this.prisma.teacher.create({
                        data: {
                            username,
                            password: '123456', // 实际应用中应该加密
                            name: '管理员',
                            email: 'admin@arkok.com',
                            role: 'ADMIN',
                            schoolId: school.id
                        },
                        include: {
                            school: true
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
                const token = jwt.sign({
                    userId: user.id,
                    username: user.username,
                    name: user.name,
                    displayName: user.displayName,
                    email: user.email,
                    role: user.role,
                    schoolId: user.schoolId,
                    schoolName: user.school?.name,
                    primaryClassName: user.primaryClassName
                }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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
                        schoolName: user.school?.name || undefined,
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
        }
        catch (error) {
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
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
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
        }
        catch (error) {
            console.error('Token verification error:', error);
            return null;
        }
    }
    /**
     * 解析过期时间为秒数
     */
    parseExpiresIn(expiresIn) {
        if (expiresIn.endsWith('d')) {
            const days = parseInt(expiresIn.slice(0, -1));
            return days * 24 * 60 * 60;
        }
        else if (expiresIn.endsWith('h')) {
            const hours = parseInt(expiresIn.slice(0, -1));
            return hours * 60 * 60;
        }
        else if (expiresIn.endsWith('m')) {
            const minutes = parseInt(expiresIn.slice(0, -1));
            return minutes * 60;
        }
        else if (expiresIn.endsWith('s')) {
            return parseInt(expiresIn.slice(0, -1));
        }
        // 默认返回 7 天的秒数
        return 7 * 24 * 60 * 60;
    }
    /**
     * 刷新令牌
     */
    async refreshToken(oldToken) {
        try {
            const decoded = jwt.verify(oldToken, JWT_SECRET, { ignoreExpiration: true });
            if (!decoded.userId || !decoded.schoolId) {
                return {
                    success: false,
                    message: '无效的令牌'
                };
            }
            // 验证用户是否仍然存在
            const user = await this.prisma.teacher.findFirst({
                where: { id: decoded.userId },
                include: {
                    school: true
                }
            });
            if (!user) {
                return {
                    success: false,
                    message: '用户不存在或已被禁用'
                };
            }
            // 生成新的令牌
            const newToken = jwt.sign({
                userId: user.id,
                username: user.username,
                name: user.name,
                displayName: user.displayName,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
                schoolName: user.school?.name,
                primaryClassName: user.primaryClassName
            }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
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
                    schoolName: user.school?.name || undefined,
                    primaryClassName: user.primaryClassName || undefined
                },
                token: newToken,
                expiresIn
            };
        }
        catch (error) {
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
    async register(userData) {
        // 预留注册功能的实现
        return {
            success: false,
            message: '注册功能暂未开放'
        };
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;

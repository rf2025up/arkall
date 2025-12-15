"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authLogger = exports.validateUser = exports.requireTeacher = exports.requireAdmin = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
/**
 * 认证中间件工厂函数
 */
const authenticateToken = (authService) => {
    return (req, res, next) => {
        console.log(`🔐 [AUTH_MIDDLEWARE] Processing ${req.method} ${req.path}`);
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        console.log(`🔐 [AUTH_MIDDLEWARE] Token found: ${!!token}, Length: ${token ? token.length : 0}`);
        if (!token) {
            console.log(`❌ [AUTH_MIDDLEWARE] No token provided`);
            res.status(401).json({
                success: false,
                message: '访问令牌缺失',
                code: 'TOKEN_MISSING'
            });
            return;
        }
        // 验证令牌
        const user = authService.verifyToken(token);
        console.log(`🔐 [AUTH_MIDDLEWARE] Token verification result: ${!!user}`);
        if (!user) {
            console.log(`❌ [AUTH_MIDDLEWARE] Invalid token`);
            res.status(401).json({
                success: false,
                message: '无效的访问令牌',
                code: 'TOKEN_INVALID'
            });
            return;
        }
        // 将用户信息附加到请求对象
        req.user = user;
        req.schoolId = user.schoolId;
        console.log(`✅ [AUTH_MIDDLEWARE] User authenticated: ${user.username} (${user.role})`);
        next();
    };
};
exports.authenticateToken = authenticateToken;
/**
 * 可选认证中间件（令牌存在时验证，不存在时继续）
 */
const optionalAuth = (authService) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const user = authService.verifyToken(token);
            if (user) {
                req.user = user;
                req.schoolId = user.schoolId;
            }
        }
        next();
    };
};
exports.optionalAuth = optionalAuth;
/**
 * 角色检查中间件
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: '用户未认证',
                code: 'USER_NOT_AUTHENTICATED'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: '权限不足',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: roles,
                current: req.user.role
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
/**
 * 管理员权限检查中间件
 */
exports.requireAdmin = (0, exports.requireRole)(['ADMIN']);
/**
 * 教师权限检查中间件
 */
exports.requireTeacher = (0, exports.requireRole)(['ADMIN', 'TEACHER']);
/**
 * 用户信息验证中间件
 */
const validateUser = (req, res, next) => {
    if (!req.user || !req.schoolId) {
        res.status(401).json({
            success: false,
            message: '用户信息无效',
            code: 'INVALID_USER_INFO'
        });
        return;
    }
    // 验证用户是否属于请求的学校ID（如果URL中包含学校ID）
    const urlSchoolId = req.params.schoolId || req.query.schoolId;
    if (urlSchoolId && urlSchoolId !== req.schoolId) {
        res.status(403).json({
            success: false,
            message: '无权访问指定学校的数据',
            code: 'SCHOOL_MISMATCH',
            userSchoolId: req.schoolId,
            requestedSchoolId: urlSchoolId
        });
        return;
    }
    next();
};
exports.validateUser = validateUser;
/**
 * 请求日志中间件（包含用户信息）
 */
const authLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const userInfo = req.user ? `${req.user.username}(${req.user.role})` : 'Anonymous';
    const schoolInfo = req.schoolId ? `School:${req.schoolId}` : 'NoSchool';
    console.log(`[${timestamp}] ${req.method} ${req.path} - User: ${userInfo} - ${schoolInfo}`);
    next();
};
exports.authLogger = authLogger;
exports.default = {
    authenticateToken: exports.authenticateToken,
    optionalAuth: exports.optionalAuth,
    requireRole: exports.requireRole,
    requireAdmin: exports.requireAdmin,
    requireTeacher: exports.requireTeacher,
    validateUser: exports.validateUser,
    authLogger: exports.authLogger
};
//# sourceMappingURL=auth.middleware.js.map
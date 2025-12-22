import { Router, Request, Response, NextFunction } from 'express';
import { parentService } from '../services/parent.service';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'arkok-family-secret';
const TEACHER_JWT_SECRET = process.env.JWT_SECRET || 'arkok-v2-secret';

// 教师端认证中间件（简化版，从请求中验证 JWT）
const authenticateTeacher = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '请先登录' });
    }

    try {
        const decoded = jwt.verify(token, TEACHER_JWT_SECRET) as any;
        (req as any).user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
};

// ==================== 认证相关（无需Token） ====================

/**
 * 家长登录
 * POST /api/parent/auth/login
 */
router.post('/auth/login', async (req: Request, res: Response) => {
    try {
        const { phone, password, schoolId } = req.body;

        if (!phone || !schoolId) {
            return res.status(400).json({ error: '请输入手机号' });
        }

        const result = await parentService.login(phone, password || '0000', schoolId);
        res.json(result);
    } catch (error: any) {
        console.error('[Parent Login Error]', error.message);
        res.status(401).json({ error: error.message });
    }
});

/**
 * 通过邀请码绑定孩子
 * POST /api/parent/auth/bind
 */
router.post('/auth/bind', async (req: Request, res: Response) => {
    try {
        const { phone, inviteCode, schoolId, studentName, name, identity } = req.body;

        if (!phone || !inviteCode || !schoolId || !studentName) {
            return res.status(400).json({ error: '请提供手机号、学生姓名和邀请码' });
        }

        const result = await parentService.bindByInviteCode(
            phone,
            inviteCode,
            schoolId,
            studentName,
            name,
            identity
        );
        res.json(result);
    } catch (error: any) {
        console.error('[Parent Bind Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

// ==================== 家长端认证中间件 ====================

const authenticateParent = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '请先登录' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.type !== 'parent') {
            return res.status(403).json({ error: '无效的访问令牌' });
        }
        (req as any).parent = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: '登录已过期，请重新登录' });
    }
};

// ==================== 时间轴相关 ====================

/**
 * 获取今日动态
 * GET /api/parent/timeline/:studentId/today
 */
router.get('/timeline/:studentId/today', authenticateParent, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const parentId = (req as any).parent.id;

        const result = await parentService.getTodayTimeline(studentId, parentId);
        res.json(result);
    } catch (error: any) {
        console.error('[Timeline Error]', error.message);
        res.status(403).json({ error: error.message });
    }
});

/**
 * 获取历史动态
 * GET /api/parent/timeline/:studentId/history
 */
router.get('/timeline/:studentId/history', authenticateParent, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const { page = '1', limit = '10' } = req.query;
        const parentId = (req as any).parent.id;

        const result = await parentService.getHistoryTimeline(
            studentId,
            parentId,
            parseInt(page as string),
            parseInt(limit as string)
        );
        res.json(result);
    } catch (error: any) {
        console.error('[History Error]', error.message);
        res.status(403).json({ error: error.message });
    }
});

// ==================== 反馈相关 ====================

/**
 * 点赞
 * POST /api/parent/feedback/like
 */
router.post('/feedback/like', authenticateParent, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.body;
        const parentId = (req as any).parent.id;

        const result = await parentService.likeToday(studentId, parentId);
        res.json(result);
    } catch (error: any) {
        console.error('[Like Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

/**
 * 留言
 * POST /api/parent/feedback/comment
 */
router.post('/feedback/comment', authenticateParent, async (req: Request, res: Response) => {
    try {
        const { studentId, comment } = req.body;
        const parentId = (req as any).parent.id;

        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ error: '留言内容不能为空' });
        }

        const result = await parentService.sendComment(studentId, parentId, comment);
        res.json(result);
    } catch (error: any) {
        console.error('[Comment Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

// ==================== 成长档案 ====================

/**
 * 获取成长档案数据
 * GET /api/parent/growth/:studentId
 */
router.get('/growth/:studentId', authenticateParent, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const parentId = (req as any).parent.id;

        const result = await parentService.getGrowthProfile(studentId, parentId);
        res.json(result);
    } catch (error: any) {
        console.error('[Growth Profile Error]', error.message);
        res.status(403).json({ error: error.message });
    }
});

// ==================== 教师端辅助接口 ====================


/**
 * 生成邀请码（教师端调用）
 * POST /api/parent/invite/generate
 */
router.post('/invite/generate', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.body;

        if (!studentId) {
            return res.status(400).json({ error: '请提供学生ID' });
        }

        const result = await parentService.generateInviteCode(studentId);
        res.json(result);
    } catch (error: any) {
        console.error('[Invite Generate Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

/**
 * 获取学生的家长列表（教师端调用）
 * GET /api/parent/students/:studentId/parents
 */
router.get('/students/:studentId/parents', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const result = await parentService.getStudentParents(studentId);
        res.json(result);
    } catch (error: any) {
        console.error('[Get Parents Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

/**
 * 解除家长绑定（教师端调用）
 * DELETE /api/parent/bindings/:bindingId
 */
router.delete('/bindings/:bindingId', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { bindingId } = req.params;
        const result = await parentService.unbindParent(bindingId);
        res.json(result);
    } catch (error: any) {
        console.error('[Unbind Parent Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

/**
 * 获取家校反馈列表（教师端调用）
 * GET /api/parent/feedbacks
 */
router.get('/feedbacks', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const schoolId = (req as any).user?.schoolId;
        const { unreadOnly } = req.query;

        if (!schoolId) {
            return res.status(400).json({ error: '无法获取学校信息' });
        }

        const result = await parentService.getTeacherFeedbacks(schoolId, unreadOnly === 'true');
        res.json(result);
    } catch (error: any) {
        console.error('[Get Feedbacks Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

/**
 * 标记反馈已读
 * POST /api/parent/feedbacks/:id/read
 */
router.post('/feedbacks/:id/read', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await parentService.markFeedbackRead(id);
        res.json(result);
    } catch (error: any) {
        console.error('[Mark Read Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

/**
 * 全部标记已读
 * POST /api/parent/feedbacks/read-all
 */
router.post('/feedbacks/read-all', authenticateTeacher, async (req: Request, res: Response) => {
    try {
        const schoolId = (req as any).user?.schoolId;

        if (!schoolId) {
            return res.status(400).json({ error: '无法获取学校信息' });
        }

        const result = await parentService.markAllFeedbacksRead(schoolId);
        res.json(result);
    } catch (error: any) {
        console.error('[Mark All Read Error]', error.message);
        res.status(400).json({ error: error.message });
    }
});

export default router;

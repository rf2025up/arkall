/**
 * 五维内功修炼系统 - API 路由
 */

import { Router, Request, Response } from 'express';
import { skillService } from '../services/skill.service';
import AuthService from '../services/auth.service';
import { authenticateToken, requireTeacher } from '../middleware/auth.middleware';

export class SkillRoutes {
    private router: Router;

    constructor(private authService: AuthService) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // 应用认证中间件
        // 注意：某些公开接口可能不需要认证，但在当前系统中，通常都需要
        // 如果有公开接口，可以把它放在 authenticateToken 之前

        // 1. 获取技能库列表 (可能公开，或需登录)
        // 暂定需登录
        this.router.get('/library', authenticateToken(this.authService), async (req: Request, res: Response) => {
            try {
                const skills = await skillService.getSkillLibrary();
                res.json({ success: true, data: skills });
            } catch (error: any) {
                console.error('[Get Skill Library Error]', error.message);
                res.status(400).json({ error: error.message });
            }
        });

        // 2. 获取学生五维属性
        this.router.get('/student/:studentId/stats', authenticateToken(this.authService), async (req: Request, res: Response) => {
            try {
                const { studentId } = req.params;
                const stats = await skillService.getStudentStats(studentId);
                res.json({ success: true, data: stats });
            } catch (error: any) {
                console.error('[Get Student Stats Error]', error.message);
                res.status(400).json({ error: error.message });
            }
        });

        // 3. 获取学生技能列表及进度
        this.router.get('/student/:studentId/skills', authenticateToken(this.authService), async (req: Request, res: Response) => {
            try {
                const { studentId } = req.params;
                const skills = await skillService.getStudentSkills(studentId);
                res.json({ success: true, data: skills });
            } catch (error: any) {
                console.error('[Get Student Skills Error]', error.message);
                res.status(400).json({ error: error.message });
            }
        });

        // 4. 教师认证技能（单个）- 需教师权限
        this.router.post('/certify',
            authenticateToken(this.authService),
            requireTeacher,
            async (req: Request, res: Response) => {
                try {
                    const { studentId, skillCode, taskId, note } = req.body;
                    const teacherId = (req as any).user?.id || (req as any).user?.userId;

                    if (!studentId || !skillCode) {
                        return res.status(400).json({ error: '缺少必填参数' });
                    }

                    const result = await skillService.recordPractice({
                        studentId,
                        skillCode,
                        certifiedBy: teacherId,
                        taskId,
                        note
                    });

                    res.json(result);
                } catch (error: any) {
                    console.error('[Certify Skill Error]', error.message);
                    res.status(400).json({ error: error.message });
                }
            });

        // 5. 教师批量认证技能 - 需教师权限
        this.router.post('/batch-certify',
            authenticateToken(this.authService),
            requireTeacher,
            async (req: Request, res: Response) => {
                try {
                    const { studentId, skillCodes, taskId } = req.body;
                    const teacherId = (req as any).user?.id || (req as any).user?.userId;

                    if (!studentId || !skillCodes || !Array.isArray(skillCodes)) {
                        return res.status(400).json({ error: '缺少必填参数' });
                    }

                    const results = await skillService.batchCertify({
                        studentId,
                        skillCodes,
                        certifiedBy: teacherId,
                        taskId
                    });

                    res.json({ success: true, results });
                } catch (error: any) {
                    console.error('[Batch Certify Error]', error.message);
                    res.status(400).json({ error: error.message });
                }
            });
    }

    public getRoutes(): Router {
        return this.router;
    }
}

export default SkillRoutes;

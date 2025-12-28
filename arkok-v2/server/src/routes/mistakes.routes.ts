import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import AuthService from '../services/auth.service';
import { authenticateToken } from '../middleware/auth.middleware';

/**
 * 错题管理路由 (V5.0 - 轻量级设计)
 * 只记录页码+题号，支持错因标签
 */
export class MistakesRoutes {
  private router: Router;
  private prisma: PrismaClient;

  constructor(private authService: AuthService, prisma: PrismaClient) {
    this.router = Router();
    this.prisma = prisma;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // 应用认证中间件
    this.router.use(authenticateToken(this.authService));

    // 获取学生错题列表（支持按科目/课程节点过滤）
    this.router.get('/:studentId', async (req, res) => {
      try {
        const { studentId } = req.params;
        const { subject, unit, lesson } = req.query;

        const where: any = { studentId };
        if (subject) where.subject = subject as string;
        if (unit) where.unit = unit as string;
        if (lesson) where.lesson = lesson as string;

        const mistakes = await this.prisma.mistakes.findMany({
          where,
          orderBy: [
            { unit: 'desc' },
            { lesson: 'desc' },
            { createdAt: 'desc' }
          ]
        });

        res.json({ success: true, data: mistakes });
      } catch (error) {
        console.error('❌ 获取错题列表失败:', error);
        res.status(500).json({ success: false, message: '获取错题列表失败' });
      }
    });

    // 创建错题记录
    this.router.post('/', async (req, res) => {
      try {
        const { studentId, schoolId, subject, unit, lesson, workbookPage, questionNo, errorCause, workbookType, notes } = req.body;

        if (!studentId || !workbookPage || !questionNo) {
          return res.status(400).json({ success: false, message: '缺少必填字段' });
        }

        const mistake = await this.prisma.mistakes.create({
          data: {
            studentId,
            schoolId,
            subject: subject || '',
            unit: unit || '',
            lesson: lesson || '',
            workbookPage: parseInt(workbookPage),
            questionNo: parseInt(questionNo),
            errorCause: errorCause || '',
            category: workbookType || '',  // 使用 category 存储作业类别
            notes: notes || '',
            wrongCount: 1,
            retryCount: 0
          }
        });

        res.json({ success: true, data: mistake, message: '错题记录成功' });
      } catch (error) {
        console.error('❌ 创建错题失败:', error);
        res.status(500).json({ success: false, message: '创建错题失败' });
      }
    });

    // 记录重做（增加 retryCount）
    this.router.patch('/:id/retry', async (req, res) => {
      try {
        const { id } = req.params;

        const mistake = await this.prisma.mistakes.update({
          where: { id },
          data: {
            retryCount: { increment: 1 },
            lastRetryAt: new Date(),
            status: 'REVIEWING'
          }
        });

        res.json({ success: true, data: mistake, message: '重做记录成功' });
      } catch (error) {
        console.error('❌ 记录重做失败:', error);
        res.status(500).json({ success: false, message: '记录重做失败' });
      }
    });

    // 标记掌握
    this.router.patch('/:id/master', async (req, res) => {
      try {
        const { id } = req.params;

        const mistake = await this.prisma.mistakes.update({
          where: { id },
          data: {
            status: 'RESOLVED'
          }
        });

        res.json({ success: true, data: mistake, message: '已标记掌握' });
      } catch (error) {
        console.error('❌ 标记掌握失败:', error);
        res.status(500).json({ success: false, message: '标记掌握失败' });
      }
    });

    // 删除错题
    this.router.delete('/:id', async (req, res) => {
      try {
        const { id } = req.params;

        await this.prisma.mistakes.delete({ where: { id } });

        res.json({ success: true, message: '删除成功' });
      } catch (error) {
        console.error('❌ 删除错题失败:', error);
        res.status(500).json({ success: false, message: '删除错题失败' });
      }
    });
  }

  public getRoutes(): Router {
    return this.router;
  }
}
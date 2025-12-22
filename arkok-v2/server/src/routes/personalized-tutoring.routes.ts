import { Router, Response } from 'express';
import ExcelJS from 'exceljs';
import { PersonalizedTutoringService } from '../services/personalized-tutoring.service';
import { AuthService } from '../services/auth.service';
import { authenticateToken, validateUser, requireTeacher } from '../middleware/auth.middleware';

export class PersonalizedTutoringRoutes {
  constructor(
    private tutoringService: PersonalizedTutoringService,
    private authService: AuthService
  ) { }

  getRoutes(): Router {
    const router = Router();

    // 挂载路由
    router.get('/', authenticateToken(this.authService), requireTeacher, async (req: any, res) => {
      try {
        const { teacherId } = req.user;
        const { status, dateRange, studentId, subject, limit = 50, offset = 0, sortBy = 'scheduledDate', sortOrder = 'asc' } = req.query;

        const plans = await this.tutoringService.getTeacherTutoringPlans(teacherId as string, {
          status: status as string,
          dateRange: dateRange ? {
            start: (dateRange as any).start,
            end: (dateRange as any).end
          } : undefined,
          studentId: studentId as string,
          subject: subject as string,
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0,
          sortBy: sortBy as 'scheduledDate' | 'createdAt' | 'status',
          sortOrder: sortOrder as 'asc' | 'desc'
        });

        res.json({ success: true, data: plans });
      } catch (error) {
        console.error('获取1v1教学计划列表失败:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // 创建1v1教学计划
    router.post('/', authenticateToken(this.authService), requireTeacher, async (req: any, res) => {
      try {
        const { teacherId, schoolId } = req.user;
        const tutoringData = {
          ...req.body,
          teacherId,
          schoolId
        };

        const plan = await this.tutoringService.createPersonalizedTutoringPlan(tutoringData);

        res.json({ success: true, data: plan });
      } catch (error) {
        console.error('创建1v1教学计划失败:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // 更新教学计划状态
    router.patch('/:id/status', authenticateToken(this.authService), requireTeacher, async (req: any, res) => {
      try {
        const { teacherId } = req.user;
        const { id } = req.params;
        const updates = req.body;

        const plan = await this.tutoringService.updateTutoringPlanStatus(id, teacherId as string, updates);

        res.json({ success: true, data: plan });
      } catch (error) {
        console.error('更新1v1教学计划状态失败:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // 删除教学计划
    router.delete('/:id', authenticateToken(this.authService), requireTeacher, async (req: any, res) => {
      try {
        const { teacherId } = req.user;
        const { id } = req.params;

        await this.tutoringService.deleteTutoringPlan(id, teacherId as string);

        res.json({ success: true });
      } catch (error) {
        console.error('删除1v1教学计划失败:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
      }
    });

    // 下载1v1教学记录表Excel
    router.get('/download-record', authenticateToken(this.authService), requireTeacher, async (req: any, res) => {
      try {
        const { teacherId, schoolId } = req.user;
        const { startDate, endDate } = req.query;

        const records = await this.tutoringService.getTeacherTutoringRecordsForDownload({
          teacherId,
          schoolId,
          startDate: startDate as string,
          endDate: endDate as string
        });

        const workbook = await this.generateTutoringRecordsExcel(records);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        const fileName = `1v1教学记录表_${req.user.displayName || req.user.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);

        await workbook.xlsx.write(res);
        res.end();

      } catch (error) {
        console.error('下载1v1教学记录表失败:', error);
        res.status(500).json({ success: false, error: '下载失败，请稍后重试' });
      }
    });

    return router;
  }

  private async generateTutoringRecordsExcel(records: any[]): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    // 1. 总览工作表
    const overviewSheet = workbook.addWorksheet('总览统计');
    overviewSheet.columns = [
      { header: '统计项目', key: 'item', width: 20 },
      { header: '数值', key: 'value', width: 15 },
      { header: '说明', key: 'description', width: 30 }
    ];

    const stats = {
      totalPlans: records.length,
      completedPlans: records.filter(r => r.status === 'COMPLETED').length,
      inProgressPlans: records.filter(r => r.status === 'IN_PROGRESS').length,
      cancelledPlans: records.filter(r => r.status === 'CANCELLED').length,
      totalStudents: new Set(records.map(r => r.studentId)).size,
      totalExpReward: records.reduce((sum, r) => sum + (r.expAwarded ? r.expReward : 0), 0),
      totalPointsReward: records.reduce((sum, r) => sum + (r.pointsAwarded ? r.pointsReward : 0), 0),
      avgRating: records.filter(r => r.effectivenessRating).length > 0
        ? (records.filter(r => r.effectivenessRating).reduce((sum, r) => sum + r.effectivenessRating, 0) / records.filter(r => r.effectivenessRating).length).toFixed(1)
        : 'N/A'
    };

    overviewSheet.addRows([
      { item: '总计划数', value: stats.totalPlans, description: '所有创建的1v1教学计划' },
      { item: '已完成计划', value: stats.completedPlans, description: '状态为已完成的计划' },
      { item: '进行中计划', value: stats.inProgressPlans, description: '当前正在进行的计划' },
      { item: '已取消计划', value: stats.cancelledPlans, description: '被取消的计划' },
      { item: '覆盖学生数', value: stats.totalStudents, description: '参与1v1讲解的学生总数' },
      { item: '总经验奖励', value: stats.totalExpReward, description: '已发放的经验值总数' },
      { item: '总积分奖励', value: stats.totalPointsReward, description: '已发放的积分总数' },
      { item: '平均效果评分', value: stats.avgRating, description: '教学效果平均评分(1-5分)' }
    ]);

    overviewSheet.getRow(1).font = { bold: true };
    overviewSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };

    // 2. 详细记录工作表
    const detailSheet = workbook.addWorksheet('详细记录');
    detailSheet.columns = [
      { header: '创建日期', key: 'createdAt', width: 12 },
      { header: '教师姓名', key: 'teacherName', width: 12 },
      { header: '学生姓名', key: 'studentName', width: 12 },
      { header: '学生班级', key: 'studentClass', width: 12 },
      { header: '计划标题', key: 'title', width: 20 },
      { header: '学科', key: 'subject', width: 8 },
      { header: '难度', key: 'difficulty', width: 8 },
      { header: '安排日期', key: 'scheduledDate', width: 12 },
      { header: '安排时间', key: 'scheduledTime', width: 10 },
      { header: '时长(分钟)', key: 'duration', width: 10 },
      { header: '知识点', key: 'knowledgePoints', width: 25 },
      { header: '主要问题', key: 'mainProblem', width: 30 },
      { header: '辅导方法', key: 'tutoringMethods', width: 20 },
      { header: '状态', key: 'status', width: 10 },
      { header: 'EXP奖励', key: 'expReward', width: 10 },
      { header: '积分奖励', key: 'pointsReward', width: 10 },
      { header: '完成日期', key: 'completedAt', width: 12 },
      { header: '效果评分', key: 'effectivenessRating', width: 10 },
      { header: '完成备注', key: 'completionNotes', width: 30 }
    ];

    records.forEach(record => {
      detailSheet.addRow({
        createdAt: new Date(record.createdAt).toLocaleDateString('zh-CN'),
        teacherName: record.teacherName,
        studentName: record.studentName,
        studentClass: record.studentClass,
        title: record.title,
        subject: this.getSubjectName(record.subject),
        difficulty: `${record.difficulty}级`,
        scheduledDate: record.scheduledDate,
        scheduledTime: record.scheduledTime,
        duration: record.duration,
        knowledgePoints: Array.isArray(record.knowledgePoints) ? record.knowledgePoints.join('、') : record.knowledgePoints,
        mainProblem: record.mainProblem,
        tutoringMethods: this.formatTutoringMethods(record.tutoringMethods),
        status: this.getStatusText(record.status),
        expReward: record.expAwarded ? record.expReward : 0,
        pointsReward: record.pointsAwarded ? record.pointsReward : 0,
        completedAt: record.actualEndTime ? new Date(record.actualEndTime).toLocaleDateString('zh-CN') : '',
        effectivenessRating: record.effectivenessRating || '',
        completionNotes: record.completionNotes || ''
      });
    });

    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F3FF' } };

    return workbook;
  }

  private getSubjectName(subject: string): string {
    const subjectMap: Record<string, string> = {
      chinese: '语文', math: '数学', english: '英语', general: '综合', science: '科学', art: '艺术'
    };
    return subjectMap[subject] || subject;
  }

  private formatTutoringMethods(methods: any): string {
    if (!methods || typeof methods !== 'object') return '';
    const methodMap: Record<string, string> = {
      conceptExplaining: '概念梳理', exampleTeaching: '例题讲解', mistakeReflection: '错题反思',
      practiceExercise: '练习巩固', interactiveDiscussion: '互动讨论', summaryReview: '总结回顾'
    };
    return Object.entries(methods)
      .filter(([_, enabled]) => enabled)
      .map(([key, _]) => methodMap[key] || key)
      .join('、');
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      SCHEDULED: '已安排', IN_PROGRESS: '进行中', COMPLETED: '已完成', CANCELLED: '已取消', NO_SHOW: '缺席'
    };
    return statusMap[status] || status;
  }
}

export default PersonalizedTutoringRoutes;
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportService, StudentStatsRequest, GeneratedPrompt } from '../services/report.service';
import { ApiResponse } from '../types/api.types';

export class ReportController {
  private prisma = new PrismaClient();
  private reportService = new ReportService(this.prisma);

  /**
   * 获取学生统计数据
   * POST /api/reports/student-stats
   */
  getStudentStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[FIX] ReportController.getStudentStats called', {
        body: req.body,
        user: req.user
      });

      const { studentId, startDate, endDate } = req.body;
      const schoolId = req.schoolId || (req.user as any)?.schoolId;

      // 参数验证
      if (!studentId || !startDate || !endDate || !schoolId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少必要参数: studentId, startDate, endDate, schoolId'
          }
        } as ApiResponse<never>);
      }

      // 构建请求对象
      const statsRequest: StudentStatsRequest = {
        studentId,
        schoolId,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };

      console.log('[FIX] Calling reportService.getStudentStats', statsRequest);

      // 获取统计数据
      const stats = await this.reportService.getStudentStats(statsRequest);

      console.log('[FIX] Stats retrieved successfully', {
        studentName: stats.studentInfo.name,
        tasksCompleted: stats.tasks.completedCount
      });

      // 获取学校教育理念
      const school = await this.prisma.schools.findUnique({
        where: { id: schoolId },
        select: { educationalPhilosophy: true }
      });

      const educationalPhilosophy = school?.educationalPhilosophy ||
        '我们致力于培养面向未来的孩子，视自主学习力为核心武器，通过反馈驱动和最近发展区理论，鼓励孩子注重过程，持续自我迭代。';

      // 生成AI提示词
      const prompt = await this.reportService.generatePrompt(stats, educationalPhilosophy);

      console.log('[FIX] Prompt generated successfully');

      const response: ApiResponse<{
        stats: any;
        prompt: GeneratedPrompt;
        educationalPhilosophy: string;
      }> = {
        success: true,
        data: {
          stats,
          prompt,
          educationalPhilosophy
        },
        message: '学生统计数据获取成功'
      };

      res.json(response);

    } catch (error) {
      console.error('[FIX] ReportController.getStudentStats error:', error);

      // 类型安全的错误处理
      if (error instanceof Error) {
        const statusCode = error.message.includes('not found') ? 404 : 500;

        return res.status(statusCode).json({
          success: false,
          error: {
            code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
            message: error.message
          }
        } as ApiResponse<never>);
      }

      // 未知错误处理
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取学生统计数据时发生未知错误'
        }
      } as ApiResponse<never>);
    }
  };

  /**
   * 获取学校周历
   * GET /api/reports/week-calendar
   */
  getWeekCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[FIX] ReportController.getWeekCalendar called');

      const schoolId = req.schoolId || (req.user as any)?.schoolId;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少学校ID'
          }
        } as ApiResponse<never>);
      }

      // 获取当前学年开始时间（假设为9月1日）
      const currentYear = new Date().getFullYear();
      const schoolYearStart = new Date(currentYear, 8, 1); // 9月1日

      // 生成当前学年的周历
      const weeks = [];
      const currentDate = new Date();
      let weekStart = new Date(schoolYearStart);

      // 找到第一个周一
      while (weekStart.getDay() !== 1) {
        weekStart.setDate(weekStart.getDate() + 1);
      }

      let weekNumber = 1;
      while (weekStart <= currentDate) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        weeks.push({
          weekNumber,
          startDate: new Date(weekStart),
          endDate: new Date(weekEnd),
          label: `第${weekNumber}周`,
          isCurrentWeek: this.isDateInWeek(currentDate, weekStart, weekEnd)
        });

        weekStart.setDate(weekStart.getDate() + 7);
        weekNumber++;
      }

      // 只返回最近12周的数据
      const recentWeeks = weeks.slice(-12);

      const response: ApiResponse<{
        weeks: any[];
        schoolYear: number;
      }> = {
        success: true,
        data: {
          weeks: recentWeeks,
          schoolYear: currentYear
        },
        message: '周历获取成功'
      };

      res.json(response);

    } catch (error) {
      console.error('[FIX] ReportController.getWeekCalendar error:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        } as ApiResponse<never>);
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取周历时发生未知错误'
        }
      } as ApiResponse<never>);
    }
  };

  /**
   * 获取学校设置
   * GET /api/reports/school-settings
   */
  getSchoolSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[FIX] ReportController.getSchoolSettings called');

      const schoolId = req.schoolId || (req.user as any)?.schoolId;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '缺少学校ID'
          }
        } as ApiResponse<never>);
      }

      const school = await this.prisma.schools.findUnique({
        where: { id: schoolId },
        select: {
          name: true,
          educationalPhilosophy: true,
          settings: true
        }
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '学校信息未找到'
          }
        } as ApiResponse<never>);
      }

      const response: ApiResponse<{
        name: string;
        educationalPhilosophy: string;
        settings: any;
      }> = {
        success: true,
        data: {
          name: school.name,
          educationalPhilosophy: school.educationalPhilosophy,
          settings: school.settings
        },
        message: '学校设置获取成功'
      };

      res.json(response);

    } catch (error) {
      console.error('[FIX] ReportController.getSchoolSettings error:', error);

      if (error instanceof Error) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message
          }
        } as ApiResponse<never>);
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取学校设置时发生未知错误'
        }
      } as ApiResponse<never>);
    }
  };

  // ===== 私有辅助方法 =====

  private isDateInWeek(date: Date, weekStart: Date, weekEnd: Date): boolean {
    const checkDate = new Date(date);
    return checkDate >= weekStart && checkDate <= weekEnd;
  }
}
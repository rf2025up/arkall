import { Router } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../services/auth.service';
import { authenticateToken, validateUser } from '../middleware/auth.middleware';

export class DashboardRoutes {
  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService
  ) { }

  getRoutes(): Router {
    const router = Router();

    // 获取大屏数据 (认证 + 基础校验)
    router.get('/', authenticateToken(this.authService), validateUser, async (req, res) => {
      try {
        console.log("--- [DASHBOARD] API hit. Using DashboardService. ---");

        // 获取学校ID，如果没有则自动查找第一个可用的学校
        let schoolId = (req as any).user?.schoolId || req.query.schoolId as string;

        console.log(`[DASHBOARD] Loading data for school: ${schoolId}`);

        // 获取仪表板数据
        const dashboardData = await this.dashboardService.getDashboardData(schoolId);

        console.log(`✅ [DASHBOARD] Data loaded successfully:`, {
          topStudents: dashboardData.topStudents.length,
          ongoingPKs: dashboardData.ongoingPKs.length,
          recentChallenges: dashboardData.recentChallenges.length,
          classRanking: dashboardData.classRanking.length
        });

        res.status(200).json({
          success: true,
          data: dashboardData,
        });
      } catch (error) {
        console.error("--- [ERROR] in Dashboard API ---", error);

        // 返回错误但不崩溃
        res.status(500).json({
          success: false,
          message: 'Failed to load dashboard data',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // 获取大屏专用数据 (公开接口，无需认证)
    router.get('/bigscreen', async (req, res) => {
      try {
        // 支持通过 URL 参数传递 schoolId，如果没有则自动查找第一个可用学校
        let schoolId = req.query.schoolId as string;

        if (!schoolId) {
          // 如果没有提供 schoolId，查找第一个有学生的学校
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient();
          const school = await prisma.schools.findFirst({
            where: { isActive: true, students: { some: { isActive: true } } },
            select: { id: true }
          });
          await prisma.$disconnect();
          schoolId = school?.id;
        }

        if (!schoolId) {
          return res.status(400).json({
            success: false,
            message: 'No active school found'
          });
        }

        console.log(`📺 [BIGSCREEN] Loading data for school: ${schoolId}`);
        const bigscreenData = await this.dashboardService.getBigscreenData(schoolId);

        res.status(200).json({
          success: true,
          data: bigscreenData
        });
      } catch (error) {
        console.error('❌ [BIGSCREEN] Error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to load bigscreen data',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    return router;
  }
}

export default DashboardRoutes;
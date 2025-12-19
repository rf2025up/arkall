import { Router } from 'express';
import { DashboardService } from '../services/dashboard.service';

const router = Router();
const dashboardService = new DashboardService();

// 获取大屏数据
router.get('/', async (req, res) => {
  try {
    console.log("--- [DASHBOARD] API hit. Using DashboardService. ---");

    // 获取学校ID，如果没有则自动查找第一个可用的学校
    let schoolId = (req as any).user?.schoolId || req.query.schoolId as string;

    console.log(`[DASHBOARD] Loading data for school: ${schoolId}`);

    // 获取仪表板数据
    const dashboardData = await dashboardService.getDashboardData(schoolId);

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

export { router as dashboardRoutes };
import { Router } from 'express';
import { SchoolService } from '../services/school.service';
import { AuthService } from '../services/auth.service';
import { authenticateToken, validateUser, requireAdmin } from '../middleware/auth.middleware';

export class SchoolRoutes {
  constructor(
    private schoolService: SchoolService,
    private authService: AuthService
  ) { }

  getRoutes(): Router {
    const router = Router();

    // 获取学校列表 (认证 + 管理员)
    router.get('/', authenticateToken(this.authService), requireAdmin, async (req, res) => {
      try {
        const schools = await this.schoolService.getSchoolsWithStats();

        res.json({
          success: true,
          data: schools
        });

      } catch (error) {
        console.error('❌ Error in GET /api/schools:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get schools',
          error: (error as Error).message
        });
      }
    });

    // 获取学生列表 (认证 + 基础校验)
    router.get('/students', authenticateToken(this.authService), validateUser, async (req, res) => {
      try {
        const { schoolId, className, limit = 50 } = req.query;

        const students = await this.schoolService.getStudentsWithStats({
          schoolId: schoolId as string,
          className: className as string,
          limit: parseInt(limit as string)
        });

        res.json({
          success: true,
          data: students
        });

      } catch (error) {
        console.error('❌ Error in GET /api/schools/students:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to get students',
          error: (error as Error).message
        });
      }
    });

    // 创建新学校 (仅限管理员)
    router.post('/', authenticateToken(this.authService), requireAdmin, async (req, res) => {
      try {
        const { name, planType = 'FREE' } = req.body;

        if (!name) {
          return res.status(400).json({
            success: false,
            message: 'School name is required'
          });
        }

        const school = await this.schoolService.createSchool({
          name,
          planType: planType as any,
          isActive: true
        });

        res.status(201).json({
          success: true,
          message: 'School created successfully',
          data: school
        });

      } catch (error) {
        console.error('❌ Error in POST /api/schools:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create school',
          error: (error as Error).message
        });
      }
    });

    return router;
  }
}

export default SchoolRoutes;
import { Router } from 'express';
import { SchoolService } from '../services/school.service';

const router = Router();
const schoolService = new SchoolService();

// 获取学校列表（包含教师和学生统计）
router.get('/', async (req, res) => {
  try {
    const schools = await schoolService.getSchoolsWithStats();

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

// 获取学生列表（按经验值排序）
router.get('/students', async (req, res) => {
  try {
    const { schoolId, className, limit = 50 } = req.query;

    const students = await schoolService.getStudentsWithStats({
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

// 创建新学校
router.post('/', async (req, res) => {
  try {
    const { name, planType = 'FREE' } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'School name is required'
      });
    }

    const school = await schoolService.createSchool({
      name,
      planType,
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

export { router as schoolRoutes };
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 获取学校列表（包含教师和学生统计）
router.get('/', async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        teachers: {
          select: { id: true, name: true, username: true, role: true }
        },
        students: {
          select: { id: true, name: true, className: true, level: true, points: true, exp: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 计算统计信息
    const schoolsWithStats = schools.map(school => ({
      ...school,
      stats: {
        teacherCount: school.teachers.length,
        studentCount: school.students.length,
        totalPoints: school.students.reduce((sum, student) => sum + student.points, 0),
        totalExp: school.students.reduce((sum, student) => sum + student.exp, 0)
      }
    }));

    res.json({
      success: true,
      data: schoolsWithStats
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

    const where: any = {
      isActive: true
    };

    if (schoolId) {
      where.schoolId = schoolId as string;
    }

    if (className) {
      where.className = className as string;
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        schoolId: true,
        name: true,
        className: true,
        level: true,
        points: true,
        exp: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        school: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { exp: 'desc' },
        { points: 'desc' },
        { name: 'asc' }
      ],
      take: parseInt(limit as string)
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

    const school = await prisma.school.create({
      data: {
        name,
        planType,
        isActive: true
      },
      include: {
        teachers: {
          select: { id: true, name: true, username: true, role: true }
        },
        students: {
          select: { id: true, name: true, className: true, level: true, points: true, exp: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: {
        ...school,
        stats: {
          teacherCount: school.teachers.length,
          studentCount: school.students.length,
          totalPoints: school.students.reduce((sum, student) => sum + student.points, 0),
          totalExp: school.students.reduce((sum, student) => sum + student.exp, 0)
        }
      }
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
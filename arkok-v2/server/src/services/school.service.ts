import { PrismaClient } from '@prisma/client';

export interface SchoolStats {
  teacherCount: number;
  studentCount: number;
  totalPoints: number;
  totalExp: number;
}

export interface SchoolWithStats {
  id: string;
  name: string;
  planType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  teachers: Array<{
    id: string;
    name: string;
    username: string;
    role: string;
  }>;
  students: Array<{
    id: string;
    name: string;
    className: string;
    level: number;
    points: number;
    exp: number;
  }>;
  stats: SchoolStats;
}

export interface StudentWithStats {
  id: string;
  schoolId: string;
  name: string;
  className: string;
  level: number;
  points: number;
  exp: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  school: {
    id: string;
    name: string;
  };
}

export interface CreateSchoolRequest {
  name: string;
  planType: string;
  isActive: boolean;
}

export interface GetStudentsOptions {
  schoolId?: string;
  className?: string;
  limit: number;
}

export class SchoolService {
  private prisma = new PrismaClient();

  /**
   * 获取学校列表（包含教师和学生统计）
   */
  async getSchoolsWithStats(): Promise<SchoolWithStats[]> {
    const schools = await this.prisma.schools.findMany({
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
    return schools.map(school => ({
      ...school,
      stats: {
        teacherCount: school.teachers.length,
        studentCount: school.students.length,
        totalPoints: school.students.reduce((sum, student) => sum + student.points, 0),
        totalExp: school.students.reduce((sum, student) => sum + student.exp, 0)
      }
    }));
  }

  /**
   * 获取学生列表（按经验值排序）
   */
  async getStudentsWithStats(options: GetStudentsOptions): Promise<StudentWithStats[]> {
    const { schoolId, className, limit } = options;

    const where: any = {
      isActive: true
    };

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (className) {
      where.className = className;
    }

    const students = await this.prisma.students.findMany({
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
      take: limit
    });

    return students as StudentWithStats[];
  }

  /**
   * 创建新学校
   */
  async createSchool(request: CreateSchoolRequest): Promise<SchoolWithStats> {
    const { name, planType, isActive } = request;

    const school = await this.prisma.schools.create({
      data: {
        name,
        planType,
        isActive
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

    return {
      ...school,
      stats: {
        teacherCount: school.teachers.length,
        studentCount: school.students.length,
        totalPoints: school.students.reduce((sum, student) => sum + student.points, 0),
        totalExp: school.students.reduce((sum, student) => sum + student.exp, 0)
      }
    };
  }

  /**
   * 根据ID获取学校详情
   */
  async getSchoolById(schoolId: string): Promise<SchoolWithStats | null> {
    const school = await this.prisma.schools.findUnique({
      where: { id: schoolId },
      include: {
        teachers: {
          select: { id: true, name: true, username: true, role: true }
        },
        students: {
          select: { id: true, name: true, className: true, level: true, points: true, exp: true }
        }
      }
    });

    if (!school) {
      return null;
    }

    return {
      ...school,
      stats: {
        teacherCount: school.teachers.length,
        studentCount: school.students.length,
        totalPoints: school.students.reduce((sum, student) => sum + student.points, 0),
        totalExp: school.students.reduce((sum, student) => sum + student.exp, 0)
      }
    };
  }
}

export default SchoolService;
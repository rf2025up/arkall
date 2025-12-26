import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

export interface BadgeQuery {
  schoolId: string;
  search?: string;
  category?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateBadgeRequest {
  name: string;
  description?: string;
  icon?: string;
  category: string;
  requirement?: Record<string, any>;
  schoolId: string;
}

export interface UpdateBadgeRequest {
  id: string;
  schoolId: string;
  name?: string;
  description?: string;
  icon?: string;
  category?: string;
  requirement?: Record<string, any>;
  isActive?: boolean;
}

export interface AwardBadgeRequest {
  studentId: string;
  badgeId: string;
  schoolId: string;
  reason?: string;
  awardedBy?: string;
}

export interface BadgeListResponse {
  badges: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BadgeStatsResponse {
  totalBadges: number;
  activeBadges: number;
  totalAwarded: number;
  uniqueEarners: number;
  categoryDistribution: {
    category: string;
    count: number;
    awardedCount: number;
  }[];
  topEarners: {
    studentId: string;
    studentName: string;
    badgeCount: number;
  }[];
  recentAwards: any[];
}

export class BadgeService {
  private prisma: PrismaClient;
  private io: SocketIOServer;

  constructor(prisma: PrismaClient, io: SocketIOServer) {
    this.prisma = prisma;
    this.io = io;
  }

  /**
   * 获取勋章列表
   */
  async getBadges(query: BadgeQuery): Promise<BadgeListResponse> {
    const { schoolId, search, category, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      schoolId,
      ...(isActive !== undefined && { isActive })
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 获取总数
    const total = await this.prisma.badges.count({ where });

    // 获取勋章列表
    const badges = await this.prisma.badges.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
        { category: 'asc' },
        { name: 'asc' }
      ],
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            student_badges: true
          }
        }
      }
    });

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);

    return {
      badges: badges.map(badge => ({
        ...badge,
        awardedCount: badge._count.student_badges
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * 根据ID获取单个勋章详情
   */
  async getBadgeById(id: string, schoolId: string): Promise<any> {
    const badge = await this.prisma.badges.findFirst({
      where: {
        id,
        schoolId
      },
      include: {
        student_badges: {
          include: {
            students: {
              select: {
                id: true,
                name: true,
                className: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            awardedAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            student_badges: true
          }
        }
      }
    });

    if (!badge) {
      throw new Error('勋章不存在');
    }

    return {
      ...badge,
      awardedCount: badge._count.student_badges,
      recentRecipients: badge.student_badges
    };
  }

  /**
   * 创建新勋章
   */
  async createBadge(data: CreateBadgeRequest): Promise<any> {
    const { name, description, icon, category, requirement, schoolId } = data;

    // 检查勋章名称是否已存在
    const existingBadge = await this.prisma.badges.findFirst({
      where: {
        name,
        schoolId
      }
    });

    if (existingBadge) {
      throw new Error('勋章名称已存在');
    }

    const badge = await this.prisma.badges.create({
      data: {
        id: require('crypto').randomUUID(),
        name,
        description,
        icon,
        category,
        requirement,
        schoolId,
        updatedAt: new Date()
      }
    });

    // 广播勋章创建事件
    this.broadcastToSchool(schoolId, {
      type: 'BADGE_CREATED',
      data: {
        badge,
        timestamp: new Date().toISOString()
      }
    });

    return badge;
  }

  /**
   * 更新勋章信息
   */
  async updateBadge(data: UpdateBadgeRequest): Promise<any> {
    const { id, schoolId, name, description, icon, category, requirement, isActive } = data;

    // 如果要更新名称，检查是否与其他勋章重复
    if (name) {
      const existingBadge = await this.prisma.badges.findFirst({
        where: {
          name,
          schoolId,
          id: { not: id }
        }
      });

      if (existingBadge) {
        throw new Error('勋章名称已存在');
      }
    }

    const badge = await this.prisma.badges.update({
      where: {
        id,
        schoolId
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(category && { category }),
        ...(requirement !== undefined && { requirement }),
        ...(isActive !== undefined && { isActive })
      }
    });

    // 广播勋章更新事件
    this.broadcastToSchool(schoolId, {
      type: 'BADGE_UPDATED',
      data: {
        badge,
        timestamp: new Date().toISOString()
      }
    });

    return badge;
  }

  /**
   * 删除勋章（软删除）
   */
  async deleteBadge(id: string, schoolId: string): Promise<void> {
    await this.prisma.badges.update({
      where: {
        id,
        schoolId
      },
      data: {
        isActive: false
      }
    });

    // 广播勋章删除事件
    this.broadcastToSchool(schoolId, {
      type: 'BADGE_DELETED',
      data: {
        badgeId: id,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * 授予学生勋章
   */
  async awardBadge(data: AwardBadgeRequest): Promise<any> {
    const { studentId, badgeId, schoolId, reason, awardedBy } = data;

    // 验证勋章是否存在且属于该学校
    const badge = await this.prisma.badges.findFirst({
      where: {
        id: badgeId,
        schoolId,
        isActive: true
      }
    });

    if (!badge) {
      throw new Error('勋章不存在或已停用');
    }

    // 验证学生是否存在且属于该学校
    const student = await this.prisma.students.findFirst({
      where: {
        id: studentId,
        schoolId,
        isActive: true
      }
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    // 检查是否已经获得过该勋章
    const existingAward = await this.prisma.student_badges.findFirst({
      where: {
        studentId,
        badgeId
      }
    });

    if (existingAward) {
      throw new Error('学生已获得过该勋章');
    }

    // 创建勋章授予记录
    const studentBadge = await this.prisma.student_badges.create({
      data: {
        id: require('crypto').randomUUID(),
        studentId,
        badgeId,
        awardedBy,
        reason
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true
          }
        },
        badges: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            category: true
          }
        }
      }
    });

    // 给予学生奖励
    await this.prisma.students.update({
      where: { id: studentId },
      data: {
        points: { increment: 10 },
        exp: { increment: 20 },
        updatedAt: new Date()
      }
    });

    // 🚀 [宪法 5.0 落地] 创建成长激励记录 (同步至全量记录表)
    await this.prisma.task_records.create({
      data: {
        id: require('crypto').randomUUID(),
        studentId,
        schoolId,
        type: 'TASK', // 勋章授予在记录层级归类为 TASK，具体分类由 task_category: 'BADGE' 决定
        title: `获得勋章: ${badge.name}`,
        content: {
          badgeId: badge.id,
          badgeName: badge.name,
          badgeDescription: badge.description,
          badgeIcon: badge.icon,
          teacherMessage: reason,
          awardedBy,
          taskDate: new Date().toISOString().split('T')[0]
        },
        status: 'COMPLETED',
        expAwarded: 20,
        updatedAt: new Date(),
        task_category: 'BADGE'
      }
    });

    // 准备广播数据
    const broadcastData = {
      type: 'BADGE_AWARDED',
      data: {
        studentBadge,
        badge,
        student: {
          id: student.id,
          name: student.name,
          className: student.className
        },
        timestamp: new Date().toISOString()
      }
    };

    // 广播到学校房间
    this.broadcastToSchool(schoolId, broadcastData);

    return studentBadge;
  }

  /**
   * 批量授予学生勋章
   */
  async batchAwardBadges(data: { studentIds: string[], badgeId: string, schoolId: string, reason?: string, awardedBy?: string }): Promise<any> {
    const { studentIds, badgeId, schoolId, reason, awardedBy } = data;

    // 1. 验证勋章是否存在
    const badge = await this.prisma.badges.findFirst({
      where: { id: badgeId, schoolId, isActive: true }
    });
    if (!badge) throw new Error('勋章不存在或已停用');

    // 2. 检查这些学生是否已经拥有该勋章 (过滤掉已拥有的)
    const existingAwards = await this.prisma.student_badges.findMany({
      where: {
        badgeId,
        studentId: { in: studentIds }
      },
      select: { studentId: true }
    });
    const existingStudentIds = new Set(existingAwards.map(a => a.studentId));
    const targetStudentIds = studentIds.filter(id => !existingStudentIds.has(id));

    if (targetStudentIds.length === 0) {
      return { success: true, message: '选择的学生均已拥有该勋章', awardedCount: 0 };
    }

    // 3. 事务处理
    const result = await this.prisma.$transaction(async (tx) => {
      const records = [];
      const timestamp = new Date();

      for (const studentId of targetStudentIds) {
        const id = require('crypto').randomUUID();
        // A. 创建勋章记录
        const sb = await tx.student_badges.create({
          data: {
            id,
            studentId,
            badgeId,
            awardedBy,
            reason,
            awardedAt: timestamp
          },
          include: {
            students: { select: { id: true, name: true, className: true } }
          }
        });

        // B. 增加学生积分
        await tx.students.update({
          where: { id: studentId },
          data: {
            points: { increment: 10 },
            exp: { increment: 20 },
            updatedAt: timestamp
          }
        });

        // C. 同步成长记录 (5.0 规范)
        await tx.task_records.create({
          data: {
            id: require('crypto').randomUUID(),
            studentId,
            schoolId,
            type: 'TASK',
            title: `获得勋章: ${badge.name}`,
            content: {
              badgeId: badge.id,
              badgeName: badge.name,
              badgeIcon: badge.icon,
              teacherMessage: reason,
              awardedBy,
              taskDate: timestamp.toISOString().split('T')[0]
            },
            status: 'COMPLETED',
            expAwarded: 20,
            updatedAt: timestamp,
            task_category: 'BADGE'
          }
        });

        records.push(sb);
      }

      return records;
    });

    // 4. 广播结果
    this.broadcastToSchool(schoolId, {
      type: 'BADGES_BATCH_AWARDED',
      data: {
        badge,
        awardedCount: result.length,
        timestamp: new Date().toISOString()
      }
    });

    return { success: true, awardedCount: result.length, records: result };
  }

  /**
   * 取消学生勋章
   */
  async revokeBadge(studentId: string, badgeId: string, schoolId: string): Promise<void> {
    // 验证勋章是否存在且属于该学校
    const badge = await this.prisma.badges.findFirst({
      where: {
        id: badgeId,
        schoolId
      }
    });

    if (!badge) {
      throw new Error('勋章不存在');
    }

    // 验证学生是否存在且属于该学校
    const student = await this.prisma.students.findFirst({
      where: {
        id: studentId,
        schoolId,
        isActive: true
      }
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    // 删除勋章授予记录
    await this.prisma.student_badges.deleteMany({
      where: {
        studentId,
        badgeId
      }
    });

    // 广播勋章撤销事件
    this.broadcastToSchool(schoolId, {
      type: 'BADGE_REVOKED',
      data: {
        studentId,
        badgeId,
        badgeName: badge.name,
        studentName: student.name,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * 获取学生勋章列表
   */
  async getStudentBadges(studentId: string, schoolId: string): Promise<any> {
    // 验证学生是否存在且属于该学校
    const student = await this.prisma.students.findFirst({
      where: {
        id: studentId,
        schoolId,
        isActive: true
      }
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    // 获取学生的勋章
    const student_badges = await this.prisma.student_badges.findMany({
      where: {
        studentId
      },
      include: {
        badges: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            category: true
          }
        }
      },
      orderBy: {
        awardedAt: 'desc'
      }
    });

    // 按类别分组统计
    const categoryStats = student_badges.reduce((acc, studentBadge) => {
      const category = studentBadge.badges.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(studentBadge);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      student: {
        id: student.id,
        name: student.name,
        className: student.className
      },
      totalBadges: student_badges.length,
      categoryStats,
      badges: student_badges
    };
  }

  /**
   * 获取可获得的勋章（基于学生成就）
   */
  async getAvailableBadges(studentId: string, schoolId: string): Promise<any> {
    // 验证学生是否存在且属于该学校
    const student = await this.prisma.students.findFirst({
      where: {
        id: studentId,
        schoolId,
        isActive: true
      },
      include: {
        student_badges: {
          include: {
            badges: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    // 获取所有活跃勋章
    const allBadges = await this.prisma.badges.findMany({
      where: {
        schoolId,
        isActive: true
      }
    });

    // 获取学生已有的勋章ID
    const earnedBadgeIds = new Set(student.student_badges.map(sb => sb.badgeId));

    // 过滤出未获得的勋章
    const availableBadges = allBadges.filter(badge => !earnedBadgeIds.has(badge.id));

    // 分析每个勋章的达成情况
    const badgeAnalysis = await Promise.all(
      availableBadges.map(async (badge) => {
        const analysis = await this.analyzeBadgeRequirement(studentId, badge.requirement);
        return {
          badge,
          isEligible: analysis.eligible,
          progress: analysis.progress,
          requirement: analysis.requirement
        };
      })
    );

    return {
      student: {
        id: student.id,
        name: student.name,
        className: student.className,
        exp: student.exp,
        points: student.points
      },
      availableBadges: badgeAnalysis
    };
  }

  /**
   * 获取勋章统计信息
   */
  async getBadgeStats(schoolId: string): Promise<BadgeStatsResponse> {
    // 获取勋章总数和活跃勋章数
    const [totalBadges, activeBadges] = await Promise.all([
      this.prisma.badges.count({
        where: { schoolId }
      }),
      this.prisma.badges.count({
        where: { schoolId, isActive: true }
      })
    ]);

    // 获取授予总数
    const totalAwarded = await this.prisma.student_badges.count({
      where: {
        badges: {
          schoolId
        }
      }
    });

    // 获取获得勋章的唯一学生数
    const uniqueEarners = await this.prisma.student_badges.groupBy({
      by: ['studentId'],
      where: {
        badges: {
          schoolId
        }
      }
    });

    // 按类别统计
    const categoryDistribution = await this.prisma.badges.groupBy({
      by: ['category'],
      where: { schoolId },
      _count: {
        category: true
      }
    });

    const categoryStats = await Promise.all(
      categoryDistribution.map(async (stat) => {
        const awardedCount = await this.prisma.student_badges.count({
          where: {
            badges: {
              schoolId,
              category: stat.category
            }
          }
        });

        return {
          category: stat.category,
          count: stat._count.category,
          awardedCount
        };
      })
    );

    // 获取获得最多勋章的学生
    const topEarners = await this.prisma.student_badges.groupBy({
      by: ['studentId'],
      where: {
        badges: {
          schoolId
        }
      },
      _count: {
        studentId: true
      },
      orderBy: {
        _count: {
          studentId: 'desc'
        }
      },
      take: 10
    });

    // 获取学生信息
    const students = await this.prisma.students.findMany({
      where: {
        id: { in: topEarners.map(earner => earner.studentId) },
        schoolId
      },
      select: {
        id: true,
        name: true
      }
    });

    const topStudentStats = topEarners.map(earner => {
      const student = students.find(s => s.id === earner.studentId);
      return {
        studentId: earner.studentId,
        studentName: student?.name || '未知学生',
        badgeCount: earner._count.studentId
      };
    });

    // 获取最近授予记录
    const recentAwards = await this.prisma.student_badges.findMany({
      where: {
        badges: {
          schoolId
        }
      },
      include: {
        students: {
          select: {
            id: true,
            name: true,
            className: true
          }
        },
        badges: {
          select: {
            id: true,
            name: true,
            icon: true,
            category: true
          }
        }
      },
      orderBy: {
        awardedAt: 'desc'
      },
      take: 10
    });

    return {
      totalBadges,
      activeBadges,
      totalAwarded,
      uniqueEarners: uniqueEarners.length,
      categoryDistribution: categoryStats,
      topEarners: topStudentStats,
      recentAwards
    };
  }

  /**
   * 分析勋章要求达成情况
   */
  private async analyzeBadgeRequirement(studentId: string, requirement: any): Promise<any> {
    if (!requirement) {
      return {
        eligible: false,
        progress: 0,
        requirement: '无要求'
      };
    }

    // 获取学生统计信息
    const student = await this.prisma.students.findUnique({
      where: { id: studentId },
      include: {
        task_records: true
      }
    });

    if (!student) {
      return {
        eligible: false,
        progress: 0,
        requirement: '学生不存在'
      };
    }

    // 根据不同类型的要求分析
    const analysis = {
      eligible: false,
      progress: 0,
      requirement: ''
    };

    if (requirement.type === 'exp_threshold') {
      const targetExp = requirement.value || 100;
      analysis.progress = Math.min(100, (student.exp / targetExp) * 100);
      analysis.eligible = student.exp >= targetExp;
      analysis.requirement = `经验值达到 ${targetExp}`;
    } else if (requirement.type === 'points_threshold') {
      const targetPoints = requirement.value || 100;
      analysis.progress = Math.min(100, (student.points / targetPoints) * 100);
      analysis.eligible = student.points >= targetPoints;
      analysis.requirement = `积分达到 ${targetPoints}`;
    } else if (requirement.type === 'task_count') {
      const targetCount = requirement.value || 10;
      const actualCount = student.task_records.length;
      analysis.progress = Math.min(100, (actualCount / targetCount) * 100);
      analysis.eligible = actualCount >= targetCount;
      analysis.requirement = `完成 ${targetCount} 个任务`;
    } else if (requirement.type === 'badge_collection') {
      // 简化版：检查已获得的勋章数量
      const earnedBadges = await this.prisma.student_badges.count({
        where: { studentId }
      });
      const targetCount = requirement.value || 5;
      analysis.progress = Math.min(100, (earnedBadges / targetCount) * 100);
      analysis.eligible = earnedBadges >= targetCount;
      analysis.requirement = `获得 ${targetCount} 个其他勋章`;
    } else {
      analysis.requirement = requirement.description || '特殊要求';
    }

    return analysis;
  }

  /**
   * 广播到指定学校的房间
   */
  private broadcastToSchool(schoolId: string, data: any): void {
    const roomName = `school_${schoolId}`;
    this.io.to(roomName).emit('DATA_UPDATE', data);
    console.log(`📡 Broadcasted to school ${schoolId}:`, data.type);
  }
}

export default BadgeService;
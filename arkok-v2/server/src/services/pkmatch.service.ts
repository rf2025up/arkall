import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

export interface PKMatchQuery {
  schoolId: string;
  search?: string;
  status?: string;
  studentId?: string;
  topic?: string;
  page?: number;
  limit?: number;
}

export interface CreatePKMatchRequest {
  studentA: string;
  studentB: string;
  topic: string;
  schoolId: string;
  expReward?: number;
  pointsReward?: number;
  metadata?: Record<string, any>;
}

export interface UpdatePKMatchRequest {
  id: string;
  schoolId: string;
  topic?: string;
  status?: string;
  winnerId?: string;
  metadata?: Record<string, any>;
}

export interface PKMatchListResponse {
  matches: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PKMatchStatsResponse {
  totalMatches: number;
  activeMatches: number;
  completedMatches: number;
  totalParticipants: number;
  averageMatchesPerStudent: number;
  popularTopics: {
    topic: string;
    count: number;
  }[];
  recentActivities: any[];
}

export class PKMatchService {
  private prisma: PrismaClient;
  private io: SocketIOServer;

  constructor(prisma: PrismaClient, io: SocketIOServer) {
    this.prisma = prisma;
    this.io = io;
  }

  /**
   * 获取PK对战列表
   */
  async getPKMatches(query: PKMatchQuery): Promise<PKMatchListResponse> {
    const { schoolId, search, status, studentId, topic, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      AND: [
        { schoolId },
        ...(status ? [{ status: status as any }] : [])
      ]
    };

    if (studentId) {
      where.AND.push({
        OR: [
          { studentA: studentId },
          { studentB: studentId }
        ]
      });
    }

    if (topic) {
      where.AND.push({
        topic: { contains: topic, mode: 'insensitive' }
      });
    }

    if (search) {
      where.AND.push({
        OR: [
          { topic: { contains: search, mode: 'insensitive' } },
          { playerA: { name: { contains: search, mode: 'insensitive' } } },
          { playerB: { name: { contains: search, mode: 'insensitive' } } }
        ]
      });
    }

    // 获取总数
    const total = await this.prisma.pk_matches.count({ where });

    // 获取PK对战列表
    const matches = await this.prisma.pk_matches.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
      include: {
        playerA: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true,
            exp: true
          }
        },
        playerB: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true,
            exp: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            className: true
          }
        }
      }
    });

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);

    return {
      matches: matches.map(m => ({
        ...m,
        studentA: m.playerA,
        studentB: m.playerB
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
   * 根据ID获取单个PK对战详情
   */
  async getPKMatchById(id: string, schoolId: string): Promise<any> {
    const match = await this.prisma.pk_matches.findFirst({
      where: {
        id,
        schoolId
      },
      include: {
        playerA: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true,
            exp: true,
            points: true
          }
        },
        playerB: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true,
            exp: true,
            points: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            className: true
          }
        }
      }
    });

    if (!match) {
      throw new Error('PK对战不存在');
    }

    // 计算对战统计信息
    const stats = this.calculateMatchStats(match);

    return {
      ...match,
      studentA: match.playerA,
      studentB: match.playerB,
      stats
    };
  }

  /**
   * 创建新PK对战
   */
  async createPKMatch(data: CreatePKMatchRequest): Promise<any> {
    const { studentA, studentB, topic, schoolId, metadata } = data;

    // 验证学生A是否存在且属于该学校
    const playerA = await this.prisma.students.findFirst({
      where: {
        id: studentA,
        schoolId,
        isActive: true
      }
    });

    if (!playerA) {
      throw new Error('学生A不存在或不属于该学校');
    }

    // 验证学生B是否存在且属于该学校
    const playerB = await this.prisma.students.findFirst({
      where: {
        id: studentB,
        schoolId,
        isActive: true
      }
    });

    if (!playerB) {
      throw new Error('学生B不存在或不属于该学校');
    }

    // 检查是否已有相同的对战
    const existingMatch = await this.prisma.pk_matches.findFirst({
      where: {
        schoolId,
        OR: [
          { studentA, studentB },
          { studentA: studentB, studentB: studentA }
        ],
        status: 'ONGOING'
      }
    });

    if (existingMatch) {
      throw new Error('已有进行中的对战');
    }

    const match = await this.prisma.pk_matches.create({
      data: {
        id: require('crypto').randomUUID(),
        studentA,
        studentB,
        topic,
        schoolId,
        metadata: {
          ...((metadata as any) || {}),
          expReward: data.expReward || 50,
          pointsReward: data.pointsReward || 20
        },
        status: 'ONGOING',
        updatedAt: new Date()
      },
      include: {
        playerA: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true
          }
        },
        playerB: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true
          }
        }
      }
    });

    // 创建基础任务记录给两个学生 (CHALLENGE类型)
    await this.prisma.task_records.createMany({
      data: [
        {
          id: require('crypto').randomUUID(),
          studentId: studentA,
          schoolId,
          type: 'CHALLENGE',
          title: `PK对战 - ${topic}`,
          content: {
            matchId: match.id,
            opponent: playerB.name,
            opponentClass: playerB.className,
            role: 'playerA',
            taskDate: new Date().toISOString().split('T')[0]
          },
          status: 'PENDING',
          updatedAt: new Date()
        },
        {
          id: require('crypto').randomUUID(),
          studentId: studentB,
          schoolId,
          type: 'CHALLENGE',
          title: `PK对战 - ${topic}`,
          content: {
            matchId: match.id,
            opponent: playerA.name,
            opponentClass: playerA.className,
            role: 'playerB',
            taskDate: new Date().toISOString().split('T')[0]
          },
          status: 'PENDING',
          updatedAt: new Date()
        }
      ]
    });

    // 广播PK对战创建事件
    this.broadcastToSchool(schoolId, {
      type: 'PKMATCH_CREATED',
      data: {
        match,
        timestamp: new Date().toISOString()
      }
    });

    return match;
  }

  /**
   * 更新PK对战信息
   */
  async updatePKMatch(data: UpdatePKMatchRequest): Promise<any> {
    const { id, schoolId, topic, status, winnerId, metadata } = data;

    // 验证对战是否存在
    const existingMatch = await this.prisma.pk_matches.findFirst({
      where: {
        id,
        schoolId
      }
    });

    if (!existingMatch) {
      throw new Error('PK对战不存在');
    }

    // 如果指定了获胜者，验证获胜者是否是对战参与者
    if (winnerId && winnerId !== existingMatch.studentA && winnerId !== existingMatch.studentB) {
      throw new Error('获胜者必须是对战参与者');
    }

    const match = await this.prisma.pk_matches.update({
      where: {
        id,
        schoolId
      },
      data: {
        ...(topic && { topic }),
        ...(status && { status: status as any }),
        ...(winnerId !== undefined && { winnerId }),
        ...(metadata !== undefined && { metadata })
      },
      include: {
        playerA: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true
          }
        },
        playerB: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true,
            className: true
          }
        }
      }
    });

    // 如果对战完成且有获胜者，给予奖励
    if (status === 'COMPLETED' && winnerId && existingMatch.status !== 'COMPLETED') {
      await this.grantMatchRewards(match);
    }

    // 广播PK对战更新事件
    this.broadcastToSchool(schoolId, {
      type: 'PKMATCH_UPDATED',
      data: {
        match,
        timestamp: new Date().toISOString()
      }
    });

    return match;
  }

  /**
   * 删除PK对战
   */
  async deletePKMatch(id: string, schoolId: string): Promise<void> {
    // 验证对战是否存在
    const match = await this.prisma.pk_matches.findFirst({
      where: {
        id,
        schoolId
      }
    });

    if (!match) {
      throw new Error('PK对战不存在');
    }

    // 只允许删除未开始的对战
    if (match.status === 'ONGOING') {
      throw new Error('无法删除进行中的对战');
    }

    await this.prisma.pk_matches.delete({
      where: {
        id,
        schoolId
      }
    });

    // 广播PK对战删除事件
    this.broadcastToSchool(schoolId, {
      type: 'PKMATCH_DELETED',
      data: {
        matchId: id,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * 获取学生PK统计
   */
  async getStudentPKStats(studentId: string, schoolId: string): Promise<any> {
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

    // 获取学生的PK对战记录
    const matches = await this.prisma.pk_matches.findMany({
      where: {
        schoolId,
        OR: [
          { studentA: studentId },
          { studentB: studentId }
        ]
      },
      include: {
        playerA: {
          select: {
            id: true,
            name: true,
            className: true
          }
        },
        playerB: {
          select: {
            id: true,
            name: true,
            className: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 计算统计信息
    const totalMatches = matches.length;
    const wins = matches.filter(match => match.winnerId === studentId).length;
    const losses = matches.filter(match => match.winnerId && match.winnerId !== studentId).length;
    const draws = matches.filter(match => match.winnerId === null).length;
    const activeMatches = matches.filter(match => match.status === 'ONGOING').length;
    const completedMatches = matches.filter(match => match.status === 'COMPLETED').length;

    // 计算胜率
    const winRate = completedMatches > 0 ? (wins / completedMatches * 100).toFixed(1) : '0.0';

    // 按主题统计
    const topicStats = matches.reduce((acc, match) => {
      const topic = match.topic;
      if (!acc[topic]) {
        acc[topic] = {
          total: 0,
          wins: 0,
          draws: 0,
          losses: 0
        };
      }
      acc[topic].total++;
      if (match.winnerId === studentId) {
        acc[topic].wins++;
      } else if (match.winnerId === null) {
        acc[topic].draws++;
      } else if (match.winnerId) {
        acc[topic].losses++;
      }
      return acc;
    }, {} as Record<string, any>);

    // 最近对战记录
    const recentMatches = matches.slice(0, 10).map(match => ({
      id: match.id,
      topic: match.topic,
      status: match.status,
      createdAt: match.createdAt,
      opponent: match.studentA === studentId ? match.playerB : match.playerA,
      result: match.status === 'COMPLETED'
        ? (match.winnerId === studentId ? 'win' : (match.winnerId === null ? 'draw' : 'lose'))
        : null
    }));

    return {
      student: {
        id: student.id,
        name: student.name,
        className: student.className,
        exp: student.exp
      },
      stats: {
        totalMatches,
        wins,
        losses,
        draws,
        activeMatches,
        completedMatches,
        winRate
      },
      topicStats,
      recentMatches
    };
  }

  /**
   * 获取PK排行榜
   */
  async getPKLeaderboard(schoolId: string, limit: number = 10): Promise<any[]> {
    // 获取所有学生的PK统计
    const students = await this.prisma.students.findMany({
      where: {
        schoolId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        className: true,
        avatarUrl: true,
        exp: true
      }
    });

    // 为每个学生计算PK统计
    const studentStats = await Promise.all(
      students.map(async (student) => {
        const matches = await this.prisma.pk_matches.findMany({
          where: {
            schoolId,
            OR: [
              { studentA: student.id },
              { studentB: student.id }
            ]
          }
        });

        const totalMatches = matches.length;
        const wins = matches.filter(match => match.winnerId === student.id).length;
        const completedMatches = matches.filter(match => match.status === 'COMPLETED').length;
        const winRate = completedMatches > 0 ? wins / completedMatches * 100 : 0;

        return {
          student,
          stats: {
            totalMatches,
            wins,
            completedMatches,
            winRate
          }
        };
      })
    );

    // 按胜率和胜利次数排序
    return studentStats
      .filter(stat => stat.stats.totalMatches > 0) // 只显示有对战记录的学生
      .sort((a, b) => {
        // 先按胜率排序，然后按胜利次数排序
        if (b.stats.winRate !== a.stats.winRate) {
          return b.stats.winRate - a.stats.winRate;
        }
        return b.stats.wins - a.stats.wins;
      })
      .slice(0, limit)
      .map((stat, index) => ({
        rank: index + 1,
        ...stat.student,
        totalMatches: stat.stats.totalMatches,
        wins: stat.stats.wins,
        completedMatches: stat.stats.completedMatches,
        winRate: stat.stats.winRate.toFixed(1)
      }));
  }

  /**
   * 获取PK统计信息
   */
  async getPKStats(schoolId: string): Promise<PKMatchStatsResponse> {
    // 获取PK对战总数和状态分布
    const [totalMatches, activeMatches, completedMatches] = await Promise.all([
      this.prisma.pk_matches.count({
        where: { schoolId }
      }),
      this.prisma.pk_matches.count({
        where: { schoolId, status: 'ONGOING' }
      }),
      this.prisma.pk_matches.count({
        where: { schoolId, status: 'COMPLETED' }
      })
    ]);

    // 获取参与统计
    const participantMatches = await this.prisma.pk_matches.findMany({
      where: { schoolId },
      select: {
        studentA: true,
        studentB: true
      }
    });

    const uniqueParticipants = new Set();
    participantMatches.forEach(match => {
      uniqueParticipants.add(match.studentA);
      uniqueParticipants.add(match.studentB);
    });

    const totalParticipants = uniqueParticipants.size;
    const averageMatchesPerStudent = totalParticipants > 0 ? Math.round(totalMatches / totalParticipants * 2) : 0;

    // 按主题统计
    const popularTopics = await this.prisma.pk_matches.groupBy({
      by: ['topic'],
      where: { schoolId },
      _count: {
        topic: true
      },
      orderBy: {
        _count: {
          topic: 'desc'
        }
      },
      take: 10
    });

    const topicStats = popularTopics.map(stat => ({
      topic: stat.topic,
      count: stat._count.topic
    }));

    // 获取最近活动
    const recentActivities = await this.prisma.pk_matches.findMany({
      where: { schoolId },
      include: {
        playerA: {
          select: {
            id: true,
            name: true,
            className: true
          }
        },
        playerB: {
          select: {
            id: true,
            name: true,
            className: true
          }
        },
        winner: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return {
      totalMatches,
      activeMatches,
      completedMatches,
      totalParticipants,
      averageMatchesPerStudent,
      popularTopics: topicStats,
      recentActivities
    };
  }

  /**
   * 给予PK对战奖励
   */
  private async grantMatchRewards(match: any): Promise<void> {
    const metadata = (match.metadata as any) || {};
    const expReward = metadata.expReward || 50;
    const pointsReward = metadata.pointsReward || 20;

    // 1. 发放学生属性奖励
    if (match.winnerId) {
      // 获胜者获得全部
      await this.prisma.students.update({
        where: { id: match.winnerId },
        data: {
          exp: { increment: expReward },
          points: { increment: pointsReward }
        }
      });

      // 创建汇总记录 (SPECIAL类型) - 用于学情时间轴汇总
      await this.prisma.task_records.create({
        data: {
          id: require('crypto').randomUUID(),
          studentId: match.winnerId,
          schoolId: match.schoolId,
          type: 'SPECIAL',
          title: `PK对决获胜: ${match.topic}`,
          content: {
            matchId: match.id,
            topic: match.topic,
            opponentName: match.winnerId === match.studentA ? match.playerB?.name : match.playerA?.name,
            result: 'WIN'
          },
          expAwarded: expReward,
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });
    } else {
      // 平局 - 两人平分奖励
      const halfExp = Math.floor(expReward / 2);
      const halfPoints = Math.floor(pointsReward / 2);

      await this.prisma.students.updateMany({
        where: { id: { in: [match.studentA, match.studentB] } },
        data: {
          exp: { increment: halfExp },
          points: { increment: halfPoints }
        }
      });

      // 为双方创建平局记录
      for (const sid of [match.studentA, match.studentB]) {
        await this.prisma.task_records.create({
          data: {
            id: require('crypto').randomUUID(),
            studentId: sid,
            schoolId: match.schoolId,
            type: 'SPECIAL',
            title: `PK对决平局: ${match.topic}`,
            content: { matchId: match.id, topic: match.topic, result: 'DRAW' },
            expAwarded: halfExp,
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });
      }
    }

    // 2. 同时更新之前的 CHALLENGE 任务状态为已完成
    await this.prisma.task_records.updateMany({
      where: {
        schoolId: match.schoolId,
        studentId: { in: [match.studentA, match.studentB] },
        type: 'CHALLENGE',
        content: { path: ['matchId'], equals: match.id }
      },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });
  }

  /**
   * 计算对战统计信息
   */
  private calculateMatchStats(match: any): any {
    return {
      isPlayerAWinner: match.winnerId === match.studentA,
      isPlayerBWinner: match.winnerId === match.studentB,
      isDraw: match.winnerId === null
    };
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

export default PKMatchService;
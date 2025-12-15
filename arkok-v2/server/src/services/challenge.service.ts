import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

export interface ChallengeQuery {
  schoolId: string;
  search?: string;
  type?: string;
  status?: string;
  creatorId?: string;
  page?: number;
  limit?: number;
}

export interface CreateChallengeRequest {
  title: string;
  description?: string;
  type: string;
  schoolId: string;
  creatorId: string;
  startDate?: Date;
  endDate?: Date;
  rewardPoints?: number;
  rewardExp?: number;
  maxParticipants?: number;
  metadata?: Record<string, any>;
}

export interface UpdateChallengeRequest {
  id: string;
  schoolId: string;
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  rewardPoints?: number;
  rewardExp?: number;
  maxParticipants?: number;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface JoinChallengeRequest {
  challengeId: string;
  studentId: string;
  schoolId: string;
}

export interface UpdateChallengeParticipantRequest {
  challengeId: string;
  studentId: string;
  schoolId: string;
  status?: string;
  result?: string;
  score?: number;
  notes?: string;
}

export interface ChallengeListResponse {
  challenges: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChallengeStatsResponse {
  totalChallenges: number;
  activeChallenges: number;
  completedChallenges: number;
  totalParticipants: number;
  averageParticipation: number;
  challengeTypes: {
    type: string;
    count: number;
  }[];
  recentActivities: any[];
}

export class ChallengeService {
  private prisma = new PrismaClient();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * 获取挑战列表
   */
  async getChallenges(query: ChallengeQuery): Promise<ChallengeListResponse> {
    const { schoolId, search, type, status, creatorId, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      schoolId,
      ...(type && { type: type as any }),
      ...(status && { status: status as any }),
      ...(creatorId && { creatorId })
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // 获取总数
    const total = await this.prisma.challenge.count({ where });

    // 获取挑战列表
    const challenges = await this.prisma.challenge.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' },
        { startDate: 'desc' }
      ],
      skip,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    // 计算分页信息
    const totalPages = Math.ceil(total / limit);

    return {
      challenges: challenges.map(challenge => ({
        ...challenge,
        participantCount: challenge._count.participants
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
   * 根据ID获取单个挑战详情
   */
  async getChallengeById(id: string, schoolId: string): Promise<any> {
    const challenge = await this.prisma.challenge.findFirst({
      where: {
        id,
        schoolId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        participants: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                className: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            joinedAt: 'desc'
          }
        }
      }
    });

    if (!challenge) {
      throw new Error('挑战不存在');
    }

    // 计算挑战统计信息
    const stats = this.calculateChallengeStats(challenge.participants);

    return {
      ...challenge,
      stats
    };
  }

  /**
   * 创建新挑战
   */
  async createChallenge(data: CreateChallengeRequest): Promise<any> {
    const { title, description, type, schoolId, creatorId, startDate, endDate, rewardPoints, rewardExp, maxParticipants, metadata } = data;

    // 验证创建者是否存在且属于该学校
    const creator = await this.prisma.teacher.findFirst({
      where: {
        id: creatorId,
        schoolId
      }
    });

    if (!creator) {
      throw new Error('创建者不存在或不属于该学校');
    }

    const challenge = await this.prisma.challenge.create({
      data: {
        title,
        description,
        type: type as any,
        schoolId,
        creatorId,
        startDate: startDate || new Date(),
        endDate,
        rewardPoints: rewardPoints || 0,
        rewardExp: rewardExp || 0,
        maxParticipants: maxParticipants || 2,
        metadata,
        status: 'DRAFT' as any
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    // 广播挑战创建事件
    this.broadcastToSchool(schoolId, {
      type: 'CHALLENGE_CREATED',
      data: {
        challenge,
        timestamp: new Date().toISOString()
      }
    });

    return challenge;
  }

  /**
   * 更新挑战信息
   */
  async updateChallenge(data: UpdateChallengeRequest): Promise<any> {
    const { id, schoolId, title, description, type, status, startDate, endDate, rewardPoints, rewardExp, maxParticipants, metadata, isActive } = data;

    const challenge = await this.prisma.challenge.update({
      where: {
        id,
        schoolId
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
        ...(startDate && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(rewardPoints !== undefined && { rewardPoints }),
        ...(rewardExp !== undefined && { rewardExp }),
        ...(maxParticipants !== undefined && { maxParticipants }),
        ...(metadata !== undefined && { metadata }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    // 广播挑战更新事件
    this.broadcastToSchool(schoolId, {
      type: 'CHALLENGE_UPDATED',
      data: {
        challenge: {
          ...challenge,
          participantCount: challenge._count.participants
        },
        timestamp: new Date().toISOString()
      }
    });

    return {
      ...challenge,
      participantCount: challenge._count.participants
    };
  }

  /**
   * 删除挑战（软删除）
   */
  async deleteChallenge(id: string, schoolId: string): Promise<void> {
    await this.prisma.challenge.update({
      where: {
        id,
        schoolId
      },
      data: {
        isActive: false
      }
    });

    // 广播挑战删除事件
    this.broadcastToSchool(schoolId, {
      type: 'CHALLENGE_DELETED',
      data: {
        challengeId: id,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * 学生参加挑战
   */
  async joinChallenge(data: JoinChallengeRequest): Promise<any> {
    const { challengeId, studentId, schoolId } = data;

    // 验证挑战是否存在且属于该学校
    const challenge = await this.prisma.challenge.findFirst({
      where: {
        id: challengeId,
        schoolId,
        isActive: true
      }
    });

    if (!challenge) {
      throw new Error('挑战不存在或已停用');
    }

    // 验证学生是否存在且属于该学校
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        isActive: true
      }
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    // 检查挑战状态和时间
    const now = new Date();
    if (challenge.startDate && now < challenge.startDate) {
      throw new Error('挑战尚未开始');
    }

    if (challenge.endDate && now > challenge.endDate) {
      throw new Error('挑战已结束');
    }

    // 检查是否已参加
    const existingParticipant = await this.prisma.challengeParticipant.findFirst({
      where: {
        challengeId,
        studentId
      }
    });

    if (existingParticipant) {
      throw new Error('已参加该挑战');
    }

    // 检查参与人数限制
    const currentParticipants = await this.prisma.challengeParticipant.count({
      where: {
        challengeId
      }
    });

    if (challenge.maxParticipants && currentParticipants >= challenge.maxParticipants) {
      throw new Error('挑战参与人数已满');
    }

    // 创建参与记录
    const participant = await this.prisma.challengeParticipant.create({
      data: {
        challengeId,
        studentId,
        status: 'JOINED' as any
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true
          }
        }
      }
    });

    // 广播参与事件
    this.broadcastToSchool(schoolId, {
      type: 'CHALLENGE_JOINED',
      data: {
        challengeId,
        participant,
        challenge: {
          id: challenge.id,
          title: challenge.title
        },
        timestamp: new Date().toISOString()
      }
    });

    return participant;
  }

  /**
   * 更新挑战参与者状态
   */
  async updateChallengeParticipant(data: UpdateChallengeParticipantRequest): Promise<any> {
    const { challengeId, studentId, schoolId, status, result, score, notes } = data;

    // 验证挑战是否存在且属于该学校
    const challenge = await this.prisma.challenge.findFirst({
      where: {
        id: challengeId,
        schoolId
      }
    });

    if (!challenge) {
      throw new Error('挑战不存在');
    }

    // 查找参与记录
    const participant = await this.prisma.challengeParticipant.findFirst({
      where: {
        challengeId,
        studentId
      }
    });

    if (!participant) {
      throw new Error('参与记录不存在');
    }

    // 更新参与记录
    const updatedParticipant = await this.prisma.challengeParticipant.update({
      where: {
        id: participant.id
      },
      data: {
        ...(status && { status: status as any }),
        ...(result && { result: result as any }),
        ...(score !== undefined && { score }),
        ...(notes !== undefined && { notes }),
        ...(result === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true
          }
        }
      }
    });

    // 如果完成了挑战，给予奖励
    if (result === 'COMPLETED' && participant.result !== 'COMPLETED') {
      await this.grantChallengeRewards(studentId, challenge, updatedParticipant);
    }

    // 广播更新事件
    this.broadcastToSchool(schoolId, {
      type: 'CHALLENGE_PARTICIPANT_UPDATED',
      data: {
        challengeId,
        participant: updatedParticipant,
        challenge: {
          id: challenge.id,
          title: challenge.title
        },
        timestamp: new Date().toISOString()
      }
    });

    return updatedParticipant;
  }

  /**
   * 获取挑战参与者列表
   */
  async getChallengeParticipants(challengeId: string, schoolId: string, page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;

    // 验证挑战是否存在且属于该学校
    const challenge = await this.prisma.challenge.findFirst({
      where: {
        id: challengeId,
        schoolId
      }
    });

    if (!challenge) {
      throw new Error('挑战不存在');
    }

    // 获取总数
    const total = await this.prisma.challengeParticipant.count({
      where: {
        challengeId
      }
    });

    // 获取参与者列表
    const participants = await this.prisma.challengeParticipant.findMany({
      where: {
        challengeId
      },
      orderBy: [
        { score: 'desc' },
        { completedAt: 'asc' },
        { joinedAt: 'desc' }
      ],
      skip,
      take: limit,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            className: true,
            avatarUrl: true,
            exp: true,
            points: true
          }
        }
      }
    });

    // 计算分页信息和排名
    const totalPages = Math.ceil(total / limit);
    const participantsWithRank = participants.map((participant, index) => ({
      ...participant,
      rank: skip + index + 1
    }));

    return {
      participants: participantsWithRank,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      challenge: {
        id: challenge.id,
        title: challenge.title,
        maxParticipants: challenge.maxParticipants
      }
    };
  }

  /**
   * 获取学生挑战统计
   */
  async getStudentChallengeStats(studentId: string, schoolId: string): Promise<any> {
    // 验证学生是否存在且属于该学校
    const student = await this.prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId,
        isActive: true
      }
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    // 获取学生的参与记录
    const participants = await this.prisma.challengeParticipant.findMany({
      where: {
        studentId
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            rewardPoints: true,
            rewardExp: true,
            startDate: true,
            endDate: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    // 计算统计信息
    const totalChallenges = participants.length;
    const completedChallenges = participants.filter(p => p.result === 'COMPLETED').length;
    const inProgressChallenges = participants.filter(p => p.status === 'JOINED' && p.result !== 'COMPLETED').length;
    const totalPoints = participants.filter(p => p.result === 'COMPLETED').reduce((sum, p) => sum + (p.challenge.rewardPoints || 0), 0);
    const totalExp = participants.filter(p => p.result === 'COMPLETED').reduce((sum, p) => sum + (p.challenge.rewardExp || 0), 0);

    // 按类型分组统计
    const typeStats = participants.reduce((acc, participant) => {
      const type = participant.challenge.type;
      if (!acc[type]) {
        acc[type] = {
          total: 0,
          completed: 0,
          totalPoints: 0,
          totalExp: 0
        };
      }
      acc[type].total++;
      if (participant.result === 'COMPLETED') {
        acc[type].completed++;
        acc[type].totalPoints += participant.challenge.rewardPoints || 0;
        acc[type].totalExp += participant.challenge.rewardExp || 0;
      }
      return acc;
    }, {} as Record<string, any>);

    return {
      student: {
        id: student.id,
        name: student.name,
        className: student.className
      },
      stats: {
        totalChallenges,
        completedChallenges,
        inProgressChallenges,
        completionRate: totalChallenges > 0 ? (completedChallenges / totalChallenges * 100).toFixed(1) : '0.0',
        totalPoints,
        totalExp
      },
      typeStats,
      recentParticipations: participants.slice(0, 10)
    };
  }

  /**
   * 获取挑战统计信息
   */
  async getChallengeStats(schoolId: string): Promise<ChallengeStatsResponse> {
    // 获取挑战总数和状态分布
    const [totalChallenges, activeChallenges, completedChallenges] = await Promise.all([
      this.prisma.challenge.count({
        where: { schoolId }
      }),
      this.prisma.challenge.count({
        where: { schoolId, status: 'ACTIVE' }
      }),
      this.prisma.challenge.count({
        where: { schoolId, status: 'COMPLETED' }
      })
    ]);

    // 获取参与统计
    const totalParticipants = await this.prisma.challengeParticipant.count({
      where: {
        challenge: {
          schoolId
        }
      }
    });

    const averageParticipation = totalChallenges > 0 ? Math.round(totalParticipants / totalChallenges) : 0;

    // 按类型统计挑战
    const challengeTypes = await this.prisma.challenge.groupBy({
      by: ['type'],
      where: { schoolId },
      _count: {
        type: true
      }
    });

    const typeStats = challengeTypes.map(stat => ({
      type: stat.type,
      count: stat._count.type
    }));

    // 获取最近活动
    const recentActivities = await this.prisma.challengeParticipant.findMany({
      where: {
        challenge: {
          schoolId
        }
      },
      include: {
        challenge: {
          select: {
            id: true,
            title: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            className: true
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      },
      take: 10
    });

    return {
      totalChallenges,
      activeChallenges,
      completedChallenges,
      totalParticipants,
      averageParticipation,
      challengeTypes: typeStats,
      recentActivities
    };
  }

  /**
   * 给予挑战奖励
   */
  private async grantChallengeRewards(studentId: string, challenge: any, participant: any): Promise<void> {
    // 更新学生积分和经验
    await this.prisma.student.update({
      where: { id: studentId },
      data: {
        points: { increment: challenge.rewardPoints || 0 },
        exp: { increment: challenge.rewardExp || 0 }
      }
    });

    // 创建任务记录
    await this.prisma.taskRecord.create({
      data: {
        studentId,
        schoolId: challenge.schoolId,
        type: 'CHALLENGE',
        title: `完成挑战 - ${challenge.title}`,
        content: {
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          score: participant.score,
          notes: participant.notes
        },
        status: 'COMPLETED',
        expAwarded: challenge.rewardExp || 0
      }
    });
  }

  /**
   * 计算挑战统计信息
   */
  private calculateChallengeStats(participants: any[]): any {
    const total = participants.length;
    const completed = participants.filter(p => p.result === 'COMPLETED').length;
    const inProgress = participants.filter(p => p.status === 'JOINED' && p.result !== 'COMPLETED').length;
    const averageScore = completed > 0
      ? participants.filter(p => p.score !== null).reduce((sum, p) => sum + (p.score || 0), 0) / completed
      : 0;

    return {
      totalParticipants: total,
      completedParticipants: completed,
      inProgressParticipants: inProgress,
      completionRate: total > 0 ? (completed / total * 100).toFixed(1) : '0.0',
      averageScore: Math.round(averageScore)
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

export default ChallengeService;
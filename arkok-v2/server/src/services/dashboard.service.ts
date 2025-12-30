import { PrismaClient } from '@prisma/client';

export interface SchoolStats {
  totalStudents: number;
  totalPoints: number;
  totalExp: number;
  avgPoints: number;
  avgExp: number;
}

export interface TopStudent {
  id: string;
  name: string;
  className: string;
  level: number;
  points: number;
  exp: number;
  avatarUrl?: string;
  teamId?: string;
}

export interface PKMatch {
  id: string;
  topic: string;
  status: string;
  playerA: {
    id: string;
    name: string;
    className: string;
    avatarUrl?: string;
  };
  playerB: {
    id: string;
    name: string;
    className: string;
    avatarUrl?: string;
  };
  createdAt: string;
  student_a: string;
  student_b: string;
  winner_id?: string;
}

export interface Challenge {
  id: string;
  title: string;
  type: string;
  expAwarded: number;
  student: {
    id: string;
    name: string;
    className: string;
    avatarUrl?: string;
  };
  submittedAt: string;
  status: string;
}

export interface ClassStats {
  className: string;
  studentCount: number;
  totalPoints: number;
  totalExp: number;
  avgPoints: number;
  avgExp: number;
}

export interface DashboardData {
  schoolStats: SchoolStats;
  topStudents: TopStudent[];
  ongoingPKs: PKMatch[];
  activePKs: PKMatch[]; // 兼容旧版本
  recentChallenges: Challenge[];
  classRanking: ClassStats[];
}

// 大屏专用数据接口
export interface BigscreenStudent {
  id: string;
  name: string;
  avatarUrl?: string;
  level: number;
  exp: number;
  expProgress: number;      // 当前等级进度 0-100
  expForNextLevel: number;  // 下一级所需经验
  points: number;
  rank: number;
}

export interface PKResult {
  id: string;
  winner: { id: string; name: string; avatarUrl?: string; score: number };
  loser: { id: string; name: string; avatarUrl?: string; score: number };
  topic: string;
  finishedAt: string;
  rewardPoints?: number;
  rewardExp?: number;
}

export interface ChallengeResult {
  id: string;
  studentName: string;
  title: string;
  success: boolean;
  expAwarded: number;
  finishedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'task' | 'pk' | 'challenge' | 'badge' | 'levelup';
  studentName: string;
  content: string;
  expAwarded: number;
  timestamp: string;
}

export interface BadgeItem {
  id: string;
  badgeName: string;
  badgeIcon: string;
  badgeDescription: string;
  studentName: string;
  earnedAt: string;
}

export interface BigscreenData {
  taskCompletionRate: number;
  students: BigscreenStudent[];
  pkResults: PKResult[];
  challengeResults: ChallengeResult[];
  activities: ActivityItem[];
  recentBadges: BadgeItem[];
  publicBounties?: { title: string, points: number, exp: number }[];
}

export class DashboardService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * 获取仪表板数据
   */
  async getDashboardData(schoolId?: string): Promise<DashboardData> {
    // 如果没有提供schoolId，查找有学生的活跃学校
    if (!schoolId) {
      const schoolsWithStudents = await this.prisma.schools.findMany({
        where: {
          isActive: true,
          students: {
            some: { isActive: true }
          }
        },
        take: 1
      });

      // 如果没有有学生的学校，则使用第一个活跃学校
      if (schoolsWithStudents.length === 0) {
        const allSchools = await this.prisma.schools.findMany({
          where: { isActive: true },
          take: 1
        });
        schoolId = allSchools.length > 0 ? allSchools[0].id : 'demo';
      } else {
        schoolId = schoolsWithStudents[0].id;
      }
    }

    console.log('🔍 [DASHBOARD] Starting parallel queries for school:', schoolId);

    const [topStudents, ongoingPKs, recentChallenges, allStudents] = await Promise.allSettled([
      // 获取前十名学生
      this.prisma.students.findMany({
        where: { schoolId },
        orderBy: { exp: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          className: true,
          level: true,
          points: true,
          exp: true,
          avatarUrl: true,
          teamId: true
        }
      }),

      // 获取进行中的PK比赛
      this.prisma.pk_matches.findMany({
        where: {
          schoolId,
          status: 'ONGOING'
        },
        take: 5,
        include: {
          playerA: {
            select: { id: true, name: true, className: true, avatarUrl: true }
          },
          playerB: {
            select: { id: true, name: true, className: true, avatarUrl: true }
          }
        }
      }),

      // 获取最近完成的挑战 (从 task_records 获取以对齐 SSOT)
      this.prisma.task_records.findMany({
        where: {
          schoolId,
          type: 'CHALLENGE',
          status: 'COMPLETED'
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          students: {
            select: { id: true, name: true, className: true, avatarUrl: true }
          }
        }
      }),

      // 获取所有学生用于统计
      this.prisma.students.findMany({
        where: { schoolId },
        select: {
          id: true,
          points: true,
          exp: true,
          className: true
        }
      })
    ]);

    // 处理结果
    const students = topStudents.status === 'fulfilled' ? topStudents.value : [];
    const pkMatches = ongoingPKs.status === 'fulfilled' ? ongoingPKs.value : [];
    const challenges = recentChallenges.status === 'fulfilled' ? recentChallenges.value : [];
    const allStudentsData = allStudents.status === 'fulfilled' ? allStudents.value : [];

    // 计算学校统计数据
    const totalStudents = allStudentsData.length;
    const totalPoints = allStudentsData.reduce((sum, student) => sum + (student.points || 0), 0);
    const totalExp = allStudentsData.reduce((sum, student) => sum + (student.exp || 0), 0);
    const avgPoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;
    const avgExp = totalStudents > 0 ? Math.round(totalExp / totalStudents) : 0;

    // 计算班级排行
    const classStats = allStudentsData.reduce((acc: any, student) => {
      const className = student.className || '未分班';
      if (!acc[className]) {
        acc[className] = {
          className,
          studentCount: 0,
          totalPoints: 0,
          totalExp: 0
        };
      }
      acc[className].studentCount++;
      acc[className].totalPoints += student.points || 0;
      acc[className].totalExp += student.exp || 0;
      return acc;
    }, {});

    const classRanking = Object.values(classStats)
      .map((cls: any) => ({
        ...cls,
        avgPoints: Math.round(cls.totalPoints / cls.studentCount),
        avgExp: Math.round(cls.totalExp / cls.studentCount)
      }))
      .sort((a: any, b: any) => b.totalExp - a.totalExp);

    // 格式化PK数据
    const formattedPKs = pkMatches.map(pk => ({
      id: pk.id,
      topic: pk.topic || 'PK对决',
      status: pk.status.toLowerCase(),
      playerA: (pk as any).playerA || {
        id: pk.studentA,
        name: '选手A',
        className: '待定',
        avatarUrl: undefined
      },
      playerB: (pk as any).playerB || {
        id: pk.studentB,
        name: '选手B',
        className: '待定',
        avatarUrl: undefined
      },
      createdAt: pk.createdAt.toISOString(),
      student_a: pk.studentA,
      student_b: pk.studentB,
      winner_id: pk.winnerId
    }));

    // 格式化挑战数据
    const formattedChallenges = challenges.map((record: any) => ({
      id: record.id,
      title: record.title,
      type: 'CHALLENGE',
      expAwarded: record.expAwarded || 0,
      student: record.students,
      submittedAt: record.updatedAt.toISOString(),
      status: 'success'
    }));

    return {
      schoolStats: {
        totalStudents,
        totalPoints,
        totalExp,
        avgPoints,
        avgExp
      },
      topStudents: students,
      ongoingPKs: formattedPKs,
      activePKs: formattedPKs, // 兼容旧版本
      recentChallenges: formattedChallenges,
      classRanking
    };
  }

  /**
   * 获取大屏专用数据
   */
  async getBigscreenData(schoolId: string): Promise<BigscreenData> {
    console.log('📺 [BIGSCREEN] Fetching data for school:', schoolId);

    // 经验进度计算辅助函数
    const getExpRequiredForLevel = (level: number): number => {
      if (level <= 5) return 30;
      if (level <= 10) return 50;
      if (level <= 15) return 80;
      if (level <= 20) return 120;
      if (level <= 25) return 160;
      if (level <= 30) return 200;
      if (level <= 40) return 280;
      if (level <= 50) return 400;
      return 500;
    };

    const calculateLevelProgress = (totalExp: number): { level: number; expProgress: number; expForNextLevel: number } => {
      let level = 1;
      let expUsed = 0;
      while (expUsed + getExpRequiredForLevel(level) <= totalExp) {
        expUsed += getExpRequiredForLevel(level);
        level++;
      }
      const currentLevelExp = totalExp - expUsed;
      const expForNextLevel = getExpRequiredForLevel(level);
      const expProgress = Math.floor((currentLevelExp / expForNextLevel) * 100);
      return { level, expProgress, expForNextLevel };
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today; // Alias for consistency with the provided snippet

    const [allStudentsResult, completedPKsResult, completedChallengesResult, activeBountiesResult, recentBadgesResult, recentTasksResult, todayTasksCountResult] = await Promise.allSettled([
      // 1. 获取所有学生
      this.prisma.students.findMany({ // Changed from student to students to match original schema
        where: { schoolId, isActive: true }, // Added isActive: true from original
        orderBy: [ // Added orderBy from original
          { level: 'desc' },
          { exp: 'desc' }
        ],
        select: { id: true, name: true, avatarUrl: true, exp: true, points: true, level: true },
      }),
      // 2. 获取今日已完成的 PK
      this.prisma.pk_matches.findMany({ // Changed from battleMatch to pk_matches to match original schema
        where: {
          schoolId,
          status: 'COMPLETED',
          updatedAt: { gte: todayStart }, // Changed from finishedAt to updatedAt to match original schema
        },
        include: { playerA: { select: { id: true, name: true, avatarUrl: true } }, playerB: { select: { id: true, name: true, avatarUrl: true } } }, // Adjusted include to match original structure
        orderBy: { updatedAt: 'desc' }, // Changed from finishedAt to updatedAt
        take: 10,
      }),
      // 3. 今日已完成的挑战记录（个人判定）
      this.prisma.challenge_participants.findMany({
        where: {
          challenges: { schoolId },
          completedAt: { gte: todayStart },
          result: { not: null }
        },
        include: { students: { select: { name: true } }, challenges: { select: { title: true, rewardExp: true, rewardPoints: true } } },
        orderBy: { completedAt: 'desc' },
        take: 10,
      }),
      // 4. 获取当前选课中的“公开悬赏”（CLASS 类型的 ACTIVE 挑战）
      this.prisma.challenges.findMany({ // Changed from challenge to challenges to match original schema
        where: {
          schoolId,
          type: 'CLASS',
          status: 'ACTIVE'
        },
        orderBy: { startDate: 'desc' },
        take: 5
      }),
      // 5. 最近获得的勋章
      this.prisma.student_badges.findMany({ // Changed from studentBadge to student_badges to match original schema
        where: { students: { schoolId } }, // Changed from schoolId to students: { schoolId } to match original schema
        include: { students: { select: { name: true } }, badges: { select: { id: true, name: true, icon: true, description: true } } }, // Adjusted include to match original structure
        orderBy: { awardedAt: 'desc' }, // Changed from earnedAt to awardedAt
        take: 15,
      }),
      // 6. 最近任务完成（实时动态）- 过滤特定类型 (from original)
      this.prisma.task_records.findMany({
        where: {
          schoolId,
          status: 'COMPLETED',
          updatedAt: { gte: today },
          task_category: {
            in: ['HABIT', 'BADGE', 'CHALLENGE', 'PK', 'PROGRESS', 'METHODOLOGY', 'GROWTH', 'PERSONALIZED', 'SPECIAL']
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: {
          students: { select: { name: true } }
        }
      }),
      // 7. 今日任务总数（用于计算完成率）(from original)
      this.prisma.task_records.count({
        where: {
          schoolId,
          createdAt: { gte: today }
        }
      })
    ]);

    // 处理学生数据
    const studentsData = allStudentsResult.status === 'fulfilled' ? allStudentsResult.value : [];

    // 1. 先计算所有人的真实等级与进度
    let students: BigscreenStudent[] = studentsData.map((s) => {
      const progress = calculateLevelProgress(s.exp);
      return {
        id: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl || undefined,
        level: progress.level,
        exp: s.exp,
        expProgress: progress.expProgress,
        expForNextLevel: progress.expForNextLevel,
        points: s.points,
        rank: 0 // 稍后计算
      };
    });

    // 2. 根据计算出的真实等级 (Level) 优先，其次经验 (Exp) 进行内存排序
    students.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      if (b.exp !== a.exp) return b.exp - a.exp;
      return b.points - a.points;
    });

    // 3. 重新分配基于真实等级的排名
    students = students.map((s, index) => ({
      ...s,
      rank: index + 1
    }));

    // 处理 PK 结果
    const pksData = completedPKsResult.status === 'fulfilled' ? completedPKsResult.value : [];
    const pkResults: PKResult[] = pksData.map(pk => {
      const isAWinner = pk.winnerId === pk.studentA;
      const metadata = (pk.metadata as any) || {};
      return {
        id: pk.id,
        winner: {
          id: isAWinner ? pk.studentA : pk.studentB,
          name: isAWinner ? (pk as any).playerA?.name : (pk as any).playerB?.name,
          avatarUrl: isAWinner ? (pk as any).playerA?.avatarUrl : (pk as any).playerB?.avatarUrl,
          score: metadata.scoreA || 0
        },
        loser: {
          id: isAWinner ? pk.studentB : pk.studentA,
          name: isAWinner ? (pk as any).playerB?.name : (pk as any).playerA?.name,
          avatarUrl: isAWinner ? (pk as any).playerB?.avatarUrl : (pk as any).playerA?.avatarUrl,
          score: metadata.scoreB || 0
        },
        topic: pk.topic || 'PK对决',
        finishedAt: pk.updatedAt.toISOString(),
        rewardPoints: metadata.rewardPoints || 100,
        rewardExp: metadata.rewardExp || 50
      };
    });

    // 处理挑战结果
    const challengesData = completedChallengesResult.status === 'fulfilled' ? completedChallengesResult.value : [];
    const challengeResults: ChallengeResult[] = challengesData.map(c => ({
      id: c.id,
      studentName: (c as any).students?.name || '未知',
      title: (c as any).challenges?.title || '未知挑战',
      success: c.result === 'COMPLETED',
      expAwarded: (c as any).challenges?.rewardExp || 0,
      finishedAt: c.completedAt ? c.completedAt.toISOString() : c.joinedAt.toISOString()
    }));

    // 处理实时动态
    const tasksData = recentTasksResult.status === 'fulfilled' ? recentTasksResult.value : [];
    const activities: ActivityItem[] = tasksData.slice(0, 10).map(t => {
      // 根据 task_category 映射类型
      const categoryMap: Record<string, string> = {
        'HABIT': 'habit',
        'BADGE': 'badge',
        'CHALLENGE': 'challenge',
        'PK': 'pk',
        'PROGRESS': 'progress',
        'METHODOLOGY': 'methodology',
        'GROWTH': 'growth',
        'PERSONALIZED': 'personalized',
        'SPECIAL': 'special'
      };
      return {
        id: t.id,
        type: (categoryMap[t.task_category] || 'task') as any,
        studentName: (t as any).students?.name || '未知',
        content: t.title,
        expAwarded: t.expAwarded || 0,
        timestamp: t.updatedAt.toISOString()
      };
    });

    // 处理勋章数据
    const badgesData = recentBadgesResult.status === 'fulfilled' ? recentBadgesResult.value : [];
    const recentBadgesList: BadgeItem[] = badgesData.map(b => ({
      id: b.id,
      badgeName: (b as any).badges?.name || '勋章',
      badgeIcon: (b as any).badges?.icon || '🏅',
      badgeDescription: (b as any).badges?.description || '在相应领域表现优异，获得此项荣誉。继续加油！',
      studentName: (b as any).students?.name || '未知',
      earnedAt: b.awardedAt.toISOString()
    }));

    // 计算任务完成率
    const totalTasksToday = todayTasksCountResult.status === 'fulfilled' ? todayTasksCountResult.value : 0;
    const completedTasksToday = tasksData.length;
    const taskCompletionRate = totalTasksToday > 0 ? Math.round((completedTasksToday / totalTasksToday) * 100) : 0;

    // 4. 处理公开悬赏
    const bountiesData = activeBountiesResult.status === 'fulfilled' ? activeBountiesResult.value : [];
    const publicBounties = bountiesData.map(b => ({
      title: b.title,
      points: b.rewardPoints,
      exp: b.rewardExp
    }));

    // 组装最终结果
    const result: BigscreenData = {
      taskCompletionRate,
      students: students.slice(0, 50),
      pkResults,
      challengeResults,
      activities: activities.slice(0, 10),
      recentBadges: recentBadgesList,
      publicBounties
    };
    return result;
  }
}

export default DashboardService;
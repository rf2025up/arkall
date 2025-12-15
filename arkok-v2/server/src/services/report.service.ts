import { PrismaClient } from '@prisma/client';

// 类型定义 - 遵循 TypeScript 类型安全宪法
export interface StudentStatsRequest {
  studentId: string;
  schoolId: string;
  startDate: Date;
  endDate: Date;
}

export interface StudentStatsData {
  // 基础信息
  studentInfo: {
    name: string;
    className: string;
    level: number;
    points: number;
    exp: number;
  };

  // 任务统计
  tasks: {
    completedCount: number;
    totalExp: number;
    breakdown: {
      [key: string]: number; // 按任务类型分组
    };
  };

  // 勋章统计
  badges: {
    earnedCount: number;
    recentBadges: Array<{
      name: string;
      category: string;
      awardedAt: Date;
    }>;
  };

  // PK战绩
  pkMatches: {
    totalMatches: number;
    wins: number;
    winRate: number;
  };

  // 错题管理
  mistakes: {
    totalMistakes: number;
    resolvedMistakes: number;
    resolutionRate: number;
  };

  // 习惯打卡
  habits: {
    totalCheckins: number;
    activeHabits: number;
    streakDays: number;
  };

  // 时间范围
  period: {
    startDate: Date;
    endDate: Date;
    weekNumber: number;
  };
}

export interface GeneratedPrompt {
  text: string;
  metadata: {
    generatedAt: Date;
    period: string;
    studentId: string;
    dataPoints: number;
  };
}

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * 获取学生在指定时间范围内的综合统计数据
   * 这是核心的"超级函数"，从所有相关表中抓取并计算数据
   */
  async getStudentStats(request: StudentStatsRequest): Promise<StudentStatsData> {
    const { studentId, schoolId, startDate, endDate } = request;

    try {
      // 并行获取所有数据以提升性能
      const [
        studentInfo,
        tasksStats,
        badgesStats,
        pkStats,
        mistakesStats,
        habitsStats
      ] = await Promise.all([
        // 1. 基础学生信息
        this.getStudentBaseInfo(studentId, schoolId),

        // 2. 任务统计
        this.getTasksStats(studentId, schoolId, startDate, endDate),

        // 3. 勋章统计
        this.getBadgesStats(studentId, startDate, endDate),

        // 4. PK战绩统计
        this.getPKStats(studentId, startDate, endDate),

        // 5. 错题统计
        this.getMistakesStats(studentId, startDate, endDate),

        // 6. 习惯打卡统计
        this.getHabitsStats(studentId, startDate, endDate)
      ]);

      // 计算周数
      const weekNumber = this.getWeekNumber(startDate);

      return {
        studentInfo,
        tasks: tasksStats,
        badges: badgesStats,
        pkMatches: pkStats,
        mistakes: mistakesStats,
        habits: habitsStats,
        period: {
          startDate,
          endDate,
          weekNumber
        }
      };

    } catch (error) {
      // 类型安全的错误处理
      if (error instanceof Error) {
        console.error('[FIX] ReportService.getStudentStats error:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        throw new Error(`Failed to get student stats: ${error.message}`);
      }
      throw new Error('Unknown error occurred in getStudentStats');
    }
  }

  /**
   * 生成AI提示词
   */
  async generatePrompt(studentStats: StudentStatsData, educationalPhilosophy: string): Promise<GeneratedPrompt> {
    try {
      const prompt = this.buildPromptText(studentStats, educationalPhilosophy);

      return {
        text: prompt,
        metadata: {
          generatedAt: new Date(),
          period: `第${studentStats.period.weekNumber}周`,
          studentId: studentStats.studentInfo.name,
          dataPoints: this.calculateDataPoints(studentStats)
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error('[FIX] ReportService.generatePrompt error:', {
          name: error.name,
          message: error.message
        });
        throw new Error(`Failed to generate prompt: ${error.message}`);
      }
      throw new Error('Unknown error occurred in generatePrompt');
    }
  }

  // ===== 私有方法 =====

  private async getStudentBaseInfo(studentId: string, schoolId: string) {
    const student = await this.prisma.student.findUnique({
      where: {
        id: studentId,
        schoolId,
        isActive: true
      },
      select: {
        name: true,
        className: true,
        level: true,
        points: true,
        exp: true
      }
    });

    if (!student) {
      throw new Error(`Student not found: ${studentId}`);
    }

    return student;
  }

  private async getTasksStats(studentId: string, schoolId: string, startDate: Date, endDate: Date) {
    const tasks = await this.prisma.taskRecord.groupBy({
      by: ['type'],
      where: {
        studentId,
        schoolId,
        status: 'COMPLETED',
        submittedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        expAwarded: true
      }
    });

    // 构建按类型分组的统计
    const breakdown: { [key: string]: number } = {};
    let completedCount = 0;
    let totalExp = 0;

    tasks.forEach(task => {
      breakdown[task.type] = task._count.id;
      completedCount += task._count.id;
      totalExp += task._sum.expAwarded || 0;
    });

    return {
      completedCount,
      totalExp,
      breakdown
    };
  }

  private async getBadgesStats(studentId: string, startDate: Date, endDate: Date) {
    const studentBadges = await this.prisma.studentBadge.findMany({
      where: {
        studentId,
        awardedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        badge: {
          select: {
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        awardedAt: 'desc'
      },
      take: 10 // 最近10个勋章
    });

    const recentBadges = studentBadges.map(sb => ({
      name: sb.badge.name,
      category: sb.badge.category,
      awardedAt: sb.awardedAt
    }));

    return {
      earnedCount: studentBadges.length,
      recentBadges
    };
  }

  private async getPKStats(studentId: string, startDate: Date, endDate: Date) {
    const [totalMatches, wins] = await Promise.all([
      // 总参赛场次
      this.prisma.pKMatch.count({
        where: {
          OR: [
            { studentA: studentId },
            { studentB: studentId }
          ],
          updatedAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'COMPLETED'
        }
      }),

      // 胜利场次
      this.prisma.pKMatch.count({
        where: {
          winnerId: studentId,
          updatedAt: {
            gte: startDate,
            lte: endDate
          },
          status: 'COMPLETED'
        }
      })
    ]);

    return {
      totalMatches,
      wins,
      winRate: totalMatches > 0 ? Math.round((wins / totalMatches) * 100) / 100 : 0
    };
  }

  private async getMistakesStats(studentId: string, startDate: Date, endDate: Date) {
    const [totalMistakes, resolvedMistakes] = await Promise.all([
      // 总错题数
      this.prisma.mistake.count({
        where: {
          studentId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // 已解决错题数
      this.prisma.mistake.count({
        where: {
          studentId,
          status: 'RESOLVED',
          updatedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })
    ]);

    return {
      totalMistakes,
      resolvedMistakes,
      resolutionRate: totalMistakes > 0 ? Math.round((resolvedMistakes / totalMistakes) * 100) / 100 : 0
    };
  }

  private async getHabitsStats(studentId: string, startDate: Date, endDate: Date) {
    const [totalCheckins, activeHabits, maxStreak] = await Promise.all([
      // 总打卡次数
      this.prisma.habitLog.count({
        where: {
          studentId,
          checkedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),

      // 活跃习惯数
      this.prisma.habitLog.groupBy({
        by: ['habitId'],
        where: {
          studentId,
          checkedAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }).then(result => result.length),

      // 最高连续天数
      this.prisma.habitLog.aggregate({
        where: {
          studentId,
          checkedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _max: {
          streakDays: true
        }
      })
    ]);

    return {
      totalCheckins,
      activeHabits,
      streakDays: maxStreak._max.streakDays || 0
    };
  }

  private getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const daysPassed = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    return Math.ceil((daysPassed + startOfYear.getDay() + 1) / 7);
  }

  private buildPromptText(stats: StudentStatsData, educationalPhilosophy: string): string {
    const { studentInfo, tasks, badges, pkMatches, mistakes, habits, period } = stats;

    return `【${studentInfo.name}】第${period.weekNumber}周成长报告

📊 基础信息：
• 班级：${studentInfo.className}
• 等级：Lv.${studentInfo.level}
• 积分：${studentInfo.points}分
• 经验：${studentInfo.exp}点

🎯 本周表现：
• 完成任务：${tasks.completedCount}个（获得${tasks.totalExp}点经验）
• 获得勋章：${badges.earnedCount}枚
• PK战绩：${pkMatches.wins}胜${pkMatches.totalMatches}场（胜率${(pkMatches.winRate * 100).toFixed(1)}%）
• 错题解决：${mistakes.resolvedMistakes}/${mistakes.totalMistakes}题（解决率${(mistakes.resolutionRate * 100).toFixed(1)}%）
• 习惯打卡：${habits.totalCheckins}次，连续${habits.streakDays}天

🔥 突出亮点：
${this.generateHighlights(stats)}

📈 AI建议：
基于${educationalPhilosophy}，建议重点关注：
${this.generateSuggestions(stats)}

生成时间：${new Date().toLocaleString('zh-CN')}`;
  }

  private generateHighlights(stats: StudentStatsData): string {
    const highlights: string[] = [];

    if (stats.tasks.completedCount >= 10) {
      highlights.push(`• 任务完成表现出色，本周完成${stats.tasks.completedCount}个任务`);
    }

    if (stats.pkMatches.winRate >= 0.7) {
      highlights.push(`• PK能力突出，胜率达到${(stats.pkMatches.winRate * 100).toFixed(1)}%`);
    }

    if (stats.habits.streakDays >= 5) {
      highlights.push(`• 习惯养成显著，连续打卡${stats.habits.streakDays}天`);
    }

    if (stats.badges.earnedCount >= 3) {
      highlights.push(`• 综合表现优秀，获得${stats.badges.earnedCount}枚勋章`);
    }

    return highlights.length > 0 ? highlights.join('\n') : '• 继续保持良好状态，稳步提升';
  }

  private generateSuggestions(stats: StudentStatsData): string {
    const suggestions: string[] = [];

    if (stats.tasks.completedCount < 5) {
      suggestions.push('• 建议增加任务参与度，提升学习主动性');
    }

    if (stats.mistakes.resolutionRate < 0.5) {
      suggestions.push('• 建议加强错题复习，提升知识掌握度');
    }

    if (stats.habits.activeHabits < 3) {
      suggestions.push('• 建议培养更多良好习惯，促进全面发展');
    }

    if (stats.pkMatches.totalMatches === 0) {
      suggestions.push('• 建议参与PK活动，提升竞争意识和表达能力');
    }

    return suggestions.length > 0 ? suggestions.join('\n') : '• 保持当前良好状态，继续挑战更高目标';
  }

  private calculateDataPoints(stats: StudentStatsData): number {
    return 1 + // 基础信息
           stats.tasks.completedCount + // 任务数
           stats.badges.earnedCount + // 勋章数
           stats.pkMatches.totalMatches + // PK场数
           stats.mistakes.totalMistakes + // 错题数
           stats.habits.totalCheckins; // 打卡数
  }
}
import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

export interface StudentQuery {
  schoolId: string;
  className?: string;  // 数据库字段名，移除className违宪用法
  search?: string;
  page?: number;
  limit?: number;
  // 🆕 新增师生绑定相关参数
  teacherId?: string;     // 查询指定老师的学生
  scope?: 'MY_STUDENTS' | 'ALL_SCHOOL' | 'SPECIFIC_TEACHER';  // 查询范围：我的学生 vs 全校 vs 特定老师
  userRole?: 'ADMIN' | 'TEACHER';       // 用户角色，用于权限控制
  requesterId?: string;   // 请求者ID（用于查看其他老师班级时的权限记录）
}

export interface AddScoreRequest {
  studentIds: string[];
  points: number;
  exp: number;
  reason: string;
  schoolId: string;
  metadata?: Record<string, any>;
}

export interface CreateStudentRequest {
  name: string;
  className?: string;  // 改为可选，仅作为显示标签
  schoolId: string;
  teacherId: string;  // 🆕 新增：必须指定归属老师
}

export interface UpdateStudentRequest {
  id: string;
  schoolId: string;
  name?: string;
  className?: string;
  avatar?: string;
  score?: number;
  exp?: number;
}

export interface StudentListResponse {
  students: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ScoreUpdateEvent {
  type: 'SCORE_UPDATE';
  data: {
    studentIds: string[];
    points: number;
    exp: number;
    reason: string;
    timestamp: string;
    updatedBy: string;
    metadata?: Record<string, any>;
  };
}

export class StudentService {
  private prisma: PrismaClient;
  private io: SocketIOServer;

  constructor(prisma: PrismaClient, io: SocketIOServer) {
    this.prisma = prisma;
    this.io = io;
  }

  /**
   * 🆕 获取学生列表 - 基于师生绑定的重构版本
   */
  async getStudents(query: StudentQuery): Promise<StudentListResponse> {
    const { schoolId, teacherId, scope, userRole } = query;
    console.log(`[TEACHER BINDING] Fetching students with query:`, { schoolId, teacherId, scope, userRole });

    try {
      // 🆕 构建查询条件 - 基于师生关系
      let whereCondition: any = {
        schoolId: schoolId,
        isActive: true,
      };

      // 🚨 临时调试：检查现有学生的teacherId分布
      console.log(`[DEBUG] 🔍 Checking teacherId distribution before query...`);
      const allStudents = await this.prisma.students.findMany({
        where: { schoolId, isActive: true },
        select: { id: true, name: true, teacherId: true, className: true }
      });

      const teacherIdStats = allStudents.reduce((acc, student) => {
        const tid = student.teacherId || 'null';
        acc[tid] = (acc[tid] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(`[DEBUG] 📊 TeacherId distribution:`, teacherIdStats);
      console.log(`[DEBUG] 📊 Total students in DB: ${allStudents.length}`);

      // 根据查询范围和用户角色确定查询条件
      if (scope === 'MY_STUDENTS' && teacherId) {
        // 老师查看自己的学生
        whereCondition.teacherId = teacherId;
        console.log(`[TEACHER BINDING] Querying MY_STUDENTS for teachers: ${teacherId}`);
      } else if (scope === 'ALL_SCHOOL' && userRole === 'ADMIN') {
        // 管理员查看全校学生 - 无需额外条件
        console.log(`[TEACHER BINDING] Querying ALL_SCHOOL for ADMIN`);
      } else if (scope === 'ALL_SCHOOL' && userRole === 'TEACHER') {
        // 老师查看全校学生 - 显示所有学生（包括已归属和未归属的）
        console.log(`[TEACHER BINDING] Querying ALL_SCHOOL for TEACHER: ${teacherId}`);
        // 🆕 修复：显示全校所有学生，不再限制teacherId
        // 老师可以看到所有学生，然后通过前端按钮选择"移入"
      } else if (scope === 'SPECIFIC_TEACHER' && teacherId) {
        // 🆕 新增：查看特定老师的学生（用于抢人功能）
        whereCondition.teacherId = teacherId;
        console.log(`[TEACHER BINDING] Querying SPECIFIC_TEACHER: ${teacherId}, requester: ${query.requesterId}`);
      } else {
        // 默认情况：如果指定了teacherId且不是ALL_SCHOOL模式，查询该老师的学生
        if (teacherId && scope !== 'ALL_SCHOOL') {
          whereCondition.teacherId = teacherId;
          console.log(`[TEACHER BINDING] Default: querying students for teachers: ${teacherId}`);
        } else if (scope === 'ALL_SCHOOL') {
          console.log(`[TEACHER BINDING] ALL_SCHOOL mode: ignoring teacherId to show all students`);
        }
      }

      // 🆕 只根据 teacherId 分班，不使用 className 过滤
      // className 仅作为显示标签，不参与查询过滤
      console.log(`[TEACHER BINDING] ⚠️ Using teacherId only for student filtering (className filter removed)`);

      // 保留搜索功能
      if (query.search) {
        whereCondition.name = {
          contains: query.search,
          mode: 'insensitive'
        };
      }

      const students = await this.prisma.students.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          className: true,
          avatarUrl: true,
          points: true,
          exp: true,
          level: true,
          teacherId: true,
          isActive: true,
        },
        orderBy: [
          { exp: 'desc' },
          { name: 'asc' },
        ],
      });

      console.log(`[TEACHER BINDING] ✅ Found ${students.length} students for scope: ${scope}`);

      return {
        students: students,
        pagination: {
          page: query.page || 1,
          limit: query.limit || students.length,
          total: students.length,
          totalPages: 1
        }
      };
    } catch (error) {
      console.error("[TEACHER BINDING] ❌ Error fetching students:", error);
      throw new Error("Could not fetch students.");
    }
  }

  /**
   * 根据ID获取单个学生
   */
  async getStudentById(id: string, schoolId: string): Promise<any> {
    const student = await this.prisma.students.findFirst({
      where: {
        id,
        schoolId,
        isActive: true
      },
      include: {
        task_records: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!student) {
      throw new Error('学生不存在');
    }

    return student;
  }

  /**
   * 获取学生完整档案（聚合所有相关数据）
   */
  public async getStudentProfile(studentId: string, schoolId: string, userRole?: 'ADMIN' | 'TEACHER', userId?: string): Promise<any> {
    try {
      console.log(`🔍 获取学生档案: ${studentId}, 学校: ${schoolId}`);

      const [
        student,
        task_records,
        pkMatchesAsPlayerA,
        pkMatchesAsPlayerB,
        allPkMatches,
        taskStats,
        allHabits,
        studentHabitLogs,
        latestLessonPlan,
        latestOverride,
        student_badges
      ] = await Promise.all([
        // 1. 学生基础信息
        this.prisma.students.findFirst({
          where: {
            id: studentId,
            schoolId,
            isActive: true,
            // 权限过滤：如果是老师，只能查看自己名下的学生；如果是管理员，可以查看所有学生
            ...(userRole === 'TEACHER' && userId ? { teacherId: userId } : {})
          },
          include: {
            teachers: {
              select: { name: true }
            }
          }
        }),

        // 2. 任务记录（全部，按时间倒序）
        this.prisma.task_records.findMany({
          where: {
            studentId,
            schoolId
          },
          orderBy: { createdAt: 'desc' },
          include: {
            lesson_plans: {
              select: { id: true, title: true, date: true }
            }
          }
        }),

        // 3. PK记录（作为PlayerA）
        this.prisma.pk_matches.findMany({
          where: {
            studentA: studentId,
            schoolId
          },
          orderBy: { createdAt: 'desc' },
          include: {
            playerA: {
              select: { id: true, name: true, className: true }
            },
            playerB: {
              select: { id: true, name: true, className: true }
            },
            winner: {
              select: { id: true, name: true }
            }
          }
        }),

        // 4. PK记录（作为PlayerB）
        this.prisma.pk_matches.findMany({
          where: {
            studentB: studentId,
            schoolId
          },
          orderBy: { createdAt: 'desc' },
          include: {
            playerA: {
              select: { id: true, name: true, className: true }
            },
            playerB: {
              select: { id: true, name: true, className: true }
            },
            winner: {
              select: { id: true, name: true }
            }
          }
        }),

        // 5. 所有PK记录（用于统计）
        this.prisma.pk_matches.findMany({
          where: {
            schoolId,
            OR: [
              { studentA: studentId },
              { studentB: studentId }
            ]
          }
        }),

        // 6. 任务统计数据
        this.prisma.task_records.groupBy({
          by: ['status', 'type'],
          where: {
            studentId,
            schoolId
          },
          _count: {
            status: true
          },
          _sum: {
            expAwarded: true
          }
        }),

        // 7. 习惯数据
        this.prisma.habits.findMany({
          where: { schoolId, isActive: true }
        }),

        // 8. 学生习惯记录
        this.prisma.habit_logs.findMany({
          where: { studentId, schoolId },
          orderBy: { checkedAt: 'desc' }
        }),

        // 9. 🆕 最新教学计划 (用于计算进度)
        this.prisma.lesson_plans.findFirst({
          where: {
            schoolId,
            isActive: true,
            // 如果学生有归属老师，取该老师的计划
            ...(studentId ? { teachers: { students: { some: { id: studentId } } } } : {})
          },
          orderBy: { date: 'desc' }
        }),

        // 10. 🆕 最新覆盖记录
        this.prisma.task_records.findFirst({
          where: { studentId, schoolId, isOverridden: true },
          orderBy: { updatedAt: 'desc' }
        }),

        // 11. 🆕 勋章数据
        this.prisma.student_badges.findMany({
          where: { studentId },
          include: {
            badges: {
              select: { id: true, name: true, icon: true, category: true }
            }
          },
          orderBy: { awardedAt: 'desc' }
        })
      ]);

      // 验证学生是否存在
      if (!student) {
        throw new Error('学生不存在');
      }

      // 🆕 注入过关地图聚合逻辑：按单元/课时分组
      const semesterMap = task_records
        .filter(t => t.type === 'QC')
        .reduce((acc: any, task: any) => {
          const content = task.content || {};
          const unit = content.unit || '0';
          const lesson = content.lesson || '0';
          const key = `${unit}-${lesson}`;

          if (!acc[key]) {
            acc[key] = { unit, lesson, title: content.lessonPlanTitle || `第${lesson}课`, tasks: [] };
          }
          acc[key].tasks.push({
            id: task.id,
            title: task.title,
            status: task.status,
            exp: task.expAwarded
          });
          return acc;
        }, {});

      // 处理PK记录 - 合并studentA和studentB的记录，并按时间排序
      const allPkRecordsWithDetails = [...pkMatchesAsPlayerA, ...pkMatchesAsPlayerB]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(match => ({
          ...match,
          isPlayerA: match.studentA === studentId,
          opponent: match.studentA === studentId ? match.studentB : match.studentA,
          isWinner: match.winnerId === studentId,
          // 添加关系字段数据用于前端显示
          playerA: match.playerA,
          playerB: match.playerB,
          winner: match.winner
        }));

      // 计算PK统计数据
      const pkStats = {
        totalMatches: allPkMatches.length,
        wins: allPkMatches.filter(match => match.winnerId === studentId).length,
        losses: allPkMatches.filter(match => match.winnerId !== studentId && match.winnerId !== null).length,
        draws: allPkMatches.filter(match => match.winnerId === null).length,
        winRate: allPkMatches.length > 0
          ? (allPkMatches.filter(match => match.winnerId === studentId).length / allPkMatches.length * 100).toFixed(1)
          : '0.0'
      };

      // 🆕 处理习惯统计数据 (SSOT)
      console.log(`🎯 [HABIT_DEBUG] allHabits 数量: ${allHabits.length}, studentHabitLogs 数量: ${studentHabitLogs.length}`);
      const habitStats = allHabits.map(habit => {
        const logs = studentHabitLogs.filter(log => log.habitId === habit.id);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return {
          habit: {
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
            expReward: habit.expReward
          },
          stats: {
            totalCheckIns: logs.length,
            currentStreak: logs.length > 0 ? logs[0].streakDays : 0, // 简化版连续打卡
            checkedToday: logs.some(log => {
              const checkDate = new Date(log.checkedAt);
              return checkDate >= today && checkDate < tomorrow;
            })
          }
        };
      });
      console.log(`🎯 [HABIT_DEBUG] 生成的 habitStats 数量: ${habitStats.length}, 有打卡记录的习惯: ${habitStats.filter(h => h.stats.totalCheckIns > 0).length}`);

      // 🆕 计算课程进度 (对齐 LMS Service 逻辑)
      const defaultProgress = {
        chinese: { unit: '1', lesson: '1', title: '默认课程' },
        math: { unit: '1', lesson: '1', title: '默认课程' },
        english: { unit: '1', title: 'Default' }
      };

      const planInfo = (latestLessonPlan?.content as any)?.courseInfo || defaultProgress;
      const overrideInfo = (latestOverride?.content as any)?.courseInfo;

      let studentProgress = planInfo;
      let progressSource = latestLessonPlan ? 'lesson_plan' : 'default';
      let progressUpdatedAt = latestLessonPlan?.updatedAt || (student ? student.createdAt : new Date());

      if (overrideInfo && student) {
        const planTime = latestLessonPlan ? new Date(latestLessonPlan.updatedAt).getTime() : 0;
        const overrideTime = new Date(latestOverride.updatedAt).getTime();

        if (overrideTime > planTime) {
          studentProgress = overrideInfo;
          progressSource = 'override';
          progressUpdatedAt = latestOverride.updatedAt;
        }
      }

      const processedProgress = {
        ...studentProgress,
        source: progressSource,
        updatedAt: progressUpdatedAt
      };

      // 处理任务统计数据
      const processedTaskStats = {
        totalTasks: task_records.length,
        completedTasks: task_records.filter(task => task.status === 'COMPLETED').length,
        pendingTasks: task_records.filter(task => task.status === 'PENDING').length,
        submittedTasks: task_records.filter(task => task.status === 'SUBMITTED').length,
        reviewedTasks: task_records.filter(task => task.status === 'REVIEWED').length,
        exp: task_records.reduce((sum, task) => sum + task.expAwarded, 0),
        qcTasks: task_records.filter(task => task.type === 'QC').length,
        specialTasks: task_records.filter(task => task.type === 'SPECIAL').length,
        challengeTasks: task_records.filter(task => task.type === 'CHALLENGE').length
      };

      // 计算学生等级（基于经验值）
      const level = this.calculateLevel(student.exp);

      // 构建时间轴数据（按日期分组的任务和PK记录）
      const timelineData = this.buildTimelineData(task_records, allPkRecordsWithDetails);

      const profile = {
        // 学生基础信息
        student: {
          ...student,
          level,
          progress: processedProgress
        },

        // 任务记录（最近50条）
        task_records: task_records.slice(0, 50),

        // PK记录
        pkRecords: allPkRecordsWithDetails.slice(0, 20),
        pkStats,

        // 任务统计
        taskStats: processedTaskStats,

        // 时间轴数据
        timelineData,

        // 🆕 习惯统计数据
        habitStats,

        // 🆕 过关地图数据
        semesterMap: Object.values(semesterMap),

        // 🆕 勋章数据
        badges: student_badges.map(sb => ({
          id: sb.badgeId,
          name: sb.badges.name,
          icon: sb.badges.icon,
          category: sb.badges.category,
          awardedAt: sb.awardedAt
        })),

        // 综合数据
        summary: {
          joinDate: student.createdAt,
          totalActiveDays: Math.ceil((new Date().getTime() - new Date(student.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          lastActiveDate: task_records.length > 0 ? task_records[0].createdAt : student.createdAt
        }
      };

      console.log(`✅ 学生档案获取成功: ${student.name}, 包含 ${task_records.length} 条任务记录, ${allPkRecordsWithDetails.length} 条PK记录`);

      return profile;

    } catch (error) {
      console.error('❌ 获取学生档案失败:', error);
      throw error;
    }
  }

  /**
   * 构建时间轴数据
   */
  private buildTimelineData(task_records: any[], pkRecords: any[]): any[] {
    // 将任务记录转换为时间轴项目
    const taskTimelineItems = task_records.map(record => ({
      id: `task-${record.id}`,
      date: record.createdAt,
      type: 'task',
      title: record.title,
      description: `完成了${this.getTaskTypeLabel(record.type)} - 获得 ${record.expAwarded} EXP`,
      status: record.status,
      exp: record.expAwarded,
      metadata: {
        taskType: record.type,
        lesson_plans: record.lessonPlan
      }
    }));

    // 将PK记录转换为时间轴项目
    const pkTimelineItems = pkRecords.map(record => ({
      id: `pk-${record.id}`,
      date: record.createdAt,
      type: 'pk',
      title: `PK对战 - ${record.opponent.name}`,
      description: `${record.isWinner ? '战胜' : record.winnerId === null ? '平局' : '败给'}了 ${record.opponent.name} (${record.opponent.className})`,
      result: record.isWinner ? 'win' : record.winnerId === null ? 'draw' : 'lose',
      metadata: {
        opponent: record.opponent,
        topic: record.topic,
        isPlayerA: record.isPlayerA
      }
    }));

    // 合并并按日期排序
    const allTimelineItems = [...taskTimelineItems, ...pkTimelineItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 按日期分组
    const groupedByDate = allTimelineItems.reduce((groups, item) => {
      const dateKey = new Date(item.date).toLocaleDateString('zh-CN');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
      return groups;
    }, {} as Record<string, any[]>);

    // 转换为数组格式并限制最近30天
    return Object.entries(groupedByDate)
      .map(([date, items]) => ({
        date,
        items: items.slice(0, 10) // 每天最多显示10条
      }))
      .slice(0, 30); // 最近30天的记录
  }

  /**
   * 获取任务类型标签
   */
  private getTaskTypeLabel(type: string): string {
    const typeLabels = {
      'QC': '质检任务',
      'TASK': '常规任务',
      'SPECIAL': '特殊任务',
      'CHALLENGE': '挑战任务',
      'HOMEWORK': '作业',
      'QUIZ': '测验',
      'PROJECT': '项目',
      'DAILY': '每日任务'
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  }

  // 🆕 重构后的 createStudent 方法 - 基于师生绑定
  public async createStudent(studentData: CreateStudentRequest) {
    console.log('[TEACHER BINDING] Creating student with data:', studentData);

    // 🆕 新的验证逻辑
    if (!studentData.name || !studentData.schoolId || !studentData.teacherId) {
      console.error('[TEACHER BINDING] Validation failed: Missing name, schoolId, or teacherId.');
      throw new Error('Missing required student data: name, schoolId, and teacherId are required');
    }

    try {
      const newStudent = await this.prisma.students.create({
        data: {
          id: require('crypto').randomUUID(),
          name: studentData.name,
          className: studentData.className,  // 可选，仅作为显示标签
          teachers: {
            connect: { id: studentData.teacherId }
          },
          schools: {
            connect: { id: studentData.schoolId }
          },
          avatarUrl: '/avatar.jpg',
          isActive: true,
          updatedAt: new Date()
        },
      });
      console.log('[TEACHER BINDING] Successfully created student with teacher binding:', newStudent);
      return newStudent;
    } catch (error) {
      console.error('[TEACHER BINDING] Prisma create operation failed:', error);
      if (error instanceof Error) {
        console.error('[TEACHER BINDING] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw error;
    }
  }

  /**
   * 更新学生信息
   */
  async updateStudent(data: UpdateStudentRequest): Promise<any> {
    const { id, schoolId, name, className, avatar, score, exp } = data;

    // 计算新的等级
    let level: number | undefined;
    if (exp !== undefined) {
      level = this.calculateLevel(exp);
    }

    const student = await this.prisma.students.update({
      where: {
        id,
        schoolId,
        isActive: true
      },
      data: {
        ...(name && { name }),
        ...(className && { className }),
        ...(avatar && { avatar }),
        ...(score !== undefined && { score }),
        ...(exp !== undefined && { exp }),
        ...(level !== undefined && { level }),
        updatedAt: new Date()
      }
    });

    // 广播学生更新事件
    this.broadcastToSchool(schoolId, {
      type: 'STUDENT_UPDATED',
      data: {
        student,
        timestamp: new Date().toISOString()
      }
    });

    return student;
  }

  /**
   * 删除学生（软删除）
   */
  async deleteStudent(id: string, schoolId: string): Promise<void> {
    await this.prisma.students.update({
      where: {
        id,
        schoolId,
        isActive: true
      },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // 广播学生删除事件
    this.broadcastToSchool(schoolId, {
      type: 'STUDENT_DELETED',
      data: {
        studentId: id,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * 批量添加积分/经验
   */
  async addScore(data: AddScoreRequest, updatedBy: string): Promise<any[]> {
    const { studentIds, points, exp, reason, schoolId, metadata = {} } = data;

    // 验证学生是否属于该学校
    const students = await this.prisma.students.findMany({
      where: {
        id: { in: studentIds },
        schoolId,
        isActive: true
      }
    });

    if (students.length !== studentIds.length) {
      throw new Error('部分学生不存在或不属于该学校');
    }

    // 批量更新学生积分和经验
    const updatedStudents = await this.prisma.$transaction(
      studentIds.map(studentId =>
        this.prisma.students.update({
          where: { id: studentId, schoolId },
          data: {
            points: { increment: points },
            exp: { increment: exp },
            updatedAt: new Date()
          }
        })
      )
    );

    // 重新计算等级
    const studentsWithLevel = await this.prisma.$transaction(
      updatedStudents.map(student => {
        const newLevel = this.calculateLevel(student.exp);
        return this.prisma.students.update({
          where: { id: student.id },
          data: { level: newLevel, updatedAt: new Date() }
        });
      })
    );

    // 创建任务记录
    await this.prisma.$transaction(
      studentIds.map(studentId =>
        this.prisma.task_records.create({
          data: {
            id: require('crypto').randomUUID(),
            studentId,
            schoolId,
            type: points > 0 ? 'SPECIAL' : 'CHALLENGE', // 使用 TaskType 枚举值
            title: reason,
            content: {
              score: points,
              exp,
              metadata: {
                ...metadata,
                updatedBy,
                previousLevel: students.find(s => s.id === studentId)?.level,
                newLevel: studentsWithLevel.find(s => s.id === studentId)?.level
              }
            },
            status: 'COMPLETED',
            expAwarded: exp,
            updatedAt: new Date()
          }
        })
      )
    );

    // 准备广播数据
    const broadcastData: ScoreUpdateEvent = {
      type: 'SCORE_UPDATE',
      data: {
        studentIds,
        points,
        exp,
        reason,
        timestamp: new Date().toISOString(),
        updatedBy,
        metadata
      }
    };

    // 广播到学校房间
    this.broadcastToSchool(schoolId, broadcastData);

    return studentsWithLevel;
  }

  /**
   * 获取学生排行榜
   */
  async getLeaderboard(schoolId: string, limit: number = 10): Promise<any[]> {
    const students = await this.prisma.students.findMany({
      where: {
        schoolId,
        isActive: true
      },
      orderBy: [
        { exp: 'desc' },
        { points: 'desc' },
        { name: 'asc' }
      ],
      take: limit,
      select: {
        id: true,
        name: true,
        className: true,
        avatarUrl: true,
        points: true,
        exp: true,
        level: true,
        createdAt: true
      }
    });

    return students.map((student, index) => ({
      rank: index + 1,
      ...student,
      className: student.className,
      avatar: student.avatarUrl,
      score: student.points,
      exp: student.exp
    }));
  }

  /**
   * 获取班级统计
   */
  async getClassStats(schoolId: string): Promise<any> {
    const classStats = await this.prisma.students.groupBy({
      by: ['className'],
      where: {
        schoolId,
        isActive: true
      },
      _count: {
        id: true
      },
      _sum: {
        points: true,
        exp: true
      },
      _avg: {
        points: true,
        exp: true
      }
    });

    return classStats.map(stat => ({
      className: stat.className,
      studentCount: stat._count.id,
      totalScore: stat._sum.points || 0,
      exp: stat._sum.exp || 0,
      averageScore: stat._avg.points || 0,
      averageExp: stat._avg.exp || 0
    }));
  }

  /**
   * 获取班级列表（用于班级切换）
   * 🆕 修改：返回按老师分组的班级信息，支持多老师显示
   */
  async getClasses(schoolId: string): Promise<any[]> {
    // 🆕 获取学校内所有老师
    const allTeachers = await this.prisma.teachers.findMany({
      where: {
        schoolId,
        role: 'TEACHER'
      },
      select: {
        id: true,
        name: true
      }
    });

    // 🆕 按老师分组获取学生统计
    const studentStats = await this.prisma.students.groupBy({
      by: ['teacherId'],
      where: {
        schoolId,
        isActive: true,
        teacherId: { in: allTeachers.map(t => t.id) }
      },
      _count: {
        id: true
      }
    });

    // 组装数据：每个老师作为一个"班级"
    const classData = allTeachers.map(teacher => {
      const stats = studentStats.find(s => s.teacherId === teacher.id);
      return {
        className: `${teacher.name}的班级`,
        studentCount: stats?._count.id || 0,
        teacherId: teacher.id,
        teacherName: teacher.name
      };
    });

    // 添加"全校"选项
    const totalStudents = await this.prisma.students.count({
      where: {
        schoolId,
        isActive: true
      }
    });

    classData.unshift({
      className: '全校大名单',
      studentCount: totalStudents,
      teacherId: 'ALL',
      teacherName: '全校'
    });

    return classData;
  }

  /**
   * 🆕 师生关系转移 - 从"转班"升级为"抢人"
   * 将学生划归到指定老师名下
   */
  async transferStudents(studentIds: string[], targetTeacherId: string, schoolId: string, updatedBy: string): Promise<any[]> {
    console.log(`[TEACHER BINDING] Transferring ${studentIds.length} students to teachers: ${targetTeacherId}`);

    // 验证学生是否属于该学校
    const students = await this.prisma.students.findMany({
      where: {
        id: { in: studentIds },
        schoolId,
        isActive: true
      }
    });

    if (students.length !== studentIds.length) {
      throw new Error('部分学生不存在或不属于该学校');
    }

    // 🆕 验证目标老师是否存在且属于同一学校
    const targetTeacher = await this.prisma.teachers.findFirst({
      where: {
        id: targetTeacherId,
        schoolId: schoolId
      }
    });

    if (!targetTeacher) {
      throw new Error('目标老师不存在或不属于同一学校');
    }

    // 批量更新学生的老师归属
    const updatedStudents = await this.prisma.$transaction(
      studentIds.map(studentId =>
        this.prisma.students.update({
          where: { id: studentId, schoolId },
          data: {
            teacherId: targetTeacherId,  // 🆕 核心变更：更新老师归属
            className: targetTeacher.primaryClassName || targetTeacher.name + '班'  // 🔒 修复：同步更新班级名
          }
        })
      )
    );

    // 🆕 创建师生关系转移记录
    await this.prisma.$transaction(
      studentIds.map(studentId =>
        this.prisma.task_records.create({
          data: {
            id: require('crypto').randomUUID(),
            studentId,
            schoolId,
            type: 'SPECIAL',
            title: '移入班级',
            content: {
              action: 'TEACHER_TRANSFER',
              fromTeacherId: students.find(s => s.id === studentId)?.teacherId,
              toTeacherId: targetTeacherId,
              toTeacherName: targetTeacher.name,
              updatedBy,
              transferType: 'STUDENT_MOVED_TO_TEACHER'
            },
            status: 'COMPLETED',
            expAwarded: 0,
            updatedAt: new Date()
          }
        })
      )
    );

    // 🆕 广播师生关系转移事件
    this.broadcastToSchool(schoolId, {
      type: 'STUDENTS_TRANSFERRED',
      data: {
        studentIds,
        targetTeacherId,
        targetTeacherName: targetTeacher.name,
        updatedBy,
        timestamp: new Date().toISOString(),
        updatedStudents,
        transferType: 'TEACHER_BINDING'  // 标识这是师生关系转移
      }
    });

    console.log(`[TEACHER BINDING] ✅ Successfully transferred ${studentIds.length} students to ${targetTeacher.name}`);
    return updatedStudents;
  }

  /**
   * 计算等级
   */
  private calculateLevel(exp: number): number {
    // 简单的等级计算公式
    // 每 100 经验值升一级
    return Math.floor(exp / 100) + 1;
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

export default StudentService;
import { PrismaClient } from '@prisma/client';

// ✅ 宪法合规：严格定义接口，禁止as any
export interface PersonalizedTutoringPlanRequest {
  teacherId: string;
  schoolId: string;
  studentId: string;
  title: string;
  subject: 'chinese' | 'math' | 'english' | 'general' | 'science' | 'art';
  difficulty: 1 | 2 | 3 | 4 | 5;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  knowledgePoints: string[];
  mainProblem: string;
  detailedContent?: string;
  teachingObjectives?: string;
  preparationMaterials?: string;
  tutoringMethods: {
    conceptExplaining: boolean;
    exampleTeaching: boolean;
    mistakeReflection: boolean;
    practiceExercise: boolean;
    interactiveDiscussion: boolean;
    summaryReview: boolean;
  };
  expReward: number;
  pointsReward: number;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export interface PersonalizedTutoringPlanResponse {
  id: string;
  teacherId: string;
  schoolId: string;
  title: string;
  subject: string;
  difficulty: number;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  studentId: string;
  studentName: string;
  studentClass: string;
  knowledgePoints: string[];
  mainProblem: string;
  detailedContent?: string;
  tutoringMethods: Record<string, boolean>;
  expReward: number;
  pointsReward: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  totalSessions: number;
  completedSessions: number;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    name: string;
    className: string;
    exp: number;
    points: number;
    level: number;
  };
}

export interface TutoringQueryOptions {
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  studentId?: string;
  subject?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'scheduledDate' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// ✅ 宪法合规：自持有PrismaClient
export class PersonalizedTutoringService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 创建1v1教学计划
   */
  async createPersonalizedTutoringPlan(request: PersonalizedTutoringPlanRequest): Promise<PersonalizedTutoringPlanResponse> {
    try {
      // 🔒 宪法合规：验证学生归属
      const student = await this.prisma.students.findFirst({
        where: {
          id: request.studentId,
          teacherId: request.teacherId,
          schoolId: request.schoolId,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          className: true
        }
      });

      if (!student) {
        throw new Error('学生不存在或不属于当前教师');
      }

      // 创建教学计划
      const plan = await this.prisma.personalized_tutoring_plans.create({
        data: {
          teacherId: request.teacherId,
          schoolId: request.schoolId,
          studentId: request.studentId,
          studentName: student.name,
          studentClass: student.className,
          title: request.title,
          subject: request.subject,
          difficulty: request.difficulty,
          scheduledDate: request.scheduledDate,
          scheduledTime: request.scheduledTime,
          duration: request.duration,
          knowledgePoints: request.knowledgePoints,
          mainProblem: request.mainProblem,
          detailedContent: request.detailedContent,
          teachingObjectives: request.teachingObjectives,
          preparationMaterials: request.preparationMaterials,
          tutoringMethods: request.tutoringMethods,
          expReward: request.expReward,
          pointsReward: request.pointsReward,
          attachments: request.attachments || [],
          totalSessions: 1, // 默认1课时，后续可调整
          completedSessions: 0
        }
      });

      // 🆕 创建Timeline事件（自调用TimelineService）
      const { TimelineService } = require('./timeline.service');
      const timeline = new TimelineService();
      await timeline.createEvent(request.studentId, 'TUTORING', {
        type: 'PERSONALIZED_PLAN_CREATED',
        title: `安排1v1讲解：${request.title}`,
        subject: request.subject,
        scheduledDate: request.scheduledDate,
        scheduledTime: request.scheduledTime,
        duration: request.duration,
        tutoringId: plan.id,
        knowledgePoints: request.knowledgePoints,
        mainProblem: request.mainProblem,
        tutoringMethods: request.tutoringMethods,
        expReward: request.expReward
      });

      console.log(`✅ [TUTORING] Created personalized tutoring plan ${plan.id}`);

      // 返回完整的响应对象
      return await this.getTutoringPlanById(plan.id);
    } catch (error) {
      console.error('❌ [TUTORING] Failed to create personalized tutoring plan:', error);
      throw error;
    }
  }

  /**
   * 获取单个教学计划详情
   */
  async getTutoringPlanById(planId: string): Promise<PersonalizedTutoringPlanResponse> {
    try {
      const plan = await this.prisma.personalized_tutoring_plans.findUnique({
        where: { id: planId },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              className: true,
              exp: true,
              points: true,
              level: true
            }
          }
        }
      });

      if (!plan) {
        throw new Error('教学计划不存在');
      }

      // ✅ 宪法合规：明确的类型转换
      return {
        id: plan.id,
        teacherId: plan.teacherId,
        schoolId: plan.schoolId,
        title: plan.title,
        subject: plan.subject,
        difficulty: plan.difficulty,
        scheduledDate: plan.scheduledDate,
        scheduledTime: plan.scheduledTime,
        duration: plan.duration,
        studentId: plan.studentId,
        studentName: plan.studentName,
        studentClass: plan.studentClass,
        knowledgePoints: plan.knowledgePoints as string[],
        mainProblem: plan.mainProblem,
        detailedContent: plan.detailedContent,
        tutoringMethods: plan.tutoringMethods as Record<string, boolean>,
        expReward: plan.expReward,
        pointsReward: plan.pointsReward,
        status: plan.status as any,
        totalSessions: plan.totalSessions,
        completedSessions: plan.completedSessions,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        student: plan.students
      };
    } catch (error) {
      console.error('❌ [TUTORING] Failed to get tutoring plan:', error);
      throw error;
    }
  }

  /**
   * 获取教师的教学计划列表
   */
  async getTeacherTutoringPlans(teacherId: string, options: TutoringQueryOptions): Promise<PersonalizedTutoringPlanResponse[]> {
    try {
      const where: any = {
        teacherId
      };

      if (options.status) {
        where.status = options.status;
      }

      if (options.dateRange) {
        where.scheduledDate = {
          gte: options.dateRange.start,
          lte: options.dateRange.end
        };
      }

      if (options.studentId) {
        where.studentId = options.studentId;
      }

      if (options.subject) {
        where.subject = options.subject;
      }

      const plans = await this.prisma.personalized_tutoring_plans.findMany({
        where,
        include: {
          students: {
            select: {
              id: true,
              name: true,
              className: true,
              exp: true,
              points: true,
              level: true
            }
          }
        },
        orderBy: [
          { [options.sortBy || 'scheduledDate']: options.sortOrder || 'asc' },
          { scheduledTime: 'asc' }
        ],
        take: options.limit,
        skip: options.offset
      });

      // ✅ 宪法合规：明确的类型转换
      return plans.map(plan => ({
        id: plan.id,
        teacherId: plan.teacherId,
        schoolId: plan.schoolId,
        title: plan.title,
        subject: plan.subject,
        difficulty: plan.difficulty,
        scheduledDate: plan.scheduledDate,
        scheduledTime: plan.scheduledTime,
        duration: plan.duration,
        studentId: plan.studentId,
        studentName: plan.studentName,
        studentClass: plan.studentClass,
        knowledgePoints: plan.knowledgePoints as string[],
        mainProblem: plan.mainProblem,
        detailedContent: plan.detailedContent,
        tutoringMethods: plan.tutoringMethods as Record<string, boolean>,
        expReward: plan.expReward,
        pointsReward: plan.pointsReward,
        status: plan.status as any,
        totalSessions: plan.totalSessions,
        completedSessions: plan.completedSessions,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        student: plan.students
      }));
    } catch (error) {
      console.error('❌ [TUTORING] Failed to get teacher tutoring plans:', error);
      throw error;
    }
  }

  /**
   * 更新教学计划状态
   */
  async updateTutoringPlanStatus(planId: string, teacherId: string, updates: {
    status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    actualStartTime?: string;
    actualEndTime?: string;
    completionNotes?: string;
    studentFeedback?: string;
    parentFeedback?: string;
    effectivenessRating?: number;
    followUpRequired?: boolean;
    followUpDate?: string;
    followUpNotes?: string;
  }): Promise<PersonalizedTutoringPlanResponse> {
    try {
      // 🔒 宪法合规：验证权限
      const existingPlan = await this.prisma.personalized_tutoring_plans.findFirst({
        where: {
          id: planId,
          teacherId: teacherId
        }
      });

      if (!existingPlan) {
        throw new Error('教学计划不存在或无权限修改');
      }

      // 更新计划状态
      const updatedPlan = await this.prisma.personalized_tutoring_plans.update({
        where: { id: planId },
        data: {
          status: updates.status,
          actualStartTime: updates.actualStartTime ? new Date(updates.actualStartTime) : undefined,
          actualEndTime: updates.actualEndTime ? new Date(updates.actualEndTime) : undefined,
          completionNotes: updates.completionNotes,
          studentFeedback: updates.studentFeedback,
          parentFeedback: updates.parentFeedback,
          effectivenessRating: updates.effectivenessRating,
          followUpRequired: updates.followUpRequired,
          followUpDate: updates.followUpDate,
          followUpNotes: updates.followUpNotes,
          updatedAt: new Date()
        }
      });

      // 如果完成，发放奖励
      if (updates.status === 'COMPLETED' && !existingPlan.expAwarded) {
        const { StudentService } = require('./student.service');
        const studentService = new StudentService(null as any);

        await studentService.updateStudentExp(existingPlan.studentId, existingPlan.expReward, 'personalized_tutoring_complete');
        await studentService.updateStudentPoints(existingPlan.studentId, existingPlan.pointsReward, 'personalized_tutoring_complete');

        // 更新奖励状态
        await this.prisma.personalized_tutoring_plans.update({
          where: { id: planId },
          data: {
            expAwarded: true,
            pointsAwarded: true
          }
        });

        // 创建Timeline完成事件
        const { TimelineService } = require('./timeline.service');
        const timeline = new TimelineService();
        await timeline.createEvent(existingPlan.studentId, 'TUTORING', {
          type: 'PERSONALIZED_PLAN_COMPLETED',
          title: `完成1v1讲解：${existingPlan.title}`,
          subject: existingPlan.subject,
          duration: existingPlan.duration,
          expAwarded: existingPlan.expReward,
          pointsAwarded: existingPlan.pointsReward,
          tutoringId: planId,
          effectivenessRating: updates.effectivenessRating
        });
      }

      return await this.getTutoringPlanById(planId);
    } catch (error) {
      console.error('❌ [TUTORING] Failed to update tutoring plan status:', error);
      throw error;
    }
  }

  /**
   * 删除教学计划
   */
  async deleteTutoringPlan(planId: string, teacherId: string): Promise<void> {
    try {
      // 🔒 宪法合规：验证权限
      const existingPlan = await this.prisma.personalized_tutoring_plans.findFirst({
        where: {
          id: planId,
          teacherId: teacherId
        }
      });

      if (!existingPlan) {
        throw new Error('教学计划不存在或无权限删除');
      }

      await this.prisma.personalized_tutoring_plans.delete({
        where: { id: planId }
      });

      console.log(`✅ [TUTORING] Deleted tutoring plan ${planId}`);
    } catch (error) {
      console.error('❌ [TUTORING] Failed to delete tutoring plan:', error);
      throw error;
    }
  }

  /**
   * 获取教师自己的1v1教学记录用于下载
   * 🔒 宪法合规：老师只能下载自己的记录
   */
  async getTeacherTutoringRecordsForDownload(options: {
    teacherId: string;
    schoolId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    try {
      const where: any = {
        teacherId: options.teacherId,  // 强制使用当前教师ID
        schoolId: options.schoolId
      };

      if (options.startDate && options.endDate) {
        where.createdAt = {
          gte: new Date(options.startDate),
          lte: new Date(options.endDate + ' 23:59:59')
        };
      }

      const records = await this.prisma.personalized_tutoring_plans.findMany({
        where,
        include: {
          teachers: {
            select: {
              name: true,
              displayName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // ✅ 宪法合规：明确的类型转换和数据处理
      return records.map(record => ({
        id: record.id,
        createdAt: record.createdAt,
        teacherName: record.teachers.displayName || record.teachers.name,
        teacherId: record.teacherId,
        studentName: record.studentName,
        studentClass: record.studentClass,
        studentId: record.studentId,
        title: record.title,
        subject: record.subject,
        difficulty: record.difficulty,
        scheduledDate: record.scheduledDate,
        scheduledTime: record.scheduledTime,
        duration: record.duration,
        knowledgePoints: record.knowledgePoints as string[],
        mainProblem: record.mainProblem,
        tutoringMethods: record.tutoringMethods,
        status: record.status,
        expReward: record.expReward,
        pointsReward: record.pointsReward,
        expAwarded: record.expAwarded,
        pointsAwarded: record.pointsAwarded,
        actualStartTime: record.actualStartTime,
        actualEndTime: record.actualEndTime,
        effectivenessRating: record.effectivenessRating,
        completionNotes: record.completionNotes,
        followUpRequired: record.followUpRequired,
        followUpDate: record.followUpDate
      }));
    } catch (error) {
      console.error('❌ [TUTORING] Failed to get teacher tutoring records for download:', error);
      throw error;
    }
  }
}
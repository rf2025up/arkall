import { PrismaClient, LessonPlan, TaskRecord, TaskType } from '@prisma/client';
export interface TaskLibraryItem {
    id: string;
    category: string;
    name: string;
    description?: string;
    defaultExp: number;
    type: TaskType;
    difficulty?: number;
    isActive: boolean;
}
export interface PublishPlanRequest {
    schoolId: string;
    teacherId: string;
    title: string;
    content: any;
    date: Date;
    tasks: Array<{
        type: TaskType;
        title: string;
        content?: any;
        expAwarded: number;
    }>;
}
export interface PublishPlanResult {
    lessonPlan: LessonPlan;
    taskStats: {
        totalStudents: number;
        tasksCreated: number;
        totalExpAwarded: number;
    };
    affectedClasses: string[];
}
export declare class LMSService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 获取任务库
     */
    getTaskLibrary(): Promise<TaskLibraryItem[]>;
    /**
     * 初始化默认任务库
     */
    private initializeDefaultTaskLibrary;
    /**
     * 获取默认任务库（降级方案）
     */
    private getDefaultTaskLibrary;
    /**
     * 🆕 发布教学计划 - 基于师生绑定的安全投送
     * 1. 创建 LessonPlan
     * 2. 🚫 安全锁定：只给发布者名下的学生创建 TaskRecord
     * 3. 返回统计信息
     */
    publishPlan(request: PublishPlanRequest, io: any): Promise<PublishPlanResult>;
    /**
     * 获取学校的教学计划列表
     */
    getLessonPlans(schoolId: string, options?: {
        page?: number;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        plans: LessonPlan[];
        total: number;
    }>;
    /**
     * 获取教学计划详情（包含任务统计）
     */
    getLessonPlanDetail(lessonPlanId: string): Promise<{
        lessonPlan: LessonPlan;
        taskStats: {
            total: number;
            pending: number;
            submitted: number;
            completed: number;
        };
    }>;
    /**
     * 删除教学计划（软删除）
     */
    deleteLessonPlan(lessonPlanId: string): Promise<void>;
    /**
     * 获取学校的教学统计
     */
    getSchoolStats(schoolId: string): Promise<{
        totalPlans: number;
        activePlans: number;
        totalTasks: number;
        completedTasks: number;
        avgCompletionRate: number;
    }>;
    /**
     * 获取指定学生某天的任务记录
     */
    getDailyRecords(schoolId: string, studentId: string, date: string): Promise<TaskRecord[]>;
    /**
     * 增加任务尝试次数
     */
    markAttempt(recordId: string, userId: string): Promise<TaskRecord>;
    /**
     * 更新任务记录状态
     */
    updateRecordStatus(recordId: string, status: 'PENDING' | 'SUBMITTED' | 'REVIEWED' | 'COMPLETED', userId: string): Promise<TaskRecord>;
    /**
     * 批量更新任务记录状态
     */
    updateMultipleRecordStatus(schoolId: string, recordIds: string[], status: 'PENDING' | 'SUBMITTED' | 'REVIEWED' | 'COMPLETED', userId: string): Promise<{
        success: number;
        failed: number;
        errors: string[];
    }>;
    /**
     * 获取学生课程进度 - 集成备课页数据
     */
    getStudentProgress(schoolId: string, studentId: string): Promise<{
        chinese?: {
            unit: string;
            lesson?: string;
            title: string;
        };
        math?: {
            unit: string;
            lesson?: string;
            title: string;
        };
        english?: {
            unit: string;
            title: string;
        };
        source: 'lesson_plan' | 'default';
        updatedAt: string;
    }>;
    /**
     * 更新学生课程进度 - 权限高于备课页
     * 这里我们将进度信息直接存储在学生的最新任务记录中
     */
    updateStudentProgress(schoolId: string, studentId: string, teacherId: string, progress: {
        chinese?: {
            unit: string;
            lesson?: string;
            title: string;
        };
        math?: {
            unit: string;
            lesson?: string;
            title: string;
        };
        english?: {
            unit: string;
            title: string;
        };
    }): Promise<{
        success: boolean;
        progress: any;
        message: string;
    }>;
}
//# sourceMappingURL=lms.service.d.ts.map
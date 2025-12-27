import { PrismaClient, lesson_plans, TaskType } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { RewardService } from './reward.service';
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
    date: Date | string;
    progress?: any;
    tasks: Array<{
        type: TaskType;
        title: string;
        content?: any;
        expAwarded: number;
    }>;
}
export interface PublishPlanResult {
    lessonPlan: lesson_plans;
    taskStats: {
        totalStudents: number;
        tasksCreated: number;
        totalExpAwarded: number;
    };
    affectedClasses: string[];
}
export declare class LMSService {
    private prisma;
    private io?;
    private rewardService;
    constructor(prisma: PrismaClient, rewardService: RewardService, io?: SocketIOServer);
    /**
     * 🆕 实时同步助手函数
     */
    private broadcastStudentUpdate;
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
     */
    publishPlan(request: PublishPlanRequest, io: any): Promise<PublishPlanResult>;
    /**
     * 获取学生课程进度 - 🆕 升级版本：支持分科智能合并 (Override vs Plan)
     */
    getStudentProgress(schoolId: string, studentId: string): Promise<any>;
    /**
     * 获取教学计划列表
     */
    getLessonPlans(schoolId: string, options?: {
        page?: number;
        limit?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        plans: ({
            teachers: {
                name: string;
            };
        } & {
            id: string;
            schoolId: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            teacherId: string;
            title: string;
            content: import("@prisma/client/runtime/library").JsonValue;
            date: Date;
            isGlobal: boolean;
        })[];
        total: number;
    }>;
    /**
     * 获取教学计划详情
     */
    getLessonPlanDetail(planId: string): Promise<{
        teachers: {
            name: string;
        };
        task_records: ({
            students: {
                name: string;
                className: string;
            };
        } & {
            id: string;
            schoolId: string;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            type: import(".prisma/client").$Enums.TaskType;
            title: string;
            content: import("@prisma/client/runtime/library").JsonValue | null;
            status: import(".prisma/client").$Enums.TaskStatus;
            expAwarded: number;
            submittedAt: Date | null;
            lessonPlanId: string | null;
            task_category: import(".prisma/client").$Enums.TaskCategory;
            is_current: boolean;
            attempts: number;
            subject: string | null;
            isOverridden: boolean;
        })[];
    } & {
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        teacherId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        date: Date;
        isGlobal: boolean;
    }>;
    /**
     * 删除教学计划
     */
    deleteLessonPlan(planId: string): Promise<{
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        teacherId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        date: Date;
        isGlobal: boolean;
    }>;
    /**
     * 获取学校统计信息
     */
    getSchoolStats(schoolId: string): Promise<{
        totalPlans: number;
        totalStudents: number;
        taskStats: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.Task_recordsGroupByOutputType, "status"[]> & {
            _count: number;
        })[];
    }>;
    /**
     * 获取学生的每日任务记录
     */
    getDailyRecords(schoolId: string, studentId: string, date: string): Promise<{
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        type: import(".prisma/client").$Enums.TaskType;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        lessonPlanId: string | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        attempts: number;
        subject: string | null;
        isOverridden: boolean;
    }[]>;
    /**
     * 🆕 性能优化：按老师或班级批量获取所有学生的每日任务记录
     */
    getBatchDailyRecords(schoolId: string, date: string, teacherId?: string, className?: string): Promise<{
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        type: import(".prisma/client").$Enums.TaskType;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        lessonPlanId: string | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        attempts: number;
        subject: string | null;
        isOverridden: boolean;
    }[]>;
    /**
     * 获取学生所有历史任务记录
     */
    getAllStudentRecords(schoolId: string, studentId: string, limit?: number): Promise<{
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        type: import(".prisma/client").$Enums.TaskType;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        lessonPlanId: string | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        attempts: number;
        subject: string | null;
        isOverridden: boolean;
    }[]>;
    /**
     * 记录尝试次数
     */
    markAttempt(recordId: string, userId: string): Promise<{
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        type: import(".prisma/client").$Enums.TaskType;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        lessonPlanId: string | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        attempts: number;
        subject: string | null;
        isOverridden: boolean;
    }>;
    /**
     * 批量更新任务状态
     */
    updateMultipleRecordStatus(schoolId: string, recordIds: string[], status: any, userId: string, courseInfo?: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    /**
     * 更新学生课程进度 - 老师手动覆盖，优先级最高
     */
    updateStudentProgress(schoolId: string, studentId: string, teacherId: string, courseInfo: any): Promise<{
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        type: import(".prisma/client").$Enums.TaskType;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        lessonPlanId: string | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        attempts: number;
        subject: string | null;
        isOverridden: boolean;
    }>;
    /**
     * 🛡️ 辅助方法：将中文/字符串分类映射为 Prisma 枚举
     */
    private mapToTaskCategory;
    /**
     * 🆕 创建单条任务记录 - 用于过关页增量添加
     */
    createSingleTaskRecord(data: {
        schoolId: string;
        studentId: string;
        type: TaskType;
        title: string;
        category: string;
        subcategory?: string;
        exp: number;
        courseInfo?: any;
        isOverridden?: boolean;
    }): Promise<{
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        type: import(".prisma/client").$Enums.TaskType;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        lessonPlanId: string | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        attempts: number;
        subject: string | null;
        isOverridden: boolean;
    }>;
    /**
     * 🆕 创建任务记录 - 用于过关抽屉手动添加 QC 项
     * courseInfo 会被完整存储，以便全学期地图能显示"第X单元 第X课 课文名字"
     */
    createTaskRecord(data: {
        studentId: string;
        type: string;
        title: string;
        status: string;
        category: string;
        subcategory?: string;
        date: string;
        courseInfo?: any;
        exp: number;
    }): Promise<{
        id: string;
        schoolId: string;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        type: import(".prisma/client").$Enums.TaskType;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        lessonPlanId: string | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        attempts: number;
        subject: string | null;
        isOverridden: boolean;
    }>;
    /**
     * 🆕 结算学生当日所有任务 - V2 正式版
     */
    settleStudentTasks(schoolId: string, studentId: string, expBonus?: number, courseInfo?: any): Promise<{
        success: boolean;
        count: number;
        totalExpAwarded: number;
    }>;
    /**
     * 获取最新教学计划
     */
    getLatestLessonPlan(schoolId: string, teacherId: string): Promise<lesson_plans | null>;
}
//# sourceMappingURL=lms.service.d.ts.map
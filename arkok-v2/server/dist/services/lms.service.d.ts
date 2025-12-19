import { lesson_plans, TaskType } from '@prisma/client';
export interface TaskLibraryItem {
    id: string;
    category: string;
    educationalDomain: string;
    educationalSubcategory?: string;
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
    constructor();
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
            teacherId: string;
            title: string;
            content: import("@prisma/client/runtime/library").JsonValue;
            date: Date;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
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
            title: string;
            content: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TaskType;
            status: import(".prisma/client").$Enums.TaskStatus;
            expAwarded: number;
            submittedAt: Date | null;
            task_category: import(".prisma/client").$Enums.TaskCategory;
            is_current: boolean;
            isOverridden: boolean;
            attempts: number;
            subject: string | null;
            studentId: string;
            lessonPlanId: string | null;
        })[];
    } & {
        id: string;
        schoolId: string;
        teacherId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        date: Date;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * 删除教学计划
     */
    deleteLessonPlan(planId: string): Promise<{
        id: string;
        schoolId: string;
        teacherId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        date: Date;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TaskType;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        isOverridden: boolean;
        attempts: number;
        subject: string | null;
        studentId: string;
        lessonPlanId: string | null;
    }[]>;
    /**
     * 获取学生所有历史任务记录
     */
    getAllStudentRecords(schoolId: string, studentId: string, limit?: number): Promise<{
        id: string;
        schoolId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TaskType;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        isOverridden: boolean;
        attempts: number;
        subject: string | null;
        studentId: string;
        lessonPlanId: string | null;
    }[]>;
    /**
     * 记录尝试次数
     */
    markAttempt(recordId: string, userId: string): Promise<{
        id: string;
        schoolId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TaskType;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        isOverridden: boolean;
        attempts: number;
        subject: string | null;
        studentId: string;
        lessonPlanId: string | null;
    }>;
    /**
     * 批量更新任务状态
     */
    updateMultipleRecordStatus(schoolId: string, recordIds: string[], status: any, userId: string): Promise<{
        success: number;
        failed: number;
    }>;
    /**
     * 更新学生课程进度 - 老师手动覆盖，优先级最高
     */
    updateStudentProgress(schoolId: string, studentId: string, teacherId: string, courseInfo: any): Promise<{
        id: string;
        schoolId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        updatedAt: Date;
        type: import(".prisma/client").$Enums.TaskType;
        status: import(".prisma/client").$Enums.TaskStatus;
        expAwarded: number;
        submittedAt: Date | null;
        task_category: import(".prisma/client").$Enums.TaskCategory;
        is_current: boolean;
        isOverridden: boolean;
        attempts: number;
        subject: string | null;
        studentId: string;
        lessonPlanId: string | null;
    }>;
    /**
     * 获取最新教学计划
     */
    getLatestLessonPlan(schoolId: string, teacherId: string): Promise<lesson_plans | null>;
}
//# sourceMappingURL=lms.service.d.ts.map
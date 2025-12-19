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
export declare class PersonalizedTutoringService {
    private prisma;
    constructor();
    /**
     * 创建1v1教学计划
     */
    createPersonalizedTutoringPlan(request: PersonalizedTutoringPlanRequest): Promise<PersonalizedTutoringPlanResponse>;
    /**
     * 获取单个教学计划详情
     */
    getTutoringPlanById(planId: string): Promise<PersonalizedTutoringPlanResponse>;
    /**
     * 获取教师的教学计划列表
     */
    getTeacherTutoringPlans(teacherId: string, options: TutoringQueryOptions): Promise<PersonalizedTutoringPlanResponse[]>;
    /**
     * 更新教学计划状态
     */
    updateTutoringPlanStatus(planId: string, teacherId: string, updates: {
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
    }): Promise<PersonalizedTutoringPlanResponse>;
    /**
     * 删除教学计划
     */
    deleteTutoringPlan(planId: string, teacherId: string): Promise<void>;
    /**
     * 获取教师自己的1v1教学记录用于下载
     * 🔒 宪法合规：老师只能下载自己的记录
     */
    getTeacherTutoringRecordsForDownload(options: {
        teacherId: string;
        schoolId: string;
        startDate?: string;
        endDate?: string;
    }): Promise<any[]>;
}
//# sourceMappingURL=personalized-tutoring.service.d.ts.map
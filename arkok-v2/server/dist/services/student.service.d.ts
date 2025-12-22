import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
export interface StudentQuery {
    schoolId: string;
    className?: string;
    search?: string;
    page?: number;
    limit?: number;
    teacherId?: string;
    scope?: 'MY_STUDENTS' | 'ALL_SCHOOL' | 'SPECIFIC_TEACHER';
    userRole?: 'ADMIN' | 'TEACHER';
    requesterId?: string;
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
    className?: string;
    schoolId: string;
    teacherId: string;
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
export declare class StudentService {
    private prisma;
    private io;
    constructor(prisma: PrismaClient, io: SocketIOServer);
    /**
     * 🆕 获取学生列表 - 基于师生绑定的重构版本
     */
    getStudents(query: StudentQuery): Promise<StudentListResponse>;
    /**
     * 根据ID获取单个学生
     */
    getStudentById(id: string, schoolId: string): Promise<any>;
    /**
     * 获取学生完整档案（聚合所有相关数据）
     */
    getStudentProfile(studentId: string, schoolId: string, userRole?: 'ADMIN' | 'TEACHER', userId?: string): Promise<any>;
    /**
     * 构建时间轴数据
     */
    private buildTimelineData;
    /**
     * 获取任务类型标签
     */
    private getTaskTypeLabel;
    createStudent(studentData: CreateStudentRequest): Promise<{
        id: string;
        schoolId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        teacherId: string | null;
        className: string | null;
        level: number;
        points: number;
        exp: number;
        avatarUrl: string | null;
        teamId: string | null;
        currentLesson: string | null;
        currentLessonTitle: string | null;
        currentUnit: string | null;
    }>;
    /**
     * 更新学生信息
     */
    updateStudent(data: UpdateStudentRequest): Promise<any>;
    /**
     * 删除学生（软删除）
     */
    deleteStudent(id: string, schoolId: string): Promise<void>;
    /**
     * 批量添加积分/经验
     */
    addScore(data: AddScoreRequest, updatedBy: string): Promise<any[]>;
    /**
     * 获取学生排行榜
     */
    getLeaderboard(schoolId: string, limit?: number): Promise<any[]>;
    /**
     * 获取班级统计
     */
    getClassStats(schoolId: string): Promise<any>;
    /**
     * 获取班级列表（用于班级切换）
     * 🆕 修改：返回按老师分组的班级信息，支持多老师显示
     */
    getClasses(schoolId: string): Promise<any[]>;
    /**
     * 🆕 师生关系转移 - 从"转班"升级为"抢人"
     * 将学生划归到指定老师名下
     */
    transferStudents(studentIds: string[], targetTeacherId: string, schoolId: string, updatedBy: string): Promise<any[]>;
    /**
     * 计算等级
     */
    private calculateLevel;
    /**
     * 广播到指定学校的房间
     */
    private broadcastToSchool;
}
export default StudentService;
//# sourceMappingURL=student.service.d.ts.map
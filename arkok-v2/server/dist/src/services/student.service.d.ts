import { Server as SocketIOServer } from 'socket.io';
export interface StudentQuery {
    schoolId: string;
    classRoom?: string;
    search?: string;
    page?: number;
    limit?: number;
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
    className: string;
    schoolId: string;
}
export interface UpdateStudentRequest {
    id: string;
    schoolId: string;
    name?: string;
    classRoom?: string;
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
    constructor(io: SocketIOServer);
    /**
     * 获取学生列表 - 强制重写修复
     */
    getStudents(query: StudentQuery): Promise<StudentListResponse>;
    /**
     * 根据ID获取单个学生
     */
    getStudentById(id: string, schoolId: string): Promise<any>;
    /**
     * 获取学生完整档案（聚合所有相关数据）
     */
    getStudentProfile(studentId: string, schoolId: string): Promise<any>;
    /**
     * 构建时间轴数据
     */
    private buildTimelineData;
    /**
     * 获取任务类型标签
     */
    private getTaskTypeLabel;
    createStudent(studentData: {
        name: string;
        className: string;
        schoolId: string;
    }): Promise<{
        name: string;
        id: string;
        schoolId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        className: string;
        level: number;
        points: number;
        exp: number;
        avatarUrl: string | null;
        teamId: string | null;
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
     */
    getClasses(schoolId: string): Promise<any[]>;
    /**
     * 转班（支持Admin和Teacher）
     */
    transferStudents(studentIds: string[], targetClassName: string, schoolId: string, updatedBy: string): Promise<any[]>;
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
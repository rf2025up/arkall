import { Server as SocketIOServer } from 'socket.io';
export interface HabitQuery {
    schoolId: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
export interface CreateHabitRequest {
    name: string;
    description?: string;
    icon?: string;
    expReward: number;
    pointsReward?: number;
    schoolId: string;
}
export interface UpdateHabitRequest {
    id: string;
    schoolId: string;
    name?: string;
    description?: string;
    icon?: string;
    expReward?: number;
    pointsReward?: number;
    isActive?: boolean;
}
export interface HabitCheckInRequest {
    habitId: string;
    studentId: string;
    schoolId: string;
    notes?: string;
}
export interface HabitListResponse {
    habits: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface HabitLogQuery {
    schoolId: string;
    habitId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
export interface HabitStatsResponse {
    totalHabits: number;
    activeHabits: number;
    totalCheckIns: number;
    streakRates: {
        habitId: string;
        habitName: string;
        avgStreakDays: number;
        totalCheckIns: number;
    }[];
    topParticipants: {
        studentId: string;
        studentName: string;
        totalCheckIns: number;
        totalExp: number;
    }[];
}
export declare class HabitService {
    private prisma;
    private io;
    constructor(io: SocketIOServer);
    /**
     * 获取习惯列表 - 性能优化版本
     */
    getHabits(query: HabitQuery): Promise<HabitListResponse>;
    /**
     * 根据ID获取单个习惯
     */
    getHabitById(id: string, schoolId: string): Promise<any>;
    /**
     * 创建新习惯
     */
    createHabit(data: CreateHabitRequest): Promise<any>;
    /**
     * 更新习惯信息
     */
    updateHabit(data: UpdateHabitRequest): Promise<any>;
    /**
     * 删除习惯（软删除）
     */
    deleteHabit(id: string, schoolId: string): Promise<void>;
    /**
     * 学生习惯打卡
     */
    checkInHabit(data: HabitCheckInRequest, checkedBy: string): Promise<any>;
    /**
     * 获取习惯打卡记录
     */
    getHabitLogs(query: HabitLogQuery): Promise<any>;
    /**
     * 获取学生习惯打卡统计
     */
    getStudentHabitStats(studentId: string, schoolId: string): Promise<any>;
    /**
     * 获取习惯统计信息
     */
    getHabitStats(schoolId: string): Promise<HabitStatsResponse>;
    /**
     * 计算当前连续打卡天数
     */
    private calculateCurrentStreak;
    /**
     * 广播到指定学校的房间
     */
    private broadcastToSchool;
}
export default HabitService;
//# sourceMappingURL=habit.service.d.ts.map
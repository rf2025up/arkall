import { Server as SocketIOServer } from 'socket.io';
export interface ChallengeQuery {
    schoolId: string;
    search?: string;
    type?: string;
    status?: string;
    creatorId?: string;
    page?: number;
    limit?: number;
}
export interface CreateChallengeRequest {
    title: string;
    description?: string;
    type: string;
    schoolId: string;
    creatorId: string;
    startDate?: Date;
    endDate?: Date;
    rewardPoints?: number;
    rewardExp?: number;
    maxParticipants?: number;
    metadata?: Record<string, any>;
}
export interface UpdateChallengeRequest {
    id: string;
    schoolId: string;
    title?: string;
    description?: string;
    type?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    rewardPoints?: number;
    rewardExp?: number;
    maxParticipants?: number;
    metadata?: Record<string, any>;
    isActive?: boolean;
}
export interface JoinChallengeRequest {
    challengeId: string;
    studentId: string;
    schoolId: string;
}
export interface UpdateChallengeParticipantRequest {
    challengeId: string;
    studentId: string;
    schoolId: string;
    status?: string;
    result?: string;
    score?: number;
    notes?: string;
}
export interface ChallengeListResponse {
    challenges: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface ChallengeStatsResponse {
    totalChallenges: number;
    activeChallenges: number;
    completedChallenges: number;
    totalParticipants: number;
    averageParticipation: number;
    challengeTypes: {
        type: string;
        count: number;
    }[];
    recentActivities: any[];
}
export declare class ChallengeService {
    private prisma;
    private io;
    constructor(io: SocketIOServer);
    /**
     * 获取挑战列表
     */
    getChallenges(query: ChallengeQuery): Promise<ChallengeListResponse>;
    /**
     * 根据ID获取单个挑战详情
     */
    getChallengeById(id: string, schoolId: string): Promise<any>;
    /**
     * 创建新挑战
     */
    createChallenge(data: CreateChallengeRequest): Promise<any>;
    /**
     * 更新挑战信息
     */
    updateChallenge(data: UpdateChallengeRequest): Promise<any>;
    /**
     * 删除挑战（软删除）
     */
    deleteChallenge(id: string, schoolId: string): Promise<void>;
    /**
     * 学生参加挑战
     */
    joinChallenge(data: JoinChallengeRequest): Promise<any>;
    /**
     * 更新挑战参与者状态
     */
    updateChallengeParticipant(data: UpdateChallengeParticipantRequest): Promise<any>;
    /**
     * 获取挑战参与者列表
     */
    getChallengeParticipants(challengeId: string, schoolId: string, page?: number, limit?: number): Promise<any>;
    /**
     * 获取学生挑战统计
     */
    getStudentChallengeStats(studentId: string, schoolId: string): Promise<any>;
    /**
     * 获取挑战统计信息
     */
    getChallengeStats(schoolId: string): Promise<ChallengeStatsResponse>;
    /**
     * 给予挑战奖励
     */
    private grantChallengeRewards;
    /**
     * 计算挑战统计信息
     */
    private calculateChallengeStats;
    /**
     * 广播到指定学校的房间
     */
    private broadcastToSchool;
}
export default ChallengeService;
//# sourceMappingURL=challenge.service.d.ts.map
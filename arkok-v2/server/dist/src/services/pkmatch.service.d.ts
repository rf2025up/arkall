import { Server as SocketIOServer } from 'socket.io';
export interface PKMatchQuery {
    schoolId: string;
    search?: string;
    status?: string;
    studentId?: string;
    topic?: string;
    page?: number;
    limit?: number;
}
export interface CreatePKMatchRequest {
    studentA: string;
    studentB: string;
    topic: string;
    schoolId: string;
    metadata?: Record<string, any>;
}
export interface UpdatePKMatchRequest {
    id: string;
    schoolId: string;
    topic?: string;
    status?: string;
    winnerId?: string;
    metadata?: Record<string, any>;
}
export interface PKMatchListResponse {
    matches: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface PKMatchStatsResponse {
    totalMatches: number;
    activeMatches: number;
    completedMatches: number;
    totalParticipants: number;
    averageMatchesPerStudent: number;
    popularTopics: {
        topic: string;
        count: number;
    }[];
    recentActivities: any[];
}
export declare class PKMatchService {
    private prisma;
    private io;
    constructor(io: SocketIOServer);
    /**
     * 获取PK对战列表
     */
    getPKMatches(query: PKMatchQuery): Promise<PKMatchListResponse>;
    /**
     * 根据ID获取单个PK对战详情
     */
    getPKMatchById(id: string, schoolId: string): Promise<any>;
    /**
     * 创建新PK对战
     */
    createPKMatch(data: CreatePKMatchRequest): Promise<any>;
    /**
     * 更新PK对战信息
     */
    updatePKMatch(data: UpdatePKMatchRequest): Promise<any>;
    /**
     * 删除PK对战
     */
    deletePKMatch(id: string, schoolId: string): Promise<void>;
    /**
     * 获取学生PK统计
     */
    getStudentPKStats(studentId: string, schoolId: string): Promise<any>;
    /**
     * 获取PK排行榜
     */
    getPKLeaderboard(schoolId: string, limit?: number): Promise<any[]>;
    /**
     * 获取PK统计信息
     */
    getPKStats(schoolId: string): Promise<PKMatchStatsResponse>;
    /**
     * 给予PK对战奖励
     */
    private grantMatchRewards;
    /**
     * 计算对战统计信息
     */
    private calculateMatchStats;
    /**
     * 广播到指定学校的房间
     */
    private broadcastToSchool;
}
export default PKMatchService;
//# sourceMappingURL=pkmatch.service.d.ts.map
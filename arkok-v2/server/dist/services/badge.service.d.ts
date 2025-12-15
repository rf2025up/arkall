import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
export interface BadgeQuery {
    schoolId: string;
    search?: string;
    category?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
export interface CreateBadgeRequest {
    name: string;
    description?: string;
    icon?: string;
    category: string;
    requirement?: Record<string, any>;
    schoolId: string;
}
export interface UpdateBadgeRequest {
    id: string;
    schoolId: string;
    name?: string;
    description?: string;
    icon?: string;
    category?: string;
    requirement?: Record<string, any>;
    isActive?: boolean;
}
export interface AwardBadgeRequest {
    studentId: string;
    badgeId: string;
    schoolId: string;
    reason?: string;
    awardedBy?: string;
}
export interface BadgeListResponse {
    badges: any[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface BadgeStatsResponse {
    totalBadges: number;
    activeBadges: number;
    totalAwarded: number;
    uniqueEarners: number;
    categoryDistribution: {
        category: string;
        count: number;
        awardedCount: number;
    }[];
    topEarners: {
        studentId: string;
        studentName: string;
        badgeCount: number;
    }[];
    recentAwards: any[];
}
export declare class BadgeService {
    private prisma;
    private io;
    constructor(prisma: PrismaClient, io: SocketIOServer);
    /**
     * 获取勋章列表
     */
    getBadges(query: BadgeQuery): Promise<BadgeListResponse>;
    /**
     * 根据ID获取单个勋章详情
     */
    getBadgeById(id: string, schoolId: string): Promise<any>;
    /**
     * 创建新勋章
     */
    createBadge(data: CreateBadgeRequest): Promise<any>;
    /**
     * 更新勋章信息
     */
    updateBadge(data: UpdateBadgeRequest): Promise<any>;
    /**
     * 删除勋章（软删除）
     */
    deleteBadge(id: string, schoolId: string): Promise<void>;
    /**
     * 授予学生勋章
     */
    awardBadge(data: AwardBadgeRequest): Promise<any>;
    /**
     * 取消学生勋章
     */
    revokeBadge(studentId: string, badgeId: string, schoolId: string): Promise<void>;
    /**
     * 获取学生勋章列表
     */
    getStudentBadges(studentId: string, schoolId: string): Promise<any>;
    /**
     * 获取可获得的勋章（基于学生成就）
     */
    getAvailableBadges(studentId: string, schoolId: string): Promise<any>;
    /**
     * 获取勋章统计信息
     */
    getBadgeStats(schoolId: string): Promise<BadgeStatsResponse>;
    /**
     * 分析勋章要求达成情况
     */
    private analyzeBadgeRequirement;
    /**
     * 广播到指定学校的房间
     */
    private broadcastToSchool;
}
export default BadgeService;
//# sourceMappingURL=badge.service.d.ts.map
import { Router } from 'express';
import { BadgeService } from '../services/badge.service';
import { AuthService } from '../services/auth.service';
export interface BadgeResponse {
    success: boolean;
    message?: string;
    data?: any;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
/**
 * 勋章管理相关路由
 */
export declare class BadgeRoutes {
    private badgeService;
    private authService;
    private router;
    constructor(badgeService: BadgeService, authService: AuthService);
    private initializeRoutes;
    /**
     * 获取勋章列表
     */
    private getBadges;
    /**
     * 获取单个勋章详情
     */
    private getBadgeById;
    /**
     * 创建新勋章
     */
    private createBadge;
    /**
     * 更新勋章信息
     */
    private updateBadge;
    /**
     * 删除勋章（软删除）
     */
    private deleteBadge;
    /**
     * 授予学生勋章
     */
    private awardBadge;
    /**
     * 取消学生勋章
     */
    private revokeBadge;
    /**
     * 批量授予学生勋章
     */
    private batchAward;
    /**
     * 获取学生勋章列表
     */
    private getStudentBadges;
    /**
     * 获取可获得的勋章
     */
    private getAvailableBadges;
    /**
     * 获取勋章统计信息
     */
    private getBadgeStats;
    /**
     * 获取路由器实例
     */
    getRoutes(): Router;
}
export default BadgeRoutes;
//# sourceMappingURL=badge.routes.d.ts.map
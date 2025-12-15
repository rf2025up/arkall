import { Router } from 'express';
import { PKMatchService } from '../services/pkmatch.service';
export interface PKMatchResponse {
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
 * PK对战管理相关路由
 */
export declare class PKMatchRoutes {
    private pkMatchService;
    private router;
    constructor(pkMatchService: PKMatchService);
    private initializeRoutes;
    /**
     * 获取PK对战列表
     */
    private getPKMatches;
    /**
     * 获取单个PK对战详情
     */
    private getPKMatchById;
    /**
     * 创建新PK对战
     */
    private createPKMatch;
    /**
     * 更新PK对战信息
     */
    private updatePKMatch;
    /**
     * 删除PK对战
     */
    private deletePKMatch;
    /**
     * 获取学生PK统计
     */
    private getStudentPKStats;
    /**
     * 获取PK排行榜
     */
    private getPKLeaderboard;
    /**
     * 获取PK统计信息
     */
    private getPKStats;
    /**
     * 获取路由器实例
     */
    getRoutes(): Router;
}
export default PKMatchRoutes;
//# sourceMappingURL=pkmatch.routes.d.ts.map
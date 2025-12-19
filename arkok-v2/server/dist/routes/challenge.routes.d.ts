import { Router } from 'express';
import { ChallengeService } from '../services/challenge.service';
import { AuthService } from '../services/auth.service';
export interface ChallengeResponse {
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
 * 挑战管理相关路由
 */
export declare class ChallengeRoutes {
    private challengeService;
    private authService;
    private router;
    constructor(challengeService: ChallengeService, authService: AuthService);
    private initializeRoutes;
    /**
     * 获取挑战列表
     */
    private getChallenges;
    /**
     * 获取单个挑战详情
     */
    private getChallengeById;
    /**
     * 创建新挑战
     */
    private createChallenge;
    /**
     * 更新挑战信息
     */
    private updateChallenge;
    /**
     * 删除挑战（软删除）
     */
    private deleteChallenge;
    /**
     * 学生参加挑战
     */
    private joinChallenge;
    /**
     * 更新挑战参与者状态
     */
    private updateChallengeParticipant;
    /**
     * 获取挑战参与者列表
     */
    private getChallengeParticipants;
    /**
     * 获取学生挑战统计
     */
    private getStudentChallengeStats;
    /**
     * 获取挑战统计信息
     */
    private getChallengeStats;
    /**
     * 获取路由器实例
     */
    getRoutes(): Router;
}
export default ChallengeRoutes;
//# sourceMappingURL=challenge.routes.d.ts.map
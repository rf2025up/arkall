import { Router } from 'express';
import { HabitService } from '../services/habit.service';
import { AuthService } from '../services/auth.service';
export interface HabitResponse {
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
 * 习惯管理相关路由
 */
export declare class HabitRoutes {
    private habitService;
    private authService;
    private router;
    constructor(habitService: HabitService, authService: AuthService);
    private initializeRoutes;
    /**
     * 获取习惯列表
     */
    private getHabits;
    /**
     * 获取单个习惯详情
     */
    private getHabitById;
    /**
     * 创建新习惯
     */
    private createHabit;
    /**
     * 更新习惯信息
     */
    private updateHabit;
    /**
     * 删除习惯（软删除）
     */
    private deleteHabit;
    /**
     * 学生习惯打卡
     */
    private checkInHabit;
    /**
     * 获取习惯打卡记录
     */
    private getHabitLogs;
    /**
     * 获取学生习惯打卡统计
     */
    private getStudentHabitStats;
    /**
     * 获取习惯统计信息
     */
    private getHabitStats;
    /**
     * 获取路由器实例
     */
    getRoutes(): Router;
}
export default HabitRoutes;
//# sourceMappingURL=habit.routes.d.ts.map
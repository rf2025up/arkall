import { Router } from 'express';
import { AuthService } from '../services/auth.service';
export declare class CheckinRoutes {
    private authService;
    private router;
    constructor(authService: AuthService);
    private initializeRoutes;
    /**
     * 批量签到
     */
    private batchCheckin;
    /**
     * 获取学生本月签到天数
     */
    private getMonthlyCheckinCount;
    /**
     * 检查学生今日是否已签到
     */
    private isTodayCheckedIn;
    getRoutes(): Router;
}
export default CheckinRoutes;
//# sourceMappingURL=checkin.routes.d.ts.map
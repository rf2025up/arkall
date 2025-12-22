import { Router } from 'express';
import { LMSService } from '../services/lms.service';
import AuthService from '../services/auth.service';
/**
 * 任务记录路由 (V5.0) - 复用 LMSService 逻辑
 */
export declare class RecordsRoutes {
    private lmsService;
    private authService;
    private router;
    constructor(lmsService: LMSService, authService: AuthService);
    private initializeRoutes;
    getRoutes(): Router;
}
//# sourceMappingURL=records.routes.d.ts.map
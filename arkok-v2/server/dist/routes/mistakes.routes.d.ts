import { Router } from 'express';
import AuthService from '../services/auth.service';
/**
 * 错题管理路由 (V5.0)
 */
export declare class MistakesRoutes {
    private authService;
    private router;
    constructor(authService: AuthService);
    private initializeRoutes;
    getRoutes(): Router;
}
//# sourceMappingURL=mistakes.routes.d.ts.map
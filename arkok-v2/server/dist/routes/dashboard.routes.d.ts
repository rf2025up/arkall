import { Router } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '../services/auth.service';
export declare class DashboardRoutes {
    private dashboardService;
    private authService;
    constructor(dashboardService: DashboardService, authService: AuthService);
    getRoutes(): Router;
}
export default DashboardRoutes;
//# sourceMappingURL=dashboard.routes.d.ts.map
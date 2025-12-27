import { Router } from 'express';
import { PlatformService } from '../services/platform.service';
import { AuthService } from '../services/auth.service';
export declare class PlatformRoutes {
    private platformService;
    private authService;
    constructor(platformService: PlatformService, authService: AuthService);
    getRoutes(): Router;
}
export default PlatformRoutes;
//# sourceMappingURL=platform.routes.d.ts.map
import { Router } from 'express';
import { SchoolService } from '../services/school.service';
import { AuthService } from '../services/auth.service';
export declare class SchoolRoutes {
    private schoolService;
    private authService;
    constructor(schoolService: SchoolService, authService: AuthService);
    getRoutes(): Router;
}
export default SchoolRoutes;
//# sourceMappingURL=school.routes.d.ts.map
import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
export declare class UserRoutes {
    private authService;
    private prisma;
    constructor(authService: AuthService, prisma: PrismaClient);
    getRoutes(): Router;
}
export default UserRoutes;
//# sourceMappingURL=user.routes.d.ts.map
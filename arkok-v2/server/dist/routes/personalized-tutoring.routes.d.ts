import { Router } from 'express';
import { PersonalizedTutoringService } from '../services/personalized-tutoring.service';
import { AuthService } from '../services/auth.service';
export declare class PersonalizedTutoringRoutes {
    private tutoringService;
    private authService;
    constructor(tutoringService: PersonalizedTutoringService, authService: AuthService);
    getRoutes(): Router;
    private generateTutoringRecordsExcel;
    private getSubjectName;
    private formatTutoringMethods;
    private getStatusText;
}
export default PersonalizedTutoringRoutes;
//# sourceMappingURL=personalized-tutoring.routes.d.ts.map
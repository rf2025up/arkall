import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import AuthService from './services/auth.service';
import StudentService from './services/student.service';
import { LMSService } from './services/lms.service';
import SocketService from './services/socket.service';
import HabitService from './services/habit.service';
import ChallengeService from './services/challenge.service';
import PKMatchService from './services/pkmatch.service';
import BadgeService from './services/badge.service';
import { ReportService } from './services/report.service';
import SchoolService from './services/school.service';
import DashboardService from './services/dashboard.service';
import { PersonalizedTutoringService } from './services/personalized-tutoring.service';
import PlatformService from './services/platform.service';
import { RewardService } from './services/reward.service';
export declare class App {
    app: express.Application;
    server: any;
    io: SocketIOServer;
    prisma: PrismaClient;
    authService: AuthService;
    studentService: StudentService;
    socketService: SocketService;
    habitService: HabitService;
    challengeService: ChallengeService;
    pkMatchService: PKMatchService;
    badgeService: BadgeService;
    lmsService: LMSService;
    reportService: ReportService;
    schoolService: SchoolService;
    dashboardService: DashboardService;
    tutoringService: PersonalizedTutoringService;
    platformService: PlatformService;
    rewardService: RewardService;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeErrorHandling;
    private initializeSocketIO;
    start(port?: number): Promise<void>;
    /**
     * 停止服务（用于安全退出）
     */
    stop(): Promise<void>;
}
export default App;
//# sourceMappingURL=app.d.ts.map
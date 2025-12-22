import { PrismaClient } from '@prisma/client';
export interface SchoolStats {
    totalStudents: number;
    totalPoints: number;
    totalExp: number;
    avgPoints: number;
    avgExp: number;
}
export interface TopStudent {
    id: string;
    name: string;
    className: string;
    level: number;
    points: number;
    exp: number;
    avatarUrl?: string;
    teamId?: string;
}
export interface PKMatch {
    id: string;
    topic: string;
    status: string;
    playerA: {
        id: string;
        name: string;
        className: string;
        avatarUrl?: string;
    };
    playerB: {
        id: string;
        name: string;
        className: string;
        avatarUrl?: string;
    };
    createdAt: string;
    student_a: string;
    student_b: string;
    winner_id?: string;
}
export interface Challenge {
    id: string;
    title: string;
    type: string;
    expAwarded: number;
    student: {
        id: string;
        name: string;
        className: string;
        avatarUrl?: string;
    };
    submittedAt: string;
    status: string;
}
export interface ClassStats {
    className: string;
    studentCount: number;
    totalPoints: number;
    totalExp: number;
    avgPoints: number;
    avgExp: number;
}
export interface DashboardData {
    schoolStats: SchoolStats;
    topStudents: TopStudent[];
    ongoingPKs: PKMatch[];
    activePKs: PKMatch[];
    recentChallenges: Challenge[];
    classRanking: ClassStats[];
}
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 获取仪表板数据
     */
    getDashboardData(schoolId?: string): Promise<DashboardData>;
}
export default DashboardService;
//# sourceMappingURL=dashboard.service.d.ts.map
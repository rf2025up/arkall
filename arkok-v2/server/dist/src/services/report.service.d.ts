import { PrismaClient } from '@prisma/client';
export interface StudentStatsRequest {
    studentId: string;
    schoolId: string;
    startDate: Date;
    endDate: Date;
}
export interface StudentStatsData {
    studentInfo: {
        name: string;
        className: string;
        level: number;
        points: number;
        exp: number;
    };
    tasks: {
        completedCount: number;
        totalExp: number;
        breakdown: {
            [key: string]: number;
        };
    };
    badges: {
        earnedCount: number;
        recentBadges: Array<{
            name: string;
            category: string;
            awardedAt: Date;
        }>;
    };
    pkMatches: {
        totalMatches: number;
        wins: number;
        winRate: number;
    };
    mistakes: {
        totalMistakes: number;
        resolvedMistakes: number;
        resolutionRate: number;
    };
    habits: {
        totalCheckins: number;
        activeHabits: number;
        streakDays: number;
    };
    period: {
        startDate: Date;
        endDate: Date;
        weekNumber: number;
    };
}
export interface GeneratedPrompt {
    text: string;
    metadata: {
        generatedAt: Date;
        period: string;
        studentId: string;
        dataPoints: number;
    };
}
export declare class ReportService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * 获取学生在指定时间范围内的综合统计数据
     * 这是核心的"超级函数"，从所有相关表中抓取并计算数据
     */
    getStudentStats(request: StudentStatsRequest): Promise<StudentStatsData>;
    /**
     * 生成AI提示词
     */
    generatePrompt(studentStats: StudentStatsData, educationalPhilosophy: string): Promise<GeneratedPrompt>;
    private getStudentBaseInfo;
    private getTasksStats;
    private getBadgesStats;
    private getPKStats;
    private getMistakesStats;
    private getHabitsStats;
    private getWeekNumber;
    private buildPromptText;
    private generateHighlights;
    private generateSuggestions;
    private calculateDataPoints;
}
//# sourceMappingURL=report.service.d.ts.map
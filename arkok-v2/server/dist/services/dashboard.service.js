"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 获取仪表板数据
     */
    async getDashboardData(schoolId) {
        // 如果没有提供schoolId，查找有学生的活跃学校
        if (!schoolId) {
            const schoolsWithStudents = await this.prisma.schools.findMany({
                where: {
                    isActive: true,
                    students: {
                        some: { isActive: true }
                    }
                },
                take: 1
            });
            // 如果没有有学生的学校，则使用第一个活跃学校
            if (schoolsWithStudents.length === 0) {
                const allSchools = await this.prisma.schools.findMany({
                    where: { isActive: true },
                    take: 1
                });
                schoolId = allSchools.length > 0 ? allSchools[0].id : 'demo';
            }
            else {
                schoolId = schoolsWithStudents[0].id;
            }
        }
        console.log('🔍 [DASHBOARD] Starting parallel queries for school:', schoolId);
        const [topStudents, ongoingPKs, recentChallenges, allStudents] = await Promise.allSettled([
            // 获取前十名学生
            this.prisma.students.findMany({
                where: { schoolId },
                orderBy: { exp: 'desc' },
                take: 10,
                select: {
                    id: true,
                    name: true,
                    className: true,
                    level: true,
                    points: true,
                    exp: true,
                    avatarUrl: true,
                    teamId: true
                }
            }),
            // 获取进行中的PK比赛
            this.prisma.pk_matches.findMany({
                where: {
                    schoolId,
                    status: 'ONGOING'
                },
                take: 5,
                include: {
                    playerA: {
                        select: { id: true, name: true, className: true, avatarUrl: true }
                    },
                    playerB: {
                        select: { id: true, name: true, className: true, avatarUrl: true }
                    }
                }
            }),
            // 获取最近完成的挑战 (从 task_records 获取以对齐 SSOT)
            this.prisma.task_records.findMany({
                where: {
                    schoolId,
                    type: 'CHALLENGE',
                    status: 'COMPLETED'
                },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                include: {
                    students: {
                        select: { id: true, name: true, className: true, avatarUrl: true }
                    }
                }
            }),
            // 获取所有学生用于统计
            this.prisma.students.findMany({
                where: { schoolId },
                select: {
                    id: true,
                    points: true,
                    exp: true,
                    className: true
                }
            })
        ]);
        // 处理结果
        const students = topStudents.status === 'fulfilled' ? topStudents.value : [];
        const pkMatches = ongoingPKs.status === 'fulfilled' ? ongoingPKs.value : [];
        const challenges = recentChallenges.status === 'fulfilled' ? recentChallenges.value : [];
        const allStudentsData = allStudents.status === 'fulfilled' ? allStudents.value : [];
        // 计算学校统计数据
        const totalStudents = allStudentsData.length;
        const totalPoints = allStudentsData.reduce((sum, student) => sum + (student.points || 0), 0);
        const totalExp = allStudentsData.reduce((sum, student) => sum + (student.exp || 0), 0);
        const avgPoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;
        const avgExp = totalStudents > 0 ? Math.round(totalExp / totalStudents) : 0;
        // 计算班级排行
        const classStats = allStudentsData.reduce((acc, student) => {
            const className = student.className || '未分班';
            if (!acc[className]) {
                acc[className] = {
                    className,
                    studentCount: 0,
                    totalPoints: 0,
                    totalExp: 0
                };
            }
            acc[className].studentCount++;
            acc[className].totalPoints += student.points || 0;
            acc[className].totalExp += student.exp || 0;
            return acc;
        }, {});
        const classRanking = Object.values(classStats)
            .map((cls) => ({
            ...cls,
            avgPoints: Math.round(cls.totalPoints / cls.studentCount),
            avgExp: Math.round(cls.totalExp / cls.studentCount)
        }))
            .sort((a, b) => b.totalExp - a.totalExp);
        // 格式化PK数据
        const formattedPKs = pkMatches.map(pk => ({
            id: pk.id,
            topic: pk.topic || 'PK对决',
            status: pk.status.toLowerCase(),
            playerA: pk.playerA || {
                id: pk.studentA,
                name: '选手A',
                className: '待定',
                avatarUrl: undefined
            },
            playerB: pk.playerB || {
                id: pk.studentB,
                name: '选手B',
                className: '待定',
                avatarUrl: undefined
            },
            createdAt: pk.createdAt.toISOString(),
            student_a: pk.studentA,
            student_b: pk.studentB,
            winner_id: pk.winnerId
        }));
        // 格式化挑战数据
        const formattedChallenges = challenges.map((record) => ({
            id: record.id,
            title: record.title,
            type: 'CHALLENGE',
            expAwarded: record.expAwarded || 0,
            student: record.students,
            submittedAt: record.updatedAt.toISOString(),
            status: 'success'
        }));
        return {
            schoolStats: {
                totalStudents,
                totalPoints,
                totalExp,
                avgPoints,
                avgExp
            },
            topStudents: students,
            ongoingPKs: formattedPKs,
            activePKs: formattedPKs, // 兼容旧版本
            recentChallenges: formattedChallenges,
            classRanking
        };
    }
}
exports.DashboardService = DashboardService;
exports.default = DashboardService;
//# sourceMappingURL=dashboard.service.js.map
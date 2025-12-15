"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.dashboardRoutes = router;
// 获取大屏数据 - 使用共享的 Prisma 实例
router.get('/', async (req, res, next) => {
    try {
        console.log("--- [DASHBOARD] API hit. Using shared Prisma client. ---");
        // 使用共享的 prisma 实例
        const prisma = req.app.get('prisma');
        console.log('🔍 [DASHBOARD] Prisma instance check:', {
            hasPrisma: !!prisma,
            appKeys: Object.keys(req.app.settings || {}),
            prismaType: typeof prisma
        });
        if (!prisma) {
            console.error('❌ [DASHBOARD] Prisma client not found in app instance');
            throw new Error('Prisma client not initialized');
        }
        // 测试Prisma连接
        console.log('🔍 [DASHBOARD] Testing Prisma connection...');
        try {
            await prisma.$connect();
            console.log('✅ [DASHBOARD] Prisma connection successful');
        }
        catch (connectError) {
            console.error('❌ [DASHBOARD] Prisma connection failed:', connectError);
            throw new Error(`Prisma connection failed: ${connectError}`);
        }
        // 获取学校ID，如果没有则自动查找第一个可用的学校
        let schoolId = req.user?.schoolId || req.query.schoolId;
        if (!schoolId) {
            // 如果没有提供schoolId，查找有学生的活跃学校
            const schoolsWithStudents = await prisma.school.findMany({
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
                const allSchools = await prisma.school.findMany({
                    where: { isActive: true },
                    take: 1
                });
                schoolId = allSchools.length > 0 ? allSchools[0].id : 'demo';
            }
            else {
                schoolId = schoolsWithStudents[0].id;
            }
        }
        console.log(`[DASHBOARD] Loading data for school: ${schoolId}`);
        // 并行查询所有数据
        console.log('🔍 [DASHBOARD] Starting parallel queries for school:', schoolId);
        // 检查student模型是否存在
        console.log('🔍 [DASHBOARD] Checking if student model exists...');
        if (!prisma.student || typeof prisma.student.findMany !== 'function') {
            console.error('❌ [DASHBOARD] Student model not available:', typeof prisma.student);
            throw new Error('Student model not available');
        }
        const [topStudents, ongoingPKs, recentChallenges, allStudents] = await Promise.allSettled([
            // 获取前十名学生
            prisma.student.findMany({
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
            prisma.pKMatch.findMany({
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
            // 获取最近完成的挑战
            prisma.challenge.findMany({
                where: {
                    schoolId,
                    status: 'COMPLETED'
                },
                orderBy: { updatedAt: 'desc' },
                take: 5,
                include: {
                    student: {
                        select: { id: true, name: true, className: true, avatarUrl: true }
                    }
                }
            }),
            // 获取所有学生用于统计
            prisma.student.findMany({
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
        const formattedChallenges = challenges.map(challenge => ({
            id: challenge.id,
            title: challenge.title,
            type: challenge.type,
            expAwarded: challenge.rewardExp || 0,
            student: challenge.student,
            submittedAt: challenge.updatedAt.toISOString(),
            status: 'success'
        }));
        const dashboardData = {
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
        console.log(`✅ [DASHBOARD] Data loaded successfully:`, {
            topStudents: students.length,
            ongoingPKs: formattedPKs.length,
            recentChallenges: formattedChallenges.length,
            classRanking: classRanking.length
        });
        res.status(200).json({
            success: true,
            data: dashboardData,
        });
    }
    catch (error) {
        console.error("--- [ERROR] in Dashboard API ---", error);
        // 返回错误但不崩溃
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard data',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

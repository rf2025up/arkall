"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PKMatchService = void 0;
const client_1 = require("@prisma/client");
class PKMatchService {
    constructor(io) {
        this.prisma = new client_1.PrismaClient();
        this.io = io;
    }
    /**
     * 获取PK对战列表
     */
    async getPKMatches(query) {
        const { schoolId, search, status, studentId, topic, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {
            schoolId,
            ...(status && { status: status })
        };
        if (studentId) {
            where.OR = [
                { studentA: studentId },
                { studentB: studentId }
            ];
        }
        if (topic) {
            where.topic = { contains: topic, mode: 'insensitive' };
        }
        if (search) {
            where.OR = [
                { topic: { contains: search, mode: 'insensitive' } },
                { playerA: { name: { contains: search, mode: 'insensitive' } } },
                { playerB: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        // 获取总数
        const total = await this.prisma.pKMatch.count({ where });
        // 获取PK对战列表
        const matches = await this.prisma.pKMatch.findMany({
            where,
            orderBy: [
                { createdAt: 'desc' }
            ],
            skip,
            take: limit,
            include: {
                playerA: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true,
                        exp: true
                    }
                },
                playerB: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true,
                        exp: true
                    }
                },
                winner: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                }
            }
        });
        // 计算分页信息
        const totalPages = Math.ceil(total / limit);
        return {
            matches,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }
    /**
     * 根据ID获取单个PK对战详情
     */
    async getPKMatchById(id, schoolId) {
        const match = await this.prisma.pKMatch.findFirst({
            where: {
                id,
                schoolId
            },
            include: {
                playerA: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true,
                        exp: true,
                        points: true
                    }
                },
                playerB: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true,
                        exp: true,
                        points: true
                    }
                },
                winner: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                }
            }
        });
        if (!match) {
            throw new Error('PK对战不存在');
        }
        // 计算对战统计信息
        const stats = this.calculateMatchStats(match);
        return {
            ...match,
            stats
        };
    }
    /**
     * 创建新PK对战
     */
    async createPKMatch(data) {
        const { studentA, studentB, topic, schoolId, metadata } = data;
        // 验证学生A是否存在且属于该学校
        const playerA = await this.prisma.student.findFirst({
            where: {
                id: studentA,
                schoolId,
                isActive: true
            }
        });
        if (!playerA) {
            throw new Error('学生A不存在或不属于该学校');
        }
        // 验证学生B是否存在且属于该学校
        const playerB = await this.prisma.student.findFirst({
            where: {
                id: studentB,
                schoolId,
                isActive: true
            }
        });
        if (!playerB) {
            throw new Error('学生B不存在或不属于该学校');
        }
        // 检查是否已有相同的对战
        const existingMatch = await this.prisma.pKMatch.findFirst({
            where: {
                schoolId,
                OR: [
                    { studentA, studentB },
                    { studentA: studentB, studentB: studentA }
                ],
                status: 'ONGOING'
            }
        });
        if (existingMatch) {
            throw new Error('已有进行中的对战');
        }
        const match = await this.prisma.pKMatch.create({
            data: {
                studentA,
                studentB,
                topic,
                schoolId,
                metadata,
                status: 'ONGOING'
            },
            include: {
                playerA: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true
                    }
                },
                playerB: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true
                    }
                }
            }
        });
        // 创建任务记录给两个学生
        await this.prisma.taskRecord.createMany({
            data: [
                {
                    studentId: studentA,
                    schoolId,
                    type: 'CHALLENGE',
                    title: `PK对战 - ${topic}`,
                    content: {
                        matchId: match.id,
                        opponent: playerB.name,
                        opponentClass: playerB.className,
                        role: 'playerA'
                    },
                    status: 'PENDING'
                },
                {
                    studentId: studentB,
                    schoolId,
                    type: 'CHALLENGE',
                    title: `PK对战 - ${topic}`,
                    content: {
                        matchId: match.id,
                        opponent: playerA.name,
                        opponentClass: playerA.className,
                        role: 'playerB'
                    },
                    status: 'PENDING'
                }
            ]
        });
        // 广播PK对战创建事件
        this.broadcastToSchool(schoolId, {
            type: 'PKMATCH_CREATED',
            data: {
                match,
                timestamp: new Date().toISOString()
            }
        });
        return match;
    }
    /**
     * 更新PK对战信息
     */
    async updatePKMatch(data) {
        const { id, schoolId, topic, status, winnerId, metadata } = data;
        // 验证对战是否存在
        const existingMatch = await this.prisma.pKMatch.findFirst({
            where: {
                id,
                schoolId
            }
        });
        if (!existingMatch) {
            throw new Error('PK对战不存在');
        }
        // 如果指定了获胜者，验证获胜者是否是对战参与者
        if (winnerId && winnerId !== existingMatch.studentA && winnerId !== existingMatch.studentB) {
            throw new Error('获胜者必须是对战参与者');
        }
        const match = await this.prisma.pKMatch.update({
            where: {
                id,
                schoolId
            },
            data: {
                ...(topic && { topic }),
                ...(status && { status: status }),
                ...(winnerId !== undefined && { winnerId }),
                ...(metadata !== undefined && { metadata })
            },
            include: {
                playerA: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true
                    }
                },
                playerB: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true
                    }
                },
                winner: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                }
            }
        });
        // 如果对战完成且有获胜者，给予奖励
        if (status === 'COMPLETED' && winnerId && existingMatch.status !== 'COMPLETED') {
            await this.grantMatchRewards(match);
        }
        // 广播PK对战更新事件
        this.broadcastToSchool(schoolId, {
            type: 'PKMATCH_UPDATED',
            data: {
                match,
                timestamp: new Date().toISOString()
            }
        });
        return match;
    }
    /**
     * 删除PK对战
     */
    async deletePKMatch(id, schoolId) {
        // 验证对战是否存在
        const match = await this.prisma.pKMatch.findFirst({
            where: {
                id,
                schoolId
            }
        });
        if (!match) {
            throw new Error('PK对战不存在');
        }
        // 只允许删除未开始的对战
        if (match.status === 'ONGOING') {
            throw new Error('无法删除进行中的对战');
        }
        await this.prisma.pKMatch.delete({
            where: {
                id,
                schoolId
            }
        });
        // 广播PK对战删除事件
        this.broadcastToSchool(schoolId, {
            type: 'PKMATCH_DELETED',
            data: {
                matchId: id,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * 获取学生PK统计
     */
    async getStudentPKStats(studentId, schoolId) {
        // 验证学生是否存在且属于该学校
        const student = await this.prisma.student.findFirst({
            where: {
                id: studentId,
                schoolId,
                isActive: true
            }
        });
        if (!student) {
            throw new Error('学生不存在');
        }
        // 获取学生的PK对战记录
        const matches = await this.prisma.pKMatch.findMany({
            where: {
                schoolId,
                OR: [
                    { studentA: studentId },
                    { studentB: studentId }
                ]
            },
            include: {
                playerA: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                },
                playerB: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                },
                winner: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // 计算统计信息
        const totalMatches = matches.length;
        const wins = matches.filter(match => match.winnerId === studentId).length;
        const losses = matches.filter(match => match.winnerId && match.winnerId !== studentId).length;
        const draws = matches.filter(match => match.winnerId === null).length;
        const activeMatches = matches.filter(match => match.status === 'ONGOING').length;
        const completedMatches = matches.filter(match => match.status === 'COMPLETED').length;
        // 计算胜率
        const winRate = completedMatches > 0 ? (wins / completedMatches * 100).toFixed(1) : '0.0';
        // 按主题统计
        const topicStats = matches.reduce((acc, match) => {
            const topic = match.topic;
            if (!acc[topic]) {
                acc[topic] = {
                    total: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0
                };
            }
            acc[topic].total++;
            if (match.winnerId === studentId) {
                acc[topic].wins++;
            }
            else if (match.winnerId === null) {
                acc[topic].draws++;
            }
            else if (match.winnerId) {
                acc[topic].losses++;
            }
            return acc;
        }, {});
        // 最近对战记录
        const recentMatches = matches.slice(0, 10).map(match => ({
            id: match.id,
            topic: match.topic,
            status: match.status,
            createdAt: match.createdAt,
            opponent: match.studentA === studentId ? match.playerB : match.playerA,
            result: match.status === 'COMPLETED'
                ? (match.winnerId === studentId ? 'win' : (match.winnerId === null ? 'draw' : 'lose'))
                : null
        }));
        return {
            student: {
                id: student.id,
                name: student.name,
                className: student.className,
                exp: student.exp
            },
            stats: {
                totalMatches,
                wins,
                losses,
                draws,
                activeMatches,
                completedMatches,
                winRate
            },
            topicStats,
            recentMatches
        };
    }
    /**
     * 获取PK排行榜
     */
    async getPKLeaderboard(schoolId, limit = 10) {
        // 获取所有学生的PK统计
        const students = await this.prisma.student.findMany({
            where: {
                schoolId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                className: true,
                avatarUrl: true,
                exp: true
            }
        });
        // 为每个学生计算PK统计
        const studentStats = await Promise.all(students.map(async (student) => {
            const matches = await this.prisma.pKMatch.findMany({
                where: {
                    schoolId,
                    OR: [
                        { studentA: student.id },
                        { studentB: student.id }
                    ]
                }
            });
            const totalMatches = matches.length;
            const wins = matches.filter(match => match.winnerId === student.id).length;
            const completedMatches = matches.filter(match => match.status === 'COMPLETED').length;
            const winRate = completedMatches > 0 ? wins / completedMatches * 100 : 0;
            return {
                student,
                stats: {
                    totalMatches,
                    wins,
                    completedMatches,
                    winRate
                }
            };
        }));
        // 按胜率和胜利次数排序
        return studentStats
            .filter(stat => stat.stats.totalMatches > 0) // 只显示有对战记录的学生
            .sort((a, b) => {
            // 先按胜率排序，然后按胜利次数排序
            if (b.stats.winRate !== a.stats.winRate) {
                return b.stats.winRate - a.stats.winRate;
            }
            return b.stats.wins - a.stats.wins;
        })
            .slice(0, limit)
            .map((stat, index) => ({
            rank: index + 1,
            ...stat.student,
            totalMatches: stat.stats.totalMatches,
            wins: stat.stats.wins,
            completedMatches: stat.stats.completedMatches,
            winRate: stat.stats.winRate.toFixed(1)
        }));
    }
    /**
     * 获取PK统计信息
     */
    async getPKStats(schoolId) {
        // 获取PK对战总数和状态分布
        const [totalMatches, activeMatches, completedMatches] = await Promise.all([
            this.prisma.pKMatch.count({
                where: { schoolId }
            }),
            this.prisma.pKMatch.count({
                where: { schoolId, status: 'ONGOING' }
            }),
            this.prisma.pKMatch.count({
                where: { schoolId, status: 'COMPLETED' }
            })
        ]);
        // 获取参与统计
        const participantMatches = await this.prisma.pKMatch.findMany({
            where: { schoolId },
            select: {
                studentA: true,
                studentB: true
            }
        });
        const uniqueParticipants = new Set();
        participantMatches.forEach(match => {
            uniqueParticipants.add(match.studentA);
            uniqueParticipants.add(match.studentB);
        });
        const totalParticipants = uniqueParticipants.size;
        const averageMatchesPerStudent = totalParticipants > 0 ? Math.round(totalMatches / totalParticipants * 2) : 0;
        // 按主题统计
        const popularTopics = await this.prisma.pKMatch.groupBy({
            by: ['topic'],
            where: { schoolId },
            _count: {
                topic: true
            },
            orderBy: {
                _count: {
                    topic: 'desc'
                }
            },
            take: 10
        });
        const topicStats = popularTopics.map(stat => ({
            topic: stat.topic,
            count: stat._count.topic
        }));
        // 获取最近活动
        const recentActivities = await this.prisma.pKMatch.findMany({
            where: { schoolId },
            include: {
                playerA: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                },
                playerB: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                },
                winner: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });
        return {
            totalMatches,
            activeMatches,
            completedMatches,
            totalParticipants,
            averageMatchesPerStudent,
            popularTopics: topicStats,
            recentActivities
        };
    }
    /**
     * 给予PK对战奖励
     */
    async grantMatchRewards(match) {
        const baseExpReward = 10; // 基础经验奖励
        const winnerBonus = 20; // 获胜者额外奖励
        // 胜利者奖励
        if (match.winnerId) {
            await this.prisma.student.update({
                where: { id: match.winnerId },
                data: {
                    exp: { increment: baseExpReward + winnerBonus },
                    points: { increment: 5 }
                }
            });
            // 创建任务记录
            await this.prisma.taskRecord.upsert({
                where: {
                    studentId_schoolId_title: {
                        studentId: match.winnerId,
                        schoolId: match.schoolId,
                        title: `PK对战胜利 - ${match.topic}`
                    }
                },
                update: {
                    status: 'COMPLETED',
                    expAwarded: baseExpReward + winnerBonus,
                    content: {
                        matchId: match.id,
                        opponent: match.studentA === match.winnerId ? match.playerB.name : match.playerA.name,
                        result: 'victory'
                    }
                },
                create: {
                    studentId: match.winnerId,
                    schoolId: match.schoolId,
                    type: 'CHALLENGE',
                    title: `PK对战胜利 - ${match.topic}`,
                    content: {
                        matchId: match.id,
                        opponent: match.studentA === match.winnerId ? match.playerB.name : match.playerA.name,
                        result: 'victory'
                    },
                    status: 'COMPLETED',
                    expAwarded: baseExpReward + winnerBonus
                }
            });
        }
        // 失败者和平局奖励
        const loserId = match.studentA === match.winnerId ? match.studentB : (match.studentB === match.winnerId ? match.studentA : null);
        if (loserId && match.winnerId) {
            // 失败者也能获得少量经验
            await this.prisma.student.update({
                where: { id: loserId },
                data: {
                    exp: { increment: baseExpReward / 2 }
                }
            });
        }
        // 平局情况，双方都获得基础奖励
        if (!match.winnerId) {
            await this.prisma.student.updateMany({
                where: {
                    id: { in: [match.studentA, match.studentB] }
                },
                data: {
                    exp: { increment: baseExpReward },
                    points: { increment: 2 }
                }
            });
        }
    }
    /**
     * 计算对战统计信息
     */
    calculateMatchStats(match) {
        return {
            isPlayerAWinner: match.winnerId === match.studentA,
            isPlayerBWinner: match.winnerId === match.studentB,
            isDraw: match.winnerId === null
        };
    }
    /**
     * 广播到指定学校的房间
     */
    broadcastToSchool(schoolId, data) {
        const roomName = `school_${schoolId}`;
        this.io.to(roomName).emit('DATA_UPDATE', data);
        console.log(`📡 Broadcasted to school ${schoolId}:`, data.type);
    }
}
exports.PKMatchService = PKMatchService;
exports.default = PKMatchService;

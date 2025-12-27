"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeService = void 0;
class ChallengeService {
    constructor(prisma, io) {
        this.prisma = prisma;
        this.io = io;
    }
    /**
     * 获取挑战列表
     */
    async getChallenges(query) {
        const { schoolId, search, type, status, creatorId, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {
            schoolId,
            ...(type && { type: type }),
            ...(status && { status: status }),
            ...(creatorId && { creatorId })
        };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        // 获取总数
        const total = await this.prisma.challenges.count({ where });
        // 获取挑战列表
        const challenges = await this.prisma.challenges.findMany({
            where,
            orderBy: [
                { createdAt: 'desc' },
                { startDate: 'desc' }
            ],
            skip,
            take: limit,
            include: {
                teachers: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                },
                _count: {
                    select: {
                        challenge_participants: true
                    }
                }
            }
        });
        // 计算分页信息
        const totalPages = Math.ceil(total / limit);
        return {
            challenges: challenges.map(challenge => ({
                ...challenge,
                participantCount: challenge._count.challenge_participants
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }
    /**
     * 根据ID获取单个挑战详情
     */
    async getChallengeById(id, schoolId) {
        const challenge = await this.prisma.challenges.findFirst({
            where: {
                id,
                schoolId
            },
            include: {
                teachers: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                },
                challenge_participants: {
                    include: {
                        students: {
                            select: {
                                id: true,
                                name: true,
                                className: true,
                                avatarUrl: true
                            }
                        }
                    },
                    orderBy: {
                        joinedAt: 'desc'
                    }
                }
            }
        });
        if (!challenge) {
            throw new Error('挑战不存在');
        }
        // 计算挑战统计信息
        const stats = this.calculateChallengeStats(challenge.challenge_participants);
        return {
            ...challenge,
            stats
        };
    }
    /**
     * 创建新挑战
     */
    async createChallenge(data) {
        const { title, description, type, schoolId, creatorId, startDate, endDate, rewardPoints, rewardExp, maxParticipants, metadata } = data;
        // 验证创建者是否存在且属于该学校
        const creator = await this.prisma.teachers.findFirst({
            where: {
                id: creatorId,
                schoolId
            }
        });
        if (!creator) {
            throw new Error('创建者不存在或不属于该学校');
        }
        const challenge = await this.prisma.challenges.create({
            data: {
                id: require('crypto').randomUUID(),
                title,
                description,
                type: type,
                schoolId,
                creatorId,
                startDate: startDate || new Date(),
                endDate,
                rewardPoints: rewardPoints || 0,
                rewardExp: rewardExp || 0,
                maxParticipants: maxParticipants || 2,
                metadata,
                status: 'DRAFT',
                updatedAt: new Date()
            },
            include: {
                teachers: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                }
            }
        });
        // 广播挑战创建事件
        this.broadcastToSchool(schoolId, {
            type: 'CHALLENGE_CREATED',
            data: {
                challenge,
                timestamp: new Date().toISOString()
            }
        });
        return challenge;
    }
    /**
     * 更新挑战信息
     */
    async updateChallenge(data) {
        const { id, schoolId, title, description, type, status, startDate, endDate, rewardPoints, rewardExp, maxParticipants, metadata, isActive } = data;
        const challenge = await this.prisma.challenges.update({
            where: {
                id,
                schoolId
            },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(type && { type: type }),
                ...(status && { status: status }),
                ...(startDate && { startDate }),
                ...(endDate !== undefined && { endDate }),
                ...(rewardPoints !== undefined && { rewardPoints }),
                ...(rewardExp !== undefined && { rewardExp }),
                ...(maxParticipants !== undefined && { maxParticipants }),
                ...(metadata !== undefined && { metadata }),
                ...(isActive !== undefined && { isActive })
            },
            include: {
                teachers: {
                    select: {
                        id: true,
                        name: true,
                        username: true
                    }
                },
                _count: {
                    select: {
                        challenge_participants: true
                    }
                }
            }
        });
        // 广播挑战更新事件
        this.broadcastToSchool(schoolId, {
            type: 'CHALLENGE_UPDATED',
            data: {
                challenge: {
                    ...challenge,
                    participantCount: challenge._count.challenge_participants
                },
                timestamp: new Date().toISOString()
            }
        });
        return {
            ...challenge,
            participantCount: challenge._count.challenge_participants
        };
    }
    /**
     * 删除挑战（软删除）
     */
    async deleteChallenge(id, schoolId) {
        await this.prisma.challenges.update({
            where: {
                id,
                schoolId
            },
            data: {
                isActive: false
            }
        });
        // 广播挑战删除事件
        this.broadcastToSchool(schoolId, {
            type: 'CHALLENGE_DELETED',
            data: {
                challengeId: id,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * 学生参加挑战
     */
    async joinChallenge(data) {
        const { challengeId, studentId, schoolId } = data;
        // 验证挑战是否存在且属于该学校
        const challenge = await this.prisma.challenges.findFirst({
            where: {
                id: challengeId,
                schoolId,
                isActive: true
            }
        });
        if (!challenge) {
            throw new Error('挑战不存在或已停用');
        }
        // 验证学生是否存在且属于该学校
        const student = await this.prisma.students.findFirst({
            where: {
                id: studentId,
                schoolId,
                isActive: true
            }
        });
        if (!student) {
            throw new Error('学生不存在');
        }
        // 检查挑战状态和时间
        const now = new Date();
        if (challenge.startDate && now < challenge.startDate) {
            throw new Error('挑战尚未开始');
        }
        if (challenge.endDate && now > challenge.endDate) {
            throw new Error('挑战已结束');
        }
        // 检查是否已参加
        const existingParticipant = await this.prisma.challenge_participants.findFirst({
            where: {
                challengeId,
                studentId
            }
        });
        if (existingParticipant) {
            throw new Error('已参加该挑战');
        }
        // 检查参与人数限制
        const currentParticipants = await this.prisma.challenge_participants.count({
            where: {
                challengeId
            }
        });
        if (challenge.maxParticipants && currentParticipants >= challenge.maxParticipants) {
            throw new Error('挑战参与人数已满');
        }
        // 创建参与记录
        const participant = await this.prisma.challenge_participants.create({
            data: {
                id: require('crypto').randomUUID(),
                challengeId,
                studentId,
                status: 'JOINED'
            },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true
                    }
                }
            }
        });
        // 🚀 [宪法 5.0 落地] 同步创建一条 CHALLENGE 类型任务记录
        await this.prisma.task_records.create({
            data: {
                id: require('crypto').randomUUID(),
                studentId,
                schoolId,
                type: 'CHALLENGE',
                task_category: 'CHALLENGE',
                title: `参加挑战: ${challenge.title}`,
                content: {
                    challengeId,
                    participantId: participant.id,
                    rewardPoints: challenge.rewardPoints,
                    rewardExp: challenge.rewardExp,
                    taskDate: new Date().toISOString().split('T')[0]
                },
                status: 'PENDING',
                updatedAt: new Date()
            }
        });
        // 广播参与事件
        this.broadcastToSchool(schoolId, {
            type: 'CHALLENGE_JOINED',
            data: {
                challengeId,
                participant,
                challenge: {
                    id: challenge.id,
                    title: challenge.title
                },
                timestamp: new Date().toISOString()
            }
        });
        return participant;
    }
    /**
     * 更新挑战参与者状态
     */
    async updateChallengeParticipant(data) {
        const { challengeId, studentId, schoolId, status, result, score, notes } = data;
        // 验证挑战是否存在且属于该学校
        const challenge = await this.prisma.challenges.findFirst({
            where: {
                id: challengeId,
                schoolId
            }
        });
        if (!challenge) {
            throw new Error('挑战不存在');
        }
        // 查找参与记录
        const participant = await this.prisma.challenge_participants.findFirst({
            where: {
                challengeId,
                studentId
            }
        });
        if (!participant) {
            throw new Error('参与记录不存在');
        }
        // 更新参与记录
        const updatedParticipant = await this.prisma.challenge_participants.update({
            where: {
                id: participant.id
            },
            data: {
                ...(status && { status: status }),
                ...(result && { result: result }),
                ...(score !== undefined && { score }),
                ...(notes !== undefined && { notes }),
                ...(result === 'COMPLETED' && { completedAt: new Date() })
            },
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true
                    }
                }
            }
        });
        // 如果完成了挑战，给予奖励
        if (result === 'COMPLETED' && participant.result !== 'COMPLETED') {
            await this.grantChallengeRewards(studentId, challenge, updatedParticipant);
        }
        // 广播更新事件
        this.broadcastToSchool(schoolId, {
            type: 'CHALLENGE_PARTICIPANT_UPDATED',
            data: {
                challengeId,
                participant: updatedParticipant,
                challenge: {
                    id: challenge.id,
                    title: challenge.title
                },
                timestamp: new Date().toISOString()
            }
        });
        // 🚀 [宪法 5.0 落地] 如果挑战完成，同步更新任务记录状态
        if (status === 'COMPLETED' || result === 'COMPLETED') {
            await this.prisma.task_records.updateMany({
                where: {
                    studentId,
                    schoolId,
                    type: 'CHALLENGE',
                    content: {
                        path: ['challengeId'],
                        equals: challengeId
                    }
                },
                data: {
                    status: 'COMPLETED',
                    updatedAt: new Date(),
                    expAwarded: challenge.rewardExp || 0
                }
            });
        }
        return updatedParticipant;
    }
    /**
     * 批量更新挑战参与者结果
     */
    async batchUpdateParticipants(challengeId, schoolId, updates) {
        const results = [];
        for (const update of updates) {
            const res = await this.updateChallengeParticipant({
                challengeId,
                studentId: update.studentId,
                schoolId,
                result: update.result,
                notes: update.notes,
                status: 'JOINED'
            });
            results.push(res);
        }
        return results;
    }
    /**
     * 获取挑战参与者列表
     */
    async getChallengeParticipants(challengeId, schoolId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        // 验证挑战是否存在且属于该学校
        const challenge = await this.prisma.challenges.findFirst({
            where: {
                id: challengeId,
                schoolId
            }
        });
        if (!challenge) {
            throw new Error('挑战不存在');
        }
        // 获取总数
        const total = await this.prisma.challenge_participants.count({
            where: {
                challengeId
            }
        });
        // 获取参与者列表
        const participants = await this.prisma.challenge_participants.findMany({
            where: {
                challengeId
            },
            orderBy: [
                { score: 'desc' },
                { completedAt: 'asc' },
                { joinedAt: 'desc' }
            ],
            skip,
            take: limit,
            include: {
                students: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true,
                        exp: true,
                        points: true
                    }
                }
            }
        });
        // 计算分页信息和排名
        const totalPages = Math.ceil(total / limit);
        const participantsWithRank = participants.map((participant, index) => ({
            ...participant,
            rank: skip + index + 1
        }));
        return {
            participants: participantsWithRank,
            pagination: {
                page,
                limit,
                total,
                totalPages
            },
            challenge: {
                id: challenge.id,
                title: challenge.title,
                maxParticipants: challenge.maxParticipants
            }
        };
    }
    /**
     * 获取学生挑战统计
     */
    async getStudentChallengeStats(studentId, schoolId) {
        // 验证学生是否存在且属于该学校
        const student = await this.prisma.students.findFirst({
            where: {
                id: studentId,
                schoolId,
                isActive: true
            }
        });
        if (!student) {
            throw new Error('学生不存在');
        }
        // 获取学生的参与记录
        const participants = await this.prisma.challenge_participants.findMany({
            where: {
                studentId
            },
            include: {
                challenges: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        type: true,
                        rewardPoints: true,
                        rewardExp: true,
                        startDate: true,
                        endDate: true
                    }
                }
            },
            orderBy: {
                joinedAt: 'desc'
            }
        });
        // 计算统计信息
        const totalChallenges = participants.length;
        const completedChallenges = participants.filter(p => p.result === 'COMPLETED').length;
        const inProgressChallenges = participants.filter(p => p.status === 'JOINED' && p.result !== 'COMPLETED').length;
        const totalPoints = participants.filter(p => p.result === 'COMPLETED').reduce((sum, p) => sum + (p.challenges.rewardPoints || 0), 0);
        const totalExp = participants.filter(p => p.result === 'COMPLETED').reduce((sum, p) => sum + (p.challenges.rewardExp || 0), 0);
        // 按类型分组统计
        const typeStats = participants.reduce((acc, participant) => {
            const type = participant.challenges.type;
            if (!acc[type]) {
                acc[type] = {
                    total: 0,
                    completed: 0,
                    totalPoints: 0,
                    totalExp: 0
                };
            }
            acc[type].total++;
            if (participant.result === 'COMPLETED') {
                acc[type].completed++;
                acc[type].totalPoints += participant.challenges.rewardPoints || 0;
                acc[type].totalExp += participant.challenges.rewardExp || 0;
            }
            return acc;
        }, {});
        return {
            student: {
                id: student.id,
                name: student.name,
                className: student.className
            },
            stats: {
                totalChallenges,
                completedChallenges,
                inProgressChallenges,
                completionRate: totalChallenges > 0 ? (completedChallenges / totalChallenges * 100).toFixed(1) : '0.0',
                totalPoints,
                totalExp
            },
            typeStats,
            recentParticipations: participants.slice(0, 10)
        };
    }
    /**
     * 获取挑战统计信息
     */
    async getChallengeStats(schoolId) {
        // 获取挑战总数和状态分布
        const [totalChallenges, activeChallenges, completedChallenges] = await Promise.all([
            this.prisma.challenges.count({
                where: { schoolId }
            }),
            this.prisma.challenges.count({
                where: { schoolId, status: 'ACTIVE' }
            }),
            this.prisma.challenges.count({
                where: { schoolId, status: 'COMPLETED' }
            })
        ]);
        // 获取参与统计
        const totalParticipants = await this.prisma.challenge_participants.count({
            where: {
                challenges: {
                    schoolId
                }
            }
        });
        const averageParticipation = totalChallenges > 0 ? Math.round(totalParticipants / totalChallenges) : 0;
        // 按类型统计挑战
        const challengeTypes = await this.prisma.challenges.groupBy({
            by: ['type'],
            where: { schoolId },
            _count: {
                type: true
            }
        });
        const typeStats = challengeTypes.map(stat => ({
            type: stat.type,
            count: stat._count.type
        }));
        // 获取最近活动
        const recentActivities = await this.prisma.challenge_participants.findMany({
            where: {
                challenges: {
                    schoolId
                }
            },
            include: {
                challenges: {
                    select: {
                        id: true,
                        title: true
                    }
                },
                students: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                }
            },
            orderBy: {
                joinedAt: 'desc'
            },
            take: 10
        });
        return {
            totalChallenges,
            activeChallenges,
            completedChallenges,
            totalParticipants,
            averageParticipation,
            challengeTypes: typeStats,
            recentActivities
        };
    }
    /**
     * 给予挑战奖励
     *
     * ⚠️ 业务规则：
     * 1. 参加挑战：创建记录（PENDING），不加分
     * 2. 完成挑战：更新记录（COMPLETED），加分
     *
     * 本方法只在完成挑战时调用，只负责加分，不创建新记录
     * 记录的更新由 updateChallengeParticipant 第 545-562 行处理
     */
    async grantChallengeRewards(studentId, challenge, participant) {
        // 更新学生积分和经验 (兼容字段名)
        const expToAdd = challenge.rewardExp || challenge.expReward || 0;
        const pointsToAdd = challenge.rewardPoints || challenge.pointsReward || 0;
        await this.prisma.students.update({
            where: { id: studentId },
            data: {
                points: { increment: pointsToAdd },
                exp: { increment: expToAdd },
                updatedAt: new Date()
            }
        });
        // ✅ 不创建 task_records，因为参加时已经创建了，完成时会更新状态
    }
    /**
     * 计算挑战统计信息
     */
    calculateChallengeStats(participants) {
        const total = participants.length;
        const completed = participants.filter(p => p.result === 'COMPLETED').length;
        const inProgress = participants.filter(p => p.status === 'JOINED' && p.result !== 'COMPLETED').length;
        const averageScore = completed > 0
            ? participants.filter(p => p.score !== null).reduce((sum, p) => sum + (p.score || 0), 0) / completed
            : 0;
        return {
            totalParticipants: total,
            completedParticipants: completed,
            inProgressParticipants: inProgress,
            completionRate: total > 0 ? (completed / total * 100).toFixed(1) : '0.0',
            averageScore: Math.round(averageScore)
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
exports.ChallengeService = ChallengeService;
exports.default = ChallengeService;
//# sourceMappingURL=challenge.service.js.map
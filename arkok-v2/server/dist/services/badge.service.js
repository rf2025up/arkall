"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeService = void 0;
const client_1 = require("@prisma/client");
class BadgeService {
    constructor(io) {
        this.prisma = new client_1.PrismaClient();
        this.io = io;
    }
    /**
     * 获取勋章列表
     */
    async getBadges(query) {
        const { schoolId, search, category, isActive, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {
            schoolId,
            ...(isActive !== undefined && { isActive })
        };
        if (category) {
            where.category = category;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        // 获取总数
        const total = await this.prisma.badges.count({ where });
        // 获取勋章列表
        const badges = await this.prisma.badges.findMany({
            where,
            orderBy: [
                { createdAt: 'desc' },
                { category: 'asc' },
                { name: 'asc' }
            ],
            skip,
            take: limit,
            include: {
                _count: {
                    select: {
                        studentBadges: true
                    }
                }
            }
        });
        // 计算分页信息
        const totalPages = Math.ceil(total / limit);
        return {
            badges: badges.map(badge => ({
                ...badge,
                awardedCount: badge._count.studentBadges
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
     * 根据ID获取单个勋章详情
     */
    async getBadgeById(id, schoolId) {
        const badge = await this.prisma.badges.findFirst({
            where: {
                id,
                schoolId
            },
            include: {
                studentBadges: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                className: true,
                                avatarUrl: true
                            }
                        }
                    },
                    orderBy: {
                        awardedAt: 'desc'
                    },
                    take: 10
                },
                _count: {
                    select: {
                        studentBadges: true
                    }
                }
            }
        });
        if (!badge) {
            throw new Error('勋章不存在');
        }
        return {
            ...badge,
            awardedCount: badge._count.studentBadges,
            recentRecipients: badge.studentBadges
        };
    }
    /**
     * 创建新勋章
     */
    async createBadge(data) {
        const { name, description, icon, category, requirement, schoolId } = data;
        // 检查勋章名称是否已存在
        const existingBadge = await this.prisma.badges.findFirst({
            where: {
                name,
                schoolId
            }
        });
        if (existingBadge) {
            throw new Error('勋章名称已存在');
        }
        const badge = await this.prisma.badges.create({
            data: {
                name,
                description,
                icon,
                category,
                requirement,
                schoolId
            }
        });
        // 广播勋章创建事件
        this.broadcastToSchool(schoolId, {
            type: 'BADGE_CREATED',
            data: {
                badge,
                timestamp: new Date().toISOString()
            }
        });
        return badge;
    }
    /**
     * 更新勋章信息
     */
    async updateBadge(data) {
        const { id, schoolId, name, description, icon, category, requirement, isActive } = data;
        // 如果要更新名称，检查是否与其他勋章重复
        if (name) {
            const existingBadge = await this.prisma.badges.findFirst({
                where: {
                    name,
                    schoolId,
                    id: { not: id }
                }
            });
            if (existingBadge) {
                throw new Error('勋章名称已存在');
            }
        }
        const badge = await this.prisma.badges.update({
            where: {
                id,
                schoolId
            },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(icon !== undefined && { icon }),
                ...(category && { category }),
                ...(requirement !== undefined && { requirement }),
                ...(isActive !== undefined && { isActive })
            }
        });
        // 广播勋章更新事件
        this.broadcastToSchool(schoolId, {
            type: 'BADGE_UPDATED',
            data: {
                badge,
                timestamp: new Date().toISOString()
            }
        });
        return badge;
    }
    /**
     * 删除勋章（软删除）
     */
    async deleteBadge(id, schoolId) {
        await this.prisma.badges.update({
            where: {
                id,
                schoolId
            },
            data: {
                isActive: false
            }
        });
        // 广播勋章删除事件
        this.broadcastToSchool(schoolId, {
            type: 'BADGE_DELETED',
            data: {
                badgeId: id,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * 授予学生勋章
     */
    async awardBadge(data) {
        const { studentId, badgeId, schoolId, reason, awardedBy } = data;
        // 验证勋章是否存在且属于该学校
        const badge = await this.prisma.badges.findFirst({
            where: {
                id: badgeId,
                schoolId,
                isActive: true
            }
        });
        if (!badge) {
            throw new Error('勋章不存在或已停用');
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
        // 检查是否已经获得过该勋章
        const existingAward = await this.prisma.studentsBadge.findFirst({
            where: {
                studentId,
                badgeId
            }
        });
        if (existingAward) {
            throw new Error('学生已获得过该勋章');
        }
        // 创建勋章授予记录
        const studentBadge = await this.prisma.studentsBadge.create({
            data: {
                studentId,
                badgeId,
                awardedBy,
                reason
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true
                    }
                },
                badge: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        icon: true,
                        category: true
                    }
                }
            }
        });
        // 给予学生奖励
        await this.prisma.students.update({
            where: { id: studentId },
            data: {
                points: { increment: 10 }, // 勋章奖励10积分
                exp: { increment: 20 } // 勋章奖励20经验
            }
        });
        // 创建任务记录
        await this.prisma.taskRecord.create({
            data: {
                studentId,
                schoolId,
                type: 'SPECIAL',
                title: `获得勋章 - ${badge.name}`,
                content: {
                    badgeId: badge.id,
                    badgeName: badge.name,
                    badgeCategory: badge.category,
                    reason,
                    awardedBy
                },
                status: 'COMPLETED',
                expAwarded: 20
            }
        });
        // 准备广播数据
        const broadcastData = {
            type: 'BADGE_AWARDED',
            data: {
                studentBadge,
                badge,
                student: {
                    id: student.id,
                    name: student.name,
                    className: student.className
                },
                timestamp: new Date().toISOString()
            }
        };
        // 广播到学校房间
        this.broadcastToSchool(schoolId, broadcastData);
        return studentBadge;
    }
    /**
     * 取消学生勋章
     */
    async revokeBadge(studentId, badgeId, schoolId) {
        // 验证勋章是否存在且属于该学校
        const badge = await this.prisma.badges.findFirst({
            where: {
                id: badgeId,
                schoolId
            }
        });
        if (!badge) {
            throw new Error('勋章不存在');
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
        // 删除勋章授予记录
        await this.prisma.studentsBadge.deleteMany({
            where: {
                studentId,
                badgeId
            }
        });
        // 广播勋章撤销事件
        this.broadcastToSchool(schoolId, {
            type: 'BADGE_REVOKED',
            data: {
                studentId,
                badgeId,
                badgeName: badge.name,
                studentName: student.name,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * 获取学生勋章列表
     */
    async getStudentBadges(studentId, schoolId) {
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
        // 获取学生的勋章
        const studentBadges = await this.prisma.studentsBadge.findMany({
            where: {
                studentId
            },
            include: {
                badge: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        icon: true,
                        category: true
                    }
                }
            },
            orderBy: {
                awardedAt: 'desc'
            }
        });
        // 按类别分组统计
        const categoryStats = studentBadges.reduce((acc, studentBadge) => {
            const category = studentBadge.badge.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(studentBadge);
            return acc;
        }, {});
        return {
            student: {
                id: student.id,
                name: student.name,
                className: student.className
            },
            totalBadges: studentBadges.length,
            categoryStats,
            badges: studentBadges
        };
    }
    /**
     * 获取可获得的勋章（基于学生成就）
     */
    async getAvailableBadges(studentId, schoolId) {
        // 验证学生是否存在且属于该学校
        const student = await this.prisma.students.findFirst({
            where: {
                id: studentId,
                schoolId,
                isActive: true
            },
            include: {
                studentBadges: {
                    include: {
                        badge: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });
        if (!student) {
            throw new Error('学生不存在');
        }
        // 获取所有活跃勋章
        const allBadges = await this.prisma.badges.findMany({
            where: {
                schoolId,
                isActive: true
            }
        });
        // 获取学生已有的勋章ID
        const earnedBadgeIds = new Set(student.studentBadges.map(sb => sb.badgeId));
        // 过滤出未获得的勋章
        const availableBadges = allBadges.filter(badge => !earnedBadgeIds.has(badge.id));
        // 分析每个勋章的达成情况
        const badgeAnalysis = await Promise.all(availableBadges.map(async (badge) => {
            const analysis = await this.analyzeBadgeRequirement(studentId, badge.requirement);
            return {
                badge,
                isEligible: analysis.eligible,
                progress: analysis.progress,
                requirement: analysis.requirement
            };
        }));
        return {
            student: {
                id: student.id,
                name: student.name,
                className: student.className,
                exp: student.exp,
                points: student.points
            },
            availableBadges: badgeAnalysis
        };
    }
    /**
     * 获取勋章统计信息
     */
    async getBadgeStats(schoolId) {
        // 获取勋章总数和活跃勋章数
        const [totalBadges, activeBadges] = await Promise.all([
            this.prisma.badges.count({
                where: { schoolId }
            }),
            this.prisma.badges.count({
                where: { schoolId, isActive: true }
            })
        ]);
        // 获取授予总数
        const totalAwarded = await this.prisma.studentsBadge.count({
            where: {
                badge: {
                    schoolId
                }
            }
        });
        // 获取获得勋章的唯一学生数
        const uniqueEarners = await this.prisma.studentsBadge.groupBy({
            by: ['studentId'],
            where: {
                badge: {
                    schoolId
                }
            }
        });
        // 按类别统计
        const categoryDistribution = await this.prisma.badges.groupBy({
            by: ['category'],
            where: { schoolId },
            _count: {
                category: true
            }
        });
        const categoryStats = await Promise.all(categoryDistribution.map(async (stat) => {
            const awardedCount = await this.prisma.studentsBadge.count({
                where: {
                    badge: {
                        schoolId,
                        category: stat.category
                    }
                }
            });
            return {
                category: stat.category,
                count: stat._count.category,
                awardedCount
            };
        }));
        // 获取获得最多勋章的学生
        const topEarners = await this.prisma.studentsBadge.groupBy({
            by: ['studentId'],
            where: {
                badge: {
                    schoolId
                }
            },
            _count: {
                studentId: true
            },
            orderBy: {
                _count: {
                    studentId: 'desc'
                }
            },
            take: 10
        });
        // 获取学生信息
        const students = await this.prisma.students.findMany({
            where: {
                id: { in: topEarners.map(earner => earner.studentId) },
                schoolId
            },
            select: {
                id: true,
                name: true
            }
        });
        const topStudentStats = topEarners.map(earner => {
            const student = students.find(s => s.id === earner.studentId);
            return {
                studentId: earner.studentId,
                studentName: student?.name || '未知学生',
                badgeCount: earner._count.studentId
            };
        });
        // 获取最近授予记录
        const recentAwards = await this.prisma.studentsBadge.findMany({
            where: {
                badge: {
                    schoolId
                }
            },
            include: {
                student: {
                    select: {
                        id: true,
                        name: true,
                        className: true
                    }
                },
                badge: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        category: true
                    }
                }
            },
            orderBy: {
                awardedAt: 'desc'
            },
            take: 10
        });
        return {
            totalBadges,
            activeBadges,
            totalAwarded,
            uniqueEarners: uniqueEarners.length,
            categoryDistribution: categoryStats,
            topEarners: topStudentStats,
            recentAwards
        };
    }
    /**
     * 分析勋章要求达成情况
     */
    async analyzeBadgeRequirement(studentId, requirement) {
        if (!requirement) {
            return {
                eligible: false,
                progress: 0,
                requirement: '无要求'
            };
        }
        // 获取学生统计信息
        const student = await this.prisma.students.findUnique({
            where: { id: studentId },
            include: {
                taskRecords: true
            }
        });
        if (!student) {
            return {
                eligible: false,
                progress: 0,
                requirement: '学生不存在'
            };
        }
        // 根据不同类型的要求分析
        const analysis = {
            eligible: false,
            progress: 0,
            requirement: ''
        };
        if (requirement.type === 'exp_threshold') {
            const targetExp = requirement.value || 100;
            analysis.progress = Math.min(100, (student.exp / targetExp) * 100);
            analysis.eligible = student.exp >= targetExp;
            analysis.requirement = `经验值达到 ${targetExp}`;
        }
        else if (requirement.type === 'points_threshold') {
            const targetPoints = requirement.value || 100;
            analysis.progress = Math.min(100, (student.points / targetPoints) * 100);
            analysis.eligible = student.points >= targetPoints;
            analysis.requirement = `积分达到 ${targetPoints}`;
        }
        else if (requirement.type === 'task_count') {
            const targetCount = requirement.value || 10;
            const actualCount = student.taskRecords.length;
            analysis.progress = Math.min(100, (actualCount / targetCount) * 100);
            analysis.eligible = actualCount >= targetCount;
            analysis.requirement = `完成 ${targetCount} 个任务`;
        }
        else if (requirement.type === 'badge_collection') {
            // 简化版：检查已获得的勋章数量
            const earnedBadges = await this.prisma.studentsBadge.count({
                where: { studentId }
            });
            const targetCount = requirement.value || 5;
            analysis.progress = Math.min(100, (earnedBadges / targetCount) * 100);
            analysis.eligible = earnedBadges >= targetCount;
            analysis.requirement = `获得 ${targetCount} 个其他勋章`;
        }
        else {
            analysis.requirement = requirement.description || '特殊要求';
        }
        return analysis;
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
exports.BadgeService = BadgeService;
exports.default = BadgeService;
//# sourceMappingURL=badge.service.js.map
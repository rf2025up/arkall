"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitService = void 0;
const client_1 = require("@prisma/client");
class HabitService {
    constructor(io) {
        this.prisma = new client_1.PrismaClient();
        this.io = io;
    }
    /**
     * 获取习惯列表 - 性能优化版本
     */
    async getHabits(query) {
        const { schoolId, search, isActive, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {
            schoolId,
            ...(isActive !== undefined && { isActive })
        };
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        // 获取总数 - 简单计数，很快
        const total = await this.prisma.habits.count({ where });
        // 获取习惯列表 - 性能优化：移除昂贵的 include 查询
        const habits = await this.prisma.habits.findMany({
            where,
            orderBy: [
                { createdAt: 'desc' },
                { name: 'asc' }
            ],
            skip,
            take: limit
            // 移除了 include: { _count: { select: { habitLogs: true } } }
            // 这个查询很昂贵，对于简单的列表展示不需要
        });
        // 计算分页信息
        const totalPages = Math.ceil(total / limit);
        return {
            habits: habits.map(habit => ({
                id: habit.id,
                name: habit.name,
                description: habit.description,
                icon: habit.icon,
                defaultExp: habit.expReward,
                isActive: habit.isActive,
                schoolId: habit.schoolId,
                createdAt: habit.createdAt,
                updatedAt: habit.updatedAt
                // 移除了 totalCheckIns 字段，需要统计可以单独调用专用接口
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
     * 根据ID获取单个习惯
     */
    async getHabitById(id, schoolId) {
        const habit = await this.prisma.habits.findFirst({
            where: {
                id,
                schoolId
            },
            include: {
                _count: {
                    select: {
                        habitLogs: true
                    }
                }
            }
        });
        if (!habit) {
            throw new Error('习惯不存在');
        }
        return {
            ...habit,
            totalCheckIns: habit._count.habitLogs
        };
    }
    /**
     * 创建新习惯
     */
    async createHabit(data) {
        const { name, description, icon, expReward, pointsReward, schoolId } = data;
        // 检查习惯名称是否已存在
        const existingHabit = await this.prisma.habits.findFirst({
            where: {
                name,
                schoolId
            }
        });
        if (existingHabit) {
            throw new Error('习惯名称已存在');
        }
        const habit = await this.prisma.habits.create({
            data: {
                name,
                description,
                icon,
                expReward,
                pointsReward,
                schoolId
            }
        });
        // 广播习惯创建事件
        this.broadcastToSchool(schoolId, {
            type: 'HABIT_CREATED',
            data: {
                habit,
                timestamp: new Date().toISOString()
            }
        });
        return habit;
    }
    /**
     * 更新习惯信息
     */
    async updateHabit(data) {
        const { id, schoolId, name, description, icon, expReward, pointsReward, isActive } = data;
        // 如果要更新名称，检查是否与其他习惯重复
        if (name) {
            const existingHabit = await this.prisma.habits.findFirst({
                where: {
                    name,
                    schoolId,
                    id: { not: id }
                }
            });
            if (existingHabit) {
                throw new Error('习惯名称已存在');
            }
        }
        const habit = await this.prisma.habits.update({
            where: {
                id,
                schoolId
            },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(icon !== undefined && { icon }),
                ...(expReward !== undefined && { expReward }),
                ...(pointsReward !== undefined && { pointsReward }),
                ...(isActive !== undefined && { isActive })
            }
        });
        // 广播习惯更新事件
        this.broadcastToSchool(schoolId, {
            type: 'HABIT_UPDATED',
            data: {
                habit,
                timestamp: new Date().toISOString()
            }
        });
        return habit;
    }
    /**
     * 删除习惯（软删除）
     */
    async deleteHabit(id, schoolId) {
        await this.prisma.habits.update({
            where: {
                id,
                schoolId
            },
            data: {
                isActive: false
            }
        });
        // 广播习惯删除事件
        this.broadcastToSchool(schoolId, {
            type: 'HABIT_DELETED',
            data: {
                habitId: id,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * 学生习惯打卡
     */
    async checkInHabit(data, checkedBy) {
        const { habitId, studentId, schoolId, notes } = data;
        // 验证习惯是否存在且属于该学校
        const habit = await this.prisma.habits.findFirst({
            where: {
                id: habitId,
                schoolId,
                isActive: true
            }
        });
        if (!habit) {
            throw new Error('习惯不存在或已停用');
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
        // 检查今天是否已经打卡
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const existingCheckIn = await this.prisma.habits_logs.findFirst({
            where: {
                habitId,
                studentId,
                schoolId,
                checkedAt: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });
        if (existingCheckIn) {
            throw new Error('今日已打卡，请明天再来');
        }
        // 计算连续打卡天数
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayCheckIn = await this.prisma.habits_logs.findFirst({
            where: {
                habitId,
                studentId,
                schoolId,
                checkedAt: {
                    gte: yesterday,
                    lt: today
                }
            },
            orderBy: { checkedAt: 'desc' }
        });
        const streakDays = yesterdayCheckIn ? yesterdayCheckIn.streakDays + 1 : 1;
        // 创建打卡记录
        const habitLog = await this.prisma.habits_logs.create({
            data: {
                habitId,
                studentId,
                schoolId,
                checkedAt: new Date(),
                streakDays,
                notes
            }
        });
        // 更新学生积分和经验
        const updatedStudent = await this.prisma.students.update({
            where: { id: studentId },
            data: {
                points: { increment: habit.pointsReward || 0 },
                exp: { increment: habit.expReward }
            }
        });
        // 重新计算等级
        const newLevel = Math.floor(updatedStudent.exp / 100) + 1;
        if (newLevel > updatedStudent.level) {
            await this.prisma.students.update({
                where: { id: studentId },
                data: { level: newLevel }
            });
        }
        // 创建任务记录
        await this.prisma.taskRecord.create({
            data: {
                studentId,
                schoolId,
                type: 'DAILY',
                title: `习惯打卡 - ${habit.name}`,
                content: {
                    habitId,
                    habitName: habit.name,
                    streakDays,
                    notes,
                    checkedBy
                },
                status: 'COMPLETED',
                expAwarded: habit.expReward
            }
        });
        // 准备广播数据
        const broadcastData = {
            type: 'HABIT_CHECKED_IN',
            data: {
                habitLog,
                habit,
                student: {
                    id: student.id,
                    name: student.name,
                    className: student.className
                },
                rewards: {
                    points: habit.pointsReward || 0,
                    exp: habit.expReward
                },
                streakDays,
                timestamp: new Date().toISOString()
            }
        };
        // 广播到学校房间
        this.broadcastToSchool(schoolId, broadcastData);
        return {
            habitLog,
            rewards: {
                points: habit.pointsReward || 0,
                exp: habit.expReward
            },
            streakDays
        };
    }
    /**
     * 获取习惯打卡记录
     */
    async getHabitLogs(query) {
        const { schoolId, habitId, studentId, startDate, endDate, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;
        // 构建查询条件
        const where = {
            schoolId,
            ...(habitId && { habitId }),
            ...(studentId && { studentId })
        };
        if (startDate || endDate) {
            where.checkedAt = {};
            if (startDate) {
                where.checkedAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.checkedAt.lte = new Date(endDate);
            }
        }
        // 获取总数
        const total = await this.prisma.habits_logs.count({ where });
        // 获取打卡记录列表
        const habitLogs = await this.prisma.habits_logs.findMany({
            where,
            orderBy: { checkedAt: 'desc' },
            skip,
            take: limit,
            include: {
                habit: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        expReward: true,
                        pointsReward: true
                    }
                },
                student: {
                    select: {
                        id: true,
                        name: true,
                        className: true,
                        avatarUrl: true
                    }
                }
            }
        });
        // 计算分页信息
        const totalPages = Math.ceil(total / limit);
        return {
            habitLogs,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        };
    }
    /**
     * 获取学生习惯打卡统计
     */
    async getStudentHabitStats(studentId, schoolId) {
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
        // 获取所有活跃习惯
        const habits = await this.prisma.habits.findMany({
            where: {
                schoolId,
                isActive: true
            }
        });
        // 获取学生的打卡记录
        const habitLogs = await this.prisma.habits_logs.findMany({
            where: {
                studentId,
                schoolId
            },
            include: {
                habit: {
                    select: {
                        id: true,
                        name: true,
                        icon: true,
                        expReward: true,
                        pointsReward: true
                    }
                }
            },
            orderBy: { checkedAt: 'desc' }
        });
        // 计算每个习惯的统计信息
        const habitStats = habits.map(habit => {
            const logs = habitLogs.filter(log => log.habitId === habit.id);
            const totalCheckIns = logs.length;
            const currentStreak = this.calculateCurrentStreak(logs);
            const maxStreak = logs.length > 0 ? Math.max(...logs.map(log => log.streakDays)) : 0;
            const totalExp = logs.reduce((sum, log) => sum + habit.expReward, 0);
            const totalPoints = logs.reduce((sum, log) => sum + (habit.pointsReward || 0), 0);
            // 检查今日是否已打卡
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const checkedToday = logs.some(log => {
                const checkDate = new Date(log.checkedAt);
                return checkDate >= today && checkDate < tomorrow;
            });
            return {
                habit,
                stats: {
                    totalCheckIns,
                    currentStreak,
                    maxStreak,
                    totalExp,
                    totalPoints,
                    checkedToday
                }
            };
        });
        // 计算总体统计
        const totalStats = {
            totalCheckIns: habitLogs.length,
            totalExp: habitLogs.reduce((sum, log) => {
                const habit = habits.find(h => h.id === log.habitId);
                return sum + (habit ? habit.expReward : 0);
            }, 0),
            totalPoints: habitLogs.reduce((sum, log) => {
                const habit = habits.find(h => h.id === log.habitId);
                return sum + (habit ? (habit.pointsReward || 0) : 0);
            }, 0),
            activeHabits: habits.length,
            habitsWithCheckIns: habitStats.filter(stat => stat.stats.totalCheckIns > 0).length
        };
        return {
            student: {
                id: student.id,
                name: student.name,
                className: student.className
            },
            habitStats,
            totalStats,
            recentLogs: habitLogs.slice(0, 10) // 最近10条打卡记录
        };
    }
    /**
     * 获取习惯统计信息
     */
    async getHabitStats(schoolId) {
        // 获取习惯总数和活跃习惯数
        const [totalHabits, activeHabits] = await Promise.all([
            this.prisma.habits.count({
                where: { schoolId }
            }),
            this.prisma.habits.count({
                where: { schoolId, isActive: true }
            })
        ]);
        // 获取打卡总数
        const totalCheckIns = await this.prisma.habits_logs.count({
            where: { schoolId }
        });
        // 获取每个习惯的平均连续打卡天数
        const habitStreakRates = await this.prisma.habits_logs.groupBy({
            by: ['habitId'],
            where: { schoolId },
            _avg: {
                streakDays: true
            },
            _count: {
                habitId: true
            }
        });
        // 获取习惯名称
        const habits = await this.prisma.habits.findMany({
            where: { schoolId },
            select: { id: true, name: true }
        });
        const streakRates = habitStreakRates.map(rate => ({
            habitId: rate.habitId,
            habitName: habits.find(h => h.id === rate.habitId)?.name || '未知习惯',
            avgStreakDays: Math.round(rate._avg.streakDays || 0),
            totalCheckIns: rate._count.habitId
        }));
        // 获取参与度最高的学生
        const topParticipants = await this.prisma.habits_logs.groupBy({
            by: ['studentId'],
            where: { schoolId },
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
        // 获取学生信息和总经验值
        const students = await this.prisma.students.findMany({
            where: {
                id: { in: topParticipants.map(p => p.studentId) },
                schoolId
            },
            select: {
                id: true,
                name: true,
                exp: true
            }
        });
        const participants = topParticipants.map(participant => {
            const student = students.find(s => s.id === participant.studentId);
            return {
                studentId: participant.studentId,
                studentName: student?.name || '未知学生',
                totalCheckIns: participant._count.studentId,
                totalExp: student?.exp || 0
            };
        });
        return {
            totalHabits,
            activeHabits,
            totalCheckIns,
            streakRates,
            topParticipants: participants
        };
    }
    /**
     * 计算当前连续打卡天数
     */
    calculateCurrentStreak(logs) {
        if (logs.length === 0)
            return 0;
        // 按日期倒序排列
        const sortedLogs = logs.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
        let currentStreak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        for (const log of sortedLogs) {
            const logDate = new Date(log.checkedAt);
            logDate.setHours(0, 0, 0, 0);
            if (logDate.getTime() === currentDate.getTime()) {
                currentStreak++;
                currentDate.setDate(currentDate.getDate() - 1);
            }
            else if (logDate.getTime() === currentDate.getTime()) {
                // 如果是今天的记录，继续
                currentStreak++;
                currentDate.setDate(currentDate.getDate() - 1);
            }
            else {
                break;
            }
        }
        return currentStreak;
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
exports.HabitService = HabitService;
exports.default = HabitService;
//# sourceMappingURL=habit.service.js.map
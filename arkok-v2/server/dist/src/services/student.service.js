"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
const client_1 = require("@prisma/client");
class StudentService {
    constructor(io) {
        this.prisma = new client_1.PrismaClient();
        this.io = io;
    }
    /**
     * 🆕 获取学生列表 - 基于师生绑定的重构版本
     */
    async getStudents(query) {
        const { schoolId, teacherId, scope, userRole } = query;
        console.log(`[TEACHER BINDING] Fetching students with query:`, { schoolId, teacherId, scope, userRole });
        try {
            // 🆕 构建查询条件 - 基于师生关系
            let whereCondition = {
                schoolId: schoolId,
                isActive: true,
            };
            // 🚨 临时调试：检查现有学生的teacherId分布
            console.log(`[DEBUG] 🔍 Checking teacherId distribution before query...`);
            const allStudents = await this.prisma.student.findMany({
                where: { schoolId, isActive: true },
                select: { id: true, name: true, teacherId: true, className: true }
            });
            const teacherIdStats = allStudents.reduce((acc, student) => {
                const tid = student.teacherId || 'null';
                acc[tid] = (acc[tid] || 0) + 1;
                return acc;
            }, {});
            console.log(`[DEBUG] 📊 TeacherId distribution:`, teacherIdStats);
            console.log(`[DEBUG] 📊 Total students in DB: ${allStudents.length}`);
            // 根据查询范围和用户角色确定查询条件
            if (scope === 'MY_STUDENTS' && teacherId) {
                // 老师查看自己的学生
                whereCondition.teacherId = teacherId;
                console.log(`[TEACHER BINDING] Querying MY_STUDENTS for teacher: ${teacherId}`);
            }
            else if (scope === 'ALL_SCHOOL' && userRole === 'ADMIN') {
                // 管理员查看全校学生 - 无需额外条件
                console.log(`[TEACHER BINDING] Querying ALL_SCHOOL for ADMIN`);
            }
            else if (scope === 'ALL_SCHOOL' && userRole === 'TEACHER') {
                // 老师查看全校学生 - 显示所有学生（包括已归属和未归属的）
                console.log(`[TEACHER BINDING] Querying ALL_SCHOOL for TEACHER: ${teacherId}`);
                // 🆕 修复：显示全校所有学生，不再限制teacherId
                // 老师可以看到所有学生，然后通过前端按钮选择"移入"
            }
            else if (scope === 'SPECIFIC_TEACHER' && teacherId) {
                // 🆕 新增：查看特定老师的学生（用于抢人功能）
                whereCondition.teacherId = teacherId;
                console.log(`[TEACHER BINDING] Querying SPECIFIC_TEACHER: ${teacherId}, requester: ${query.requesterId}`);
            }
            else {
                // 默认情况：如果指定了teacherId，查询该老师的学生
                if (teacherId) {
                    whereCondition.teacherId = teacherId;
                    console.log(`[TEACHER BINDING] Default: querying students for teacher: ${teacherId}`);
                }
            }
            // 保留搜索功能
            if (query.search) {
                whereCondition.name = {
                    contains: query.search,
                    mode: 'insensitive'
                };
            }
            const students = await this.prisma.student.findMany({
                where: whereCondition,
                orderBy: [
                    { exp: 'desc' }, // 按经验值排序
                    { name: 'asc' },
                ],
            });
            console.log(`[TEACHER BINDING] ✅ Found ${students.length} students for scope: ${scope}`);
            return {
                students: students,
                pagination: {
                    page: query.page || 1,
                    limit: query.limit || students.length,
                    total: students.length,
                    totalPages: 1
                }
            };
        }
        catch (error) {
            console.error("[TEACHER BINDING] ❌ Error fetching students:", error);
            throw new Error("Could not fetch students.");
        }
    }
    /**
     * 根据ID获取单个学生
     */
    async getStudentById(id, schoolId) {
        const student = await this.prisma.student.findFirst({
            where: {
                id,
                schoolId,
                isActive: true
            },
            include: {
                taskRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
        if (!student) {
            throw new Error('学生不存在');
        }
        return student;
    }
    /**
     * 获取学生完整档案（聚合所有相关数据）
     */
    async getStudentProfile(studentId, schoolId) {
        try {
            console.log(`🔍 获取学生档案: ${studentId}, 学校: ${schoolId}`);
            // 使用 Promise.all 并行查询所有相关数据
            const [student, taskRecords, pkMatchesAsPlayerA, pkMatchesAsPlayerB, allPkMatches, taskStats] = await Promise.all([
                // 1. 学生基础信息
                this.prisma.student.findFirst({
                    where: {
                        id: studentId,
                        schoolId,
                        isActive: true
                    }
                }),
                // 2. 任务记录（全部，按时间倒序）
                this.prisma.taskRecord.findMany({
                    where: {
                        studentId,
                        schoolId
                    },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        lessonPlan: {
                            select: { id: true, title: true, date: true }
                        }
                    }
                }),
                // 3. PK记录（作为PlayerA）
                this.prisma.pKMatch.findMany({
                    where: {
                        studentA: studentId,
                        schoolId
                    },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        playerA: {
                            select: { id: true, name: true, className: true }
                        },
                        playerB: {
                            select: { id: true, name: true, className: true }
                        },
                        winner: {
                            select: { id: true, name: true }
                        }
                    }
                }),
                // 4. PK记录（作为PlayerB）
                this.prisma.pKMatch.findMany({
                    where: {
                        studentB: studentId,
                        schoolId
                    },
                    orderBy: { createdAt: 'desc' },
                    include: {
                        playerA: {
                            select: { id: true, name: true, className: true }
                        },
                        playerB: {
                            select: { id: true, name: true, className: true }
                        },
                        winner: {
                            select: { id: true, name: true }
                        }
                    }
                }),
                // 5. 所有PK记录（用于统计）
                this.prisma.pKMatch.findMany({
                    where: {
                        schoolId,
                        OR: [
                            { studentA: studentId },
                            { studentB: studentId }
                        ]
                    }
                }),
                // 6. 任务统计数据
                this.prisma.taskRecord.groupBy({
                    by: ['status', 'type'],
                    where: {
                        studentId,
                        schoolId
                    },
                    _count: {
                        status: true
                    },
                    _sum: {
                        expAwarded: true
                    }
                })
            ]);
            // 验证学生是否存在
            if (!student) {
                throw new Error('学生不存在');
            }
            // 处理PK记录 - 合并playerA和playerB的记录，并按时间排序
            const allPkRecordsWithDetails = [...pkMatchesAsPlayerA, ...pkMatchesAsPlayerB]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(match => ({
                ...match,
                isPlayerA: match.studentA === studentId,
                opponent: match.studentA === studentId ? match.playerB : match.playerA,
                isWinner: match.winnerId === studentId
            }));
            // 计算PK统计数据
            const pkStats = {
                totalMatches: allPkMatches.length,
                wins: allPkMatches.filter(match => match.winnerId === studentId).length,
                losses: allPkMatches.filter(match => match.winnerId !== studentId && match.winnerId !== null).length,
                draws: allPkMatches.filter(match => match.winnerId === null).length,
                winRate: allPkMatches.length > 0
                    ? (allPkMatches.filter(match => match.winnerId === studentId).length / allPkMatches.length * 100).toFixed(1)
                    : '0.0'
            };
            // 处理任务统计数据
            const processedTaskStats = {
                totalTasks: taskRecords.length,
                completedTasks: taskRecords.filter(task => task.status === 'COMPLETED').length,
                pendingTasks: taskRecords.filter(task => task.status === 'PENDING').length,
                submittedTasks: taskRecords.filter(task => task.status === 'SUBMITTED').length,
                reviewedTasks: taskRecords.filter(task => task.status === 'REVIEWED').length,
                exp: taskRecords.reduce((sum, task) => sum + task.expAwarded, 0),
                qcTasks: taskRecords.filter(task => task.type === 'QC').length,
                specialTasks: taskRecords.filter(task => task.type === 'SPECIAL').length,
                challengeTasks: taskRecords.filter(task => task.type === 'CHALLENGE').length
            };
            // 计算学生等级（基于经验值）
            const level = this.calculateLevel(student.exp);
            // 构建时间轴数据（按日期分组的任务和PK记录）
            const timelineData = this.buildTimelineData(taskRecords, allPkRecordsWithDetails);
            const profile = {
                // 学生基础信息
                student: {
                    ...student,
                    level
                },
                // 任务记录（最近50条）
                taskRecords: taskRecords.slice(0, 50),
                // PK记录
                pkRecords: allPkRecordsWithDetails.slice(0, 20),
                pkStats,
                // 任务统计
                taskStats: processedTaskStats,
                // 时间轴数据
                timelineData,
                // 综合数据
                summary: {
                    joinDate: student.createdAt,
                    totalActiveDays: Math.ceil((new Date().getTime() - new Date(student.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                    lastActiveDate: taskRecords.length > 0 ? taskRecords[0].createdAt : student.createdAt
                }
            };
            console.log(`✅ 学生档案获取成功: ${student.name}, 包含 ${taskRecords.length} 条任务记录, ${allPkRecordsWithDetails.length} 条PK记录`);
            return profile;
        }
        catch (error) {
            console.error('❌ 获取学生档案失败:', error);
            throw error;
        }
    }
    /**
     * 构建时间轴数据
     */
    buildTimelineData(taskRecords, pkRecords) {
        // 将任务记录转换为时间轴项目
        const taskTimelineItems = taskRecords.map(record => ({
            id: `task-${record.id}`,
            date: record.createdAt,
            type: 'task',
            title: record.title,
            description: `完成了${this.getTaskTypeLabel(record.type)} - 获得 ${record.expAwarded} EXP`,
            status: record.status,
            exp: record.expAwarded,
            metadata: {
                taskType: record.type,
                lessonPlan: record.lessonPlan
            }
        }));
        // 将PK记录转换为时间轴项目
        const pkTimelineItems = pkRecords.map(record => ({
            id: `pk-${record.id}`,
            date: record.createdAt,
            type: 'pk',
            title: `PK对战 - ${record.opponent.name}`,
            description: `${record.isWinner ? '战胜' : record.winnerId === null ? '平局' : '败给'}了 ${record.opponent.name} (${record.opponent.className})`,
            result: record.isWinner ? 'win' : record.winnerId === null ? 'draw' : 'lose',
            metadata: {
                opponent: record.opponent,
                topic: record.topic,
                isPlayerA: record.isPlayerA
            }
        }));
        // 合并并按日期排序
        const allTimelineItems = [...taskTimelineItems, ...pkTimelineItems]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // 按日期分组
        const groupedByDate = allTimelineItems.reduce((groups, item) => {
            const dateKey = new Date(item.date).toLocaleDateString('zh-CN');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(item);
            return groups;
        }, {});
        // 转换为数组格式并限制最近30天
        return Object.entries(groupedByDate)
            .map(([date, items]) => ({
            date,
            items: items.slice(0, 10) // 每天最多显示10条
        }))
            .slice(0, 30); // 最近30天的记录
    }
    /**
     * 获取任务类型标签
     */
    getTaskTypeLabel(type) {
        const typeLabels = {
            'QC': '质检任务',
            'TASK': '常规任务',
            'SPECIAL': '特殊任务',
            'CHALLENGE': '挑战任务',
            'HOMEWORK': '作业',
            'QUIZ': '测验',
            'PROJECT': '项目',
            'DAILY': '每日任务'
        };
        return typeLabels[type] || type;
    }
    // 🆕 重构后的 createStudent 方法 - 基于师生绑定
    async createStudent(studentData) {
        console.log('[TEACHER BINDING] Creating student with data:', studentData);
        // 🆕 新的验证逻辑
        if (!studentData.name || !studentData.schoolId || !studentData.teacherId) {
            console.error('[TEACHER BINDING] Validation failed: Missing name, schoolId, or teacherId.');
            throw new Error('Missing required student data: name, schoolId, and teacherId are required');
        }
        try {
            const newStudent = await this.prisma.student.create({
                data: {
                    name: studentData.name,
                    className: studentData.className, // 可选，仅作为显示标签
                    teacherId: studentData.teacherId, // 🆕 核心变更：直接绑定到老师
                    school: {
                        connect: { id: studentData.schoolId }
                    },
                    avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(studentData.name)}`,
                    isActive: true
                },
            });
            console.log('[TEACHER BINDING] Successfully created student with teacher binding:', newStudent);
            return newStudent;
        }
        catch (error) {
            console.error('[TEACHER BINDING] Prisma create operation failed:', error);
            if (error instanceof Error) {
                console.error('[TEACHER BINDING] Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
            throw error;
        }
    }
    /**
     * 更新学生信息
     */
    async updateStudent(data) {
        const { id, schoolId, name, classRoom, avatar, score, exp } = data;
        // 计算新的等级
        let level;
        if (exp !== undefined) {
            level = this.calculateLevel(exp);
        }
        const student = await this.prisma.student.update({
            where: {
                id,
                schoolId,
                isActive: true
            },
            data: {
                ...(name && { name }),
                ...(classRoom && { classRoom }),
                ...(avatar && { avatar }),
                ...(score !== undefined && { score }),
                ...(exp !== undefined && { exp }),
                ...(level !== undefined && { level })
            }
        });
        // 广播学生更新事件
        this.broadcastToSchool(schoolId, {
            type: 'STUDENT_UPDATED',
            data: {
                student,
                timestamp: new Date().toISOString()
            }
        });
        return student;
    }
    /**
     * 删除学生（软删除）
     */
    async deleteStudent(id, schoolId) {
        await this.prisma.student.update({
            where: {
                id,
                schoolId,
                isActive: true
            },
            data: {
                isActive: false
            }
        });
        // 广播学生删除事件
        this.broadcastToSchool(schoolId, {
            type: 'STUDENT_DELETED',
            data: {
                studentId: id,
                timestamp: new Date().toISOString()
            }
        });
    }
    /**
     * 批量添加积分/经验
     */
    async addScore(data, updatedBy) {
        const { studentIds, points, exp, reason, schoolId, metadata = {} } = data;
        // 验证学生是否属于该学校
        const students = await this.prisma.student.findMany({
            where: {
                id: { in: studentIds },
                schoolId,
                isActive: true
            }
        });
        if (students.length !== studentIds.length) {
            throw new Error('部分学生不存在或不属于该学校');
        }
        // 批量更新学生积分和经验
        const updatedStudents = await this.prisma.$transaction(studentIds.map(studentId => this.prisma.student.update({
            where: { id: studentId, schoolId },
            data: {
                points: { increment: points },
                exp: { increment: exp }
            }
        })));
        // 重新计算等级
        const studentsWithLevel = await this.prisma.$transaction(updatedStudents.map(student => {
            const newLevel = this.calculateLevel(student.exp);
            return this.prisma.student.update({
                where: { id: student.id },
                data: { level: newLevel }
            });
        }));
        // 创建任务记录
        await this.prisma.$transaction(studentIds.map(studentId => this.prisma.taskRecord.create({
            data: {
                studentId,
                schoolId,
                type: points > 0 ? 'SPECIAL' : 'CHALLENGE', // 使用 TaskType 枚举值
                title: reason,
                content: {
                    score: points,
                    exp,
                    metadata: {
                        ...metadata,
                        updatedBy,
                        previousLevel: students.find(s => s.id === studentId)?.level,
                        newLevel: studentsWithLevel.find(s => s.id === studentId)?.level
                    }
                },
                status: 'COMPLETED',
                expAwarded: exp
            }
        })));
        // 准备广播数据
        const broadcastData = {
            type: 'SCORE_UPDATE',
            data: {
                studentIds,
                points,
                exp,
                reason,
                timestamp: new Date().toISOString(),
                updatedBy,
                metadata,
                updatedStudents: studentsWithLevel
            }
        };
        // 广播到学校房间
        this.broadcastToSchool(schoolId, broadcastData);
        return studentsWithLevel;
    }
    /**
     * 获取学生排行榜
     */
    async getLeaderboard(schoolId, limit = 10) {
        const students = await this.prisma.student.findMany({
            where: {
                schoolId,
                deletedAt: null
            },
            orderBy: [
                { exp: 'desc' },
                { score: 'desc' },
                { name: 'asc' }
            ],
            take: limit,
            select: {
                id: true,
                name: true,
                className: true,
                avatarUrl: true,
                points: true,
                exp: true,
                level: true,
                createdAt: true
            }
        });
        return students.map((student, index) => ({
            rank: index + 1,
            ...student,
            classRoom: student.className,
            avatar: student.avatarUrl,
            score: student.points,
            exp: student.exp
        }));
    }
    /**
     * 获取班级统计
     */
    async getClassStats(schoolId) {
        const classStats = await this.prisma.student.groupBy({
            by: ['className'],
            where: {
                schoolId,
                isActive: true
            },
            _count: {
                id: true
            },
            _sum: {
                points: true,
                exp: true
            },
            _avg: {
                points: true,
                exp: true
            }
        });
        return classStats.map(stat => ({
            classRoom: stat.className,
            studentCount: stat._count.id,
            totalScore: stat._sum.points || 0,
            exp: stat._sum.exp || 0,
            averageScore: stat._avg.points || 0,
            averageExp: stat._avg.exp || 0
        }));
    }
    /**
     * 获取班级列表（用于班级切换）
     * 🆕 修改：返回按老师分组的班级信息，支持多老师显示
     */
    async getClasses(schoolId) {
        // 🆕 按老师分组获取学生统计
        const teacherGroups = await this.prisma.student.groupBy({
            by: ['teacherId'],
            where: {
                schoolId,
                isActive: true,
                teacherId: { not: null } // 排除没有归属老师的学生
            },
            _count: {
                id: true
            }
        });
        // 获取对应的老师信息
        const teacherIds = teacherGroups.map(g => g.teacherId);
        const teachers = await this.prisma.user.findMany({
            where: {
                id: { in: teacherIds },
                schoolId,
                role: 'TEACHER'
            },
            select: {
                id: true,
                name: true
            }
        });
        // 组装数据：每个老师作为一个"班级"
        const classData = teacherGroups.map(group => {
            const teacher = teachers.find(t => t.id === group.teacherId);
            return {
                className: `${teacher?.name || '未知老师'}的班级`,
                studentCount: group._count.id,
                teacherId: group.teacherId,
                teacherName: teacher?.name || '未知老师'
            };
        });
        // 添加"全校"选项
        const totalStudents = await this.prisma.student.count({
            where: {
                schoolId,
                isActive: true
            }
        });
        classData.unshift({
            className: '全校大名单',
            studentCount: totalStudents,
            teacherId: 'ALL',
            teacherName: '全校'
        });
        return classData;
    }
    /**
     * 🆕 师生关系转移 - 从"转班"升级为"抢人"
     * 将学生划归到指定老师名下
     */
    async transferStudents(studentIds, targetTeacherId, schoolId, updatedBy) {
        console.log(`[TEACHER BINDING] Transferring ${studentIds.length} students to teacher: ${targetTeacherId}`);
        // 验证学生是否属于该学校
        const students = await this.prisma.student.findMany({
            where: {
                id: { in: studentIds },
                schoolId,
                isActive: true
            }
        });
        if (students.length !== studentIds.length) {
            throw new Error('部分学生不存在或不属于该学校');
        }
        // 🆕 验证目标老师是否存在且属于同一学校
        const targetTeacher = await this.prisma.teacher.findFirst({
            where: {
                id: targetTeacherId,
                schoolId: schoolId
            }
        });
        if (!targetTeacher) {
            throw new Error('目标老师不存在或不属于同一学校');
        }
        // 批量更新学生的老师归属
        const updatedStudents = await this.prisma.$transaction(studentIds.map(studentId => this.prisma.student.update({
            where: { id: studentId, schoolId },
            data: {
                teacherId: targetTeacherId, // 🆕 核心变更：更新老师归属
                className: targetTeacher.primaryClassName || targetTeacher.name + '班' // 🔒 修复：同步更新班级名
            }
        })));
        // 🆕 创建师生关系转移记录
        await this.prisma.$transaction(studentIds.map(studentId => this.prisma.taskRecord.create({
            data: {
                studentId,
                schoolId,
                type: 'SPECIAL',
                title: '移入班级',
                content: {
                    action: 'TEACHER_TRANSFER',
                    fromTeacherId: students.find(s => s.id === studentId)?.teacherId,
                    toTeacherId: targetTeacherId,
                    toTeacherName: targetTeacher.name,
                    updatedBy,
                    transferType: 'STUDENT_MOVED_TO_TEACHER'
                },
                status: 'COMPLETED',
                expAwarded: 0
            }
        })));
        // 🆕 广播师生关系转移事件
        this.broadcastToSchool(schoolId, {
            type: 'STUDENTS_TRANSFERRED',
            data: {
                studentIds,
                targetTeacherId,
                targetTeacherName: targetTeacher.name,
                updatedBy,
                timestamp: new Date().toISOString(),
                updatedStudents,
                transferType: 'TEACHER_BINDING' // 标识这是师生关系转移
            }
        });
        console.log(`[TEACHER BINDING] ✅ Successfully transferred ${studentIds.length} students to ${targetTeacher.name}`);
        return updatedStudents;
    }
    /**
     * 计算等级
     */
    calculateLevel(exp) {
        // 简单的等级计算公式
        // 每 100 经验值升一级
        return Math.floor(exp / 100) + 1;
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
exports.StudentService = StudentService;
exports.default = StudentService;
//# sourceMappingURL=student.service.js.map
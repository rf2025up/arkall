"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMSService = void 0;
const socketHandlers_1 = require("../utils/socketHandlers");
class LMSService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * 获取任务库
     */
    async getTaskLibrary() {
        console.log('🔍 [LMS_SERVICE] 开始获取任务库数据...');
        try {
            // 首先检查任务库是否有数据
            const taskCount = await this.prisma.taskLibrary.count({
                where: { isActive: true }
            });
            console.log(`🔍 [LMS_SERVICE] 任务库活跃任务数量: ${taskCount}`);
            // 如果任务库为空，初始化默认任务
            if (taskCount === 0) {
                console.log('⚠️ [LMS_SERVICE] 任务库为空，正在初始化默认任务...');
                await this.initializeDefaultTaskLibrary();
                // 重新计数
                const newTaskCount = await this.prisma.taskLibrary.count({
                    where: { isActive: true }
                });
                console.log(`✅ [LMS_SERVICE] 默认任务初始化完成，任务数量: ${newTaskCount}`);
            }
            const tasks = await this.prisma.taskLibrary.findMany({
                where: {
                    isActive: true
                },
                orderBy: [
                    { category: 'asc' },
                    { difficulty: 'asc' }
                ]
            });
            console.log(`✅ [LMS_SERVICE] 成功获取任务库，任务数量: ${tasks.length}`);
            return tasks.map(task => ({
                id: task.id,
                category: task.category,
                name: task.name,
                description: task.description || '',
                defaultExp: task.defaultExp,
                type: task.type,
                difficulty: task.difficulty || 0,
                isActive: task.isActive
            }));
        }
        catch (error) {
            console.error('❌ [LMS_SERVICE] 获取任务库失败:', error);
            // 返回默认任务库而不是抛出错误
            return this.getDefaultTaskLibrary();
        }
    }
    /**
     * 初始化默认任务库
     */
    async initializeDefaultTaskLibrary() {
        const defaultTasks = [
            // 语文过关项 - 对应PrepView中的chinese QC项目
            { name: '生字听写', category: '语文过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '本课生字听写训练' },
            { name: '课文背诵', category: '语文过关', defaultExp: 10, difficulty: 3, type: 'QC', description: '流利背诵课文段落' },
            { name: '古诗默写', category: '语文过关', defaultExp: 12, difficulty: 3, type: 'QC', description: '古诗默写与理解' },
            { name: '课文理解', category: '语文过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '课文内容理解分析' },
            { name: '词语解释', category: '语文过关', defaultExp: 6, difficulty: 2, type: 'QC', description: '重点词语解释' },
            { name: '句子仿写', category: '语文过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '句型仿写练习' },
            // 数学过关项 - 对应PrepView中的math QC项目
            { name: '口算达标', category: '数学过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '10分钟口算练习' },
            { name: '竖式计算', category: '数学过关', defaultExp: 12, difficulty: 3, type: 'QC', description: '多位数竖式计算' },
            { name: '公式背诵', category: '数学过关', defaultExp: 6, difficulty: 2, type: 'QC', description: '数学公式背诵默写' },
            { name: '错题订正', category: '数学过关', defaultExp: 10, difficulty: 2, type: 'QC', description: '错题本订正讲解' },
            { name: '应用题解答', category: '数学过关', defaultExp: 12, difficulty: 3, type: 'QC', description: '数学应用题分析' },
            { name: '图形认知', category: '数学过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '几何图形特征识别' },
            // 英语过关项 - 对应PrepView中的english QC项目
            { name: '单词默写', category: '英语过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '本单元单词默写' },
            { name: '句型背诵', category: '英语过关', defaultExp: 10, difficulty: 3, type: 'QC', description: '重点句型背诵' },
            { name: '课文朗读', category: '英语过关', defaultExp: 6, difficulty: 1, type: 'QC', description: '流利朗读英语课文' },
            { name: '听力理解', category: '英语过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '英语听力理解训练' },
            { name: '口语对话', category: '英语过关', defaultExp: 10, difficulty: 3, type: 'QC', description: '英语口语对话练习' },
            // 基础核心任务
            { name: '课文朗读', category: '基础核心', defaultExp: 5, difficulty: 1, type: 'TASK', description: '流利朗读课文' },
            { name: '生字练习', category: '基础核心', defaultExp: 8, difficulty: 2, type: 'TASK', description: '练习本课生字' },
            { name: '单词背诵', category: '基础核心', defaultExp: 6, difficulty: 1, type: 'TASK', description: '背诵英语单词' },
            { name: '计算练习', category: '基础核心', defaultExp: 10, difficulty: 2, type: 'TASK', description: '数学计算题练习' },
            // 数学巩固
            { name: '口算练习', category: '数学巩固', defaultExp: 8, difficulty: 2, type: 'TASK', description: '口算能力训练' },
            { name: '竖式练习', category: '数学巩固', defaultExp: 12, difficulty: 3, type: 'TASK', description: '竖式计算巩固' },
            { name: '公式应用', category: '数学巩固', defaultExp: 6, difficulty: 2, type: 'TASK', description: '数学公式应用练习' },
            // 英语提升
            { name: '词汇积累', category: '英语提升', defaultExp: 8, difficulty: 2, type: 'TASK', description: '英语词汇扩展' },
            { name: '语法练习', category: '英语提升', defaultExp: 10, difficulty: 3, type: 'TASK', description: '英语语法巩固' },
            { name: '阅读理解', category: '英语提升', defaultExp: 6, difficulty: 1, type: 'TASK', description: '英语阅读理解' },
            // 阅读训练
            { name: '课外阅读', category: '阅读训练', defaultExp: 15, difficulty: 2, type: 'TASK', description: '30分钟课外阅读' },
            { name: '理解训练', category: '阅读训练', defaultExp: 12, difficulty: 3, type: 'TASK', description: '阅读理解专项训练' },
            { name: '古诗鉴赏', category: '阅读训练', defaultExp: 10, difficulty: 2, type: 'TASK', description: '古诗鉴赏与背诵' },
            // 写作练习
            { name: '日记写作', category: '写作练习', defaultExp: 15, difficulty: 3, type: 'TASK', description: '日常日记写作' },
            { name: '作文指导', category: '写作练习', defaultExp: 20, difficulty: 4, type: 'TASK', description: '作文技巧指导' },
            { name: '书法练习', category: '写作练习', defaultExp: 8, difficulty: 2, type: 'TASK', description: '书法字帖练习' }
        ];
        console.log(`🌱 [LMS_SERVICE] 正在创建 ${defaultTasks.length} 个默认任务...`);
        await this.prisma.taskLibrary.createMany({
            data: defaultTasks,
            skipDuplicates: true
        });
        console.log('✅ [LMS_SERVICE] 默认任务库创建完成');
    }
    /**
     * 获取默认任务库（降级方案）
     */
    getDefaultTaskLibrary() {
        console.log('🔄 [LMS_SERVICE] 使用默认任务库数据作为降级方案');
        return [
            // 语文过关
            { id: 'default-chinese-1', category: '语文过关', name: '生字听写', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '本课生字听写训练' },
            { id: 'default-chinese-2', category: '语文过关', name: '课文背诵', defaultExp: 10, type: 'QC', difficulty: 3, isActive: true, description: '流利背诵课文段落' },
            { id: 'default-chinese-3', category: '语文过关', name: '古诗默写', defaultExp: 12, type: 'QC', difficulty: 3, isActive: true, description: '古诗默写与理解' },
            { id: 'default-chinese-4', category: '语文过关', name: '课文理解', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '课文内容理解分析' },
            // 数学过关
            { id: 'default-math-1', category: '数学过关', name: '口算达标', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '10分钟口算练习' },
            { id: 'default-math-2', category: '数学过关', name: '竖式计算', defaultExp: 12, type: 'QC', difficulty: 3, isActive: true, description: '多位数竖式计算' },
            { id: 'default-math-3', category: '数学过关', name: '公式背诵', defaultExp: 6, type: 'QC', difficulty: 2, isActive: true, description: '数学公式背诵默写' },
            { id: 'default-math-4', category: '数学过关', name: '错题订正', defaultExp: 10, type: 'QC', difficulty: 2, isActive: true, description: '错题本订正讲解' },
            // 英语过关
            { id: 'default-english-1', category: '英语过关', name: '单词默写', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '本单元单词默写' },
            { id: 'default-english-2', category: '英语过关', name: '句型背诵', defaultExp: 10, type: 'QC', difficulty: 3, isActive: true, description: '重点句型背诵' },
            { id: 'default-english-3', category: '英语过关', name: '课文朗读', defaultExp: 6, type: 'QC', difficulty: 1, isActive: true, description: '流利朗读英语课文' },
            // 基础核心
            { id: 'default-core-1', category: '基础核心', name: '课文朗读', defaultExp: 5, type: 'TASK', difficulty: 1, isActive: true, description: '流利朗读课文' },
            { id: 'default-core-2', category: '基础核心', name: '生字练习', defaultExp: 8, type: 'TASK', difficulty: 2, isActive: true, description: '练习本课生字' },
            { id: 'default-core-3', category: '基础核心', name: '单词背诵', defaultExp: 6, type: 'TASK', difficulty: 1, isActive: true, description: '背诵英语单词' },
            { id: 'default-core-4', category: '基础核心', name: '计算练习', defaultExp: 10, type: 'TASK', difficulty: 2, isActive: true, description: '数学计算题练习' }
        ];
    }
    /**
     * 🆕 发布教学计划 - 基于师生绑定的安全投送
     * 1. 创建 LessonPlan
     * 2. 🚫 安全锁定：只给发布者名下的学生创建 TaskRecord
     * 3. 返回统计信息
     */
    async publishPlan(request, io) {
        const { schoolId, teacherId, title, content, date, tasks } = request;
        try {
            console.log(`📚 [LMS_SECURITY] Publishing lesson plan: ${title} for teacher: ${teacherId}`);
            // 🆕 安全锁定：只查找归属该老师的学生
            const students = await this.prisma.student.findMany({
                where: {
                    schoolId: schoolId,
                    teacherId: teacherId, // 🔒 核心安全约束：只给发布者的学生投送
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    className: true
                }
            });
            if (students.length === 0) {
                console.log(`⚠️ [LMS_SECURITY] No students found for teacher: ${teacherId}`);
                throw new Error(`该老师名下暂无学生，无法发布任务`);
            }
            console.log(`👥 [LMS_SECURITY] Found ${students.length} students for teacher: ${teacherId}`);
            // 2. 创建教学计划
            const lessonPlan = await this.prisma.lessonPlan.create({
                data: {
                    schoolId,
                    teacherId,
                    title,
                    content: {
                        ...content,
                        // 🆕 记录发布范围信息
                        publishedTo: 'TEACHERS_STUDENTS',
                        publisherId: teacherId
                    },
                    date: new Date(date),
                    isActive: true
                }
            });
            console.log(`✅ [LMS_SECURITY] Created lesson plan: ${lessonPlan.id} for ${students.length} students`);
            // 3. 批量创建任务记录 - 只给发布者名下的学生
            const taskRecords = [];
            const affectedClasses = new Set();
            for (const student of students) {
                affectedClasses.add(student.className || '未分班');
                for (const task of tasks) {
                    taskRecords.push({
                        schoolId,
                        studentId: student.id,
                        lessonPlanId: lessonPlan.id, // 🆕 关联教学计划
                        type: task.type,
                        title: task.title,
                        content: {
                            ...task.content,
                            lessonPlanId: lessonPlan.id,
                            lessonPlanTitle: lessonPlan.title,
                            publisherId: teacherId
                        },
                        status: 'PENDING',
                        expAwarded: task.expAwarded,
                        createdAt: new Date()
                    });
                }
            }
            // 批量插入任务记录
            if (taskRecords.length > 0) {
                await this.prisma.taskRecord.createMany({
                    data: taskRecords
                });
                console.log(`✅ [LMS_SECURITY] Created ${taskRecords.length} task records for ${students.length} students`);
            }
            // 4. 计算统计信息
            const taskStats = {
                totalStudents: students.length,
                tasksCreated: taskRecords.length,
                totalExpAwarded: tasks.reduce((sum, task) => sum + (task.expAwarded * students.length), 0)
            };
            // 5. 🆕 安全广播：只向该老师的房间广播事件
            const teacherRoom = `teacher_${teacherId}`;
            io.to(teacherRoom).emit(socketHandlers_1.SOCKET_EVENTS.PLAN_PUBLISHED, {
                lessonPlanId: lessonPlan.id,
                schoolId,
                publisherId: teacherId,
                title,
                date: lessonPlan.date,
                taskStats,
                affectedClasses: Array.from(affectedClasses),
                securityScope: 'TEACHERS_STUDENTS' // 🆕 标识安全范围
            });
            console.log(`📡 [LMS_SECURITY] Broadcasted plan published event to teacher ${teacherId} for ${taskStats.totalStudents} students`);
            return {
                lessonPlan,
                taskStats,
                affectedClasses: Array.from(affectedClasses)
            };
        }
        catch (error) {
            console.error('❌ Error publishing lesson plan:', error);
            throw new Error(`Failed to publish lesson plan: ${error.message}`);
        }
    }
    /**
     * 获取学校的教学计划列表
     */
    async getLessonPlans(schoolId, options = {}) {
        const { page = 1, limit = 20, startDate, endDate } = options;
        const where = {
            schoolId,
            isActive: true
        };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = startDate;
            if (endDate)
                where.date.lte = endDate;
        }
        const [plans, total] = await Promise.all([
            this.prisma.lessonPlan.findMany({
                where,
                include: {
                    teacher: {
                        select: { id: true, name: true, username: true }
                    }
                },
                orderBy: { date: 'desc' },
                skip: (page - 1) * limit,
                take: limit
            }),
            this.prisma.lessonPlan.count({ where })
        ]);
        return { plans, total };
    }
    /**
     * 获取教学计划详情（包含任务统计）
     */
    async getLessonPlanDetail(lessonPlanId) {
        const lessonPlan = await this.prisma.lessonPlan.findUnique({
            where: { id: lessonPlanId },
            include: {
                teacher: {
                    select: { id: true, name: true, username: true }
                }
            }
        });
        if (!lessonPlan) {
            throw new Error('Lesson plan not found');
        }
        // 获取任务统计
        const taskStats = await this.prisma.taskRecord.groupBy({
            by: ['status'],
            where: {
                lessonPlanId
            },
            _count: {
                status: true
            }
        });
        const stats = {
            total: 0,
            pending: 0,
            submitted: 0,
            completed: 0
        };
        taskStats.forEach(stat => {
            stats.total += stat._count.status;
            switch (stat.status) {
                case 'PENDING':
                    stats.pending = stat._count.status;
                    break;
                case 'SUBMITTED':
                    stats.submitted = stat._count.status;
                    break;
                case 'COMPLETED':
                    stats.completed = stat._count.status;
                    break;
            }
        });
        return {
            lessonPlan,
            taskStats: stats
        };
    }
    /**
     * 删除教学计划（软删除）
     */
    async deleteLessonPlan(lessonPlanId) {
        await this.prisma.lessonPlan.update({
            where: { id: lessonPlanId },
            data: { isActive: false }
        });
    }
    /**
     * 获取学校的教学统计
     */
    async getSchoolStats(schoolId) {
        const [totalPlans, activePlans, taskStats] = await Promise.all([
            this.prisma.lessonPlan.count({
                where: { schoolId }
            }),
            this.prisma.lessonPlan.count({
                where: { schoolId, isActive: true }
            }),
            this.prisma.taskRecord.groupBy({
                by: ['status'],
                where: { schoolId },
                _count: { status: true }
            })
        ]);
        const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count.status, 0);
        const completedTasks = taskStats.find(stat => stat.status === 'COMPLETED')?._count.status || 0;
        const avgCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        return {
            totalPlans,
            activePlans,
            totalTasks,
            completedTasks,
            avgCompletionRate
        };
    }
    /**
     * 获取指定学生某天的任务记录
     */
    async getDailyRecords(schoolId, studentId, date) {
        try {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
            const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
            const records = await this.prisma.taskRecord.findMany({
                where: {
                    schoolId,
                    studentId,
                    createdAt: {
                        gte: startOfDay,
                        lte: endOfDay
                    }
                },
                include: {
                    student: {
                        select: { id: true, name: true, className: true }
                    },
                    lessonPlan: {
                        select: { id: true, title: true, date: true }
                    }
                },
                orderBy: [
                    { type: 'asc' }, // QC -> TASK -> SPECIAL
                    { createdAt: 'asc' }
                ]
            });
            return records;
        }
        catch (error) {
            console.error('获取每日任务记录失败:', error);
            throw new Error('获取任务记录失败');
        }
    }
    /**
     * 增加任务尝试次数
     */
    async markAttempt(recordId, userId) {
        try {
            const record = await this.prisma.taskRecord.findUnique({
                where: { id: recordId }
            });
            if (!record) {
                throw new Error('任务记录不存在');
            }
            // 简单的权限校验 - 在实际应用中应该有更复杂的权限系统
            // 这里假设只要 userId 存在就有权限操作该校区的记录
            const updatedRecord = await this.prisma.taskRecord.update({
                where: { id: recordId },
                data: {
                    // 如果没有 attempts 字段，则添加该字段
                    // 由于 schema 中没有 attempts 字段，这里我们使用 content 字段存储尝试次数
                    content: {
                        ...(typeof record.content === 'object' ? record.content : {}),
                        attempts: ((typeof record.content === 'object' && record.content?.attempts) || 0) + 1,
                        lastAttemptAt: new Date().toISOString()
                    },
                    updatedAt: new Date()
                }
            });
            console.log(`📝 任务 ${recordId} 尝试次数更新为: ${updatedRecord.content?.attempts}`);
            return updatedRecord;
        }
        catch (error) {
            console.error('更新尝试次数失败:', error);
            throw new Error('更新尝试次数失败');
        }
    }
    /**
     * 更新任务记录状态
     */
    async updateRecordStatus(recordId, status, userId) {
        try {
            const record = await this.prisma.taskRecord.findUnique({
                where: { id: recordId }
            });
            if (!record) {
                throw new Error('任务记录不存在');
            }
            // 简单的权限校验
            // 在实际应用中应该验证 userId 是否属于该校区的老师
            const updatedRecord = await this.prisma.taskRecord.update({
                where: { id: recordId },
                data: {
                    status,
                    // 如果状态变为已完成，设置提交时间
                    ...(status === 'COMPLETED' && { submittedAt: new Date() }),
                    // 如果状态变为已提交，设置提交时间
                    ...(status === 'SUBMITTED' && { submittedAt: new Date() }),
                    updatedAt: new Date()
                }
            });
            console.log(`✅ 任务 ${recordId} 状态更新为: ${status}`);
            return updatedRecord;
        }
        catch (error) {
            console.error('更新任务状态失败:', error);
            throw new Error('更新任务状态失败');
        }
    }
    /**
     * 批量更新任务记录状态
     */
    async updateMultipleRecordStatus(schoolId, recordIds, status, userId) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        for (const recordId of recordIds) {
            try {
                await this.updateRecordStatus(recordId, status, userId);
                results.success++;
            }
            catch (error) {
                results.failed++;
                results.errors.push(`记录 ${recordId}: ${error instanceof Error ? error.message : '未知错误'}`);
            }
        }
        return results;
    }
}
exports.LMSService = LMSService;
//# sourceMappingURL=lms.service.js.map
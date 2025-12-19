"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMSService = void 0;
const client_1 = require("@prisma/client");
const socketHandlers_1 = require("../utils/socketHandlers");
class LMSService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    /**
     * 获取任务库
     */
    async getTaskLibrary() {
        console.log('🔍 [LMS_SERVICE] 开始获取任务库数据...');
        try {
            // 首先检查任务库是否有数据
            const taskCount = await this.prisma.task_library.count({
                where: { isActive: true }
            });
            console.log(`🔍 [LMS_SERVICE] 任务库活跃任务数量: ${taskCount}`);
            // 如果任务库为空，初始化默认任务
            if (taskCount === 0) {
                console.log('⚠️ [LMS_SERVICE] 任务库为空，正在初始化默认任务...');
                await this.initializeDefaultTaskLibrary();
            }
            // 获取任务列表
            const tasks = await this.prisma.task_library.findMany({
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
                educationalDomain: task.educationalDomain,
                educationalSubcategory: task.educationalSubcategory,
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
            // 返回降级方案
            return this.getDefaultTaskLibrary();
        }
    }
    /**
     * 初始化默认任务库
     */
    async initializeDefaultTaskLibrary() {
        const defaultTasks = [
            // 语文过关项
            { id: require('crypto').randomUUID(), schoolId: 'default', name: '生字听写', category: '语文过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '本课生字听写训练', updatedAt: new Date() },
            { id: require('crypto').randomUUID(), schoolId: 'default', name: '课文背诵', category: '语文过关', defaultExp: 10, difficulty: 3, type: 'QC', description: '流利背诵课文段落', updatedAt: new Date() },
            { id: require('crypto').randomUUID(), schoolId: 'default', name: '古诗默写', category: '语文过关', defaultExp: 12, difficulty: 3, type: 'QC', description: '古诗默写与理解', updatedAt: new Date() },
            // 数学过关项
            { id: require('crypto').randomUUID(), schoolId: 'default', name: '口算达标', category: '数学过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '10分钟口算练习', updatedAt: new Date() },
            { id: require('crypto').randomUUID(), schoolId: 'default', name: '竖式计算', category: '数学过关', defaultExp: 12, difficulty: 3, type: 'QC', description: '多位数竖式计算', updatedAt: new Date() },
            // 英语过关项
            { id: require('crypto').randomUUID(), schoolId: 'default', name: '单词默写', category: '英语过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '本单元单词默写', updatedAt: new Date() },
            { id: require('crypto').randomUUID(), schoolId: 'default', name: '听力理解', category: '英语过关', defaultExp: 8, difficulty: 2, type: 'QC', description: '英语听力理解训练', updatedAt: new Date() }
        ];
        console.log(`🌱 [LMS_SERVICE] 正在创建 ${defaultTasks.length} 个默认任务...`);
        // 注意：实际生产中需要根据 schoolId 创建，这里简化逻辑
        try {
            await this.prisma.task_library.createMany({
                data: defaultTasks,
                skipDuplicates: true
            });
            console.log('✅ [LMS_SERVICE] 默认任务库创建完成');
        }
        catch (e) {
            console.warn('⚠️ [LMS_SERVICE] 初始化任务库略过 (可能已存在)');
        }
    }
    /**
     * 获取默认任务库（降级方案）
     */
    getDefaultTaskLibrary() {
        console.log('🔄 [LMS_SERVICE] 使用内存默认任务库数据');
        return [
            { id: 'def-1', category: '语文过关', educationalDomain: '基础作业', name: '生字听写', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true },
            { id: 'def-2', category: '数学过关', educationalDomain: '基础作业', name: '口算达标', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true },
            { id: 'def-3', category: '英语过关', educationalDomain: '基础作业', name: '单词默写', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true }
        ];
    }
    /**
     * 🆕 发布教学计划 - 基于师生绑定的安全投送
     */
    async publishPlan(request, io) {
        const { schoolId, teacherId, title, content, date, tasks } = request;
        try {
            console.log(`🔒 [LMS_SECURITY] Publishing lesson plan: ${title} for teacher ${teacherId}`);
            if (!teacherId)
                throw new Error('发布者ID不能为空');
            // 1. 查找归属该老师的学生
            const boundStudents = await this.prisma.students.findMany({
                where: { schoolId, teacherId, isActive: true }
            });
            if (boundStudents.length === 0) {
                throw new Error(`该老师名下暂无学生，无法发布任务`);
            }
            // 2. 创建教学计划
            const lessonPlan = await this.prisma.lesson_plans.create({
                data: {
                    id: require('crypto').randomUUID(),
                    schoolId,
                    teacherId,
                    title,
                    content: {
                        ...content,
                        progress: request.progress, // 🆕 将显式传入的进度数据存入 content 字段，方便回填
                        publishedTo: 'TEACHERS_STUDENTS',
                        publisherId: teacherId
                    },
                    date: new Date(date),
                    isActive: true,
                    updatedAt: new Date()
                }
            });
            // 3. 创建任务记录
            const dateValue = request.date || new Date();
            const dateStr = typeof dateValue === 'string' ? dateValue.split('T')[0] : dateValue.toISOString().split('T')[0];
            const startOfDay = new Date(`${dateStr}T00:00:00+08:00`);
            const endOfDay = new Date(`${dateStr}T23:59:59+08:00`);
            // 🆕 从 courseInfo 中提取单元和课，用于注入任务记录（学期地图汇总关键数据）
            const courseInfo = content?.courseInfo || {};
            let newTaskCount = 0;
            const affectedClasses = new Set();
            // 🆕 核心修复：实现“覆盖逻辑”
            // 在发布新任务前，先清理掉当日（由该老师发布的）所有旧任务记录，防止重复累加
            // 🔧 增强：使用 content->>taskDate 进行字符串匹配，规避时区带来的时间戳范围偏差问题
            console.log(`🧹 [LMS_CLEANUP] 清理老师 ${teacherId} 在 ${dateStr} 的旧任务记录...`);
            const deleteResult = await this.prisma.task_records.deleteMany({
                where: {
                    schoolId,
                    studentId: { in: boundStudents.map(s => s.id) },
                    content: {
                        path: ['taskDate'],
                        equals: dateStr
                    },
                    // 仅清理自动发布的任务（QC, TASK, SPECIAL），保留手动调整的 override 记录
                    type: { in: ['QC', 'TASK', 'SPECIAL'] },
                    isOverridden: false
                }
            });
            console.log(`✅ [LMS_CLEANUP] 已删除 ${deleteResult.count} 条旧任务记录`);
            for (const student of boundStudents) {
                affectedClasses.add(student.className || '未分班');
                // 🆕 宪法要求：发布时同步更新学生表的进度快照字段，确保过关页列表立即更新
                await this.prisma.students.update({
                    where: { id: student.id },
                    data: {
                        currentUnit: courseInfo.chinese?.unit || "1",
                        currentLesson: courseInfo.chinese?.lesson || "1",
                        currentLessonTitle: courseInfo.chinese?.title || "默认课程",
                        updatedAt: new Date()
                    }
                });
                for (const task of tasks) {
                    // 动态确定该任务所属学科的单元和课
                    let taskUnit = "1";
                    let taskLesson = "1";
                    const category = task.content?.category || '';
                    if (category.includes('语文')) {
                        taskUnit = courseInfo.chinese?.unit || "1";
                        taskLesson = courseInfo.chinese?.lesson || "1";
                    }
                    else if (category.includes('数学')) {
                        taskUnit = courseInfo.math?.unit || "1";
                        taskLesson = courseInfo.math?.lesson || "1";
                    }
                    else if (category.includes('英语')) {
                        taskUnit = courseInfo.english?.unit || "1";
                        taskLesson = "1"; // 英语通常只有单元
                    }
                    // 🆕 核心修复：移除单条防重检查逻辑，改由上方全局 deleteMany 支撑覆盖逻辑
                    // 这样即使任务标题相同，也会更新到最新的 lessonPlanId
                    await this.prisma.task_records.create({
                        data: {
                            id: require('crypto').randomUUID(),
                            schoolId,
                            studentId: student.id,
                            lessonPlanId: lessonPlan.id,
                            type: task.type,
                            title: task.title,
                            content: {
                                ...task.content,
                                taskDate: dateStr,
                                publisherId: teacherId,
                                // 🆕 动态注入 unit 和 lesson 字段，不再硬编码
                                unit: taskUnit,
                                lesson: taskLesson,
                                taskName: task.title
                            },
                            status: 'PENDING',
                            expAwarded: task.expAwarded,
                            updatedAt: new Date()
                        }
                    });
                    newTaskCount++;
                }
            }
            const taskStats = {
                totalStudents: boundStudents.length,
                tasksCreated: newTaskCount,
                totalExpAwarded: tasks.reduce((sum, t) => sum + t.expAwarded, 0) * boundStudents.length
            };
            // 广播
            io.to(`teacher_${teacherId}`).emit(socketHandlers_1.SOCKET_EVENTS.PLAN_PUBLISHED, {
                lessonPlanId: lessonPlan.id,
                title,
                taskStats,
                affectedClasses: Array.from(affectedClasses)
            });
            return { lessonPlan, taskStats, affectedClasses: Array.from(affectedClasses) };
        }
        catch (error) {
            console.error('❌ Error publishing lesson plan:', error);
            throw error;
        }
    }
    /**
     * 获取学生课程进度 - 🆕 升级版本：支持分科智能合并 (Override vs Plan)
     */
    async getStudentProgress(schoolId, studentId) {
        try {
            console.log(`[LMS_PROGRESS] Calculating progress for student: ${studentId}`);
            // 1. 获取老师最新计划
            const student = await this.prisma.students.findUnique({ where: { id: studentId } });
            let teacherPlan = null;
            if (student?.teacherId) {
                teacherPlan = await this.prisma.lesson_plans.findFirst({
                    where: { schoolId, teacherId: student.teacherId, isActive: true },
                    orderBy: { date: 'desc' }
                });
            }
            // 2. 获取最新覆盖记录 (可能有多条，取最新的一条)
            const override = await this.prisma.task_records.findFirst({
                where: { studentId, schoolId, isOverridden: true },
                orderBy: { updatedAt: 'desc' }
            });
            const defaultProgress = {
                chinese: { unit: '1', lesson: '1', title: '默认课程' },
                math: { unit: '1', lesson: '1', title: '默认课程' },
                english: { unit: '1', title: 'Default' }
            };
            const planInfo = teacherPlan?.content?.courseInfo || defaultProgress;
            const overrideInfo = override?.content?.courseInfo;
            // 如果没有覆盖记录，直接返回老师计划
            if (!overrideInfo) {
                return {
                    ...planInfo,
                    source: teacherPlan ? 'lesson_plan' : 'default',
                    updatedAt: teacherPlan?.updatedAt || new Date()
                };
            }
            // 3. 🆕 智能合并逻辑：如果覆盖记录比计划更新，则保留覆盖值
            // 注意：这里我们假设 override 记录中的内容是针对全科的快照
            // 以后可以升级为针对单科的 override 标记
            const planTime = teacherPlan ? new Date(teacherPlan.updatedAt).getTime() : 0;
            const overrideTime = new Date(override.updatedAt).getTime();
            console.log(`[LMS_PROGRESS] Times - Plan: ${planTime}, Override: ${overrideTime}`);
            // 如果覆盖记录更晚，说明 student 有最近的手动调整，返回覆盖记录
            if (overrideTime > planTime) {
                return {
                    ...overrideInfo,
                    source: 'override',
                    updatedAt: override.updatedAt
                };
            }
            // 如果老师计划更新，则返回老师计划
            return {
                ...planInfo,
                source: 'lesson_plan',
                updatedAt: teacherPlan.updatedAt
            };
        }
        catch (e) {
            console.error('[LMS_PROGRESS] Error calculating progress:', e);
            return {
                chinese: { unit: '1', lesson: '1', title: '错误回退' },
                source: 'error',
                updatedAt: new Date()
            };
        }
    }
    /**
     * 获取教学计划列表
     */
    async getLessonPlans(schoolId, options = {}) {
        const { page = 1, limit = 20, startDate, endDate } = options;
        const skip = (page - 1) * limit;
        const where = { schoolId, isActive: true };
        if (startDate || endDate) {
            where.date = {};
            if (startDate)
                where.date.gte = startDate;
            if (endDate)
                where.date.lte = endDate;
        }
        const [plans, total] = await Promise.all([
            this.prisma.lesson_plans.findMany({
                where,
                orderBy: { date: 'desc' },
                skip,
                take: limit,
                include: { teachers: { select: { name: true } } }
            }),
            this.prisma.lesson_plans.count({ where })
        ]);
        return { plans, total };
    }
    /**
     * 获取教学计划详情
     */
    async getLessonPlanDetail(planId) {
        const plan = await this.prisma.lesson_plans.findUnique({
            where: { id: planId },
            include: {
                teachers: { select: { name: true } },
                task_records: {
                    include: { students: { select: { name: true, className: true } } }
                }
            }
        });
        if (!plan)
            throw new Error('教学计划不存在');
        return plan;
    }
    /**
     * 删除教学计划
     */
    async deleteLessonPlan(planId) {
        return this.prisma.lesson_plans.update({
            where: { id: planId },
            data: { isActive: false, updatedAt: new Date() }
        });
    }
    /**
     * 获取学校统计信息
     */
    async getSchoolStats(schoolId) {
        const [totalPlans, totalStudents, taskStats] = await Promise.all([
            this.prisma.lesson_plans.count({ where: { schoolId, isActive: true } }),
            this.prisma.students.count({ where: { schoolId, isActive: true } }),
            this.prisma.task_records.groupBy({
                by: ['status'],
                where: { schoolId },
                _count: true
            })
        ]);
        return { totalPlans, totalStudents, taskStats };
    }
    /**
     * 获取学生的每日任务记录
     */
    async getDailyRecords(schoolId, studentId, date) {
        const startOfDay = new Date(`${date}T00:00:00+08:00`);
        const endOfDay = new Date(`${date}T23:59:59+08:00`);
        return this.prisma.task_records.findMany({
            where: {
                schoolId,
                studentId,
                createdAt: { gte: startOfDay, lte: endOfDay }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
    /**
     * 获取学生所有历史任务记录
     */
    async getAllStudentRecords(schoolId, studentId, limit = 100) {
        return this.prisma.task_records.findMany({
            where: { schoolId, studentId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
    /**
     * 记录尝试次数
     */
    async markAttempt(recordId, userId) {
        return this.prisma.task_records.update({
            where: { id: recordId },
            data: {
                attempts: { increment: 1 },
                updatedAt: new Date()
            }
        });
    }
    /**
     * 批量更新任务状态
     */
    async updateMultipleRecordStatus(schoolId, recordIds, status, userId) {
        const result = await this.prisma.task_records.updateMany({
            where: {
                id: { in: recordIds },
                schoolId
            },
            data: {
                status,
                updatedAt: new Date(),
                submittedAt: status === 'SUBMITTED' || status === 'COMPLETED' ? new Date() : undefined
            }
        });
        return { success: result.count, failed: recordIds.length - result.count };
    }
    /**
     * 更新学生课程进度 - 老师手动覆盖，优先级最高
     */
    async updateStudentProgress(schoolId, studentId, teacherId, courseInfo) {
        // 创建一个特殊的任务记录，标记为 isOverridden: true
        return this.prisma.task_records.create({
            data: {
                id: require('crypto').randomUUID(),
                schoolId,
                studentId,
                type: 'SPECIAL',
                title: '老师手动调整进度',
                content: { courseInfo, teacherId, updatedAt: new Date().toISOString() },
                status: 'COMPLETED',
                isOverridden: true,
                updatedAt: new Date()
            }
        });
    }
    /**
     * 获取最新教学计划
     */
    async getLatestLessonPlan(schoolId, teacherId) {
        return this.prisma.lesson_plans.findFirst({
            where: { schoolId, teacherId, isActive: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
exports.LMSService = LMSService;
//# sourceMappingURL=lms.service.js.map
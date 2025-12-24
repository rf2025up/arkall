"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMSService = void 0;
const socketHandlers_1 = require("../utils/socketHandlers");
class LMSService {
    constructor(prisma, io) {
        this.prisma = prisma;
        this.io = io;
    }
    /**
     * 🆕 实时同步助手函数
     */
    broadcastStudentUpdate(studentId) {
        if (this.io) {
            (0, socketHandlers_1.broadcastToStudent)(this.io, studentId, 'DATA_UPDATE', {
                studentId,
                timestamp: new Date().toISOString()
            });
        }
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
            console.log(`🔍[LMS_SERVICE] 任务库活跃任务数量: ${taskCount} `);
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
            console.log(`✅[LMS_SERVICE] 成功获取任务库，任务数量: ${tasks.length} `);
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
        console.log(`🌱[LMS_SERVICE] 正在创建 ${defaultTasks.length} 个默认任务...`);
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
            { id: 'def-1', category: '语文过关', name: '生字听写', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true },
            { id: 'def-2', category: '数学过关', name: '口算达标', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true },
            { id: 'def-3', category: '英语过关', name: '单词默写', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true }
        ];
    }
    /**
     * 🆕 发布教学计划 - 基于师生绑定的安全投送
     */
    async publishPlan(request, io) {
        const { schoolId, teacherId, title, content, date, tasks } = request;
        try {
            console.log(`🔒[LMS_SECURITY] Publishing lesson plan: ${title} for teacher ${teacherId}`);
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
            // 🆕 核心修复：优先使用前端传入的原始日期字符串，避免 Date 对象的 UTC 转换导致的日期回退
            let dateStr;
            if (typeof dateValue === 'string') {
                // 前端传入的是 "2025-12-20" 格式的字符串，直接使用
                dateStr = dateValue.split('T')[0];
            }
            else {
                // 如果是 Date 对象，使用本地时间格式化
                const d = dateValue;
                dateStr = `${d.getFullYear()} -${String(d.getMonth() + 1).padStart(2, '0')} -${String(d.getDate()).padStart(2, '0')} `;
            }
            console.log(`📅[LMS_PUBLISH] 使用日期: ${dateStr} `);
            const startOfDay = new Date(`${dateStr} T00:00:00 +08:00`);
            const endOfDay = new Date(`${dateStr} T23: 59: 59 +08:00`);
            // 🆕 从 courseInfo 中提取单元和课，用于注入任务记录（学期地图汇总关键数据）
            const courseInfo = content?.courseInfo || {};
            let newTaskCount = 0;
            const affectedClasses = new Set();
            // 🆕 核心修复：实现“覆盖逻辑”
            // 在发布新任务前，先清理掉当日（由该老师发布的）所有旧任务记录，防止重复累加
            // 🔧 增强：使用 content->>taskDate 进行字符串匹配，规避时区带来的时间戳范围偏差问题
            console.log(`🧹[LMS_CLEANUP] 清理老师 ${teacherId} 在 ${dateStr} 的旧任务记录...`);
            const deleteResult = await this.prisma.task_records.deleteMany({
                where: {
                    schoolId,
                    studentId: { in: boundStudents.map(s => s.id) },
                    OR: [
                        {
                            content: {
                                path: ['taskDate'],
                                equals: dateStr
                            }
                        },
                        {
                            createdAt: { gte: startOfDay, lte: endOfDay }
                        }
                    ],
                    // 仅清理自动发布的任务，保留手动调整的 override 记录
                    // 🔧 扩展清理类型：包含所有可能由进度发布的类型
                    type: { in: ['QC', 'TASK', 'SPECIAL', 'HOMEWORK', 'DAILY', 'QUIZ'] },
                    isOverridden: false
                }
            });
            console.log(`✅[LMS_CLEANUP] 已删除 ${deleteResult.count} 条旧任务记录`);
            for (const student of boundStudents) {
                affectedClasses.add(student.className || '未分班');
            }
            // 🆕 性能优化：批量更新受众学生的进度快照
            await this.prisma.students.updateMany({
                where: { id: { in: boundStudents.map(s => s.id) } },
                data: {
                    currentUnit: courseInfo.chinese?.unit || "1",
                    currentLesson: courseInfo.chinese?.lesson || "1",
                    currentLessonTitle: courseInfo.chinese?.title || "默认课程",
                    updatedAt: new Date()
                }
            });
            const taskRecordsToCreate = [];
            const crypto = require('crypto');
            for (const student of boundStudents) {
                for (const task of tasks) {
                    // 🚀 核心重构：基础过关项 (QC) 不再随教学计划分发，转为过关页静态自持
                    if (task.type === 'QC') {
                        continue;
                    }
                    // 🆕 核心逻辑：精准分发“定制加餐” (SPECIAL 类型)
                    if (task.type === 'SPECIAL') {
                        const targetStudentNames = task.content?.targetStudentNames;
                        if (Array.isArray(targetStudentNames) && targetStudentNames.length > 0) {
                            if (!targetStudentNames.includes(student.name)) {
                                continue;
                            }
                        }
                    }
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
                        taskLesson = "1";
                    }
                    else if (category.includes('英语')) {
                        taskUnit = courseInfo.english?.unit || "1";
                        taskLesson = "1";
                    }
                    taskRecordsToCreate.push({
                        id: crypto.randomUUID(),
                        schoolId,
                        studentId: student.id,
                        lessonPlanId: lessonPlan.id,
                        type: task.type,
                        title: task.title,
                        content: {
                            ...task.content, // 已包含 category, subcategory
                            taskDate: dateStr,
                            publisherId: teacherId,
                            unit: taskUnit,
                            lesson: taskLesson,
                            taskName: task.title,
                            updatedAt: new Date().toISOString()
                        },
                        status: 'PENDING',
                        expAwarded: task.expAwarded,
                        updatedAt: new Date()
                    });
                    newTaskCount++;
                }
            }
            // 🆕 性能优化：批量创建任务记录
            if (taskRecordsToCreate.length > 0) {
                console.log(`📡[LMS_PUBLISH] 正在批量创建 ${taskRecordsToCreate.length} 条任务记录...`);
                await this.prisma.task_records.createMany({
                    data: taskRecordsToCreate
                });
                console.log(`✅[LMS_PUBLISH] 批量创建成功`);
            }
            const taskStats = {
                totalStudents: boundStudents.length,
                tasksCreated: newTaskCount,
                totalExpAwarded: tasks.reduce((sum, t) => sum + t.expAwarded, 0) * boundStudents.length
            };
            // 广播
            io.to(`teacher_${teacherId} `).emit(socketHandlers_1.SOCKET_EVENTS.PLAN_PUBLISHED, {
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
            console.log(`[LMS_PROGRESS] Calculating progress for student: ${studentId} `);
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
            console.log(`[LMS_PROGRESS] Times - Plan: ${planTime}, Override: ${overrideTime} `);
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
        // 🆕 核心修复：不再依赖 createdAt 的 UTC 时间戳范围，直接匹配业务字段 taskDate
        // 这能彻底解决凌晨发布任务时（00:00-08:00）产生的日期错位问题
        return this.prisma.task_records.findMany({
            where: {
                schoolId,
                studentId,
                content: {
                    path: ['taskDate'],
                    equals: date // 传入的通常是 YYYY-MM-DD
                }
            },
            orderBy: { createdAt: 'asc' }
        });
    }
    /**
     * 🆕 性能优化：按老师或班级批量获取所有学生的每日任务记录
     */
    async getBatchDailyRecords(schoolId, date, teacherId, className) {
        console.log(`🚀[BATCH_RECORDS] Fetching records for schoolId: ${schoolId}, date: ${date}, teacherId: ${teacherId}, className: ${className} `);
        // 构建过滤条件
        const whereCondition = {
            schoolId,
            content: {
                path: ['taskDate'],
                equals: date
            }
        };
        // 如果指定了教师 ID，则只过滤该教师名下的学生记录
        // 注意：task_records 表中目前可能没有直接关联 teacherId，我们需要先找到符合条件的 studentId
        if (teacherId || className) {
            const studentWhere = { schoolId };
            if (teacherId)
                studentWhere.teacherId = teacherId;
            if (className && className !== 'ALL')
                studentWhere.className = className;
            const students = await this.prisma.students.findMany({
                where: studentWhere,
                select: { id: true }
            });
            const studentIds = students.map(s => s.id);
            if (studentIds.length === 0) {
                return [];
            }
            whereCondition.studentId = { in: studentIds };
        }
        return this.prisma.task_records.findMany({
            where: whereCondition,
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
    async updateMultipleRecordStatus(schoolId, recordIds, status, userId, courseInfo) {
        const data = {
            status,
            isOverridden: true, // 🚀 关键修复：批量手动操作也标记为已覆盖
            updatedAt: new Date(),
            submittedAt: status === 'SUBMITTED' || status === 'COMPLETED' ? new Date() : undefined
        };
        // 如果传入了课程信息，则尝试注入到每个记录的 content 中
        // 注意：updateMany 不支持直接基于旧值合并 Json，这里只能覆盖或依赖后续 getStudentProgress 的智能逻辑
        // 为了安全，我们只在有 courseInfo 时覆盖 content.courseInfo
        if (courseInfo) {
            // Prisma updateMany 不支持在 JSON 中进行 deep merge
            // 这里的妥协方案是：如果提供了 courseInfo，我们就认为这是要同步的进度
            // 实际上 updateMany 只能设置固定的值。
            // 所以我们这里只在 recordIds 较少时使用循环，或者统一更新 content
            // 考虑到性能，我们依然使用 updateMany，但这意味着 content 会被部分重置（如果原本有其他数据）
            // 改进方案：我们分两步，或者接受 content 被设置。
            // 针对 Arkall 现状，task_records 的 content 主要就是 courseInfo 和一些元数据
            data.content = { courseInfo, updatedAt: new Date().toISOString() };
        }
        const result = await this.prisma.task_records.updateMany({
            where: {
                id: { in: recordIds },
                schoolId
            },
            data
        });
        // 🆕 实时同步
        const records = await this.prisma.task_records.findMany({
            where: { id: { in: recordIds } },
            select: { studentId: true },
            distinct: ['studentId']
        });
        records.forEach(r => this.broadcastStudentUpdate(r.studentId));
        return result;
    }
    /**
     * 更新学生课程进度 - 老师手动覆盖，优先级最高
     */
    async updateStudentProgress(schoolId, studentId, teacherId, courseInfo) {
        // 创建一个特殊的任务记录，标记为 isOverridden: true
        const record = await this.prisma.task_records.create({
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
        // 🆕 实时同步
        this.broadcastStudentUpdate(studentId);
        return record;
    }
    /**
     * 🛡️ 辅助方法：将中文/字符串分类映射为 Prisma 枚举
     */
    mapToTaskCategory(category) {
        const cat = category.trim();
        // 核心教学法 (Methodology)
        if (['核心教学法', '基础学习方法论', 'METHODOLOGY'].includes(cat)) {
            return 'METHODOLOGY';
        }
        // 基础过关 / 课程进度 / 学科 (Progress)
        // 包含前端传入的子Tab名称: chinese, math, english
        if (['基础过关项', '基础过关', '课程进度', 'PROGRESS', 'chinese', 'math', 'english', '语文', '数学', '英语'].includes(cat)) {
            return 'PROGRESS';
        }
        // 个性化/定制 (Personalized)
        if (['定制加餐', '个性化', 'PERSONALIZED'].includes(cat)) {
            return 'PERSONALIZED';
        }
        // 默认归类为综合成长 (Task/Growth)
        // 包括: "综合成长", "综合素养", "TASK" 等所有未匹配项
        return 'TASK';
    }
    /**
     * 🆕 创建单条任务记录 - 用于过关页增量添加
     */
    async createSingleTaskRecord(data) {
        const { schoolId, studentId, type, title, category, subcategory, exp, courseInfo, isOverridden = true } = data;
        // 🛡️ 映射分类
        const mappedCategory = this.mapToTaskCategory(category);
        console.log(`📝[LMS_SERVICE] 为学生 ${studentId} 创建单条任务: ${title} (${category}/${subcategory} -> ${mappedCategory})`);
        const record = await this.prisma.task_records.create({
            data: {
                id: require('crypto').randomUUID(),
                schoolId,
                studentId,
                type,
                title,
                task_category: mappedCategory, // 使用映射后的枚举值
                expAwarded: exp,
                // 🚨 修正：前端依赖 content.category 来进行中文分组过滤，必须保留原始字段名为 category
                // 🔴 关键：必须包含 taskDate 字段，否则 getBatchDailyRecords 查询不到
                content: courseInfo
                    ? { courseInfo, updatedAt: new Date().toISOString(), category: category, subcategory: subcategory || '', taskDate: new Date().toISOString().split('T')[0] }
                    : { updatedAt: new Date().toISOString(), category: category, subcategory: subcategory || '', taskDate: new Date().toISOString().split('T')[0] },
                isOverridden,
                status: 'PENDING',
                updatedAt: new Date()
            }
        });
        // 🆕 实时同步
        this.broadcastStudentUpdate(studentId);
        return record;
    }
    /**
     * 🆕 创建任务记录 - 用于过关抽屉手动添加 QC 项
     * courseInfo 会被完整存储，以便全学期地图能显示"第X单元 第X课 课文名字"
     */
    async createTaskRecord(data) {
        const { studentId, type, title, status, category, subcategory, date, courseInfo, exp } = data;
        console.log(`📝[CREATE_TASK_RECORD] 为学生 ${studentId} 创建记录: ${title}, 类型 = ${type}, 分类 = ${category}, 子分类 = ${subcategory} `);
        // 从学生信息中获取 schoolId
        const student = await this.prisma.students.findUnique({
            where: { id: studentId },
            select: { schoolId: true }
        });
        if (!student) {
            throw new Error(`学生不存在: ${studentId} `);
        }
        // 根据学科分类确定 subject
        let subject = '';
        if (category.includes('语文'))
            subject = 'chinese';
        else if (category.includes('数学'))
            subject = 'math';
        else if (category.includes('英语'))
            subject = 'english';
        // 从 courseInfo 中提取进度信息
        const subjectInfo = courseInfo?.[subject] || {};
        const unit = subjectInfo.unit || '';
        const lesson = subjectInfo.lesson || '';
        const lessonTitle = subjectInfo.title || '';
        // 构建 content 对象，包含完整的进度信息
        // 🚨 关键：必须包含 taskDate 字段，否则 getBatchDailyRecords 查询不到
        const content = {
            category,
            subcategory: subcategory || '', // 🆕 分类标题
            subject,
            unit,
            lesson,
            lessonPlanTitle: lessonTitle, // 课文名字
            courseInfo,
            taskDate: date, // 🔴 新增：确保批量查询能找到这条记录
            createdAt: new Date().toISOString()
        };
        const record = await this.prisma.task_records.create({
            data: {
                id: require('crypto').randomUUID(),
                schoolId: student.schoolId,
                studentId,
                type: type,
                title,
                status: status, // 允许动态状态值
                expAwarded: exp,
                content,
                isOverridden: true,
                updatedAt: new Date()
            }
        });
        console.log(`✅[CREATE_TASK_RECORD] 记录创建成功: ${record.id} `);
        return record;
    }
    /**
     * 🆕 结算学生当日所有任务 - V2 正式版
     */
    async settleStudentTasks(schoolId, studentId, expBonus = 0) {
        console.log(`💰[LMS_SERVICE] 开始结算学生 ${studentId} 的所有完成任务...`);
        // 1. 先将该学生所有待办项（QC 项、核心教学法、综合成长）标记为已完成
        // 遵循宪法：使用 isOverridden 标记手动结算
        await this.prisma.task_records.updateMany({
            where: {
                schoolId,
                studentId,
                status: 'PENDING',
                type: { in: ['QC', 'TASK'] }
            },
            data: {
                status: 'COMPLETED',
                isOverridden: true,
                updatedAt: new Date(),
                submittedAt: new Date()
            }
        });
        // 2. 获取该学生今日所有已完成（COMPLETED）的任务供累计计算
        const completedTasks = await this.prisma.task_records.findMany({
            where: {
                schoolId,
                studentId,
                status: 'COMPLETED'
            }
        });
        const totalExp = completedTasks.reduce((sum, t) => sum + t.expAwarded, 0) + expBonus;
        if (totalExp > 0) {
            await this.prisma.students.update({
                where: { id: studentId },
                data: {
                    exp: { increment: totalExp },
                    updatedAt: new Date()
                }
            });
            console.log(`✅[LMS_SERVICE] 已为学生 ${studentId} 增加 ${totalExp} 经验值`);
            // 创建结算汇总记录 (TASK类型) - 用于学情时间轴汇总
            await this.prisma.task_records.create({
                data: {
                    id: require('crypto').randomUUID(),
                    studentId,
                    schoolId,
                    type: 'TASK',
                    title: `当日学业全面过关结算`,
                    content: {
                        taskCount: completedTasks.length,
                        totalExpAwarded: totalExp,
                        expBonus,
                        teacherMessage: `完成了今日所有 ${completedTasks.length} 项学业任务，额外获得 ${expBonus} 经验奖励，表现非常出色！`
                    },
                    status: 'COMPLETED',
                    updatedAt: new Date(),
                    task_category: 'TASK'
                }
            });
        }
        // 🆕 实时同步
        this.broadcastStudentUpdate(studentId);
        return {
            success: true,
            count: completedTasks.length,
            totalExpAwarded: totalExp
        };
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
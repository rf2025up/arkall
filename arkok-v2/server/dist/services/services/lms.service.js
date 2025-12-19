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
            // --- 探针代码开始 ---
            console.log("🔬 [LMS DEBUG] Probing database connection...");
            const schoolCount = await this.prisma.schools.count();
            console.log(`✅ [LMS DEBUG] Probe successful. Found ${schoolCount} schools.`);
            // 探针：检查taskLibrary表是否存在
            try {
                const tableExists = await this.prisma.$queryRaw `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = 'task_library'`;
                console.log(`🔬 [LMS DEBUG] task_library table exists:`, tableExists);
            }
            catch (tableCheckError) {
                console.error(`❌ [LMS DEBUG] Error checking task_library table:`, tableCheckError);
            }
            // --- 探针代码结束 ---
            // 确保数据库连接正常
            await this.prisma.$connect();
            console.log('✅ [LMS_SERVICE] 数据库连接成功');
            // 首先检查任务库是否有数据
            console.log('🔬 [LMS DEBUG] Checking taskLibrary count...');
            const taskCount = await this.prisma.task_library.count({
                where: { isActive: true }
            });
            console.log(`🔍 [LMS_SERVICE] 任务库活跃任务数量: ${taskCount}`);
            // 如果任务库为空，初始化默认任务
            if (taskCount === 0) {
                console.log('⚠️ [LMS_SERVICE] 任务库为空，正在初始化默认任务...');
                await this.initializeDefaultTaskLibrary();
                // 重新计数
                console.log('🔬 [LMS DEBUG] Recounting tasks after initialization...');
                const newTaskCount = await this.prisma.task_library.count({
                    where: { isActive: true }
                });
                console.log(`✅ [LMS_SERVICE] 默认任务初始化完成，任务数量: ${newTaskCount}`);
            }
            // 主要数据库查询
            console.log('🔬 [LMS DEBUG] Executing main taskLibrary query...');
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
            // 显示任务分类统计
            const categoryStats = tasks.reduce((acc, task) => {
                acc[task.category] = (acc[task.category] || 0) + 1;
                return acc;
            }, {});
            console.log('📊 [LMS_SERVICE] 任务分类统计:', categoryStats);
            return tasks.map(task => ({
                id: task.id,
                // 🏷️ 运营标签分类（过关页使用）
                category: task.category,
                // 📚 教育体系分类（备课页使用）- 使用数据库的正确字段
                educationalDomain: task.educationalDomain || task.category, // 优先使用educationalDomain字段
                educationalSubcategory: task.educationalSubcategory || task.category, // 优先使用educationalSubcategory字段
                name: task.name,
                description: task.description || '',
                defaultExp: task.defaultExp,
                type: task.type,
                difficulty: task.difficulty || 0,
                isActive: task.isActive
            }));
        }
        catch (error) {
            console.error("🔥 [LMS DEBUG] CRITICAL FAILURE in getTaskLibrary!", error);
            console.error('❌ [LMS_SERVICE] 获取任务库失败:', error);
            console.error('❌ [LMS_SERVICE] 错误详情:', error.stack);
            // 返回默认任务库而不是抛出错误
            console.log('🔄 [LMS_SERVICE] 使用fallback默认任务库');
            return this.getDefaultTaskLibrary();
        }
        finally {
            // 确保断开数据库连接
            try {
                await this.prisma.$disconnect();
                console.log('🔌 [LMS_SERVICE] 数据库连接已断开');
            }
            catch (disconnectError) {
                console.warn('⚠️ [LMS_SERVICE] 断开数据库连接时出错:', disconnectError);
            }
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
        // 添加必需的字段
        const tasksWithRequiredFields = defaultTasks.map(task => ({
            ...task,
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            schoolId: 'default-school',
            updatedAt: new Date()
        }));
        await this.prisma.task_library.createMany({
            data: tasksWithRequiredFields,
            skipDuplicates: true
        });
        console.log('✅ [LMS_SERVICE] 默认任务库创建完成');
    }
    /**
     * 获取默认任务库（降级方案）
     */
    getDefaultTaskLibrary() {
        console.log('🔄 [LMS_SERVICE] 使用fallback默认任务库');
        return [
            // 语文过关项 - 对应PrepView中的chinese QC项目
            { id: 'default-1', category: '语文', name: '生字听写', educationalDomain: '基础作业', educationalSubcategory: '语文过关', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '本课生字听写训练' },
            { id: 'default-2', category: '语文', name: '课文背诵', educationalDomain: '基础作业', educationalSubcategory: '语文过关', defaultExp: 10, type: 'QC', difficulty: 3, isActive: true, description: '流利背诵课文段落' },
            { id: 'default-3', category: '语文', name: '古诗默写', educationalDomain: '基础作业', educationalSubcategory: '语文过关', defaultExp: 12, type: 'QC', difficulty: 3, isActive: true, description: '古诗默写与理解' },
            { id: 'default-4', category: '语文', name: '课文理解', educationalDomain: '基础作业', educationalSubcategory: '语文过关', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '课文内容理解分析' },
            { id: 'default-5', category: '语文', name: '词语解释', educationalDomain: '基础作业', educationalSubcategory: '语文过关', defaultExp: 6, type: 'QC', difficulty: 2, isActive: true, description: '重点词语解释' },
            // 数学过关项 - 对应PrepView中的math QC项目
            { id: 'default-6', category: '数学', name: '口算达标', educationalDomain: '基础作业', educationalSubcategory: '数学过关', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '10分钟口算练习' },
            { id: 'default-7', category: '数学', name: '竖式计算', educationalDomain: '基础作业', educationalSubcategory: '数学过关', defaultExp: 12, type: 'QC', difficulty: 3, isActive: true, description: '多位数竖式计算' },
            { id: 'default-8', category: '数学', name: '公式背诵', educationalDomain: '基础作业', educationalSubcategory: '数学过关', defaultExp: 6, type: 'QC', difficulty: 2, isActive: true, description: '数学公式背诵默写' },
            { id: 'default-9', category: '数学', name: '错题订正', educationalDomain: '基础作业', educationalSubcategory: '数学过关', defaultExp: 10, type: 'QC', difficulty: 2, isActive: true, description: '错题本订正讲解' },
            // 英语过关项 - 对应PrepView中的english QC项目
            { id: 'default-10', category: '英语', name: '单词默写', educationalDomain: '基础作业', educationalSubcategory: '英语过关', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '本单元单词默写' },
            { id: 'default-11', category: '英语', name: '句型背诵', educationalDomain: '基础作业', educationalSubcategory: '英语过关', defaultExp: 10, type: 'QC', difficulty: 3, isActive: true, description: '重点句型背诵' },
            { id: 'default-12', category: '英语', name: '课文朗读', educationalDomain: '基础作业', educationalSubcategory: '英语过关', defaultExp: 6, type: 'QC', difficulty: 1, isActive: true, description: '流利朗读英语课文' },
            { id: 'default-13', category: '英语', name: '听力理解', educationalDomain: '基础作业', educationalSubcategory: '英语过关', defaultExp: 8, type: 'QC', difficulty: 2, isActive: true, description: '英语听力理解训练' },
            { id: 'default-14', category: '英语', name: '口语对话', educationalDomain: '基础作业', educationalSubcategory: '英语过关', defaultExp: 10, type: 'QC', difficulty: 3, isActive: true, description: '英语口语对话练习' },
            // 基础核心任务
            { id: 'default-15', category: '基础作业', name: '课文朗读', educationalDomain: '基础作业', educationalSubcategory: '基础核心', defaultExp: 5, type: 'TASK', difficulty: 1, isActive: true, description: '流利朗读课文' }
        ];
    }
    /**
     * 🆕 发布教学计划 - 四层价值发布模型 (状态/动作分离)
     * 1. 创建 LessonPlan
     * 2. 🚫 安全锁定：只给发布者名下的学生创建 TaskRecord
     * 3. 处理【状态类】任务 (Progress) - 增量更新
     * 4. 处理【动作类】任务 (Methods, Tasks, Personalized) - 每日清空
     * 5. 返回统计信息
     */
    async publishPlan(request, io) {
        const { schoolId, teacherId, title, content, date, progress = {}, coreMethods = [], dailyTasks = [], personalizedTasks = [], tasks = [] // 兼容旧版本
         } = request;
        try {
            // 🔧 使用let以便修改schoolId
            let dynamicSchoolId = schoolId;
            console.log(`🔒 [LMS_SECURITY] Publishing lesson plan: ${title}`);
            console.log(`🔒 [LMS_SECURITY] Teacher ID: ${teacherId}`);
            console.log(`🔒 [LMS_SECURITY] School ID: ${dynamicSchoolId}`);
            console.log(`🔒 [LMS_SECURITY] Debugging - Request params:`, {
                schoolId: dynamicSchoolId,
                teacherId,
                title,
                date: date?.toISOString()
            });
            // 🚨 严重安全检查：验证当前用户的权限
            if (!teacherId) {
                console.error(`🚨 [LMS_SECURITY] CRITICAL: teacherId is undefined or null!`);
                throw new Error('发布者ID不能为空');
            }
            // 🔧 新增：验证schoolId的有效性
            if (!dynamicSchoolId || dynamicSchoolId === 'default-school' || dynamicSchoolId === 'default') {
                console.error(`🚨 [LMS_SECURITY] Invalid schoolId detected: "${dynamicSchoolId}"`);
                // 🔧 尝试从teacherId获取正确的schoolId
                const teacherInfo = await this.prisma.teachers.findUnique({
                    where: { id: teacherId },
                    select: { schoolId: true, name: true, username: true }
                });
                if (teacherInfo) {
                    console.log(`🔧 [LMS_SECURITY] Auto-correcting schoolId from "${dynamicSchoolId}" to "${teacherInfo.schoolId}" for teacher ${teacherInfo.name}`);
                    dynamicSchoolId = teacherInfo.schoolId;
                }
                else {
                    throw new Error(`无效的教师ID: ${teacherId}，无法获取正确的schoolId`);
                }
            }
            // 🆕 安全锁定：只查找归属该老师的学生
            console.log(`🔍 [LMS_DEBUG] Querying students with params:`, {
                schoolId: dynamicSchoolId,
                teacherId,
                isActive: true
            });
            const students = await this.prisma.students.findMany({
                where: {
                    schoolId: dynamicSchoolId,
                    teacherId: teacherId, // 🔒 核心安全约束：只给发布者的学生投送
                    isActive: true
                },
                select: {
                    id: true,
                    name: true,
                    className: true,
                    teacherId: true
                }
            });
            console.log(`🔍 [LMS_DEBUG] Query result: Found ${students.length} students`);
            // 🔧 调试：检查数据库中实际存在的学生
            const allStudentsForTeacher = await this.prisma.students.findMany({
                where: { teacherId: teacherId, isActive: true },
                select: { id: true, schoolId: true, name: true, className: true }
            });
            console.log(`🔍 [LMS_DEBUG] All students for teacher ${teacherId}:`, allStudentsForTeacher.length);
            if (allStudentsForTeacher.length > 0) {
                console.log(`🔍 [LMS_DEBUG] Student schoolIds:`, [...new Set(allStudentsForTeacher.map(s => s.schoolId))]);
            }
            // 🚨 额外安全验证：检查所有返回的学生都确实属于当前老师
            const invalidStudents = students.filter(s => s.teacherId !== teacherId);
            if (invalidStudents.length > 0) {
                console.error(`🚨 [LMS_SECURITY] CRITICAL: Found students belonging to other teachers:`, invalidStudents);
                throw new Error('严重安全错误：查询结果包含其他老师的学生');
            }
            if (students.length === 0) {
                console.log(`⚠️ [LMS_SECURITY] No students found for teacher: ${teacherId} with schoolId: ${dynamicSchoolId}`);
                // 🔧 提供更详细的错误信息
                if (allStudentsForTeacher.length === 0) {
                    throw new Error(`该老师 (${teacherId}) 名下暂无任何学生，请先添加学生或检查师生绑定关系`);
                }
                else {
                    const availableSchoolIds = [...new Set(allStudentsForTeacher.map(s => s.schoolId))];
                    throw new Error(`该老师名下有 ${allStudentsForTeacher.length} 个学生，但他们在不同的校区 (schoolId: ${availableSchoolIds.join(', ')})。当前使用的是: "${dynamicSchoolId}"`);
                }
            }
            console.log(`👥 [LMS_SECURITY] Found ${students.length} students for teacher: ${teacherId}`);
            students.forEach(s => {
                console.log(`👤 [LMS_SECURITY] Student: ${s.name} (${s.className}) - teacherId: ${s.teacherId}`);
            });
            // 2. 创建教学计划 - 使用Prisma标准方法避免SQL命名问题
            const lessonPlan = await this.prisma.lesson_plans.create({
                data: {
                    schoolId: dynamicSchoolId,
                    teacherId: teacherId,
                    title: title,
                    content: {
                        ...content,
                        // 🆕 修复：保存课程进度信息到courseInfo
                        courseInfo: {
                            chinese: progress.chinese ? {
                                unit: "1",
                                lesson: "1",
                                title: progress.chinese
                            } : undefined,
                            math: progress.math ? {
                                unit: "1",
                                lesson: "1",
                                title: progress.math
                            } : undefined,
                            english: progress.english ? {
                                unit: "1",
                                title: progress.english
                            } : undefined
                        },
                        // 🆕 记录发布范围信息
                        publishedTo: 'TEACHERS_STUDENTS',
                        publisherId: teacherId
                    },
                    date: date,
                    isActive: true
                }
            });
            console.log(`✅ [LMS_SECURITY] Created lesson plan: ${lessonPlan.id} for ${students.length} students`);
            // 3. 🆕 四层价值发布模型逻辑
            const taskRecords = [];
            const affectedClasses = new Set();
            let stats = {
                progressCreated: 0,
                methodologyCreated: 0,
                taskCreated: 0,
                personalizedCreated: 0,
                archivedCount: 0
            };
            // 📅 计算今天的时间范围（考虑时区）
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
            console.log(`🎯 [LMS_FOUR_TIER] Four-tier publication mode started`);
            console.log(`📅 [LMS_FOUR_TIER] Date range: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
            // 🏗️ 第一步：处理【状态类】任务 (Progress) - 增量更新
            console.log(`📈 [PROGRESS_TIER] Processing stateful tasks (Progress)...`);
            const allStudentIds = students.map(s => s.id);
            for (const [subject, newContent] of Object.entries(progress)) {
                if (newContent && newContent.trim()) {
                    // 🗑️ 归档旧的进度任务
                    const archivedCount = await this.prisma.task_records.updateMany({
                        where: {
                            studentId: { in: allStudentIds },
                            task_category: 'PROGRESS',
                            subject: subject === 'chinese' ? '语文' : subject === 'math' ? '数学' : '英语',
                            is_current: true
                        },
                        data: { is_current: false }
                    });
                    stats.archivedCount += archivedCount.count;
                    // ✨ 创建新的进度任务
                    const progressTasks = allStudentIds.map(studentId => ({
                        schoolId,
                        studentId,
                        lessonPlanId: lessonPlan.id,
                        type: 'TASK',
                        taskCategory: 'PROGRESS',
                        title: `${subject === 'chinese' ? '语文' : subject === 'math' ? '数学' : '英语'}进度`,
                        content: {
                            progress: newContent,
                            subject: subject === 'chinese' ? '语文' : subject === 'math' ? '数学' : '英语',
                            lessonPlanId: lessonPlan.id,
                            publisherId: teacherId,
                            tier: 'PROGRESS'
                        },
                        subject: subject === 'chinese' ? '语文' : subject === 'math' ? '数学' : '英语',
                        status: 'PENDING',
                        is_current: true,
                        expAwarded: 0, // 进度任务不给予经验值
                        createdAt: new Date()
                    }));
                    taskRecords.push(...progressTasks);
                    stats.progressCreated += progressTasks.length;
                }
            }
            // 🧹 第二步：动作类任务 - "大扫除" (每日清空)
            console.log(`🧹 [ACTION_TIER] Daily sweep for action-based tasks...`);
            // 扫描全班性动作任务
            const actionArchivedCount = await this.prisma.task_records.updateMany({
                where: {
                    studentId: { in: allStudentIds },
                    task_category: { in: ['METHODOLOGY', 'TASK'] },
                    is_current: true
                },
                data: { is_current: false }
            });
            stats.archivedCount += actionArchivedCount.count;
            // 扫描个性化任务
            const personalizedStudentIds = personalizedTasks.map(p => p.studentId);
            let personalArchivedCount = { count: 0 };
            if (personalizedStudentIds.length > 0) {
                personalArchivedCount = await this.prisma.task_records.updateMany({
                    where: {
                        studentId: { in: personalizedStudentIds },
                        task_category: 'PERSONALIZED',
                        is_current: true
                    },
                    data: { is_current: false }
                });
                stats.archivedCount += personalArchivedCount.count;
            }
            console.log(`🧹 [ACTION_TIER] Archived ${actionArchivedCount.count} class-wide and ${personalArchivedCount.count} personalized tasks`);
            // 🏫 第三步：创建全班任务 (核心教法 + 过程任务)
            console.log(`🏫 [CLASS_TIER] Creating class-wide tasks...`);
            const classTasks = [...coreMethods, ...dailyTasks];
            for (const student of students) {
                affectedClasses.add(student.className || '未分班');
                for (const task of classTasks) {
                    taskRecords.push({
                        schoolId,
                        studentId: student.id,
                        lessonPlanId: lessonPlan.id,
                        type: 'TASK',
                        task_category: task.category === '核心教学法' ? 'METHODOLOGY' : 'TASK',
                        title: task.name,
                        content: {
                            taskId: task.id,
                            category: task.category,
                            subject: task.subject,
                            lessonPlanId: lessonPlan.id,
                            publisherId: teacherId,
                            tier: task.category === '核心教学法' ? 'METHODOLOGY' : 'GROWTH'
                        },
                        subject: task.subject,
                        status: 'PENDING',
                        is_current: true,
                        expAwarded: task.expAwarded,
                        attempts: 0,
                        createdAt: new Date()
                    });
                    if (task.category === '核心教学法') {
                        stats.methodologyCreated++;
                    }
                    else {
                        stats.taskCreated++;
                    }
                }
            }
            // 🎯 第四步：创建个性化任务 (只给指定学生)
            console.log(`🎯 [PERSONALIZED_TIER] Creating personalized tasks...`);
            for (const personalized of personalizedTasks) {
                const { studentId, tasks: personalTasks } = personalized;
                // 验证该学生是否属于当前老师
                const targetStudent = students.find(s => s.id === studentId);
                if (!targetStudent) {
                    console.warn(`⚠️ [PERSONALIZED_TIER] Student ${studentId} not found in teacher's class, skipping personalized tasks`);
                    continue;
                }
                for (const task of personalTasks) {
                    taskRecords.push({
                        schoolId,
                        studentId: targetStudent.id,
                        lessonPlanId: lessonPlan.id,
                        type: 'TASK',
                        taskCategory: 'PERSONALIZED',
                        title: task.name,
                        content: {
                            taskId: task.id,
                            category: task.category,
                            subject: task.subject,
                            lessonPlanId: lessonPlan.id,
                            publisherId: teacherId,
                            tier: 'PERSONALIZED',
                            forStudentOnly: true
                        },
                        subject: task.subject,
                        status: 'PENDING',
                        is_current: true,
                        expAwarded: task.expAwarded,
                        attempts: 0,
                        createdAt: new Date()
                    });
                    stats.personalizedCreated++;
                }
            }
            // 💾 批量插入所有任务记录
            if (taskRecords.length > 0) {
                await this.prisma.task_records.createMany({
                    data: taskRecords
                });
                console.log(`✅ [LMS_FOUR_TIER] Created ${taskRecords.length} total task records`);
            }
            // 📊 四层价值发布模型统计报告
            console.log(`📊 [LMS_FOUR_TIER] Four-tier Publication Summary:`);
            console.log(`   - Progress tasks created: ${stats.progressCreated}`);
            console.log(`   - Methodology tasks created: ${stats.methodologyCreated}`);
            console.log(`   - Growth tasks created: ${stats.taskCreated}`);
            console.log(`   - Personalized tasks created: ${stats.personalizedCreated}`);
            console.log(`   - Total tasks archived: ${stats.archivedCount}`);
            console.log(`   - Total students affected: ${students.length}`);
            // 4. 📊 计算四层价值发布模型的统计信息
            const totalTasksCreated = stats.progressCreated + stats.methodologyCreated + stats.taskCreated + stats.personalizedCreated;
            const taskStats = {
                totalStudents: students.length,
                tasksCreated: totalTasksCreated,
                progressTasks: stats.progressCreated,
                methodologyTasks: stats.methodologyCreated,
                growthTasks: stats.taskCreated,
                personalizedTasks: stats.personalizedCreated,
                tasksArchived: stats.archivedCount,
                totalExpAwarded: taskRecords.reduce((sum, task) => sum + (task.expAwarded || 0), 0),
                fourTierMode: true // 🆕 标识这是四层价值发布模式
            };
            // 5. 🆕 安全广播：四层价值发布模型事件
            const teacherRoom = `teacher_${teacherId}`;
            io.to(teacherRoom).emit(socketHandlers_1.SOCKET_EVENTS.PLAN_PUBLISHED, {
                lessonPlanId: lessonPlan.id,
                schoolId,
                publisherId: teacherId,
                title,
                date: lessonPlan.date,
                taskStats,
                affectedClasses: Array.from(affectedClasses),
                securityScope: 'TEACHERS_STUDENTS', // 🆕 标识安全范围
                publicationMode: 'FOUR_TIER_VALUE_MODEL', // 🆕 发布模式标识
                stats: {
                    progress: stats.progressCreated,
                    methodology: stats.methodologyCreated,
                    growth: stats.taskCreated,
                    personalized: stats.personalizedCreated,
                    archived: stats.archivedCount
                }
            });
            console.log(`📡 [LMS_FOUR_TIER] Broadcasted four-tier publication event to teacher ${teacherId}`);
            console.log(`🎯 [LMS_FOUR_TIER] Distribution: Progress(${stats.progressCreated}) + Methodology(${stats.methodologyCreated}) + Growth(${stats.taskCreated}) + Personalized(${stats.personalizedCreated})`);
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
     * 获取最新的教学计划
     */
    async getLatestLessonPlan(schoolId, teacherId) {
        try {
            const whereCondition = {
                schoolId,
                isActive: true
            };
            // 🆕 按老师过滤，确保只获取当前老师的最新计划用于表单回填
            if (teacherId) {
                whereCondition.teacherId = teacherId;
            }
            const latestPlan = await this.prisma.lesson_plans.findFirst({
                where: whereCondition,
                orderBy: {
                    date: 'desc'
                }
            });
            return latestPlan;
        }
        catch (error) {
            console.error('❌ Error getting latest lesson plan:', error);
            throw new Error(`Failed to get latest lesson plan: ${error.message}`);
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
            this.prisma.lesson_plans.findMany({
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
            this.prisma.lesson_plans.count({ where })
        ]);
        return { plans, total };
    }
    /**
     * 获取教学计划详情（包含任务统计）
     */
    async getLessonPlanDetail(lessonPlanId) {
        const lessonPlan = await this.prisma.lesson_plans.findUnique({
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
        const taskStats = await this.prisma.task_records.groupBy({
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
        await this.prisma.lesson_plans.update({
            where: { id: lessonPlanId },
            data: { isActive: false }
        });
    }
    /**
     * 获取学校的教学统计
     */
    async getSchoolStats(schoolId) {
        const [totalPlans, activePlans, taskStats] = await Promise.all([
            this.prisma.lesson_plans.count({
                where: { schoolId }
            }),
            this.prisma.lesson_plans.count({
                where: { schoolId, isActive: true }
            }),
            this.prisma.task_records.groupBy({
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
     * 支持24小时规则：超过24小时后不再显示前一天备课内容
     */
    async getDailyRecords(schoolId, studentId, date) {
        try {
            console.log(`🔥 [LMS DEBUG] ===== getDailyRecords 调用开始 =====`);
            console.log(`🔥 [LMS DEBUG] 传入参数: schoolId=${schoolId}, studentId=${studentId}, date=${date}`);
            const now = new Date();
            const targetDate = new Date(date);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const day = targetDate.getDate();
            // 创建目标日期的开始和结束时间
            const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
            const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
            console.log(`🔥 [LMS DEBUG] 目标日期: ${date}`);
            console.log(`🔥 [LMS DEBUG] 服务器当前时间: ${now.toISOString()}`);
            console.log(`🔥 [LMS DEBUG] 目标日期范围: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
            // 🆕 实现24小时规则
            let queryStartDate;
            let queryEndDate = endOfDay;
            // 计算目标日期与当前时间的差异
            const daysDiff = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`🔥 [24H_RULE] 目标日期与今天相差: ${daysDiff} 天`);
            if (daysDiff > 1) {
                // 如果目标日期是前天或更早，不显示任何内容
                console.log(`🔥 [24H_RULE] 目标日期超过24小时范围，返回空结果`);
                return [];
            }
            else if (daysDiff === 1) {
                // 如果目标日期是昨天，检查是否在24小时范围内
                const yesterdayEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1); // 昨天23:59:59
                const hoursSinceYesterday = (now.getTime() - yesterdayEnd.getTime()) / (1000 * 60 * 60);
                if (hoursSinceYesterday > 24) {
                    console.log(`🔥 [24H_RULE] 距离昨天结束已超过${hoursSinceYesterday.toFixed(1)}小时，返回空结果`);
                    return [];
                }
                else {
                    console.log(`🔥 [24H_RULE] 距离昨天结束${hoursSinceYesterday.toFixed(1)}小时，仍在24小时范围内`);
                    // 查询昨天的数据，但限制在24小时前到现在的时间范围
                    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    queryStartDate = new Date(Math.max(startOfDay.getTime(), twentyFourHoursAgo.getTime()));
                    console.log(`🔥 [24H_RULE] 24小时查询范围: ${queryStartDate.toISOString()} - ${endOfDay.toISOString()}`);
                }
            }
            else {
                // 今天或未来日期，正常查询
                queryStartDate = startOfDay;
                console.log(`🔥 [24H_RULE] 今日数据，正常查询范围: ${queryStartDate.toISOString()} - ${queryEndDate.toISOString()}`);
            }
            // 🔥 [时区修复] 扩展查询范围，确保覆盖时区差异
            const extendedStart = new Date(queryStartDate.getTime() - 2 * 60 * 60 * 1000); // 前2小时缓冲
            const extendedEnd = new Date(queryEndDate.getTime() + 2 * 60 * 60 * 1000); // 后2小时缓冲
            console.log(`🔥 [LMS DEBUG] 最终查询范围: ${extendedStart.toISOString()} - ${extendedEnd.toISOString()}`);
            // 执行查询 - ✅ 修复：只查询当前有效的任务记录（实现覆盖规则）
            const records = await this.prisma.task_records.findMany({
                where: {
                    schoolId,
                    studentId,
                    is_current: true, // 🆕 关键修复：只显示当前有效的任务，实现覆盖规则
                    createdAt: {
                        gte: extendedStart,
                        lte: extendedEnd
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
            console.log(`🔥 [LMS DEBUG] 查询结果: 找到 ${records.length} 条记录`);
            if (records.length > 0) {
                console.log(`🔥 [LMS DEBUG] ===== 记录详情 =====`);
                records.forEach((record, index) => {
                    console.log(`🔥 [LMS DEBUG] 记录 ${index + 1}:`);
                    console.log(`   - ID: ${record.id}`);
                    console.log(`   - Title: ${record.title}`);
                    console.log(`   - Type: ${record.type}`);
                    console.log(`   - Status: ${record.status}`);
                    console.log(`   - Created: ${record.createdAt.toISOString()}`);
                    console.log(`   - Created Local: ${record.createdAt.toLocaleString()}`);
                    console.log(`   - Exp: ${record.expAwarded}`);
                    console.log(`   - Student: ${record.student?.name}`);
                    console.log(`   - LessonPlan: ${record.lessonPlan?.title || '无'}`);
                });
            }
            else {
                console.log(`🔥 [LMS DEBUG] ⚠️ 没有找到任何记录！`);
                // 🔥 调试：查询该学生的所有记录，忽略时间限制
                const allStudentRecords = await this.prisma.task_records.findMany({
                    where: {
                        schoolId,
                        studentId
                    },
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        status: true,
                        createdAt: true,
                        expAwarded: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 10
                });
                console.log(`🔥 [LMS DEBUG] 学生 ${studentId} 的最近10条记录（忽略时间限制）:`);
                if (allStudentRecords.length > 0) {
                    allStudentRecords.forEach((record, index) => {
                        console.log(`   ${index + 1}. [${record.type}] ${record.title} - ${record.createdAt.toISOString()}`);
                    });
                }
                else {
                    console.log(`🔥 [LMS DEBUG] 学生 ${studentId} 完全没有任何记录！`);
                }
            }
            return records;
        }
        catch (error) {
            console.error('获取每日任务记录失败:', error);
            throw new Error('获取任务记录失败');
        }
    }
    /**
     * 🆕 获取学生所有历史任务记录（用于动态学期地图）
     */
    async getAllStudentRecords(schoolId, studentId, limit = 100) {
        try {
            console.log(`[LMS_SERVICE] Getting all records for student ${studentId}, limit: ${limit}`);
            const records = await this.prisma.task_records.findMany({
                where: {
                    schoolId,
                    studentId,
                    // 获取所有记录，不过滤is_current，用于生成完整的历史学期地图
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
                    { createdAt: 'desc' } // 最新的在前
                ],
                take: limit
            });
            console.log(`[LMS_SERVICE] Found ${records.length} total records for student ${studentId}`);
            return records;
        }
        catch (error) {
            console.error('[LMS_SERVICE] Get all student records error:', error);
            throw new Error('获取学生历史记录失败');
        }
    }
    /**
     * 增加任务尝试次数
     */
    async markAttempt(recordId, userId) {
        try {
            const record = await this.prisma.task_records.findUnique({
                where: { id: recordId }
            });
            if (!record) {
                throw new Error('任务记录不存在');
            }
            // 简单的权限校验 - 在实际应用中应该有更复杂的权限系统
            // 这里假设只要 userId 存在就有权限操作该校区的记录
            const updatedRecord = await this.prisma.task_records.update({
                where: { id: recordId },
                data: {
                    // 如果没有 attempts 字段，则添加该字段
                    // 由于 schema 中没有 attempts 字段，这里我们使用 content 字段存储尝试次数
                    content: {
                        ...(typeof record.content === 'object' ? record.content : {}),
                        attempts: (((typeof record.content === 'object' && record.content)?.attempts) || 0) + 1,
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
    async updateRecordStatus(recordId, status, userId, schoolId) {
        try {
            console.log(`🔍 [DEBUG] updateRecordStatus 调用:`);
            console.log(`   - recordId: ${recordId}`);
            console.log(`   - status: ${status}`);
            console.log(`   - userId: ${userId}`);
            console.log(`   - schoolId: ${schoolId}`);
            // 首先通过ID查找记录
            const record = await this.prisma.task_records.findUnique({
                where: { id: recordId }
            });
            if (!record) {
                console.log(`❌ [DEBUG] 记录不存在: ${recordId}`);
                throw new Error('任务记录不存在');
            }
            console.log(`✅ [DEBUG] 找到记录:`);
            console.log(`   - 记录ID: ${record.id}`);
            console.log(`   - 记录schoolId: ${record.schoolId}`);
            console.log(`   - 用户schoolId: ${schoolId}`);
            console.log(`   - 状态: ${record.status}`);
            // 权限校验：确保记录属于指定的学校（如果提供了schoolId）
            if (schoolId && record.schoolId !== schoolId) {
                console.log(`❌ [DEBUG] 学校ID不匹配: record.schoolId=${record.schoolId} != user.schoolId=${schoolId}`);
                throw new Error('任务记录不存在或无权限访问');
            }
            console.log(`✅ [DEBUG] 学校ID匹配，继续更新...`);
            const updatedRecord = await this.prisma.task_records.update({
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
        console.log(`🔍 [DEBUG] updateMultipleRecordStatus 开始执行:`);
        console.log(`   - schoolId: ${schoolId}`);
        console.log(`   - recordIds: [${recordIds.join(', ')}]`);
        console.log(`   - status: ${status}`);
        console.log(`   - userId: ${userId}`);
        console.log(`   - recordIds数量: ${recordIds.length}`);
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };
        for (const recordId of recordIds) {
            try {
                console.log(`🔄 [DEBUG] 开始处理记录: ${recordId}`);
                await this.updateRecordStatus(recordId, status, userId, schoolId);
                results.success++;
                console.log(`✅ [DEBUG] 记录 ${recordId} 更新成功`);
            }
            catch (error) {
                results.failed++;
                const errorMsg = `记录 ${recordId}: ${error instanceof Error ? error.message : '未知错误'}`;
                results.errors.push(errorMsg);
                console.log(`❌ [DEBUG] 记录 ${recordId} 更新失败: ${errorMsg}`);
                console.error(error);
            }
        }
        console.log(`🏁 [DEBUG] updateMultipleRecordStatus 完成:`);
        console.log(`   - 成功: ${results.success}`);
        console.log(`   - 失败: ${results.failed}`);
        console.log(`   - 错误: [${results.errors.join(', ')}]`);
        return results;
    }
    /**
     * 获取学生课程进度 - 集成备课页数据
     */
    async getStudentProgress(schoolId, studentId) {
        try {
            console.log(`[LMS_SERVICE] Getting student progress for ${studentId}`);
            // 🆕 修复：首先查找该学生是否有任务记录，以确定相关的教学计划
            const studentTaskRecord = await this.prisma.task_records.findFirst({
                where: {
                    schoolId: schoolId,
                    studentId: studentId,
                    is_current: true,
                    lessonPlanId: { not: null }
                },
                include: {
                    lessonPlan: {
                        select: { id: true, content: true, updatedAt: true }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            // 2. 如果有任务记录，从关联的教学计划中获取课程进度
            if (studentTaskRecord?.lessonPlan) {
                const content = studentTaskRecord.lessonPlan.content;
                console.log(`[LMS_SERVICE] Found lesson plan ${studentTaskRecord.lessonPlan.id} via student task record`);
                console.log(`[LMS_SERVICE] Content structure:`, {
                    hasContent: !!content,
                    hasCourseInfo: !!content?.courseInfo,
                    courseInfoKeys: content?.courseInfo ? Object.keys(content.courseInfo) : []
                });
                // 检查content中是否包含courseInfo
                if (content?.courseInfo?.chinese || content?.courseInfo?.math || content?.courseInfo?.english) {
                    console.log(`[LMS_SERVICE] Found progress in lesson plan ${studentTaskRecord.lessonPlan.id}`);
                    return {
                        chinese: content.courseInfo?.chinese,
                        math: content.courseInfo?.math,
                        english: content.courseInfo?.english,
                        source: 'lesson_plan',
                        updatedAt: studentTaskRecord.lessonPlan.updatedAt.toISOString()
                    };
                }
                else {
                    console.log(`[LMS_SERVICE] No courseInfo found in lesson plan content`);
                    console.log(`[LMS_SERVICE] Content data:`, content);
                }
            }
            // 3. 🆕 优先查找学校的最新教学计划作为主要数据源
            console.log(`[LMS_SERVICE] 查找学校最新教学计划作为主要数据源`);
            const latestLessonPlan = await this.prisma.lesson_plans.findFirst({
                where: {
                    schoolId: schoolId,
                    isActive: true
                },
                orderBy: {
                    date: 'desc'
                }
            });
            // 4. 如果有教学计划，提取课程进度信息（主要方案）
            if (latestLessonPlan) {
                const content = latestLessonPlan.content;
                console.log(`[LMS_SERVICE] Found latest lesson plan ${latestLessonPlan.id}`);
                console.log(`[LMS_SERVICE] Content structure:`, {
                    hasContent: !!content,
                    hasCourseInfo: !!content?.courseInfo,
                    courseInfoKeys: content?.courseInfo ? Object.keys(content.courseInfo) : []
                });
                // 检查content中是否包含courseInfo
                if (content?.courseInfo?.chinese || content?.courseInfo?.math || content?.courseInfo?.english) {
                    console.log(`[LMS_SERVICE] ✅ 在教学计划中找到课程进度: ${latestLessonPlan.id}`);
                    const progressData = {
                        chinese: content.courseInfo?.chinese,
                        math: content.courseInfo?.math,
                        english: content.courseInfo?.english,
                        source: 'lesson_plan',
                        updatedAt: latestLessonPlan.updatedAt.toISOString()
                    };
                    console.log(`[LMS_SERVICE] 返回的课程进度:`, progressData);
                    return progressData;
                }
                else {
                    console.log(`[LMS_SERVICE] ⚠️ 教学计划中没有courseInfo信息`);
                    console.log(`[LMS_SERVICE] Content keys:`, content ? Object.keys(content) : 'null');
                }
            }
            else {
                console.log(`[LMS_SERVICE] ⚠️ 没有找到学校的教学计划`);
            }
            // 5. 🆕 检查所有教学计划中是否有课程进度信息（兜底方案）
            console.log(`[LMS_SERVICE] 检查所有教学计划作为兜底方案`);
            const anyLessonPlan = await this.prisma.lesson_plans.findFirst({
                where: {
                    schoolId: schoolId
                },
                orderBy: {
                    date: 'desc'
                }
            });
            if (anyLessonPlan) {
                const content = anyLessonPlan.content;
                if (content?.courseInfo?.chinese || content?.courseInfo?.math || content?.courseInfo?.english) {
                    console.log(`[LMS_SERVICE] ✅ 在教学计划中找到兜底课程进度: ${anyLessonPlan.id}`);
                    return {
                        chinese: content.courseInfo?.chinese,
                        math: content.courseInfo?.math,
                        english: content.courseInfo?.english,
                        source: 'lesson_plan',
                        updatedAt: anyLessonPlan.updatedAt.toISOString()
                    };
                }
            }
            // 6. 最后的兜底：如果没有找到教学计划或进度信息，返回默认数据
            console.log(`[LMS_SERVICE] ⚠️ 没有找到任何课程进度，返回默认数据`);
            return {
                chinese: { unit: "1", lesson: "1", title: "默认课程" },
                math: { unit: "1", lesson: "1", title: "默认课程" },
                english: { unit: "1", title: "Default Course" },
                source: 'default',
                updatedAt: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('[LMS_SERVICE] Get student progress error:', error);
            // 降级处理：返回默认数据
            return {
                chinese: { unit: "1", lesson: "1", title: "默认课程" },
                math: { unit: "1", lesson: "1", title: "默认课程" },
                english: { unit: "1", title: "Default Course" },
                source: 'default',
                updatedAt: new Date().toISOString()
            };
        }
    }
    /**
     * 更新学生课程进度 - 权限高于备课页
     * 这里我们将进度信息直接存储在学生的最新任务记录中
     */
    async updateStudentProgress(schoolId, studentId, teacherId, progress) {
        try {
            console.log(`[LMS_SERVICE] Updating student progress for ${studentId} by teacher ${teacherId}`);
            // 1. 查找最新的教学计划
            const latestLessonPlan = await this.prisma.lesson_plans.findFirst({
                where: {
                    schoolId: schoolId,
                    teacherId: teacherId,
                    isActive: true
                },
                orderBy: {
                    date: 'desc'
                }
            });
            if (!latestLessonPlan) {
                throw new Error('未找到教学计划，请先发布备课计划');
            }
            // 2. 更新教学计划中的课程进度信息
            const updatedContent = {
                ...latestLessonPlan.content,
                courseInfo: {
                    ...latestLessonPlan.content?.courseInfo || {},
                    ...progress
                },
                // 记录手动更新历史
                manualProgressUpdate: {
                    updatedAt: new Date().toISOString(),
                    updatedBy: teacherId,
                    studentId: studentId,
                    progress: progress
                }
            };
            const updatedLessonPlan = await this.prisma.lesson_plans.update({
                where: { id: latestLessonPlan.id },
                data: {
                    content: updatedContent
                }
            });
            console.log(`[LMS_SERVICE] Successfully updated student progress in lesson plan ${latestLessonPlan.id}`);
            return {
                success: true,
                progress: {
                    chinese: progress.chinese,
                    math: progress.math,
                    english: progress.english,
                    source: 'lesson_plan',
                    updatedAt: updatedLessonPlan.updatedAt.toISOString()
                },
                message: '课程进度更新成功'
            };
        }
        catch (error) {
            console.error('[LMS_SERVICE] Update student progress error:', error);
            return {
                success: false,
                progress: null,
                message: `更新失败: ${error.message}`
            };
        }
    }
}
exports.LMSService = LMSService;

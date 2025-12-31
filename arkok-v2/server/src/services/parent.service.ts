import prisma from '../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'arkok-family-secret';

/**
 * 家长端服务 - 核心业务逻辑
 * 遵循技术宪法 V5.0 "一源多端"原则
 */
export class ParentService {

    // ==================== 认证相关 ====================

    /**
     * 家长登录（通过邀请码绑定）
     * @param phone 家长手机号
     * @param password 密码（默认0000）
     * @param inviteCode 老师生成的邀请码
     * @param schoolId 学校ID
     */
    async login(phone: string, password: string, schoolId: string) {
        // 查找家长账户
        let parent = await prisma.parents.findUnique({
            where: { schoolId_phone: { schoolId, phone } },
            include: {
                parent_student_bindings: {
                    where: { isActive: true },
                    include: {
                        students: {
                            select: { id: true, name: true, className: true, avatarUrl: true }
                        }
                    }
                }
            }
        });

        if (!parent) {
            throw new Error('账户不存在，请先通过邀请码绑定');
        }

        if (parent.password !== password) {
            throw new Error('密码错误');
        }

        if (!parent.isActive) {
            throw new Error('账户已被禁用');
        }

        // 更新最后登录时间
        await prisma.parents.update({
            where: { id: parent.id },
            data: { lastLoginAt: new Date() }
        });

        // 生成 JWT，有效期365天
        const token = jwt.sign(
            {
                id: parent.id,
                phone: parent.phone,
                schoolId: parent.schoolId,
                type: 'parent'
            },
            JWT_SECRET,
            { expiresIn: '365d' }
        );

        // 获取绑定的学生列表
        const students = parent.parent_student_bindings.map(b => b.students);

        return {
            token,
            parent: {
                id: parent.id,
                phone: parent.phone,
                name: parent.name,
                identity: parent.identity
            },
            students
        };
    }

    /**
     * 通过邀请码绑定孩子
     * @param phone 家长手机号
     * @param inviteCode 邀请码（4位数字）
     * @param schoolId 学校ID
     * @param studentName 学生姓名（用于验证）
     * @param name 家长姓名（可选）
     * @param identity 身份标签（可选）
     */
    async bindByInviteCode(
        phone: string,
        inviteCode: string,
        schoolId: string,
        studentName: string,
        name?: string,
        identity?: string
    ) {
        // 验证邀请码格式（4位数字）
        if (!/^\d{4}$/.test(inviteCode)) {
            throw new Error('邀请码格式错误，应为4位数字');
        }

        // 通过学生姓名和邀请码查找学生
        const student = await prisma.students.findFirst({
            where: {
                name: studentName,
                schoolId,
                currentInviteCode: inviteCode
            },
            select: {
                id: true,
                name: true,
                className: true,
                schoolId: true,
                currentInviteCode: true,
                inviteCodeExpiresAt: true
            }
        });

        if (!student) {
            // 检查是否只是邀请码不匹配
            const studentByName = await prisma.students.findFirst({
                where: { name: studentName, schoolId }
            });

            if (!studentByName) {
                throw new Error('未找到该学生，请检查姓名是否正确');
            } else {
                throw new Error('邀请码错误，请确认老师提供的4位数字');
            }
        }

        // 检查邀请码是否过期
        if (student.inviteCodeExpiresAt && new Date() > student.inviteCodeExpiresAt) {
            throw new Error('邀请码已过期，请联系老师重新生成');
        }

        // 查找或创建家长账户
        let parent = await prisma.parents.findUnique({
            where: { schoolId_phone: { schoolId, phone } }
        });

        if (!parent) {
            parent = await prisma.parents.create({
                data: {
                    schoolId,
                    phone,
                    password: '0000', // 默认密码
                    name,
                    identity
                }
            });
        }

        // 检查是否已绑定
        const existingBinding = await prisma.parent_student_bindings.findUnique({
            where: { parentId_studentId: { parentId: parent.id, studentId: student.id } }
        });

        if (existingBinding) {
            if (existingBinding.isActive) {
                throw new Error('已绑定该学生');
            }
            // 重新激活绑定
            await prisma.parent_student_bindings.update({
                where: { id: existingBinding.id },
                data: { isActive: true }
            });
        } else {
            // 创建新绑定
            await prisma.parent_student_bindings.create({
                data: {
                    parentId: parent.id,
                    studentId: student.id,
                    inviteCode
                }
            });
        }

        // 绑定成功后清除邀请码（一次性使用）
        await prisma.students.update({
            where: { id: student.id },
            data: {
                currentInviteCode: null,
                inviteCodeExpiresAt: null
            }
        });

        return {
            success: true,
            student: {
                id: student.id,
                name: student.name,
                className: student.className
            }
        };
    }

    // ==================== 时间轴相关 ====================

    /**
     * 获取学生今日动态时间轴
     * 直接读取 task_records 表，遵循"一源多端"原则
     */
    async getTodayTimeline(studentId: string, parentId: string) {
        // 验证家长是否有权限查看该学生
        await this.verifyParentAccess(parentId, studentId);

        // 🆕 强制使用北京时间 (UTC+8) 计算今日范围，避免代理/VPN影响
        const now = new Date();
        const beijingOffset = 8 * 60; // UTC+8 in minutes
        const localOffset = now.getTimezoneOffset(); // Local offset in minutes (negative for east)
        const beijingTime = new Date(now.getTime() + (beijingOffset + localOffset) * 60 * 1000);

        const todayStr = beijingTime.toISOString().split('T')[0]; // "2025-12-25"
        const today = new Date(`${todayStr}T00:00:00+08:00`);
        const tomorrow = new Date(`${todayStr}T23:59:59+08:00`);

        // 获取今日所有记录
        const allRecords = await prisma.task_records.findMany({
            where: {
                studentId,
                createdAt: { gte: today, lt: tomorrow }
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                type: true,
                task_category: true,
                title: true,
                content: true,
                status: true,
                expAwarded: true,
                createdAt: true,
                subject: true,
                attempts: true  // 🆕 补过次数
            }
        });

        // 分离已完成记录和待办计划
        const completedRecords = allRecords.filter(r => r.status === 'COMPLETED');
        const pendingRecords = allRecords.filter(r => r.status === 'PENDING');

        // 获取今日习惯打卡
        const habitLogs = await prisma.habit_logs.findMany({
            where: {
                studentId,
                checkedAt: { gte: today, lt: tomorrow }
            },
            include: {
                habits: { select: { id: true, name: true, icon: true } }
            },
            orderBy: { checkedAt: 'asc' }
        });

        // 🆕 获取每个习惯的累计打卡次数（与教师端保持一致）
        const habitTotalCounts = await prisma.habit_logs.groupBy({
            by: ['habitId'],
            where: { studentId },
            _count: { id: true }
        });
        const habitCountMap = new Map(habitTotalCounts.map(h => [h.habitId, h._count.id]));

        // 🆕 为每条习惯打卡记录注入累计次数
        const habitLogsWithTotal = habitLogs.map(log => ({
            ...log,
            totalCheckIns: habitCountMap.get(log.habitId) || 1
        }));

        // 🆕 获取今日阅读记录
        const readingLogs = await prisma.reading_logs.findMany({
            where: {
                studentId,
                recordedAt: { gte: today, lt: tomorrow }
            },
            include: {
                books: { select: { bookName: true, totalPages: true } }
            },
            orderBy: { recordedAt: 'asc' }
        });

        // 🆕 获取今日完成的家校计划项目
        const completedPlanItems = await prisma.weekly_plan_items.findMany({
            where: {
                isCompleted: true,
                completedAt: { gte: today, lt: tomorrow },
                plan: { studentId }
            },
            include: {
                plan: { select: { parentNote: true } }
            },
            orderBy: { completedAt: 'asc' }
        });

        // 获取今日PK记录
        const pkMatches = await prisma.pk_matches.findMany({
            where: {
                OR: [{ studentA: studentId }, { studentB: studentId }],
                createdAt: { gte: today, lt: tomorrow }
            },
            include: {
                playerA: { select: { name: true } },
                playerB: { select: { name: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // 获取今日勋章
        const badges = await prisma.student_badges.findMany({
            where: {
                studentId,
                awardedAt: { gte: today, lt: tomorrow }
            },
            include: {
                badges: { select: { name: true, icon: true, description: true } }
            }
        });

        // 整合时间轴数据
        const filteredCompleted = completedRecords.filter(r => {
            if (r.title?.startsWith('习惯打卡:')) return false;
            if (r.title?.startsWith('挑战赛:') && r.type === 'SPECIAL') return false;
            return true;
        });

        // 🆕 移除跨天累计逻辑：只显示当天的记录，确保每次发布后数据干净
        const timeline = this.buildTimeline(filteredCompleted, habitLogsWithTotal, pkMatches, badges, studentId, readingLogs, completedPlanItems);

        // 🆕 注入“今日教学计划”置顶公告 (展示全天计划，包含已过关和待练习)
        // 🔧 过滤逻辑：只包含从备课页发布的任务，排除 PK/挑战赛等系统自动生成的记录
        const filterPlanRecords = (records: any[]) => records.filter(r => {
            const content = (r.content || {}) as any;

            // ✅ 核心过滤：只有备课页发布的记录才有 publisherId
            if (!content.publisherId) return false;

            // 排除系统记录
            if (r.title?.startsWith('进度修正')) return false;
            if (r.title?.startsWith('老师手动调整')) return false;
            // 排除 PK/挑战赛记录
            if (r.type === 'CHALLENGE') return false;
            if (r.title?.includes('PK')) return false;
            if (r.title?.includes('对决')) return false;
            // 只保留来自备课页的任务类型
            return r.task_category === 'PROGRESS' || r.task_category === 'TASK' || r.task_category === 'METHODOLOGY' || r.type === 'QC' || r.type === 'SPECIAL';
        });

        const allPlanRecords = [
            ...filterPlanRecords(pendingRecords),
            ...filterPlanRecords(completedRecords)
        ];

        // 🆕 获取学生最新的课程进度，用于回填“待过关”任务的具体标题
        const studentProfile = await prisma.students.findUnique({
            where: { id: studentId },
            select: { currentUnit: true, currentLesson: true, currentLessonTitle: true }
        });

        if (allPlanRecords.length > 0) {
            const planGroups: Record<string, { title: string; status: string }[]> = {
                '基础过关': [],
                '习惯培养': [],
                '能力训练': [],
                '定制加餐': []
            };

            allPlanRecords.forEach(r => {
                const content = (r.content || {}) as any;
                const cat = content.category || r.task_category || '';
                const title = r.title || '';

                // 🚀 获取原始任务标题 (公告栏保持简洁/概括，不显示具体课文进度)
                const displayTitle = title || '未知任务';

                const taskInfo = {
                    title: displayTitle,
                    status: r.status
                };

                // 🆕 增强分类匹配：优先识别 QC 类型记录
                const isQcType = r.type === 'QC' || r.task_category === 'PROGRESS';
                const isBasicsCategory = ['基础过关', 'PROGRESS', 'chinese', 'math', 'english', '语文', '数学', '英语',
                    '语文基础过关', '数学基础过关', '英语基础过关'].includes(cat) ||
                    cat.includes('基础过关') || cat.includes('过关');

                // QC 类型或者包含典型基础过关关键词的任务
                const hasQcKeyword = ['生字', '听写', '课文', '背诵', '口算', '计算', '竖式', '脱式', '默写', '单词']
                    .some(kw => title.includes(kw));

                if (isQcType || isBasicsCategory || hasQcKeyword) {
                    planGroups['基础过关'].push(taskInfo);
                } else if (['习惯打卡', '习惯培养', '习惯养成', 'HABIT', 'TASK', '综合成长'].includes(cat) ||
                    cat.includes('习惯')) {
                    planGroups['习惯培养'].push(taskInfo);
                } else if (['核心教学法', '能力训练', 'METHODOLOGY', '能力培养'].includes(cat) ||
                    cat.includes('能力') || cat.includes('教学法')) {
                    planGroups['能力训练'].push(taskInfo);
                } else {
                    planGroups['定制加餐'].push(taskInfo);
                }
            });

            // 过滤空分组
            const structuredPlan: any = {};
            Object.entries(planGroups).forEach(([key, tasks]) => {
                if (tasks.length > 0) structuredPlan[key] = tasks;
            });

            const planAnnouncement = {
                id: `plan-announcement-${today.getTime()}`,
                type: 'PLAN_ANNOUNCEMENT',
                category: '今日导学',
                title: '今日能力培养目标',
                icon: '📢',
                content: {
                    planGroups: structuredPlan,
                    totalCount: allPlanRecords.length,
                    completedCount: completedRecords.length,
                    message: completedRecords.length === allPlanRecords.length
                        ? "今日所有计划已圆满完成，孩子表现非常棒！"
                        : `今日已准备 ${allPlanRecords.length} 项核心挑战，已达成 ${completedRecords.length} 项，过关成果实时同步中。`
                },
                time: new Date(today.getTime() + 1).toISOString(),
                cardStyle: 'plan-announcement'
            };
            timeline.unshift(planAnnouncement); // 置顶
        }

        // 获取今日点赞和留言状态
        const summary = await prisma.daily_summaries.findFirst({
            where: {
                studentId,
                parentId,
                date: today.toISOString().split('T')[0]
            }
        });

        // 计算今日积分 (仅计算已获得的 XP)
        const todayExp = completedRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0);

        return {
            date: todayStr,
            weekday: ['日', '一', '二', '三', '四', '五', '六'][beijingTime.getDay()],
            todayExp,
            parentLiked: !!summary?.parentLiked,
            parentComment: summary?.parentComment || null,
            timeline
        };
    }

    /**
     * 获取历史动态（分页）
     */
    async getHistoryTimeline(studentId: string, parentId: string, page = 1, limit = 10) {
        await this.verifyParentAccess(parentId, studentId);

        const skip = (page - 1) * limit;

        const records = await prisma.task_records.findMany({
            where: { studentId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
                id: true,
                type: true,
                task_category: true,
                title: true,
                content: true,
                status: true,
                expAwarded: true,
                createdAt: true,
                subject: true
            }
        });

        return records.map(r => this.formatTimelineItem(r));
    }

    // ==================== 反馈相关 ====================

    /**
     * 家长点赞
     */
    async likeToday(studentId: string, parentId: string) {
        await this.verifyParentAccess(parentId, studentId);

        const today = new Date().toISOString().split('T')[0];

        await prisma.daily_summaries.upsert({
            where: {
                studentId_parentId_date: { studentId, parentId, date: today }
            },
            update: { parentLiked: true },
            create: {
                studentId,
                parentId,
                date: today,
                parentLiked: true
            }
        });

        return { success: true, liked: true };
    }

    /**
     * 家长留言
     */
    async sendComment(studentId: string, parentId: string, comment: string) {
        await this.verifyParentAccess(parentId, studentId);

        const today = new Date().toISOString().split('T')[0];

        await prisma.daily_summaries.upsert({
            where: {
                studentId_parentId_date: { studentId, parentId, date: today }
            },
            update: { parentComment: comment },
            create: {
                studentId,
                parentId,
                date: today,
                parentComment: comment
            }
        });

        return { success: true };
    }

    // ==================== 辅助方法 ====================

    /**
     * 验证家长是否有权限访问该学生
     */
    async verifyParentAccess(parentId: string, studentId: string) {
        const binding = await prisma.parent_student_bindings.findFirst({
            where: {
                parentId,
                studentId,
                isActive: true
            }
        });

        if (!binding) {
            throw new Error('您没有权限查看该学生的信息');
        }

        return true;
    }

    /**
     * 构建时间轴数据
     */
    private buildTimeline(
        records: any[],
        habitLogs: any[],
        pkMatches: any[],
        badges: any[],
        studentId: string,
        readingLogs: any[] = [],  // 🆕 阅读记录参数
        familyPlanItems: any[] = []  // 🆕 家校计划完成项
    ) {
        const timeline: any[] = [];

        // 分离 QC 记录和其他记录
        const qcRecords: any[] = [];
        const otherRecords: any[] = [];

        records.forEach(r => {
            // 🆕 排除内部记录：手动调整进度的记录不作为动态展示给家长
            if (r.title === '老师手动调整进度' || r.title?.includes('进度修正')) {
                return;
            }

            // 跳过PK类型记录（PK数据从独立的pk_matches表来）
            if (r.task_category === 'PK' || r.type === 'PK' || r.type === 'PK_RESULT') {
                return;
            }

            if (r.type === 'QC') {
                qcRecords.push(r);
            } else {
                otherRecords.push(r);
            }
        });

        // 按课程（unit+lesson+subject）聚合 QC 记录
        const qcBySubject = new Map<string, { subject: string; unit: string; lesson: string; title: string; records: any[]; seenTitles: Set<string> }>();
        qcRecords.forEach(r => {
            const content = (r.content || {}) as any;
            const category = content.category || '';
            const courseInfo = content.courseInfo || {};

            // 识别科目
            let subject = '其他';
            if (category.includes('语文') || r.title?.includes('生字') || r.title?.includes('课文') || r.title?.includes('听写') || r.title?.includes('背诵') || r.title?.includes('古诗')) {
                subject = '语文';
            } else if (category.includes('数学') || r.title?.includes('口算') || r.title?.includes('计算') || r.title?.includes('竖式') || r.title?.includes('脱式')) {
                subject = '数学';
            } else if (category.includes('英语') || r.title?.includes('单词') || r.title?.includes('Unit')) {
                subject = '英语';
            }

            // 🆕 提取 unit/lesson 信息（支持嵌套和扁平格式）
            let unit = '1', lesson = '1', title = '';
            if (courseInfo[subject === '语文' ? 'chinese' : subject === '数学' ? 'math' : 'english']) {
                const subInfo = courseInfo[subject === '语文' ? 'chinese' : subject === '数学' ? 'math' : 'english'];
                unit = subInfo.unit || '1';
                lesson = subInfo.lesson || '1';
                title = subInfo.title || '';
            } else if (courseInfo.unit) {
                unit = courseInfo.unit;
                lesson = courseInfo.lesson || '1';
                title = courseInfo.title || '';
            }

            // 🆕 使用 subject-unit-lesson 作为分组键，确保不同课程不会混在一起
            const groupKey = `${subject}-${unit}-${lesson}`;

            if (!qcBySubject.has(groupKey)) {
                qcBySubject.set(groupKey, { subject, unit, lesson, title, records: [], seenTitles: new Set() });
            }

            // 🆕 去重：同一课程中，相同标题的过关项只保留一条（最新的）
            const group = qcBySubject.get(groupKey)!;
            if (!group.seenTitles.has(r.title)) {
                group.seenTitles.add(r.title);
                group.records.push(r);
            }
        });

        // 为每个课程（unit+lesson）创建聚合卡片
        qcBySubject.forEach((group, groupKey) => {
            const { subject, unit, lesson, title, records } = group;
            if (records.length === 0) return;

            const firstRecord = records[0];

            // 构建过关项列表（已去重）
            const tasks = records.map(r => ({
                id: r.id,
                name: r.title,
                status: r.status,
                exp: r.expAwarded || 0,
                attempts: r.attempts || 0, // 🆕 返回尝试次数
                time: r.createdAt
            }));

            timeline.push({
                id: `qc-${groupKey}-${firstRecord.id}`,
                type: 'QC_GROUP',
                category: '基础过关',  // 大标题：基础过关
                title: title ? `第${unit}单元 第${lesson}课《${title}》` : `第${unit}单元 第${lesson}课`,  // 卡片内标题：进度
                icon: '✅',
                content: {
                    subject,
                    unit,
                    lesson,
                    lessonTitle: title,
                    tasks,
                    totalExp: records.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                    completedCount: records.filter(r => r.status === 'COMPLETED').length,
                    totalCount: records.length
                },
                exp: records.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                time: firstRecord.createdAt,
                cardStyle: 'qc-group'
            });
        });

        // 🆕 按类别聚合其他任务记录（核心教学法、综合成长、定制加餐）
        const methodologyRecords: any[] = [];
        const habitRecords: any[] = [];
        const specialRecords: any[] = [];
        const genericRecords: any[] = [];

        otherRecords.forEach(r => {
            const content = (r.content || {}) as any;
            const cat = content.category || r.task_category || '';

            // 排除系统操作记录（移入班级等）不显示在定制加餐中
            if (r.title?.includes('移入班级') || r.title?.includes('移出班级')) {
                return;
            }

            // 根据task_category分类（清晰的一一对应）
            switch (r.task_category) {
                case 'METHODOLOGY':
                    methodologyRecords.push(r);
                    break;
                case 'TASK':
                    habitRecords.push(r);
                    break;
                case 'SPECIAL':
                    if (!r.title?.includes('手动调整')) {
                        specialRecords.push(r);
                    }
                    break;
                case 'BADGE':
                case 'PK':
                case 'PK_RESULT':
                case 'HABIT':
                    // 这些类型的数据从独立表来，跳过
                    return;
                case 'CHALLENGE':
                    // 挑战记录单独显示
                    genericRecords.push(r);
                    break;
                default:
                    // 兼容旧数据，使用category字段判断
                    if (cat.includes('能力') || cat.includes('教学法') || cat.includes('核心教学法')) {
                        methodologyRecords.push(r);
                    } else if (cat.includes('习惯') || cat.includes('综合成长')) {
                        habitRecords.push(r);
                    } else {
                        genericRecords.push(r);
                    }
            }
        });

        // 核心教学法聚合卡片
        if (methodologyRecords.length > 0) {
            const firstRecord = methodologyRecords[0];
            timeline.push({
                id: `methodology-group-${firstRecord.id}`,
                type: 'METHODOLOGY_GROUP',
                category: '核心教学法',
                title: '能力训练',
                icon: '📝',
                content: {
                    tasks: methodologyRecords.map(r => ({
                        id: r.id,
                        name: r.title,
                        status: r.status,
                        exp: r.expAwarded || 0
                    })),
                    totalExp: methodologyRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                    completedCount: methodologyRecords.filter(r => r.status === 'COMPLETED').length,
                    totalCount: methodologyRecords.length
                },
                exp: methodologyRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                time: firstRecord.createdAt,
                cardStyle: 'methodology-group'
            });
        }

        // 综合成长聚合卡片
        if (habitRecords.length > 0) {
            const firstRecord = habitRecords[0];
            timeline.push({
                id: `habit-task-group-${firstRecord.id}`,
                type: 'HABIT_TASK_GROUP',
                category: '综合成长',
                title: '习惯培养',
                icon: '🌱',
                content: {
                    tasks: habitRecords.map(r => ({
                        id: r.id,
                        name: r.title,
                        status: r.status,
                        exp: r.expAwarded || 0
                    })),
                    totalExp: habitRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                    completedCount: habitRecords.filter(r => r.status === 'COMPLETED').length,
                    totalCount: habitRecords.length
                },
                exp: habitRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                time: firstRecord.createdAt,
                cardStyle: 'habit-task-group'
            });
        }

        // 定制加餐聚合卡片（只包含备课页发布的 SPECIAL 任务，排除系统操作）
        if (specialRecords.length > 0) {
            const firstRecord = specialRecords[0];
            timeline.push({
                id: `special-group-${firstRecord.id}`,
                type: 'SPECIAL_GROUP',
                category: '定制加餐',
                title: '个性化任务',
                icon: '⭐',
                content: {
                    tasks: specialRecords.map(r => ({
                        id: r.id,
                        name: r.title,
                        status: r.status,
                        exp: r.expAwarded || 0,
                        targetStudent: (r.content as any)?.targetStudentNames?.[0]
                    })),
                    totalExp: specialRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                    completedCount: specialRecords.filter(r => r.status === 'COMPLETED').length,
                    totalCount: specialRecords.length
                },
                exp: specialRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                time: firstRecord.createdAt,
                cardStyle: 'special-group'
            });
        }

        // 其他未分类的记录（单独显示）
        genericRecords.forEach(r => {
            timeline.push(this.formatTimelineItem(r));
        });

        // 添加习惯打卡
        habitLogs.forEach(h => {
            timeline.push({
                id: h.id,
                type: 'HABIT',
                category: '习惯打卡',
                title: h.habits.name,
                icon: h.habits.icon || '🎯',
                content: {
                    totalCheckIns: (h as any).totalCheckIns || 1,  // 🆕 改为累计打卡次数
                    habitName: h.habits.name,
                    notes: h.notes
                },
                time: h.checkedAt,
                cardStyle: 'habit'
            });
        });

        // 🆕 添加阅读记录
        readingLogs.forEach(log => {
            timeline.push({
                id: log.id,
                type: 'READING',
                category: '阅读培养',
                title: log.books.bookName,
                icon: '📚',
                content: {
                    bookName: log.books.bookName,
                    currentPage: log.currentPage,
                    totalPages: log.books.totalPages,
                    duration: log.duration,
                    progress: log.books.totalPages
                        ? Math.round((log.currentPage / log.books.totalPages) * 100)
                        : null
                },
                time: log.recordedAt,
                cardStyle: 'reading'
            });
        });

        // 添加PK记录
        pkMatches.forEach(pk => {
            const isWinner = pk.winnerId === studentId;
            const opponent = pk.studentA === studentId
                ? pk.playerB.name
                : pk.playerA.name;

            timeline.push({
                id: pk.id,
                type: 'PK',
                category: 'PK对决',
                title: pk.topic || '学科PK',
                icon: '🏆',
                content: {
                    result: isWinner ? 'WIN' : (pk.winnerId ? 'LOSE' : 'DRAW'),
                    opponent,
                    exp: isWinner ? 50 : 0
                },
                time: pk.createdAt,
                cardStyle: 'pk'
            });
        });

        // 添加勋章
        badges.forEach(b => {
            timeline.push({
                id: b.id,
                type: 'BADGE',
                category: '勋章荣誉',
                title: b.badges.name,
                icon: b.badges.icon || '🏅',
                content: { description: b.badges.description, reason: b.reason },
                time: b.awardedAt,
                cardStyle: 'badge'
            });
        });

        // 🆕 添加家校计划完成项 - 合并为单一面板
        if (familyPlanItems.length > 0) {
            // 按类别分组
            const itemsByCategory: Record<string, any[]> = {};
            let parentNote = null;

            familyPlanItems.forEach(item => {
                const cat = item.category || 'OTHER';
                if (!itemsByCategory[cat]) {
                    itemsByCategory[cat] = [];
                }
                itemsByCategory[cat].push({
                    id: item.id,
                    title: item.title,
                    category: cat,
                    isCompleted: true
                });
                if (item.plan?.parentNote) {
                    parentNote = item.plan.parentNote;
                }
            });

            // 创建单一分组卡片
            timeline.push({
                id: `family-plan-group-${familyPlanItems[0].id}`,
                type: 'FAMILY_PLAN_GROUP',
                category: '家校计划',
                title: '家校计划完成',
                icon: '🎯',
                content: {
                    items: familyPlanItems.map(item => ({
                        id: item.id,
                        title: item.title,
                        category: item.category
                    })),
                    itemsByCategory,
                    parentNote,
                    completedCount: familyPlanItems.length,
                    totalCount: familyPlanItems.length
                },
                time: familyPlanItems[0].completedAt,
                cardStyle: 'family-plan-group'
            });
        }

        // 按时间排序
        timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        return timeline;
    }

    /**
 * 格式化单条时间轴项目
 */
    private formatTimelineItem(record: any) {
        const content = record.content as any || {};

        // 根据类型和分类确定卡片样式
        let cardStyle = 'default';
        let icon = '📝';
        const originalCategory = content.category || record.task_category || '';
        let category = originalCategory;
        let subcategory = '';

        switch (record.type) {
            case 'QC':
                cardStyle = 'qc';
                icon = '✅';
                category = content.category || '基础过关';
                break;
            case 'TASK':
                // 🆕 优先使用 content.subcategory（发布时传递的分类标题）
                subcategory = content.subcategory || '';

                // 根据 content.category 确定大类和样式
                if (originalCategory === '核心教学法' || originalCategory === 'METHODOLOGY') {
                    cardStyle = 'methodology';
                    icon = '📝';
                    category = '核心教学法';
                }
                else if (originalCategory === '综合成长' || originalCategory === 'TASK') {
                    cardStyle = 'growth';
                    icon = '🌟';
                    category = '综合成长';
                }
                // 降级方案：从标题关键词推断（兼容历史数据）
                else if (!subcategory) {
                    const title = record.title || '';
                    // 核心教学法关键词
                    if (['错题', '订正', '三色笔', '检查', '自评', '方法', '口算', '作业'].some(k => title.includes(k))) {
                        cardStyle = 'methodology';
                        icon = '📝';
                        category = '核心教学法';
                    }
                    // 综合成长关键词
                    else if (['阅读', '整理', '贡献', '浇花', '打扫', '书架', '光盘'].some(k => title.includes(k))) {
                        cardStyle = 'growth';
                        icon = '🌟';
                        category = '综合成长';
                    }
                    else {
                        cardStyle = 'task';
                        icon = '📋';
                    }
                }
                else {
                    cardStyle = 'task';
                    icon = '📋';
                }
                break;
            case 'SPECIAL':
            case 'PERSONALIZED':
                cardStyle = 'vip';
                icon = '⭐';
                category = '定制加餐';
                break;
            case 'CHALLENGE':
                cardStyle = 'challenge';
                icon = '⚡';
                category = '挑战任务';
                break;
            case 'PK':
            case 'PK_RESULT':
                cardStyle = 'pk';
                icon = '🏆';
                category = 'PK对决';
                break;
            case 'BADGE':
                cardStyle = 'badge';
                icon = '🏅';
                category = '获得勋章';
                break;
            case 'SKILL': // 🆕 技能解锁
                cardStyle = 'skill';
                icon = '✨';
                category = '技能点亮';
                break;
            default:
                cardStyle = 'default';
        }

        // 🚀 优先从 content.courseInfo 中获取更具体的课文标题用于时间轴卡片展示
        let displayTitle = record.title;
        if (record.status === 'COMPLETED' && content.courseInfo) {
            const ci = content.courseInfo;
            if (ci.title && ci.title !== '加载中...') {
                displayTitle = ci.title;
            }
        }

        return {
            id: record.id,
            type: record.type,
            category,
            title: displayTitle,
            icon,
            content: {
                ...content,
                status: record.status,
                subject: record.subject,
                subcategory  // 子分类
            },
            exp: record.expAwarded,
            time: record.createdAt,
            cardStyle
        };
    }
    // ==================== 教师端辅助方法 ====================

    /**
     * 生成学生邀请码（教师端调用）
     * 格式：4位随机数字
     * 邀请码有效期：24小时
     * 权限校验：仅限管理老师或管理员
     */
    async generateInviteCode(studentId: string, requesterId?: string, userRole?: string) {
        const student = await prisma.students.findUnique({
            where: { id: studentId },
            select: { id: true, name: true, className: true, teacherId: true }
        });

        if (!student) {
            throw new Error('学生不存在');
        }

        // 权限校验：如果不是管理员，必须是该学生的管理老师
        if (userRole !== 'ADMIN' && requesterId && student.teacherId !== requesterId) {
            console.error(`[AUTH_DENIED] Teacher ${requesterId} attempted to generate invite for student ${studentId} managed by ${student.teacherId}`);
            throw new Error('权限不足：您不是该学生的管理老师');
        }

        // 邀请码格式: 4位随机数字 (1000-9999)
        const inviteCode = String(Math.floor(1000 + Math.random() * 9000));

        // 设置邀请码过期时间为24小时后
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // 持久化存储邀请码
        await prisma.students.update({
            where: { id: studentId },
            data: {
                currentInviteCode: inviteCode,
                inviteCodeExpiresAt: expiresAt
            }
        });

        return {
            inviteCode,
            expiresAt: expiresAt.toISOString(),
            student: {
                id: student.id,
                name: student.name,
                className: student.className
            }
        };
    }

    /**
     * 获取学生绑定的家长列表（教师端调用）
     */
    async getStudentParents(studentId: string) {
        const bindings = await prisma.parent_student_bindings.findMany({
            where: { studentId, isActive: true },
            include: {
                parents: {
                    select: { id: true, phone: true, name: true, identity: true, lastLoginAt: true }
                }
            }
        });

        return bindings.map(b => ({
            bindingId: b.id,
            parentId: b.parents.id,
            phone: b.parents.phone,
            name: b.parents.name,
            identity: b.parents.identity,
            lastLoginAt: b.parents.lastLoginAt,
            bindingTime: b.bindingTime,
            inviteCode: b.inviteCode
        }));
    }

    /**
     * 解除家长绑定（教师端调用）
     */
    async unbindParent(bindingId: string) {
        const binding = await prisma.parent_student_bindings.findUnique({
            where: { id: bindingId },
            include: {
                students: { select: { name: true } },
                parents: { select: { phone: true, name: true } }
            }
        });

        if (!binding) {
            throw new Error('绑定关系不存在');
        }

        // 软删除：设置 isActive = false
        await prisma.parent_student_bindings.update({
            where: { id: bindingId },
            data: { isActive: false }
        });

        return {
            success: true,
            message: `已解除 ${binding.parents.name || binding.parents.phone} 与 ${binding.students.name} 的绑定`
        };
    }


    /**
     * 获取教师的家校反馈消息列表
     */
    async getTeacherFeedbacks(schoolId: string, unreadOnly = false) {
        const where: any = {
            students: { schoolId }
        };

        if (unreadOnly) {
            where.teacherRead = false;
        }

        const summaries = await prisma.daily_summaries.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            take: 50,
            include: {
                students: { select: { id: true, name: true, avatarUrl: true } },
                parents: { select: { id: true, name: true, identity: true } }
            }
        });

        return summaries.map(s => ({
            id: s.id,
            student: s.students,
            parent: s.parents,
            date: s.date,
            liked: s.parentLiked,
            comment: s.parentComment,
            read: s.teacherRead,
            updatedAt: s.updatedAt
        }));
    }

    /**
     * 标记反馈为已读
     */
    async markFeedbackRead(feedbackId: string) {
        await prisma.daily_summaries.update({
            where: { id: feedbackId },
            data: { teacherRead: true }
        });

        return { success: true };
    }

    /**
     * 批量标记已读
     */
    async markAllFeedbacksRead(schoolId: string) {
        await prisma.daily_summaries.updateMany({
            where: {
                teacherRead: false,
                students: { schoolId }
            },
            data: { teacherRead: true }
        });

        return { success: true };
    }

    // ==================== 成长档案相关 ====================

    /**
     * 获取成长档案数据
     * 包含：五维雷达图、毅力热力图、积分曲线
     */
    async getGrowthProfile(studentId: string, parentId: string) {
        await this.verifyParentAccess(parentId, studentId);

        // 获取学生基本信息
        const student = await prisma.students.findUnique({
            where: { id: studentId },
            select: { id: true, name: true, className: true, level: true, exp: true, points: true }
        });

        // 并行获取各维度数据
        const [radarData, heatmapData, trendData, summary] = await Promise.all([
            this.calculateRadarStats(studentId),
            this.getMonthlyHeatmap(studentId),
            this.getExpTrend(studentId),
            this.getGrowthSummary(studentId)
        ]);

        // 获取已解锁技能
        const skills = await prisma.student_skills.findMany({
            where: {
                studentId,
                level: { gt: 0 }
            },
            include: {
                skill: {
                    select: {
                        name: true,
                        code: true,
                        attribute: true,
                        category: true,
                        icon: true,
                        levelData: true
                    }
                }
            },
            orderBy: { levelUpAt: 'desc' }
        });

        const unlockedSkills = skills.map(s => ({
            code: s.skill.code,
            name: s.skill.name,
            attribute: s.skill.attribute,
            category: s.skill.category,
            icon: s.skill.icon,
            level: s.level,
            currentExp: s.currentExp,
            levelTitle: (s.skill.levelData as any[])?.find((l: any) => l.lvl === s.level)?.title || `${s.level}级`,
            unlockedAt: s.unlockedAt
        }));

        return {
            student,
            radarData,
            heatmapData,
            trendData,
            summary,
            unlockedSkills // 🆕 返回技能数据
        };
    }

    /**
     * 计算五维雷达图数据
     * 维度：自主力、规划力、复盘力、思考力、坚持力
     */
    private async calculateRadarStats(studentId: string) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. 自主力 (Autonomy)：自选任务完成数、主动申报任务数
        // 暂用 SPECIAL 类型任务 + 非强制任务完成率
        const specialTasks = await prisma.task_records.count({
            where: {
                studentId,
                task_category: 'SPECIAL',
                status: 'COMPLETED',
                createdAt: { gte: monthStart }
            }
        });
        const autonomyScore = Math.min(100, specialTasks * 10); // 10个自选任务得满分

        // 2. 规划力 (Planning)：周计划制定率、每日任务完成率
        // 暂用每日任务按时完成率
        const monthlyTasks = await prisma.task_records.findMany({
            where: {
                studentId,
                type: 'TASK',
                createdAt: { gte: monthStart }
            },
            select: { status: true }
        });
        const taskTotal = monthlyTasks.length;
        const taskCompleted = monthlyTasks.filter(t => t.status === 'COMPLETED').length;
        const planningScore = taskTotal > 0 ? Math.round((taskCompleted / taskTotal) * 100) : 50;

        // 3. 复盘力 (Review)：错题订正数、归因填写率
        // 暂用 QC 完成率 + METHODOLOGY 类型任务完成数
        const [qcStats, methodologyCount] = await Promise.all([
            prisma.task_records.groupBy({
                by: ['status'],
                where: { studentId, type: 'QC' },
                _count: true
            }),
            prisma.task_records.count({
                where: {
                    studentId,
                    task_category: 'METHODOLOGY',
                    status: 'COMPLETED',
                    createdAt: { gte: monthStart }
                }
            })
        ]);
        const qcTotal = qcStats.reduce((sum, s) => sum + s._count, 0);
        const qcCompleted = qcStats.find(s => s.status === 'COMPLETED')?._count || 0;
        const qcRate = qcTotal > 0 ? (qcCompleted / qcTotal) * 50 : 25;
        const reviewScore = Math.min(100, Math.round(qcRate + methodologyCount * 5));

        // 4. 思考力 (Thinking)：母题整理数、讲题视频数
        // 暂用挑战成功率 + PK胜率
        const [challenges, pkMatches] = await Promise.all([
            prisma.challenge_participants.findMany({
                where: { studentId },
                select: { status: true, result: true }
            }),
            prisma.pk_matches.findMany({
                where: { OR: [{ studentA: studentId }, { studentB: studentId }] },
                select: { winnerId: true }
            })
        ]);
        const challengeTotal = challenges.length;
        const challengeSuccess = challenges.filter(c => c.result === 'COMPLETED' || c.result === 'WINNER').length;
        const challengeRate = challengeTotal > 0 ? (challengeSuccess / challengeTotal) * 50 : 25;
        const pkTotal = pkMatches.length;
        const pkWins = pkMatches.filter(pk => pk.winnerId === studentId).length;
        const pkRate = pkTotal > 0 ? (pkWins / pkTotal) * 50 : 25;
        const thinkingScore = Math.round(challengeRate + pkRate);

        // 5. 坚持力 (Grit)：连胜天数、累计里程碑
        // 使用习惯打卡连续天数 + 勋章数量
        const [habitLogs, badgeCount] = await Promise.all([
            prisma.habit_logs.findMany({
                where: { studentId },
                select: { streakDays: true },
                orderBy: { checkedAt: 'desc' },
                take: 10
            }),
            prisma.student_badges.count({ where: { studentId } })
        ]);
        const maxStreak = habitLogs.length > 0
            ? Math.max(...habitLogs.map(h => h.streakDays))
            : 0;
        const gritScore = Math.min(100, maxStreak * 5 + badgeCount * 10);

        return {
            dimensions: [
                { name: '自主力', value: autonomyScore, icon: '🎯' },
                { name: '规划力', value: planningScore, icon: '📋' },
                { name: '复盘力', value: reviewScore, icon: '🔍' },
                { name: '思考力', value: thinkingScore, icon: '💡' },
                { name: '坚持力', value: gritScore, icon: '🔥' }
            ],
            // 综合评分
            overallScore: Math.round((autonomyScore + planningScore + reviewScore + thinkingScore + gritScore) / 5)
        };
    }

    /**
     * 获取本月每日活跃热力图数据
     */
    private async getMonthlyHeatmap(studentId: string) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // 获取本月所有活动记录
        const [taskRecords, habitLogs] = await Promise.all([
            prisma.task_records.findMany({
                where: {
                    studentId,
                    createdAt: { gte: monthStart, lte: monthEnd }
                },
                select: { createdAt: true }
            }),
            prisma.habit_logs.findMany({
                where: {
                    studentId,
                    checkedAt: { gte: monthStart, lte: monthEnd }
                },
                select: { checkedAt: true }
            })
        ]);

        // 按日期聚合活动数
        const activityByDate: Record<string, number> = {};

        taskRecords.forEach(r => {
            const dateKey = r.createdAt.toISOString().split('T')[0];
            activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
        });

        habitLogs.forEach(h => {
            const dateKey = h.checkedAt.toISOString().split('T')[0];
            activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
        });

        // 生成本月每天的热力值（0-3级）
        const daysInMonth = monthEnd.getDate();
        const heatmap: Array<{ date: string; level: number; count: number }> = [];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(now.getFullYear(), now.getMonth(), day);
            const dateKey = date.toISOString().split('T')[0];
            const count = activityByDate[dateKey] || 0;

            // 活动数转换为热力等级
            let level = 0;
            if (count >= 1) level = 1;
            if (count >= 3) level = 2;
            if (count >= 6) level = 3;

            heatmap.push({ date: dateKey, level, count });
        }

        return {
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            days: heatmap,
            totalActiveDays: Object.keys(activityByDate).length
        };
    }

    /**
     * 获取积分/经验趋势数据（最近30天）
     */
    private async getExpTrend(studentId: string) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 获取最近30天的任务记录
        const records = await prisma.task_records.findMany({
            where: {
                studentId,
                createdAt: { gte: thirtyDaysAgo }
            },
            select: { createdAt: true, expAwarded: true }
        });

        // 按日期聚合经验值
        const expByDate: Record<string, number> = {};
        records.forEach(r => {
            const dateKey = r.createdAt.toISOString().split('T')[0];
            expByDate[dateKey] = (expByDate[dateKey] || 0) + (r.expAwarded || 0);
        });

        // 生成30天数据点
        const trend: Array<{ date: string; exp: number; cumulative: number }> = [];
        let cumulative = 0;

        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const dayExp = expByDate[dateKey] || 0;
            cumulative += dayExp;

            trend.push({
                date: dateKey,
                exp: dayExp,
                cumulative
            });
        }

        return {
            period: '30天',
            data: trend,
            totalExp: cumulative
        };
    }

    /**
     * 获取成长概要统计
     */
    private async getGrowthSummary(studentId: string) {
        const student = await prisma.students.findUnique({
            where: { id: studentId },
            select: { createdAt: true }
        });

        const [totalTasks, totalQC, totalPK, totalHabits, totalBadges] = await Promise.all([
            prisma.task_records.count({ where: { studentId, type: 'TASK', status: 'COMPLETED' } }),
            prisma.task_records.count({ where: { studentId, type: 'QC', status: 'COMPLETED' } }),
            prisma.pk_matches.count({ where: { OR: [{ studentA: studentId }, { studentB: studentId }] } }),
            prisma.habit_logs.count({ where: { studentId } }),
            prisma.student_badges.count({ where: { studentId } })
        ]);

        // 计算入学天数
        const joinDate = student?.createdAt || new Date();
        const daysSinceJoin = Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
            joinDate: joinDate.toISOString().split('T')[0],
            daysSinceJoin,
            totalTasks,
            totalQC,
            totalPK,
            totalHabits,
            totalBadges
        };
    }

    // ==================== 周计划相关 ====================

    /**
     * 保存周计划（持久化到数据库）
     * 家长端确认后调用，保存后教师端可在过关页看到
     */
    async saveWeeklyPlan(studentId: string, planData: any) {
        // 使用本周一作为计划起始日（发布后立即生效）
        const weekStart = planData.weekStart || this.getThisWeekMonday();

        // 获取学生的 schoolId
        const student = await prisma.students.findUnique({
            where: { id: studentId },
            select: { schoolId: true }
        });
        if (!student) throw new Error('学生不存在');

        // 删除该学生所有已有计划（最后一次发布覆盖前面所有）
        await prisma.weekly_plans.deleteMany({
            where: { studentId }
        });

        // 创建新的周计划
        const plan = await prisma.weekly_plans.create({
            data: {
                studentId,
                weekStart,
                parentNote: planData.parentNote || null,
                status: 'ACTIVE'
            }
        });

        // 创建计划项目
        const items: { category: string; title: string; metadata?: any }[] = [];

        // 能力修炼项目
        (planData.methodology || []).forEach((title: string) => {
            items.push({ category: 'METHODOLOGY', title });
        });

        // 综合成长项目
        (planData.growth || []).forEach((title: string) => {
            items.push({ category: 'GROWTH', title });
        });

        // 习惯项目
        (planData.habits || []).forEach((id: string) => {
            items.push({ category: 'HABIT', title: id, metadata: { habitId: id } });
        });

        // 阅读项目
        if (planData.reading) {
            items.push({
                category: 'READING',
                title: `阅读目标: ${planData.reading.targetPage}页`,
                metadata: planData.reading
            });
        }

        // 错题攻克
        if (planData.errorTarget > 0) {
            items.push({
                category: 'ERROR_REVIEW',
                title: `错题攻克: ${planData.errorTarget}道`,
                metadata: { target: planData.errorTarget }
            });
        }

        // 批量创建项目
        if (items.length > 0) {
            await prisma.weekly_plan_items.createMany({
                data: items.map(item => ({
                    planId: plan.id,
                    category: item.category,
                    title: item.title,
                    metadata: item.metadata || null
                }))
            });
        }

        console.log('[WeeklyPlan] Saved plan for student:', studentId, 'week:', weekStart, 'items:', items.length);

        return {
            success: true,
            plan: {
                id: plan.id,
                weekStart,
                parentNote: planData.parentNote,
                itemCount: items.length
            }
        };
    }

    /**
     * 获取周计划（从数据库查询）
     */
    async getWeeklyPlan(studentId: string, weekStart?: string) {
        const targetWeek = weekStart || this.getNextWeekMonday();

        const plan = await prisma.weekly_plans.findUnique({
            where: {
                studentId_weekStart: { studentId, weekStart: targetWeek }
            },
            include: {
                items: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!plan) {
            return {
                weekStart: targetWeek,
                items: [],
                exists: false
            };
        }

        return {
            id: plan.id,
            weekStart: plan.weekStart,
            parentNote: plan.parentNote,
            status: plan.status,
            items: plan.items.map(item => ({
                id: item.id,
                category: item.category,
                title: item.title,
                metadata: item.metadata,
                isCompleted: item.isCompleted,
                completedAt: item.completedAt
            })),
            exists: true
        };
    }

    /**
     * 获取当前活跃的周计划（用于教师端过关页）
     * 查询本周或最近的活跃计划
     */
    async getCurrentWeekPlan(studentId: string) {
        // 查找最近的活跃计划（未完成的）
        const plan = await prisma.weekly_plans.findFirst({
            where: {
                studentId,
                status: 'ACTIVE'
            },
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    where: { isCompleted: false },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!plan || plan.items.length === 0) return null;

        return {
            id: plan.id,
            weekStart: plan.weekStart,
            parentNote: plan.parentNote,
            items: plan.items
        };
    }

    /**
     * 标记周计划项目为已完成（教师端调用）
     * 返回完成详情，用于同步到家长端今日动态
     */
    async completeWeeklyPlanItem(itemId: string) {
        const updatedItem = await prisma.weekly_plan_items.update({
            where: { id: itemId },
            data: {
                isCompleted: true,
                completedAt: new Date()
            },
            include: {
                plan: {
                    select: {
                        studentId: true,
                        weekStart: true
                    }
                }
            }
        });

        return {
            success: true,
            completedItem: {
                id: updatedItem.id,
                title: updatedItem.title,
                category: updatedItem.category,
                completedAt: updatedItem.completedAt,
                studentId: updatedItem.plan.studentId
            }
        };
    }

    /**
     * 获取下周一日期
     */
    private getNextWeekMonday(): string {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilNextMonday);
        return nextMonday.toISOString().split('T')[0];
    }

    /**
     * 获取本周一日期
     */
    private getThisWeekMonday(): string {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + daysToMonday);
        return monday.toISOString().split('T')[0];
    }
}

export const parentService = new ParentService();


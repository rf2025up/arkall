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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 获取今日所有记录
        const records = await prisma.task_records.findMany({
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
                subject: true
            }
        });

        // 获取今日习惯打卡
        const habitLogs = await prisma.habit_logs.findMany({
            where: {
                studentId,
                checkedAt: { gte: today, lt: tomorrow }
            },
            include: {
                habits: { select: { name: true, icon: true } }
            },
            orderBy: { checkedAt: 'asc' }
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
        // 🆕 过滤掉重复/错误分类的记录：
        // - "习惯打卡:"开头的 TASK 记录（已有习惯打卡卡片）
        // - "挑战赛:"开头的 SPECIAL 记录（已有挑战卡片，这是错误分类的重复数据）
        const filteredRecords = records.filter(r => {
            if (r.title?.startsWith('习惯打卡:')) return false;
            if (r.title?.startsWith('挑战赛:') && r.type === 'SPECIAL') return false;
            return true;
        });
        const timeline = this.buildTimeline(filteredRecords, habitLogs, pkMatches, badges, studentId);

        // 获取今日点赞和留言状态
        const summary = await prisma.daily_summaries.findFirst({
            where: {
                studentId,
                parentId,
                date: today.toISOString().split('T')[0]
            }
        });

        // 计算今日积分
        const todayExp = records.reduce((sum, r) => sum + (r.expAwarded || 0), 0);

        return {
            date: today.toISOString().split('T')[0],
            weekday: ['日', '一', '二', '三', '四', '五', '六'][today.getDay()],
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
    private async verifyParentAccess(parentId: string, studentId: string) {
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
        studentId: string
    ) {
        const timeline: any[] = [];

        // 分离 QC 记录和其他记录
        const qcRecords: any[] = [];
        const otherRecords: any[] = [];

        records.forEach(r => {
            // 跳过标题包含 "PK" 的 CHALLENGE 类型记录
            if (r.type === 'CHALLENGE' && r.title && r.title.includes('PK')) {
                return;
            }
            if (r.type === 'QC') {
                qcRecords.push(r);
            } else {
                otherRecords.push(r);
            }
        });

        // 按科目聚合 QC 记录
        const qcBySubject = new Map<string, any[]>();
        qcRecords.forEach(r => {
            const content = (r.content || {}) as any;
            const category = content.category || '';

            // 识别科目
            let subject = '其他';
            if (category.includes('语文') || r.title?.includes('生字') || r.title?.includes('课文') || r.title?.includes('听写') || r.title?.includes('背诵')) {
                subject = '语文';
            } else if (category.includes('数学') || r.title?.includes('口算') || r.title?.includes('计算')) {
                subject = '数学';
            } else if (category.includes('英语') || r.title?.includes('单词') || r.title?.includes('Unit')) {
                subject = '英语';
            }

            if (!qcBySubject.has(subject)) {
                qcBySubject.set(subject, []);
            }
            qcBySubject.get(subject)!.push(r);
        });

        // 为每个科目创建聚合卡片
        qcBySubject.forEach((subjectRecords, subject) => {
            // 获取第一条记录的时间作为卡片时间
            const firstRecord = subjectRecords[0];
            const content = (firstRecord.content || {}) as any;
            const courseInfo = content.courseInfo || {};

            // 获取课程进度信息
            let progressInfo = null;
            if (subject === '语文' && courseInfo.chinese) {
                progressInfo = courseInfo.chinese;
            } else if (subject === '数学' && courseInfo.math) {
                progressInfo = courseInfo.math;
            } else if (subject === '英语' && courseInfo.english) {
                progressInfo = courseInfo.english;
            }

            const unit = progressInfo?.unit || '1';
            const lesson = progressInfo?.lesson || '1';
            const title = progressInfo?.title || '';

            // 构建过关项列表
            const tasks = subjectRecords.map(r => ({
                id: r.id,
                name: r.title,
                status: r.status,
                exp: r.expAwarded || 0,
                time: r.createdAt
            }));

            timeline.push({
                id: `qc-${subject}-${firstRecord.id}`,
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
                    totalExp: subjectRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                    completedCount: subjectRecords.filter(r => r.status === 'COMPLETED').length,
                    totalCount: subjectRecords.length
                },
                exp: subjectRecords.reduce((sum, r) => sum + (r.expAwarded || 0), 0),
                time: firstRecord.createdAt,
                cardStyle: 'qc-group'
            });
        });

        // 添加其他任务记录
        otherRecords.forEach(r => {
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
                content: { streakDays: h.streakDays, notes: h.notes },
                time: h.checkedAt,
                cardStyle: 'habit'
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
                category = '个人挑战';
                break;
            default:
                cardStyle = 'default';
        }

        return {
            id: record.id,
            type: record.type,
            category,
            title: record.title,
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

        return {
            student,
            radarData,
            heatmapData,
            trendData,
            summary
        };
    }

    /**
     * 计算五维雷达图数据
     * 维度：学业攻克、任务达人、PK战力、习惯坚持、荣誉成就
     */
    private async calculateRadarStats(studentId: string) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. 学业攻克：QC 完成率
        const qcStats = await prisma.task_records.groupBy({
            by: ['status'],
            where: {
                studentId,
                type: 'QC'
            },
            _count: true
        });
        const qcTotal = qcStats.reduce((sum, s) => sum + s._count, 0);
        const qcCompleted = qcStats.find(s => s.status === 'COMPLETED')?._count || 0;
        const academicScore = qcTotal > 0 ? Math.round((qcCompleted / qcTotal) * 100) : 0;

        // 2. 任务达人：本月完成的 TASK 数量（归一化到 0-100）
        const monthlyTasks = await prisma.task_records.count({
            where: {
                studentId,
                type: 'TASK',
                status: 'COMPLETED',
                createdAt: { gte: monthStart }
            }
        });
        const taskScore = Math.min(100, monthlyTasks * 5); // 20个任务得满分

        // 3. PK战力：胜率
        const pkMatches = await prisma.pk_matches.findMany({
            where: {
                OR: [{ studentA: studentId }, { studentB: studentId }]
            },
            select: { winnerId: true }
        });
        const pkTotal = pkMatches.length;
        const pkWins = pkMatches.filter(pk => pk.winnerId === studentId).length;
        const pkScore = pkTotal > 0 ? Math.round((pkWins / pkTotal) * 100) : 50; // 默认50

        // 4. 习惯坚持：平均连续打卡天数（归一化）
        const habitLogs = await prisma.habit_logs.findMany({
            where: { studentId },
            select: { streakDays: true },
            orderBy: { checkedAt: 'desc' },
            take: 10
        });
        const avgStreak = habitLogs.length > 0
            ? habitLogs.reduce((sum, h) => sum + h.streakDays, 0) / habitLogs.length
            : 0;
        const habitScore = Math.min(100, Math.round(avgStreak * 10)); // 10天连续得满分

        // 5. 荣誉成就：勋章数量（归一化）
        const badgeCount = await prisma.student_badges.count({
            where: { studentId }
        });
        const badgeScore = Math.min(100, badgeCount * 10); // 10个勋章得满分

        return {
            dimensions: [
                { name: '学业攻克', value: academicScore, icon: '📚' },
                { name: '任务达人', value: taskScore, icon: '✅' },
                { name: 'PK战力', value: pkScore, icon: '⚔️' },
                { name: '习惯坚持', value: habitScore, icon: '🔥' },
                { name: '荣誉成就', value: badgeScore, icon: '🏆' }
            ],
            // 综合评分
            overallScore: Math.round((academicScore + taskScore + pkScore + habitScore + badgeScore) / 5)
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
}

export const parentService = new ParentService();

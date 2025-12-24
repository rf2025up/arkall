/**
 * 家长端服务 - 核心业务逻辑
 * 遵循技术宪法 V5.0 "一源多端"原则
 */
export declare class ParentService {
    /**
     * 家长登录（通过邀请码绑定）
     * @param phone 家长手机号
     * @param password 密码（默认0000）
     * @param inviteCode 老师生成的邀请码
     * @param schoolId 学校ID
     */
    login(phone: string, password: string, schoolId: string): Promise<{
        token: string;
        parent: {
            id: string;
            phone: string;
            name: string;
            identity: string;
        };
        students: {
            id: string;
            name: string;
            className: string;
            avatarUrl: string;
        }[];
    }>;
    /**
     * 通过邀请码绑定孩子
     * @param phone 家长手机号
     * @param inviteCode 邀请码（4位数字）
     * @param schoolId 学校ID
     * @param studentName 学生姓名（用于验证）
     * @param name 家长姓名（可选）
     * @param identity 身份标签（可选）
     */
    bindByInviteCode(phone: string, inviteCode: string, schoolId: string, studentName: string, name?: string, identity?: string): Promise<{
        success: boolean;
        student: {
            id: string;
            name: string;
            className: string;
        };
    }>;
    /**
     * 获取学生今日动态时间轴
     * 直接读取 task_records 表，遵循"一源多端"原则
     */
    getTodayTimeline(studentId: string, parentId: string): Promise<{
        date: string;
        weekday: string;
        todayExp: number;
        parentLiked: boolean;
        parentComment: string;
        timeline: any[];
    }>;
    /**
     * 获取历史动态（分页）
     */
    getHistoryTimeline(studentId: string, parentId: string, page?: number, limit?: number): Promise<{
        id: any;
        type: any;
        category: any;
        title: any;
        icon: string;
        content: any;
        exp: any;
        time: any;
        cardStyle: string;
    }[]>;
    /**
     * 家长点赞
     */
    likeToday(studentId: string, parentId: string): Promise<{
        success: boolean;
        liked: boolean;
    }>;
    /**
     * 家长留言
     */
    sendComment(studentId: string, parentId: string, comment: string): Promise<{
        success: boolean;
    }>;
    /**
     * 验证家长是否有权限访问该学生
     */
    private verifyParentAccess;
    /**
     * 构建时间轴数据
     */
    private buildTimeline;
    /**
 * 格式化单条时间轴项目
 */
    private formatTimelineItem;
    /**
     * 生成学生邀请码（教师端调用）
     * 格式：4位随机数字
     * 邀请码有效期：24小时
     * 权限校验：仅限管理老师或管理员
     */
    generateInviteCode(studentId: string, requesterId?: string, userRole?: string): Promise<{
        inviteCode: string;
        expiresAt: string;
        student: {
            id: string;
            name: string;
            className: string;
        };
    }>;
    /**
     * 获取学生绑定的家长列表（教师端调用）
     */
    getStudentParents(studentId: string): Promise<{
        bindingId: string;
        parentId: string;
        phone: string;
        name: string;
        identity: string;
        lastLoginAt: Date;
        bindingTime: Date;
        inviteCode: string;
    }[]>;
    /**
     * 解除家长绑定（教师端调用）
     */
    unbindParent(bindingId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 获取教师的家校反馈消息列表
     */
    getTeacherFeedbacks(schoolId: string, unreadOnly?: boolean): Promise<{
        id: string;
        student: {
            id: string;
            name: string;
            avatarUrl: string;
        };
        parent: {
            id: string;
            name: string;
            identity: string;
        };
        date: string;
        liked: boolean;
        comment: string;
        read: boolean;
        updatedAt: Date;
    }[]>;
    /**
     * 标记反馈为已读
     */
    markFeedbackRead(feedbackId: string): Promise<{
        success: boolean;
    }>;
    /**
     * 批量标记已读
     */
    markAllFeedbacksRead(schoolId: string): Promise<{
        success: boolean;
    }>;
    /**
     * 获取成长档案数据
     * 包含：五维雷达图、毅力热力图、积分曲线
     */
    getGrowthProfile(studentId: string, parentId: string): Promise<{
        student: {
            id: string;
            name: string;
            className: string;
            level: number;
            points: number;
            exp: number;
        };
        radarData: {
            dimensions: {
                name: string;
                value: number;
                icon: string;
            }[];
            overallScore: number;
        };
        heatmapData: {
            month: string;
            days: {
                date: string;
                level: number;
                count: number;
            }[];
            totalActiveDays: number;
        };
        trendData: {
            period: string;
            data: {
                date: string;
                exp: number;
                cumulative: number;
            }[];
            totalExp: number;
        };
        summary: {
            joinDate: string;
            daysSinceJoin: number;
            totalTasks: number;
            totalQC: number;
            totalPK: number;
            totalHabits: number;
            totalBadges: number;
        };
    }>;
    /**
     * 计算五维雷达图数据
     * 维度：学业攻克、任务达人、PK战力、习惯坚持、荣誉成就
     */
    private calculateRadarStats;
    /**
     * 获取本月每日活跃热力图数据
     */
    private getMonthlyHeatmap;
    /**
     * 获取积分/经验趋势数据（最近30天）
     */
    private getExpTrend;
    /**
     * 获取成长概要统计
     */
    private getGrowthSummary;
}
export declare const parentService: ParentService;
//# sourceMappingURL=parent.service.d.ts.map
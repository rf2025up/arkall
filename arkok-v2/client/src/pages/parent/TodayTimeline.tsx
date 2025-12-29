import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import socketService from '../../services/socket.service';

const API_BASE = '/api/parent';

interface TimelineItem {
    id: string;
    type: string;
    category: string;
    title: string;
    icon: string;
    content: any;
    exp?: number;
    time: string;
    cardStyle: string;
}

interface TimelineData {
    date: string;
    weekday: string;
    todayExp: number;
    parentLiked?: boolean;
    parentComment?: string | null;
    timeline: TimelineItem[];
}

/**
 * 今日动态页
 * UI 参考: /parent/今日动态页.html
 */
const TodayTimeline: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const [data, setData] = useState<TimelineData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);
    const [comment, setComment] = useState('');
    const [serverComment, setServerComment] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // 获取今日动态
    const fetchTimeline = async () => {
        const token = localStorage.getItem('parent_token');
        if (!token || !studentId) return;

        try {
            const res = await fetch(`${API_BASE}/timeline/${studentId}/today`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();

            if (!res.ok) throw new Error(result.error);
            setData(result);
            // 同步初始化交互状态
            if (result.parentLiked) setLiked(true);
            if (result.parentComment) setServerComment(result.parentComment);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeline();
    }, [studentId]);

    // 🆕 实时同步逻辑
    useEffect(() => {
        if (!studentId) return;

        console.log(`🔌 [PARENT_TIMELINE] 尝试连接 Socket 并加入房间 student-${studentId}`);

        // 我们需要一个 schoolId 来连接，通常家长端登录时会存这个
        const schoolId = localStorage.getItem('schoolId') || 'default';

        socketService.connect(schoolId).then(() => {
            socketService.emit('join-student', studentId);

            // 监听数据更新事件
            const handleDataUpdate = (msg: any) => {
                console.log('📡 [PARENT_TIMELINE] 收到实时同步指令:', msg);
                // 如果更新涉及当前学生，则刷新列表
                // 注意：这里我们简单地全量重拉，以确保时区、逻辑等与后端完全一致
                if (msg.studentId === studentId || msg.data?.studentId === studentId) {
                    fetchTimeline();
                }
            };

            socketService.on('DATA_UPDATE' as any, handleDataUpdate);

            return () => {
                socketService.emit('leave-student', studentId);
                socketService.off('DATA_UPDATE' as any, handleDataUpdate);
            };
        });
    }, [studentId]);

    // 点赞
    const handleLike = async () => {
        const token = localStorage.getItem('parent_token');
        if (!token) return;

        try {
            await fetch(`${API_BASE}/feedback/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ studentId })
            });
            setLiked(true);
        } catch (err) {
            console.error('点赞失败', err);
        }
    };

    // 发送留言
    const handleComment = async () => {
        if (!comment.trim() || submitting) return;

        const token = localStorage.getItem('parent_token');
        if (!token) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/feedback/comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ studentId, comment: comment.trim() })
            });

            if (res.ok) {
                setServerComment(comment.trim());
                setComment('');
            }
        } catch (err) {
            console.error('留言失败', err);
        } finally {
            setSubmitting(false);
        }
    };

    // 渲染时间轴卡片 - 统一大标题样式
    const renderTimelineCard = (item: TimelineItem) => {
        const formatTime = (timeStr: string) => {
            const date = new Date(timeStr);
            return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        };

        // 获取分类配置（颜色、图标、背景装饰）
        const getCategoryConfig = () => {
            switch (item.type) {
                case 'QC_GROUP':
                    // 基础过关统一使用绿色主题
                    return {
                        nodeColor: 'border-green-500 bg-green-50',
                        nodeShadow: 'rgba(34,197,94,0.15)',
                        titleColor: 'text-green-700',
                        timeColor: 'text-green-600 bg-green-100',
                        cardBg: 'bg-gradient-to-br from-white to-green-50 border-green-200',
                        decorIcon: '✅',
                        decorColor: 'text-green-500/5'
                    };
                case 'QC':
                    return {
                        nodeColor: 'border-green-500 bg-green-50',
                        nodeShadow: 'rgba(34,197,94,0.15)',
                        titleColor: 'text-green-700',
                        timeColor: 'text-green-600 bg-green-100',
                        cardBg: 'bg-gradient-to-br from-white to-green-50 border-green-200',
                        decorIcon: '✅',
                        decorColor: 'text-green-500/5'
                    };
                case 'TASK':
                    if (item.category === '核心教学法') {
                        return {
                            nodeColor: 'border-orange-500 bg-orange-50',
                            nodeShadow: 'rgba(249,115,22,0.15)',
                            titleColor: 'text-orange-700',
                            timeColor: 'text-orange-600 bg-orange-100',
                            cardBg: 'bg-gradient-to-br from-white to-orange-50 border-orange-200',
                            decorIcon: '📝',
                            decorColor: 'text-orange-500/5'
                        };
                    } else if (item.category === '综合成长') {
                        return {
                            nodeColor: 'border-indigo-500 bg-indigo-50',
                            nodeShadow: 'rgba(99,102,241,0.15)',
                            titleColor: 'text-indigo-700',
                            timeColor: 'text-indigo-600 bg-indigo-100',
                            cardBg: 'bg-gradient-to-br from-white to-indigo-50 border-indigo-200',
                            decorIcon: '🌟',
                            decorColor: 'text-indigo-500/5'
                        };
                    }
                    return {
                        nodeColor: 'border-purple-500 bg-purple-50',
                        nodeShadow: 'rgba(139,92,246,0.15)',
                        titleColor: 'text-purple-700',
                        timeColor: 'text-purple-600 bg-purple-100',
                        cardBg: 'bg-gradient-to-br from-white to-purple-50 border-purple-200',
                        decorIcon: '⭐',
                        decorColor: 'text-purple-500/5'
                    };
                case 'PK':
                    return {
                        nodeColor: 'border-red-500 bg-red-50',
                        nodeShadow: 'rgba(239,68,68,0.15)',
                        titleColor: 'text-red-700',
                        timeColor: 'text-red-600 bg-red-100',
                        cardBg: 'bg-gradient-to-br from-white to-red-50 border-red-200',
                        decorIcon: '🏆',
                        decorColor: 'text-red-500/5'
                    };
                case 'HABIT':
                    return {
                        nodeColor: 'border-emerald-500 bg-emerald-50',
                        nodeShadow: 'rgba(16,185,129,0.15)',
                        titleColor: 'text-emerald-700',
                        timeColor: 'text-emerald-600 bg-emerald-100',
                        cardBg: 'bg-gradient-to-br from-white to-emerald-50 border-emerald-200',
                        decorIcon: '🎯',
                        decorColor: 'text-emerald-500/5'
                    };
                case 'BADGE':
                    return {
                        nodeColor: 'border-yellow-500 bg-yellow-50',
                        nodeShadow: 'rgba(234,179,8,0.15)',
                        titleColor: 'text-yellow-700',
                        timeColor: 'text-yellow-600 bg-yellow-100',
                        cardBg: 'bg-gradient-to-br from-white to-yellow-50 border-yellow-200',
                        decorIcon: '🏅',
                        decorColor: 'text-yellow-500/5'
                    };
                case 'PLAN_ANNOUNCEMENT':
                    return {
                        nodeColor: 'border-blue-500 bg-blue-50',
                        nodeShadow: 'rgba(59,130,246,0.15)',
                        titleColor: 'text-blue-700',
                        timeColor: 'text-blue-600 bg-blue-100',
                        cardBg: 'bg-gradient-to-br from-blue-50 to-white border-blue-200',
                        decorIcon: '📢',
                        decorColor: 'text-blue-500/10'
                    };
                case 'CHALLENGE':
                    return {
                        nodeColor: 'border-pink-500 bg-pink-50',
                        nodeShadow: 'rgba(236,72,153,0.15)',
                        titleColor: 'text-pink-700',
                        timeColor: 'text-pink-600 bg-pink-100',
                        cardBg: 'bg-gradient-to-br from-white to-pink-50 border-pink-200',
                        decorIcon: '⚡',
                        decorColor: 'text-pink-500/5'
                    };
                // 🆕 核心教学法分组
                case 'METHODOLOGY_GROUP':
                    return {
                        nodeColor: 'border-orange-500 bg-orange-50',
                        nodeShadow: 'rgba(249,115,22,0.15)',
                        titleColor: 'text-orange-700',
                        timeColor: 'text-orange-600 bg-orange-100',
                        cardBg: 'bg-gradient-to-br from-white to-orange-50 border-orange-200',
                        decorIcon: '📝',
                        decorColor: 'text-orange-500/5'
                    };
                // 🆕 综合成长分组
                case 'HABIT_TASK_GROUP':
                    return {
                        nodeColor: 'border-indigo-500 bg-indigo-50',
                        nodeShadow: 'rgba(99,102,241,0.15)',
                        titleColor: 'text-indigo-700',
                        timeColor: 'text-indigo-600 bg-indigo-100',
                        cardBg: 'bg-gradient-to-br from-white to-indigo-50 border-indigo-200',
                        decorIcon: '🌱',
                        decorColor: 'text-indigo-500/5'
                    };
                // 🆕 定制加餐分组  
                case 'SPECIAL_GROUP':
                    return {
                        nodeColor: 'border-purple-500 bg-purple-50',
                        nodeShadow: 'rgba(139,92,246,0.15)',
                        titleColor: 'text-purple-700',
                        timeColor: 'text-purple-600 bg-purple-100',
                        cardBg: 'bg-gradient-to-br from-white to-purple-50 border-purple-200',
                        decorIcon: '⭐',
                        decorColor: 'text-purple-500/5'
                    };
                // 🆕 阅读培养卡片
                case 'READING':
                    return {
                        nodeColor: 'border-emerald-500 bg-emerald-50',
                        nodeShadow: 'rgba(16,185,129,0.15)',
                        titleColor: 'text-emerald-700',
                        timeColor: 'text-emerald-600 bg-emerald-100',
                        cardBg: 'bg-gradient-to-br from-white to-emerald-50 border-emerald-200',
                        decorIcon: '📚',
                        decorColor: 'text-emerald-500/5'
                    };
                default:
                    return {
                        nodeColor: 'border-gray-500 bg-gray-50',
                        nodeShadow: 'rgba(107,114,128,0.15)',
                        titleColor: 'text-gray-700',
                        timeColor: 'text-gray-600 bg-gray-100',
                        cardBg: 'bg-gradient-to-br from-white to-gray-50 border-gray-200',
                        decorIcon: '📋',
                        decorColor: 'text-gray-500/5'
                    };
            }
        };

        const config = getCategoryConfig();

        // 渲染卡片内容
        const renderCardContent = () => {
            // 获取科目显示名称和颜色
            const getSubjectInfo = () => {
                const subject = item.content?.subject || item.content?.category || '';
                if (subject.includes('语文') || subject === 'chinese') {
                    return { name: '语文', color: 'bg-red-100 text-red-600', icon: '📖' };
                }
                if (subject.includes('数学') || subject === 'math') {
                    return { name: '数学', color: 'bg-blue-100 text-blue-600', icon: '📐' };
                }
                if (subject.includes('英语') || subject === 'english') {
                    return { name: '英语', color: 'bg-purple-100 text-purple-600', icon: '🔤' };
                }
                return null;
            };

            // 获取课程进度信息
            const getCourseProgress = () => {
                const courseInfo = item.content?.courseInfo;
                if (!courseInfo) return null;

                // 尝试从不同格式解析
                if (typeof courseInfo === 'object') {
                    // 🆕 优先检查扁平格式 (直接包含 unit/lesson/title)
                    if (courseInfo.unit || courseInfo.lesson || courseInfo.title) {
                        return {
                            unit: courseInfo.unit || '?',
                            lesson: courseInfo.lesson || '?',
                            title: courseInfo.title || ''
                        };
                    }

                    // 降级：检查科目嵌套格式 (courseInfo.chinese.unit 等)
                    const subject = item.content?.subject || item.content?.category || '';
                    let progress = null;

                    if (subject.includes('语文') || subject === 'chinese') {
                        progress = courseInfo.chinese;
                    } else if (subject.includes('数学') || subject === 'math') {
                        progress = courseInfo.math;
                    } else if (subject.includes('英语') || subject === 'english') {
                        progress = courseInfo.english;
                    }

                    if (progress) {
                        const unit = progress.unit || progress.currentUnit || '1';
                        const lesson = progress.lesson || progress.currentLesson || '1';
                        const title = progress.title || progress.lessonTitle || '';
                        return { unit, lesson, title };
                    }
                }
                return null;
            };

            const subjectInfo = getSubjectInfo();
            const courseProgress = getCourseProgress();

            return (
                <>
                    {/* 基础过关分组卡片 (QC_GROUP) */}
                    {item.type === 'QC_GROUP' && item.content?.tasks && (
                        <div className="space-y-2">
                            {/* 过关项列表 */}
                            <div className="space-y-2">
                                {item.content.tasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-green-100"
                                    >
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${task.status === 'COMPLETED'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                            }`}>
                                            {task.status === 'COMPLETED' ? '✓' : '○'}
                                        </span>
                                        <span className={`flex-1 text-sm ${task.status === 'COMPLETED' ? 'text-gray-800' : 'text-gray-400'
                                            }`}>
                                            {task.name}
                                        </span>
                                        {task.attempts > 0 && (
                                            <span className="text-[10px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 italic">X{task.attempts}</span>
                                        )}
                                        {task.exp > 0 && (
                                            <span className="text-xs text-orange-500 font-bold">+{task.exp}</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* 汇总信息 */}
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
                                <span>已完成 {item.content.completedCount}/{item.content.totalCount}</span>
                                <span className="text-orange-500 font-bold">+{item.content.totalExp} 经验</span>
                            </div>
                        </div>
                    )}

                    {/* 🆕 核心教学法分组卡片 (METHODOLOGY_GROUP) */}
                    {item.type === 'METHODOLOGY_GROUP' && item.content?.tasks && (
                        <div className="space-y-2">
                            <div className="space-y-2">
                                {item.content.tasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-orange-100"
                                    >
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${task.status === 'COMPLETED'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                            }`}>
                                            {task.status === 'COMPLETED' ? '✓' : '○'}
                                        </span>
                                        <span className={`flex-1 text-sm ${task.status === 'COMPLETED' ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {task.name}
                                        </span>
                                        {task.exp > 0 && (
                                            <span className="text-xs text-orange-500 font-bold">+{task.exp}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
                                <span>已完成 {item.content.completedCount}/{item.content.totalCount}</span>
                                <span className="text-orange-500 font-bold">+{item.content.totalExp} 经验</span>
                            </div>
                        </div>
                    )}

                    {/* 🆕 综合成长分组卡片 (HABIT_TASK_GROUP) */}
                    {item.type === 'HABIT_TASK_GROUP' && item.content?.tasks && (
                        <div className="space-y-2">
                            <div className="space-y-2">
                                {item.content.tasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-indigo-100"
                                    >
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${task.status === 'COMPLETED'
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                            }`}>
                                            {task.status === 'COMPLETED' ? '✓' : '○'}
                                        </span>
                                        <span className={`flex-1 text-sm ${task.status === 'COMPLETED' ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {task.name}
                                        </span>
                                        {task.exp > 0 && (
                                            <span className="text-xs text-indigo-500 font-bold">+{task.exp}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
                                <span>已完成 {item.content.completedCount}/{item.content.totalCount}</span>
                                <span className="text-indigo-500 font-bold">+{item.content.totalExp} 经验</span>
                            </div>
                        </div>
                    )}

                    {/* 🆕 定制加餐分组卡片 (SPECIAL_GROUP) */}
                    {item.type === 'SPECIAL_GROUP' && item.content?.tasks && (
                        <div className="space-y-2">
                            <div className="space-y-2">
                                {item.content.tasks.map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-purple-100"
                                    >
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${task.status === 'COMPLETED'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-200 text-gray-400'
                                            }`}>
                                            {task.status === 'COMPLETED' ? '✓' : '○'}
                                        </span>
                                        <span className={`flex-1 text-sm ${task.status === 'COMPLETED' ? 'text-gray-800' : 'text-gray-400'}`}>
                                            {task.name}
                                        </span>
                                        {task.exp > 0 && (
                                            <span className="text-xs text-purple-500 font-bold">+{task.exp}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs text-gray-500">
                                <span>已完成 {item.content.completedCount}/{item.content.totalCount}</span>
                                <span className="text-purple-500 font-bold">+{item.content.totalExp} 经验</span>
                            </div>
                        </div>
                    )}

                    {/* 基础过关(QC)类型的特殊展示 - 单条记录兼容 */}
                    {item.type === 'QC' && (
                        <div className="space-y-2">
                            {/* 科目标签 */}
                            {subjectInfo && (
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${subjectInfo.color}`}>
                                        {subjectInfo.icon} {subjectInfo.name}
                                    </span>
                                </div>
                            )}

                            {/* 课程进度 */}
                            {courseProgress && (
                                <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">
                                    <span className="font-medium">第{courseProgress.unit}单元 第{courseProgress.lesson}课</span>
                                    {courseProgress.title && (
                                        <span className="ml-2 text-gray-500">《{courseProgress.title}》</span>
                                    )}
                                </div>
                            )}

                            {/* 完成状态 */}
                            {item.content?.status === 'COMPLETED' && (
                                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                                    <span>✅</span> 已过关
                                </div>
                            )}
                        </div>
                    )}

                    {/* PK 结果 */}
                    {item.type === 'PK' && item.content?.opponent && (
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">🏆</span>
                            <span className="text-gray-700">
                                {item.content.result === 'WIN' ? '战胜了' : item.content.result === 'LOSE' ? '败给了' : '平局'}
                                <span className="font-bold ml-1">{item.content.opponent}</span>
                            </span>
                            {item.content.exp > 0 && (
                                <span className="text-orange-500 font-bold text-sm font-mono ml-auto">+{item.content.exp} 经验</span>
                            )}
                        </div>
                    )}

                    {/* 习惯打卡 - 只显示连续天数，标题已在卡片头部 */}
                    {item.type === 'HABIT' && (
                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold">习惯</span>
                            {item.content?.streakDays > 0 && (
                                <span className="text-xs text-orange-500 font-bold">🔥 连续 {item.content.streakDays} 天</span>
                            )}
                        </div>
                    )}

                    {/* 勋章获得 */}
                    {item.type === 'BADGE' && (
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{item.icon}</span>
                            <div>
                                <div className="font-bold text-gray-800">获得勋章</div>
                                {item.content?.description && (
                                    <div className="text-xs text-gray-500">{item.content.description}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 置顶公告 (PLAN_ANNOUNCEMENT) */}
                    {item.type === 'PLAN_ANNOUNCEMENT' && (
                        <div className="space-y-4">
                            {/* 🆕 待过关清单 - 三支柱分组展示 */}
                            {item.content?.planGroups && Object.entries(item.content.planGroups).map(([groupName, tasks]: [string, any], groupIdx) => {
                                // 判断该分组是否有任何完成的任务
                                const hasCompleted = tasks.some((t: any) => t.status === 'COMPLETED');
                                const allCompleted = tasks.every((t: any) => t.status === 'COMPLETED');

                                // 动态状态标签
                                let statusLabel = groupName === '基础过关' ? '待过关' : '待练习';
                                let statusStyle = 'bg-blue-50 text-blue-400 border-blue-100';

                                if (allCompleted) {
                                    statusLabel = groupName === '基础过关' ? '已过关' : '已完成';
                                    statusStyle = 'bg-green-50 text-green-500 border-green-200';
                                } else if (hasCompleted) {
                                    statusLabel = groupName === '基础过关' ? '过关中' : '练习中';
                                    statusStyle = 'bg-orange-50 text-orange-500 border-orange-200';
                                }

                                return (
                                    <div key={groupName} className="bg-white/60 rounded-xl p-3 border border-blue-100/50 shadow-sm">
                                        <div className="text-[10px] text-blue-500 font-bold mb-2 uppercase tracking-wider flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-1 h-3 rounded-full ${groupIdx === 0 ? 'bg-red-400' : groupIdx === 1 ? 'bg-green-400' : 'bg-orange-400'}`}></span>
                                                {groupName}
                                            </div>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${statusStyle}`}>
                                                {statusLabel}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            {tasks.map((task: any, idx: number) => (
                                                <div key={idx} className={`flex items-center gap-2 text-xs transition-all ${task.status === 'COMPLETED' ? 'text-green-600/60' : 'text-blue-900/70 font-medium'}`}>
                                                    {task.status === 'COMPLETED' ? (
                                                        <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px]">✓</span>
                                                    ) : (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-200"></div>
                                                    )}
                                                    <span className={task.status === 'COMPLETED' ? 'line-through-none' : ''}>
                                                        {task.title}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}


                            <p className="text-[11px] text-blue-800/60 leading-relaxed font-medium italic bg-blue-50/50 p-2 rounded-lg border border-blue-100/30 text-center">
                                "{item.content?.message}"
                            </p>
                            <div className="flex items-center justify-center gap-2 text-[10px] text-blue-400">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping"></span>
                                进入实时把关模式
                            </div>
                        </div>
                    )}

                    {/* 🆕 阅读培养卡片内容 */}
                    {item.type === 'READING' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-emerald-700">
                                    {item.content?.bookName}
                                </span>
                                {item.content?.totalPages && (
                                    <span className="text-xs text-emerald-500">
                                        第{item.content.currentPage}页/{item.content.totalPages}页
                                    </span>
                                )}
                            </div>
                            {item.content?.totalPages && item.content?.progress !== null && (
                                <div className="relative h-2 bg-emerald-100 rounded-full overflow-hidden">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(item.content.progress, 100)}%` }}
                                    />
                                </div>
                            )}
                            {!item.content?.totalPages && (
                                <div className="text-xs text-emerald-400">已读到第 {item.content?.currentPage} 页</div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-emerald-500">
                                <span>⏱️ 阅读 {item.content?.duration} 分钟</span>
                            </div>
                        </div>
                    )}

                    {/* 任务描述 + 完成状态（同行） - 只在有独立描述时显示 */}
                    {item.type !== 'BADGE' && item.type !== 'QC' && item.type !== 'QC_GROUP' && item.type !== 'HABIT' && item.type !== 'PK' && item.type !== 'PLAN_ANNOUNCEMENT' && item.type !== 'READING' && (
                        <div className="flex items-center justify-between gap-2 text-sm">
                            {/* 🆕 修复：只有当 description 存在且与 title 不同时才显示 */}
                            {item.content?.description && item.content.description !== item.title && (
                                <span className="text-gray-600 flex-1">
                                    {item.content.description}
                                </span>
                            )}
                            {/* 挑战类型显示成功/失败 - 🆕 只有成功或失败，无"进行中" */}
                            {item.type === 'CHALLENGE' && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.content?.status === 'COMPLETED' || item.content?.result === 'SUCCESS'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-red-100 text-red-600'
                                    }`}>
                                    {item.content?.status === 'COMPLETED' || item.content?.result === 'SUCCESS'
                                        ? '✅ 成功'
                                        : '❌ 失败'}
                                </span>
                            )}
                            {/* 其他类型显示已完成 */}
                            {item.type !== 'CHALLENGE' && item.content?.status === 'COMPLETED' && (
                                <span className="text-xs font-bold text-green-600">✅ 已完成</span>
                            )}
                        </div>
                    )}

                    {/* 老师评语 */}
                    {item.content?.comment && (
                        <div className="mt-2 bg-gray-50 p-2 rounded-lg text-xs text-gray-500 flex gap-2">
                            <span className="text-orange-400">💬</span>
                            <span>老师：{item.content.comment}</span>
                        </div>
                    )}
                </>
            );
        };

        // 统一大标题样式
        return (
            <div key={item.id} className="relative pl-10 mb-6">
                {/* 时间轴节点 */}
                <div
                    className={`absolute left-[14px] top-1 w-5 h-5 rounded-full border-4 ${config.nodeColor} bg-white z-10`}
                    style={{ boxShadow: `0 0 0 4px ${config.nodeShadow}` }}
                />


                {/* 大标题行 */}
                <div className="flex items-baseline justify-between mb-2">
                    <span className={`text-sm font-bold ${config.titleColor} flex items-center gap-1.5`}>
                        {item.icon} {item.category}
                        {/* QC_GROUP 类型在大标题后显示科目标签 */}
                        {item.type === 'QC_GROUP' && item.content?.subject && (
                            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${item.content.subject === '语文' ? 'bg-red-100 text-red-600' :
                                item.content.subject === '数学' ? 'bg-blue-100 text-blue-600' :
                                    'bg-purple-100 text-purple-600'
                                }`}>
                                {item.content.subject}
                            </span>
                        )}
                        {/* TASK 类型在大标题后显示子分类标签 */}
                        {item.type === 'TASK' && item.content?.subcategory && (
                            <span className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${item.category === '核心教学法' ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'
                                }`}>
                                {item.content.subcategory}
                            </span>
                        )}
                    </span>
                    <span className={`text-xs font-bold ${config.timeColor} px-2 py-0.5 rounded-full`}>
                        {formatTime(item.time)}
                    </span>
                </div>

                {/* 卡片内容 */}
                <div className={`p-4 rounded-2xl ${config.cardBg} border relative overflow-hidden shadow-sm`}>
                    {/* 背景装饰 */}
                    <div className={`absolute right-[-10px] bottom-[-15px] text-[80px] ${config.decorColor} transform -rotate-15 z-0`}>
                        {config.decorIcon}
                    </div>

                    <div className="relative z-10">
                        {/* 标题 */}
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-sm font-bold text-gray-800">{item.title}</h3>
                            {item.exp && item.exp > 0 && item.type !== 'PK' && (
                                <span className="text-orange-500 font-bold text-xs font-mono">+{item.exp} 经验</span>
                            )}
                        </div>

                        {/* 内容区 */}
                        {renderCardContent()}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-400 animate-pulse">加载中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-48">
            {/* 顶部概览 - 橙色渐变满铺样式 */}
            <div className="bg-gradient-to-br from-orange-400 to-orange-600 px-5 py-3 pt-10 pb-4 rounded-b-3xl shadow-lg shadow-orange-200/50">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            {data?.date?.replace(/-/g, '月').replace(/月(\d+)$/, '月$1日')}
                            <span className="text-sm font-normal text-white/70 ml-2">周{data?.weekday}</span>
                        </h1>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-white/80" />
                            <p className="text-xs text-white/80">
                                今日状态：<span className="text-white font-bold">
                                    {(data?.timeline?.length || 0) > 5 ? '充实' : (data?.timeline?.length || 0) > 2 ? '良好' : '平静'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="text-center bg-white/20 rounded-2xl px-4 py-2 backdrop-blur-sm">
                        <div className="text-xs text-white/80">今日积分</div>
                        <div className="font-bold text-white text-lg font-mono">+{data?.todayExp || 0}</div>
                    </div>
                </div>
            </div>


            {/* 时间轴列表 */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                {/* 时间轴线 */}
                <div className="relative">
                    <div className="absolute left-[23px] top-4 bottom-10 w-0.5 bg-gray-200 z-0" />

                    {data?.timeline && data.timeline.length > 0 ? (
                        data.timeline.map(item => renderTimelineCard(item))
                    ) : (
                        <div className="text-center text-gray-400 py-20">
                            今日暂无动态
                        </div>
                    )}
                </div>

                <div className="text-center text-[10px] text-gray-300 mt-10 tracking-widest">
                    — 星途与伴 · 全程用心陪伴 —
                </div>
            </div>

            {/* 底部反馈区 - 仅点赞 */}
            <div className="fixed bottom-16 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3 z-20">
                <button
                    onClick={handleLike}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border ${liked
                        ? 'bg-orange-50 text-orange-500 border-orange-300'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                >
                    <span className="text-xl">{liked ? '❤️' : '👍'}</span>
                    <span className="text-sm">{liked ? '已收到，谢谢老师！' : '为孩子今日表现点赞'}</span>
                </button>
            </div>
        </div>
    );
};

export default TodayTimeline;

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, MessageCircle, Heart } from 'lucide-react';

interface Feedback {
    id: string;
    student: { id: string; name: string; avatarUrl?: string };
    parent: { id: string; name?: string; identity?: string };
    date: string;
    liked: boolean;
    comment?: string;
    read: boolean;
    updatedAt: string;
}

interface MessageCenterProps {
    variant?: 'default' | 'header';  // 🆕 header 用于首页橙色渐变背景
}

/**
 * 教师端消息中心组件
 * 显示家长的点赞和留言反馈
 * UI 参考: /parent/右上角消息.html
 */
const MessageCenter: React.FC<MessageCenterProps> = ({ variant = 'default' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // 获取反馈列表
    const fetchFeedbacks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/parent/feedbacks', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setFeedbacks(data);
                setUnreadCount(data.filter((f: Feedback) => !f.read).length);
            }
        } catch (err) {
            console.error('获取反馈失败', err);
        } finally {
            setLoading(false);
        }
    };

    // 打开时加载数据
    useEffect(() => {
        if (isOpen) {
            fetchFeedbacks();
        }
    }, [isOpen]);

    // 点击外部关闭
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    // 标记单条已读
    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/parent/feedbacks/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFeedbacks(prev => prev.map(f =>
                f.id === id ? { ...f, read: true } : f
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('标记已读失败', err);
        }
    };

    // 全部标记已读
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/parent/feedbacks/read-all', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFeedbacks(prev => prev.map(f => ({ ...f, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('全部标记已读失败', err);
        }
    };

    // 格式化时间
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    };

    // 🆕 根据 variant 选择铃铛样式
    const bellButtonClass = variant === 'header'
        ? "w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-colors border border-white/10 relative"
        : "relative p-2 rounded-full hover:bg-gray-100 transition-colors";

    const bellIconClass = variant === 'header'
        ? "text-white"
        : "text-gray-600";

    return (
        <div className="relative" ref={panelRef}>
            {/* 铃铛按钮 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={bellButtonClass}
            >
                <Bell size={variant === 'header' ? 18 : 22} className={bellIconClass} />
                {unreadCount > 0 && (
                    <span className={`absolute ${variant === 'header' ? 'top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-white/50' : '-top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1'}`}>
                        {variant === 'header' ? '' : (unreadCount > 99 ? '99+' : unreadCount)}
                    </span>
                )}
            </button>

            {/* 消息面板 */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[500px] bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                    {/* 头部 */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 flex justify-between items-center">
                        <div className="text-white">
                            <h3 className="font-bold">家校反馈</h3>
                            <div className="text-[10px] text-white/80 mt-0.5">
                                未读 {unreadCount} 条
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors text-white flex items-center gap-1"
                                >
                                    <CheckCheck size={14} />
                                    全部已读
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={18} className="text-white/80" />
                            </button>
                        </div>
                    </div>

                    {/* 消息列表 */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">加载中...</div>
                        ) : feedbacks.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">暂无反馈消息</div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {feedbacks.map(feedback => (
                                    <div
                                        key={feedback.id}
                                        onClick={() => !feedback.read && markAsRead(feedback.id)}
                                        className={`p-4 cursor-pointer transition-colors ${feedback.read
                                            ? 'bg-white opacity-70'
                                            : 'bg-orange-50 border-l-3 border-l-orange-500 hover:bg-orange-100/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                {/* 头像 */}
                                                <div className="relative">
                                                    {feedback.student.avatarUrl ? (
                                                        <img
                                                            src={feedback.student.avatarUrl}
                                                            className="w-10 h-10 rounded-full bg-gray-100 border border-gray-100"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                                                            {feedback.student.name?.charAt(0)}
                                                        </div>
                                                    )}
                                                    {/* 类型图标 */}
                                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white ${feedback.comment ? 'bg-blue-500' : 'bg-red-500'
                                                        }`}>
                                                        {feedback.comment ? (
                                                            <MessageCircle size={10} className="text-white" />
                                                        ) : (
                                                            <Heart size={10} className="text-white fill-white" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="font-bold text-gray-800 text-sm">
                                                        {feedback.student.name}
                                                        {feedback.parent.identity && (
                                                            <span className="font-normal text-gray-400 ml-1">
                                                                {feedback.parent.identity}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {feedback.comment ? (
                                                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                            "{feedback.comment}"
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            为今日表现点了赞 👍
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-[10px] text-gray-400">
                                                    {formatTime(feedback.updatedAt)}
                                                </div>
                                                {!feedback.read && (
                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* 留言内容完整显示 */}
                                        {feedback.comment && (
                                            <div className="mt-3 bg-white/60 p-3 rounded-lg text-sm text-gray-600 leading-relaxed border border-orange-100/50">
                                                "{feedback.comment}"
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageCenter;

import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, TrendingUp, ChevronDown } from 'lucide-react';
import apiService from '../services/api.service';

interface BookProgress {
    id: string;
    bookName: string;
    totalPages: number | null;
    currentPage: number;
    progress: number | null;
}

interface ReadingStats {
    totalPages: number;
    totalDuration: number;
    totalDurationHours: number;
    booksCount: number;
    books: BookProgress[];
}

interface ReadingStatsProps {
    studentId: string;
}

/**
 * 阅读统计组件
 * 用于学生详情页展示阅读成长数据
 */
const ReadingStatsCard: React.FC<ReadingStatsProps> = ({ studentId }) => {
    const [stats, setStats] = useState<ReadingStats | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiService.get(`/reading/stats/${studentId}`);
                if (res.success && res.data) {
                    setStats(res.data as ReadingStats);
                }
            } catch (err) {
                console.error('[ReadingStats] 获取阅读统计失败:', err);
            } finally {
                setIsLoading(false);
            }
        };

        if (studentId) {
            fetchStats();
        }
    }, [studentId]);

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-600">
                    <BookOpen size={18} />
                    <span className="font-semibold">阅读成长</span>
                </div>
                <div className="mt-2 text-sm text-emerald-400 animate-pulse">加载中...</div>
            </div>
        );
    }

    if (!stats || stats.booksCount === 0) {
        return (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-600">
                    <BookOpen size={18} />
                    <span className="font-semibold">阅读成长</span>
                </div>
                <div className="mt-2 text-sm text-emerald-400">暂无阅读记录</div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 overflow-hidden">
            {/* 标题和统计概览 */}
            <div
                className="p-4 cursor-pointer active:bg-emerald-100/50"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                        <BookOpen size={18} />
                        <span className="font-semibold">阅读成长</span>
                    </div>
                    <ChevronDown
                        size={16}
                        className={`text-emerald-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                </div>

                {/* 统计数据卡片 */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-emerald-600">{stats.booksCount}</div>
                        <div className="text-xs text-emerald-500 font-medium">本书</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-teal-600">{stats.totalPages}</div>
                        <div className="text-xs text-teal-500 font-medium">总页数</div>
                    </div>
                    <div className="bg-white/60 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-cyan-600">{stats.totalDurationHours}h</div>
                        <div className="text-xs text-cyan-500 font-medium">时长</div>
                    </div>
                </div>
            </div>

            {/* 展开的书籍进度详情 */}
            {isExpanded && stats.books.length > 0 && (
                <div className="px-4 pb-4 space-y-2">
                    <div className="text-xs text-emerald-600 font-medium">书籍进度</div>
                    {stats.books.map(book => (
                        <div key={book.id} className="bg-white/70 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-emerald-800">{book.bookName}</span>
                                {book.totalPages && (
                                    <span className="text-xs text-emerald-500">
                                        {book.currentPage}/{book.totalPages}页
                                    </span>
                                )}
                            </div>
                            {book.totalPages && book.progress !== null && (
                                <div className="relative h-2 bg-emerald-100 rounded-full overflow-hidden">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(book.progress, 100)}%` }}
                                    />
                                </div>
                            )}
                            {!book.totalPages && (
                                <div className="text-xs text-emerald-400">已读 {book.currentPage} 页</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReadingStatsCard;

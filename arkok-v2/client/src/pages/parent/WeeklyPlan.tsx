import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, BookMarked, XCircle, Flame, MessageSquare, Check, Compass, ChevronDown, TrendingUp, Plus, X } from 'lucide-react';
import { getMethodologyCategories, getGrowthCategories, type CategoryItem } from '../../config/taskCategories';

const API_BASE = '/api/parent';

interface HabitItem {
    id: string;
    name: string;
    icon: string;
    streakDays?: number;
}

interface BookItem {
    id: string;
    bookName: string;
    currentPage: number;
    totalPages: number;
}

interface SelectedItem {
    category: string;
    title: string;
    metadata?: any;
}

/**
 * 下周航海图页面
 * 使用下拉选择，选中后显示在面板上，确认后保存到数据库
 */
const WeeklyPlan: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [studentName, setStudentName] = useState('');
    const [parentNote, setParentNote] = useState('');

    // 数据源
    const [methodologyCategories, setMethodologyCategories] = useState<CategoryItem[]>([]);
    const [growthCategories, setGrowthCategories] = useState<CategoryItem[]>([]);
    const [habits, setHabits] = useState<HabitItem[]>([]);
    const [books, setBooks] = useState<BookItem[]>([]);

    // 已选择的项目
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

    // 阅读目标
    const [readingBook, setReadingBook] = useState<string>('');
    const [readingTarget, setReadingTarget] = useState<number>(50);

    // 错题攻克目标
    const [errorTarget, setErrorTarget] = useState<number>(5);

    // 下拉选择当前展开的类别
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    // 计划生效日期范围（发布后立即生效）
    const getWeekRange = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();

        // 计算本周日（作为结束日期）
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const thisSunday = new Date(now);
        thisSunday.setDate(now.getDate() + daysUntilSunday);

        // 计算下周五
        const nextFriday = new Date(thisSunday);
        nextFriday.setDate(thisSunday.getDate() + 5);

        const format = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
        return `${format(now)} - ${format(nextFriday)}`;
    };

    // 获取本周一日期（用于标识计划）
    const getThisWeekMonday = () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const thisMonday = new Date(now);
        thisMonday.setDate(now.getDate() - daysFromMonday);
        return thisMonday.toISOString().split('T')[0];
    };

    // 生成下拉选项
    const dropdownOptions = useMemo(() => {
        const options: { category: string; label: string; items: { value: string; label: string; meta?: string }[] }[] = [];

        // 能力修炼
        const methodologyItems: { value: string; label: string }[] = [];
        methodologyCategories.forEach(cat => {
            cat.items.forEach(item => {
                methodologyItems.push({ value: item, label: item });
            });
        });
        options.push({ category: 'METHODOLOGY', label: '能力修炼', items: methodologyItems });

        // 综合成长
        const growthItems: { value: string; label: string }[] = [];
        growthCategories.forEach(cat => {
            cat.items.forEach(item => {
                growthItems.push({ value: item, label: item });
            });
        });
        options.push({ category: 'GROWTH', label: '综合成长', items: growthItems });

        // 习惯坚持
        const habitItems = habits.map(h => ({
            value: h.id,
            label: h.name,
            meta: h.streakDays ? `🔥 连胜${h.streakDays}天` : undefined
        }));
        options.push({ category: 'HABIT', label: '习惯坚持', items: habitItems });

        return options;
    }, [methodologyCategories, growthCategories, habits]);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('parent_token');
            if (!token || !studentId) return;

            try {
                // 加载本地配置
                setMethodologyCategories(getMethodologyCategories());
                setGrowthCategories(getGrowthCategories());

                // 获取学生数据
                const growthRes = await fetch(`${API_BASE}/growth/${studentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const growthData = await growthRes.json();
                if (growthRes.ok) {
                    setStudentName(growthData.student?.name || '');
                }

                // 习惯数据（暂用模拟数据）
                setHabits([
                    { id: 'habit-1', name: '晨读打卡', icon: '📖', streakDays: 3 },
                    { id: 'habit-2', name: '睡前阅读', icon: '🌙', streakDays: 5 },
                    { id: 'habit-3', name: '课外阅读30分钟', icon: '📚', streakDays: 0 },
                ]);

                // 书籍数据（暂用模拟数据）
                setBooks([
                    { id: 'book-1', bookName: '神奇校车', currentPage: 45, totalPages: 120 },
                    { id: 'book-2', bookName: '十万个为什么', currentPage: 30, totalPages: 200 },
                ]);

            } catch (err) {
                console.error('Failed to fetch data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId]);

    // 添加选中项
    const addItem = (category: string, title: string, metadata?: any) => {
        // 检查是否已存在
        const exists = selectedItems.some(item => item.category === category && item.title === title);
        if (!exists) {
            setSelectedItems(prev => [...prev, { category, title, metadata }]);
        }
        setOpenDropdown(null);
    };

    // 移除选中项
    const removeItem = (category: string, title: string) => {
        setSelectedItems(prev => prev.filter(item => !(item.category === category && item.title === title)));
    };

    // 确认保存计划
    const handleConfirm = async () => {
        setSaving(true);
        const token = localStorage.getItem('parent_token');

        try {
            // 构建计划数据 - 不传递 weekStart，让后端使用本周一
            const planData = {
                methodology: selectedItems.filter(i => i.category === 'METHODOLOGY').map(i => i.title),
                growth: selectedItems.filter(i => i.category === 'GROWTH').map(i => i.title),
                habits: selectedItems.filter(i => i.category === 'HABIT').map(i => i.title),
                reading: readingBook ? { bookId: readingBook, targetPage: readingTarget } : null,
                errorTarget: errorTarget > 0 ? errorTarget : 0,
                parentNote
            };

            const res = await fetch(`${API_BASE}/weekly-plan/${studentId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(planData)
            });

            if (res.ok) {
                alert('✅ 周计划已保存！教师端可在过关页看到待办项目。');
                navigate(-1);
            } else {
                const error = await res.json();
                alert('保存失败: ' + (error.error || '请重试'));
            }
        } catch (err) {
            console.error('Save failed:', err);
            alert('保存失败，请检查网络');
        } finally {
            setSaving(false);
        }
    };

    // 获取类别图标
    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'METHODOLOGY': return <Zap className="w-4 h-4 text-red-500" />;
            case 'GROWTH': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'HABIT': return <Flame className="w-4 h-4 text-yellow-500" />;
            case 'READING': return <BookMarked className="w-4 h-4 text-emerald-500" />;
            case 'ERROR_REVIEW': return <XCircle className="w-4 h-4 text-orange-500" />;
            default: return null;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'METHODOLOGY': return 'bg-red-50 border-red-200 text-red-700';
            case 'GROWTH': return 'bg-green-50 border-green-200 text-green-700';
            case 'HABIT': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
            case 'READING': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'ERROR_REVIEW': return 'bg-orange-50 border-orange-200 text-orange-700';
            default: return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-400 animate-pulse">加载中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-32">
            {/* 顶部导航 */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <h1 className="font-bold text-gray-800 flex items-center gap-2">
                        <Compass className="w-5 h-5 text-blue-500" />
                        下周航海图
                    </h1>
                    <div className="w-9" />
                </div>
            </div>

            {/* 日期和学生信息 */}
            <div className="text-center py-4 px-4">
                <div className="text-lg font-bold text-gray-800">{studentName}的成长计划</div>
                <div className="text-sm text-gray-500 mt-1">{getWeekRange()}</div>
            </div>

            <div className="px-4 space-y-4">
                {/* 已选择的项目展示 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="font-bold text-gray-800">📋 已选计划项目</div>
                        <span className="text-xs text-gray-400">{selectedItems.length} 项</span>
                    </div>

                    {selectedItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <div className="text-4xl mb-2">🎯</div>
                            <div className="text-sm">通过下方下拉菜单添加计划项目</div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {selectedItems.map((item, idx) => (
                                <div
                                    key={`${item.category}-${item.title}-${idx}`}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${getCategoryColor(item.category)}`}
                                >
                                    {getCategoryIcon(item.category)}
                                    <span className="max-w-[150px] truncate">{item.title}</span>
                                    <button
                                        onClick={() => removeItem(item.category, item.title)}
                                        className="p-0.5 hover:bg-black/10 rounded-full"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 下拉选择器 */}
                {dropdownOptions.map(option => (
                    <div key={option.category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setOpenDropdown(openDropdown === option.category ? null : option.category)}
                            className="w-full flex items-center justify-between p-4"
                        >
                            <div className="flex items-center gap-2 font-bold text-gray-700">
                                {getCategoryIcon(option.category)}
                                <span>{option.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Plus className="w-5 h-5 text-gray-400" />
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${openDropdown === option.category ? 'rotate-180' : ''}`} />
                            </div>
                        </button>
                        {openDropdown === option.category && (
                            <div className="px-4 pb-4 max-h-60 overflow-y-auto">
                                <div className="space-y-1">
                                    {option.items.map((item, idx) => {
                                        const isSelected = selectedItems.some(s => s.category === option.category && s.title === item.value);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => !isSelected && addItem(option.category, item.value)}
                                                disabled={isSelected}
                                                className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${isSelected
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'hover:bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span>{item.label}</span>
                                                    {item.meta && <span className="text-xs text-orange-500">{item.meta}</span>}
                                                    {isSelected && <Check className="w-4 h-4 text-green-500" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* 阅读培养 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 font-bold text-emerald-500 mb-3">
                        <BookMarked className="w-5 h-5" />
                        <span>阅读培养</span>
                    </div>
                    <div className="space-y-3">
                        <select
                            value={readingBook}
                            onChange={(e) => setReadingBook(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="">请选择本周阅读书籍</option>
                            {books.map(book => (
                                <option key={book.id} value={book.id}>
                                    {book.bookName} (当前第{book.currentPage}页/{book.totalPages}页)
                                </option>
                            ))}
                        </select>
                        {readingBook && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">本周目标读到第</span>
                                <input
                                    type="number"
                                    value={readingTarget}
                                    onChange={(e) => setReadingTarget(parseInt(e.target.value) || 0)}
                                    className="w-20 px-3 py-2 text-center font-bold bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    min={0}
                                />
                                <span className="text-sm text-gray-600">页</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 错题攻克 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 font-bold text-orange-500 mb-3">
                        <XCircle className="w-5 h-5" />
                        <span>错题攻克</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm text-gray-600">本周订正目标</span>
                        <input
                            type="number"
                            value={errorTarget}
                            onChange={(e) => setErrorTarget(parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-2 text-center text-lg font-bold bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            min={0}
                        />
                        <span className="text-sm text-gray-600">道错题</span>
                    </div>
                </div>

                {/* 家长寄语 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 font-bold text-pink-500 mb-3">
                        <MessageSquare className="w-5 h-5" />
                        <span>家长寄语</span>
                    </div>
                    <textarea
                        value={parentNote}
                        onChange={(e) => setParentNote(e.target.value)}
                        placeholder="给孩子写一句鼓励的话..."
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                        rows={3}
                    />
                </div>
            </div>

            {/* 底部确认按钮 */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
                <button
                    onClick={handleConfirm}
                    disabled={saving || (selectedItems.length === 0 && !readingBook && errorTarget === 0)}
                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Check className="w-5 h-5" />
                    {saving ? '保存中...' : '确认计划'}
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">
                    确认后，教师端可在过关页看到家校计划待办
                </p>
            </div>
        </div>
    );
};

export default WeeklyPlan;

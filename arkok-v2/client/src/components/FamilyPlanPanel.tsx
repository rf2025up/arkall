import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Compass, MessageSquare } from 'lucide-react';
import apiService from '../services/api.service';

interface PlanItem {
    id: string;
    category: string;
    title: string;
    metadata?: any;
    isCompleted: boolean;
    completedAt?: string;
}

interface WeeklyPlan {
    id: string;
    weekStart: string;
    parentNote?: string;
    items: PlanItem[];
}

interface FamilyPlanPanelProps {
    studentId: string;
    studentName: string;
    onComplete?: () => void;
}

// 类别配置
const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    METHODOLOGY: { label: '能力修炼', color: 'text-red-500 bg-red-50', icon: '⚡' },
    GROWTH: { label: '综合成长', color: 'text-green-500 bg-green-50', icon: '📈' },
    HABIT: { label: '习惯坚持', color: 'text-yellow-500 bg-yellow-50', icon: '🔥' },
    READING: { label: '阅读培养', color: 'text-emerald-500 bg-emerald-50', icon: '📖' },
    ERROR_REVIEW: { label: '错题攻克', color: 'text-orange-500 bg-orange-50', icon: '❌' },
};

/**
 * 家校计划面板组件
 * 用于在教师端过关页展示学生的周计划待办
 */
const FamilyPlanPanel: React.FC<FamilyPlanPanelProps> = ({ studentId, studentName, onComplete }) => {
    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const res = await apiService.get(`/parent/weekly-plan/${studentId}/current`);
                if (res.success && res.data) {
                    setPlan(res.data as WeeklyPlan);
                } else {
                    setPlan(null);
                }
            } catch (err) {
                console.error('[FamilyPlanPanel] Failed to fetch plan:', err);
                setPlan(null);
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchPlan();
        }
    }, [studentId]);

    // 勾选完成项目
    const handleComplete = async (itemId: string) => {
        setCompleting(itemId);
        try {
            await apiService.patch(`/parent/weekly-plan-item/${itemId}/complete`);

            // 更新本地状态
            setPlan(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    items: prev.items.filter(item => item.id !== itemId)
                };
            });

            onComplete?.();
        } catch (err) {
            console.error('[FamilyPlanPanel] Failed to complete item:', err);
        } finally {
            setCompleting(null);
        }
    };

    if (loading) {
        return (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 animate-pulse">
                <div className="h-4 bg-blue-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
        );
    }

    if (!plan || plan.items.length === 0) {
        return null; // 没有待办项目时不显示
    }

    return (
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
            {/* 标题 */}
            <div className="flex items-center gap-2 mb-2">
                <Compass className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-bold text-blue-700">家校计划待办</span>
                <span className="text-xs text-gray-400">{plan.items.length}项</span>
            </div>

            {/* 家长寄语 */}
            {plan.parentNote && (
                <div className="flex items-start gap-2 mb-2 p-2 bg-white/60 rounded-lg">
                    <MessageSquare className="w-3 h-3 text-pink-400 mt-0.5" />
                    <p className="text-xs text-pink-600 italic">"{plan.parentNote}"</p>
                </div>
            )}

            {/* 待办列表 */}
            <div className="space-y-1.5">
                {plan.items.map(item => {
                    const config = CATEGORY_CONFIG[item.category] || { label: '其他', color: 'text-gray-500 bg-gray-50', icon: '📝' };
                    const isCompleting = completing === item.id;

                    return (
                        <div
                            key={item.id}
                            onClick={() => !isCompleting && handleComplete(item.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all hover:shadow-sm ${config.color} ${isCompleting ? 'opacity-50' : ''}`}
                        >
                            {isCompleting ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Circle className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="text-xs flex-1 truncate">{item.title}</span>
                            <span className="text-[10px] opacity-60">{config.icon}</span>
                        </div>
                    );
                })}
            </div>

            {/* 提示 */}
            <p className="text-[10px] text-gray-400 mt-2 text-center">
                点击勾选完成，家长端会收到通知
            </p>
        </div>
    );
};

export default FamilyPlanPanel;

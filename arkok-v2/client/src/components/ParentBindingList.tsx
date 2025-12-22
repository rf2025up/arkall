import React, { useState, useEffect } from 'react';
import { Users, X, RefreshCw, Phone, Clock, UserCircle } from 'lucide-react';

interface ParentBinding {
    bindingId: string;
    parentId: string;
    phone: string;
    name?: string;
    identity?: string;
    lastLoginAt?: string;
    bindingTime: string;
    inviteCode: string;
}

interface ParentBindingListProps {
    studentId: string;
    studentName?: string;
}

/**
 * 家长绑定列表组件
 * 显示已绑定的家长，支持解绑操作
 */
const ParentBindingList: React.FC<ParentBindingListProps> = ({ studentId, studentName }) => {
    const [bindings, setBindings] = useState<ParentBinding[]>([]);
    const [loading, setLoading] = useState(true);
    const [unbinding, setUnbinding] = useState<string | null>(null);

    // 加载绑定列表
    const loadBindings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/parent/students/${studentId}/parents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setBindings(data);
            }
        } catch (err) {
            console.error('获取家长列表失败', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (studentId) {
            loadBindings();
        }
    }, [studentId]);

    // 解绑操作
    const handleUnbind = async (bindingId: string, parentName: string) => {
        if (!window.confirm(`确定要解除 ${parentName} 的绑定吗？解绑后家长将无法查看该孩子的动态。`)) {
            return;
        }

        setUnbinding(bindingId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/parent/bindings/${bindingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setBindings(prev => prev.filter(b => b.bindingId !== bindingId));
            } else {
                alert(data.error || '解绑失败');
            }
        } catch (err) {
            console.error('解绑失败', err);
            alert('解绑失败，请重试');
        } finally {
            setUnbinding(null);
        }
    };

    // 格式化时间
    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // 格式化手机号
    const formatPhone = (phone: string) => {
        return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-orange-500" />
                    <span className="font-bold text-gray-800">已绑定家长</span>
                    <span className="text-xs text-gray-400">({bindings.length}人)</span>
                </div>
                <button
                    onClick={loadBindings}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* 列表内容 */}
            <div className="divide-y divide-gray-50">
                {loading ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                        加载中...
                    </div>
                ) : bindings.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                        <UserCircle size={32} className="mx-auto mb-2 text-gray-300" />
                        暂无绑定家长
                        <br />
                        <span className="text-xs">点击右上角分享按钮生成邀请卡</span>
                    </div>
                ) : (
                    bindings.map(binding => (
                        <div key={binding.bindingId} className="p-4 flex items-center gap-3">
                            {/* 头像 */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {binding.identity?.charAt(0) || binding.name?.charAt(0) || '家'}
                            </div>

                            {/* 信息 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-800 truncate">
                                        {binding.name || '未设置姓名'}
                                    </span>
                                    {binding.identity && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">
                                            {binding.identity}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Phone size={12} />
                                        {formatPhone(binding.phone)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatTime(binding.bindingTime)}
                                    </span>
                                </div>
                            </div>

                            {/* 解绑按钮 */}
                            <button
                                onClick={() => handleUnbind(binding.bindingId, binding.name || binding.phone)}
                                disabled={unbinding === binding.bindingId}
                                className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {unbinding === binding.bindingId ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                    <X size={12} />
                                )}
                                解绑
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ParentBindingList;

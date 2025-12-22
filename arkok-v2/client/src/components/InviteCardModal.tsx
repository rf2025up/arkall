import React, { useState, useEffect } from 'react';
import { X, Copy, Send, Gift, Check } from 'lucide-react';

interface Student {
    id: string;
    name: string;
    className?: string;
    avatarUrl?: string;
}

interface InviteCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
}

/**
 * 教师端邀请卡弹窗
 * 生成邀请码供家长绑定孩子
 * UI 参考: /parent/邀请和家长绑定.html
 */
const InviteCardModal: React.FC<InviteCardModalProps> = ({ isOpen, onClose, student }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // 生成邀请码
    useEffect(() => {
        if (isOpen && student?.id) {
            generateInviteCode();
        }
    }, [isOpen, student?.id]);

    const generateInviteCode = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/parent/invite/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ studentId: student.id })
            });

            const data = await res.json();
            if (res.ok) {
                setInviteCode(data.inviteCode);
            }
        } catch (err) {
            console.error('生成邀请码失败', err);
        } finally {
            setLoading(false);
        }
    };

    // 复制邀请信息
    const copyInvite = async () => {
        const text = `🎓 邀请您加入【星途与伴】

👦 学生：${student.name}
📚 班级：${student.className || '未知班级'}
🔑 邀请码：${inviteCode}

📱 访问链接：${window.location.origin}/parent/login

请在家长端输入手机号和邀请码完成绑定，实时查看孩子成长动态！`;

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败', err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 邀请卡片 */}
            <div className="relative z-10 w-full max-w-sm bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-2xl border border-orange-200 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* 关闭按钮 */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-20"
                >
                    <X size={20} className="text-gray-400" />
                </button>

                {/* 头部装饰 */}
                <div className="pt-8 pb-4 text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                        <Gift className="text-orange-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">邀请家长加入</h2>
                    <p className="text-sm text-gray-500 mt-2 px-6">
                        将此卡片发给家长，邀请他们共同关注孩子成长
                    </p>
                </div>

                {/* 核心信息区 */}
                <div className="px-6 pb-6">
                    <div className="bg-white border border-dashed border-orange-300 rounded-xl p-4">
                        {/* 学生信息 */}
                        <div className="flex items-center gap-3 mb-3 border-b border-gray-100 pb-3">
                            {student.avatarUrl ? (
                                <img
                                    src={student.avatarUrl}
                                    alt={student.name}
                                    className="w-10 h-10 rounded-full bg-gray-100 object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                                    {student.name?.charAt(0) || '?'}
                                </div>
                            )}
                            <div className="text-left">
                                <div className="font-bold text-gray-800">{student.name}</div>
                                <div className="text-xs text-gray-400">{student.className || '未知班级'}</div>
                            </div>
                        </div>

                        {/* 邀请码 */}
                        <div className="flex justify-between items-center bg-orange-50 px-4 py-3 rounded-lg">
                            <span className="text-xs text-gray-500">邀请码</span>
                            {loading ? (
                                <span className="text-gray-400 animate-pulse">生成中...</span>
                            ) : (
                                <span className="font-mono font-bold text-xl text-orange-600 tracking-widest">
                                    {inviteCode || '----'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 按钮组 */}
                    <div className="mt-6 space-y-3">
                        <button
                            onClick={copyInvite}
                            disabled={!inviteCode || loading}
                            className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all ${copied
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {copied ? (
                                <>
                                    <Check size={18} />
                                    已复制到剪贴板
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    复制邀请信息
                                </>
                            )}
                        </button>

                        <button
                            onClick={copyInvite}
                            disabled={!inviteCode || loading}
                            className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <Copy size={16} />
                            复制邀请码：{inviteCode || '----'}
                        </button>
                    </div>

                    {/* 提示 */}
                    <p className="text-[10px] text-gray-400 text-center mt-4">
                        家长访问 {window.location.origin}/parent/login 输入手机号和邀请码即可绑定
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InviteCardModal;

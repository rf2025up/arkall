import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 家长端 API
const API_BASE = '/api/parent';

interface ParentLoginProps {
    schoolId: string; // 从 URL 或配置获取
}

/**
 * 家长登录/绑定页
 * UI 参考: /parent/邀请和家长绑定.html
 */
const ParentLogin: React.FC<ParentLoginProps> = ({ schoolId }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'bind'>('login');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [studentName, setStudentName] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 登录
    const handleLogin = async () => {
        if (!phone) {
            setError('请输入手机号');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password: password || '0000', schoolId })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '登录失败');
            }

            // 存储 token 和用户信息
            localStorage.setItem('parent_token', data.token);
            localStorage.setItem('parent_info', JSON.stringify(data.parent));
            localStorage.setItem('parent_students', JSON.stringify(data.students));

            // 跳转到今日动态页（带上第一个孩子的ID）
            const firstStudentId = data.students?.[0]?.id;
            if (firstStudentId) {
                navigate(`/parent/timeline/${firstStudentId}`);
            } else {
                setError('未找到绑定的学生，请先绑定孩子');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 绑定孩子
    const handleBind = async () => {
        if (!phone || !inviteCode || !studentName) {
            setError('请输入手机号、孩子姓名和邀请码');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE}/auth/bind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, inviteCode, schoolId, studentName, name })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || '绑定失败');
            }

            // 绑定成功后自动登录
            setMode('login');
            setError('');
            alert(`绑定成功！已绑定学生：${data.student.name}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
            {/* Logo 区域 */}
            <div className="flex-1 flex flex-col justify-center items-center px-8 pt-12">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center text-4xl text-white mb-4">
                    🚀
                </div>
                <h1 className="text-2xl font-bold text-gray-800">星途与伴</h1>
                <p className="text-sm text-gray-500 mt-2">开启孩子的成长数字档案</p>
            </div>

            {/* 表单区域 */}
            <div className="px-8 pb-12">
                <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 p-6 space-y-5">

                    {/* 手机号输入 */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">
                            手机号
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:border-orange-300 focus:bg-white placeholder-gray-300"
                            placeholder="请输入手机号"
                        />
                    </div>

                    {mode === 'login' ? (
                        // 登录模式：密码输入
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">
                                密码
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:border-orange-300 focus:bg-white font-mono tracking-widest text-lg placeholder-gray-300"
                                placeholder="0000"
                                maxLength={4}
                            />
                            <p className="text-[10px] text-gray-400 mt-2 text-right">
                                默认密码：0000
                            </p>
                        </div>
                    ) : (
                        // 绑定模式：孩子姓名、邀请码和您的称呼
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">
                                    孩子姓名
                                </label>
                                <input
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:border-orange-300 focus:bg-white placeholder-gray-300"
                                    placeholder="请输入孩子的姓名"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">
                                    邀请码 (4位数字)
                                </label>
                                <input
                                    type="tel"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:border-orange-300 focus:bg-white font-mono tracking-[0.5em] text-2xl text-center placeholder-gray-300"
                                    placeholder="0000"
                                    maxLength={4}
                                />
                                <p className="text-[10px] text-gray-400 mt-2 text-right">
                                    请向老师获取邀请码
                                </p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase">
                                    您的称呼（可选）
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-800 outline-none transition-all focus:border-orange-300 focus:bg-white placeholder-gray-300"
                                    placeholder="例如：爸爸/妈妈"
                                />
                            </div>
                        </>
                    )}

                    {/* 错误提示 */}
                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* 主按钮 */}
                    <button
                        onClick={mode === 'login' ? handleLogin : handleBind}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-transform mt-4 flex justify-center items-center gap-2 disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="animate-spin">⏳</span>
                        ) : (
                            <>
                                <span>{mode === 'login' ? '开启成长之旅' : '绑定孩子'}</span>
                                <span>→</span>
                            </>
                        )}
                    </button>

                    {/* 切换模式 */}
                    <div className="text-center pt-2">
                        <button
                            onClick={() => {
                                setMode(mode === 'login' ? 'bind' : 'login');
                                setError('');
                            }}
                            className="text-sm text-orange-500 hover:underline"
                        >
                            {mode === 'login' ? '首次使用？通过邀请码绑定孩子' : '已有账号？直接登录'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 底部版本信息 */}
            <div className="text-center text-xs text-gray-300 pb-6">
                ArkOK Family v2.0
            </div>
        </div>
    );
};

export default ParentLogin;

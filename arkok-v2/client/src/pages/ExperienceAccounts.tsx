import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Crown,
    Heart,
    ShieldCheck,
    ArrowRight,
    Sparkles,
    Smartphone,
    Layout,
    GraduationCap,
    Zap,
    Map as MapIcon,
    Share2,
    CheckCircle2,
    Trophy,
    ArrowLeft,
    Target,
    MessageCircle,
    Clock,
    Gamepad2,
    Layers,
    TrendingUp,
    Frown,
    EyeOff,
    BarChart2,
    ClipboardCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 演示数据 ---
const MOCK_MAP_DATA = [
    { subject: '语文', modules: [85, 70, 95, 40, 60, 30, 0, 0], color: 'bg-orange-500' },
    { subject: '数学', modules: [90, 85, 50, 80, 45, 20, 0, 0], color: 'bg-blue-500' },
    { subject: '英语', modules: [100, 90, 80, 70, 60, 50, 40, 20], color: 'bg-green-500' },
];

const MOCK_TIMELINE = [
    { time: '16:30', title: '【数学】备考加餐', desc: '课程：第3单元 混合运算', category: '核心教学法', type: 'TASK', icon: '📝' },
    { time: '17:15', title: '【习惯】作业规范全A', desc: '获得奖励 10 经验', category: '综合成长', type: 'HABIT', icon: '🌱' },
    { time: '18:00', title: '获得「专注小达人」勋章', desc: '今日专注时长突破 60 分钟', category: '荣誉勋章', type: 'BADGE', icon: '🏅' },
];

const ExperienceAccounts = () => {
    const navigate = useNavigate();
    const [activeDemo, setActiveDemo] = useState<string | null>(null);

    // 模拟提示
    const showToast = (msg: string) => {
        const toast = document.createElement('div');
        toast.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/90 backdrop-blur-md text-white px-8 py-4 rounded-3xl shadow-2xl z-[100] font-black text-sm animate-bounce border border-white/10';
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast) }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#FFF8F4] text-[#2D2D2F] font-sans selection:bg-orange-100 selection:text-orange-600 pb-20 overflow-x-hidden">

            {/* 动态背景 */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-100px] right-[-150px] w-[600px] h-[600px] bg-[#FFD194] rounded-full blur-[120px] opacity-30 animate-pulse" />
                <div className="absolute bottom-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#FF9966] rounded-full blur-[120px] opacity-30 animate-pulse delay-700" />
            </div>

            <div className="relative z-10 max-w-[1000px] mx-auto px-6">

                {/* Hero Section */}
                <section className="text-center pt-24 pb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-orange-100/50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-orange-200/50"
                    >
                        <Sparkles size={14} /> 2025 托管机构差异化增长引擎
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent leading-tight tracking-tight"
                    >
                        拒绝同质化竞争<br />打造“看得见”的专业教育服务
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-500 max-w-2xl mx-auto font-medium"
                    >
                        从“催骂吼”的对抗场，到“比学赶超”的竞技场。<br />
                        星途与伴，专为中国托管教育场景设计的行为塑造与服务外化系统。
                    </motion.p>

                    {/* 痛点卡片 */}
                    <div className="grid md:grid-cols-3 gap-6 mt-16 text-left">
                        {[
                            { icon: Frown, title: '班级氛围差', desc: '孩子被动学习，老师靠吼靠催，师生关系紧张。', color: 'bg-red-50 text-red-500' },
                            { icon: EyeOff, title: '家长看不见', desc: '服务过程无形，机构的用心无法被感知。', color: 'bg-orange-50 text-orange-500' },
                            { icon: BarChart2, title: '管理无数据', desc: '任人唯贤，换个老师就像换个机构，质量难标化。', color: 'bg-blue-50 text-blue-500' },
                        ].map((p, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-orange-100/50"
                            >
                                <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center mb-4`}>
                                    <p.icon size={20} />
                                </div>
                                <h4 className="font-black mb-2 text-slate-800">{p.title}</h4>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">{p.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 模块 1: 游戏化积分 (克隆视觉) */}
                <section className="bg-white/95 backdrop-blur-xl rounded-[48px] p-8 md:p-12 mb-12 border border-white/80 shadow-2xl shadow-orange-100/10">
                    <div className="flex flex-col md:flex-row gap-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-orange-500 text-white rounded-3xl shadow-xl shadow-orange-200"><Gamepad2 size={32} /></div>
                                <div>
                                    <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Gamification System</span>
                                    <h2 className="text-3xl font-black">把“枯燥”变成“挑战”</h2>
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                利用“即时反馈”原理，将坐姿、书写、纠错等抽象行为，通过积分与虚拟奖励固化为内在动力。
                            </p>
                            <div className="bg-orange-50/50 border-l-4 border-orange-500 p-6 rounded-2xl mb-8">
                                <div className="flex items-center gap-2 font-black text-orange-700 mb-2">
                                    <Zap size={18} /> 真实案例：计算粗心矫正
                                </div>
                                <p className="text-sm text-orange-900/60 leading-relaxed">
                                    系统发布任务：“连续5天，每天仅做5道题但必须全对”。通过21天接力，将“细心”养成习惯。
                                </p>
                            </div>
                            <ul className="space-y-4">
                                {[
                                    { icon: Trophy, text: '<b>沉浸式PK竞技</b>：古诗、单词一键开启对战' },
                                    { icon: Sparkles, text: '<b>数字化荣誉勋章</b>：比线下奖状反馈更即时' },
                                    { icon: Target, text: '<b>习惯可视化</b>：坐姿书写变成可量化的经验值' },
                                ].map((f, i) => (
                                    <li key={i} className="flex gap-3 text-slate-600 text-sm">
                                        <f.icon size={18} className="text-orange-500 shrink-0" />
                                        <span dangerouslySetInnerHTML={{ __html: f.text }} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-[40px] p-8 border border-slate-100 relative overflow-hidden group">
                            {/* 模拟 PK 场景 */}
                            <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-3xl p-6 text-white shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black opacity-60">LIVE PK ARENA</span>
                                    <div className="px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black animate-pulse">进行中</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20" />
                                            <span className="text-sm font-black text-white">王小明 <span className="opacity-50 text-[10px]">Lv.12</span></span>
                                        </div>
                                        <span className="text-sm font-black">2,480 pts</span>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl border border-white/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white/20" />
                                            <span className="text-sm font-black text-white">李华 <span className="opacity-50 text-[10px]">Lv.10</span></span>
                                        </div>
                                        <span className="text-sm font-black">2,150 pts</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex gap-2">
                                <div className="flex-1 h-20 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                                    <Trophy size={16} className="text-yellow-500 mb-1" />
                                    <span className="text-[10px] font-black">最高连胜</span>
                                </div>
                                <div className="flex-1 h-20 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                                    <Sparkles size={16} className="text-blue-500 mb-1" />
                                    <span className="text-[10px] font-black">即时奖励</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 模块 2: 过关地图 (直接集成 EmpowermentHub 元素) */}
                <section className="bg-white/95 backdrop-blur-xl rounded-[48px] p-8 md:p-12 mb-12 border border-white/80 shadow-2xl shadow-orange-100/10">
                    <div className="flex flex-col md:flex-row-reverse gap-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-blue-500 text-white rounded-3xl shadow-xl shadow-blue-200"><Layers size={32} /></div>
                                <div>
                                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">Service Standardization</span>
                                    <h2 className="text-3xl font-black">把“服务”变成“产品”</h2>
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                托管不只是看管，更是有规划的成长。通过“上帝视角”全校过关地图，将抽象辅导具象化为每一课的进度卡片。
                            </p>
                            <div className="space-y-6">
                                <div className="flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    <MapIcon className="text-blue-500 shrink-0" />
                                    <div>
                                        <div className="text-sm font-black mb-1">全学期数据留痕</div>
                                        <p className="text-xs text-slate-400 font-medium">生词、错题、掌握情况自动汇总，换老师也能无缝衔接。</p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                    <ClipboardCheck className="text-green-500 shrink-0" />
                                    <div>
                                        <div className="text-sm font-black mb-1">一键“点选”式备课</div>
                                        <p className="text-xs text-slate-400 font-medium">老师一秒分发任务，像 Check-list 一样交付高质量教育。</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-900 rounded-[40px] p-8 border border-white/10 shadow-inner overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <span className="text-[10px] font-black text-white/40">SCHOOL PROGRESS MAP</span>
                                <span className="text-[10px] text-green-400 font-black">● LIVE SYNC</span>
                            </div>
                            <div className="space-y-8">
                                {MOCK_MAP_DATA.map((row, idx) => (
                                    <div key={idx} className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-black text-white">{row.subject}</span>
                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Efficiency: 92%</span>
                                        </div>
                                        <div className="flex gap-1.5 h-6">
                                            {row.modules.map((val, mIdx) => (
                                                <motion.div
                                                    key={mIdx}
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: val > 0 ? val / 100 : 0.1 }}
                                                    transition={{ delay: 0.5 + idx * 0.1 + mIdx * 0.05 }}
                                                    className={`flex-1 rounded shadow-sm transition-all ${val > 0 ? row.color : 'bg-white/10'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 模块 3: 今日动态 (克隆 TodayTimeline) */}
                <section className="bg-white/95 backdrop-blur-xl rounded-[48px] p-8 md:p-12 mb-12 border border-white/80 shadow-2xl shadow-orange-100/10">
                    <div className="flex flex-col md:flex-row gap-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-rose-500 text-white rounded-3xl shadow-xl shadow-rose-200"><Smartphone size={32} /></div>
                                <div>
                                    <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Family Connection</span>
                                    <h2 className="text-3xl font-black">深度服务外化</h2>
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed mb-6">
                                破解“家长看不见辛苦”的难题。系统自动生成的成长动态时间轴，是机构最硬核的专业输出。
                            </p>
                            <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100">
                                <h4 className="font-black text-rose-800 text-sm mb-4">给家长的“定心丸”</h4>
                                <p className="text-xs text-rose-900/50 leading-relaxed font-medium">
                                    当家长看到我们也关注错题重练、考前加餐、专注力训练，不仅是看管而是“有规划的成长”，安全感瞬间拉满。
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 flex justify-center py-4">
                            <div className="w-[300px] h-[580px] bg-slate-900 rounded-[50px] border-[10px] border-slate-800 shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center items-end pb-1"><div className="w-16 h-4 bg-black rounded-b-xl" /></div>
                                <div className="bg-white h-full pt-10 px-4 overflow-y-auto">
                                    <div className="flex justify-between items-baseline mb-6 px-2">
                                        <h4 className="font-black text-slate-800 text-sm">今日动态</h4>
                                        <span className="text-[10px] text-slate-400">12月28日</span>
                                    </div>
                                    <div className="relative pl-8 space-y-8">
                                        <div className="absolute left-[7px] top-1 bottom-10 w-0.5 bg-slate-100" />
                                        {MOCK_TIMELINE.map((item, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ x: 20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.8 + i * 0.2 }}
                                                className="relative mb-6"
                                            >
                                                <div className="absolute -left-[30px] top-0 w-4 h-4 rounded-full bg-white border-4 border-orange-500 shadow-sm z-10" />
                                                <div className="text-[10px] font-black text-slate-300 mb-1">{item.time}</div>
                                                <div className="text-[11px] font-black text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs">{item.icon}</span>
                                                        {item.title}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium opacity-80">{item.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 模块 4: 裂变机制 (集成 SchoolConnect/EmpowermentHub) */}
                <section className="bg-white/95 backdrop-blur-xl rounded-[48px] p-8 md:p-12 mb-12 border border-white/80 shadow-2xl shadow-orange-100/10">
                    <div className="flex flex-col md:flex-row-reverse gap-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-4 bg-red-500 text-white rounded-3xl shadow-xl shadow-red-200"><TrendingUp size={32} /></div>
                                <div>
                                    <span className="text-xs font-black text-red-500 uppercase tracking-widest">Viral Growth</span>
                                    <h2 className="text-3xl font-black">让口碑“自动传播”</h2>
                                </div>
                            </div>
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                利用“损失厌恶”心理与晒娃需求。孩子坚持20天的习惯中断了？家长发个助力朋友圈即可复活，顺便为机构背书。
                            </p>
                            <div className="p-6 bg-red-50 rounded-[32px] border border-red-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <Target className="text-red-500" />
                                    <span className="text-sm font-black text-red-800">21天挑战 (第18天)</span>
                                </div>
                                <div className="flex gap-1 h-1.5 mb-4">
                                    {[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0].map((v, i) => (
                                        <div key={i} className={`flex-1 rounded-full ${v ? 'bg-red-500' : 'bg-red-200'}`} />
                                    ))}
                                </div>
                                <button
                                    onClick={() => showToast('已成功模拟生成复活海报！')}
                                    className="w-full py-4 bg-white text-red-500 text-xs font-black rounded-2xl shadow-lg border border-red-100 active:scale-95 transition-all"
                                >
                                    生成复活海报 · 邀请好友助力
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-red-500 rounded-[48px] p-10 text-white text-center flex flex-col justify-center items-center shadow-xl">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                <Heart size={40} fill="white" />
                            </div>
                            <h3 className="text-2xl font-black mb-4">最高级的软广</h3>
                            <p className="text-sm opacity-80 leading-relaxed font-medium">
                                家长转发的是孩子“坚持”的过程，好友点赞的是孩子“努力”的精神。转化率是传统广告的 10 倍以上。
                            </p>
                        </div>
                    </div>
                </section>

                {/* 角色价值区 (克隆视觉) */}
                <section className="py-24 text-center">
                    <h2 className="text-3xl font-black mb-4 tracking-tight">为什么选择星途与伴？</h2>
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest mb-16 underline decoration-orange-500 decoration-2 underline-offset-8">Value Proposition</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: GraduationCap, title: '对孩子', desc: '枯燥作业变挑战\n获取即时正反馈', color: 'bg-orange-50 text-orange-500' },
                            { icon: Crown, title: '对校长', desc: '实时掌握教学进度\n沉淀校区资产', color: 'bg-blue-50 text-blue-500' },
                            { icon: Heart, title: '对家长', desc: '看见服务细节\n感知专业深度', color: 'bg-rose-50 text-rose-500' },
                            { icon: ShieldCheck, title: '对老师', desc: '流程标准高效\n让备课变轻松', color: 'bg-green-50 text-green-500' },
                        ].map((v, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-center group"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${v.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <v.icon size={28} />
                                </div>
                                <h3 className="font-black mb-2 text-slate-800">{v.title}</h3>
                                <p className="text-[10px] text-slate-400 font-bold leading-relaxed whitespace-pre-line text-center">{v.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* CTA (克隆试用页) */}
                <section className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-[56px] p-12 md:p-20 text-center text-white shadow-2xl shadow-orange-100 overflow-hidden relative">
                    <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-white/10 rounded-full blur-3xl" />
                    <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">让每一次教育服务都有回响</h2>
                    <p className="text-lg opacity-80 mb-12 max-w-xl mx-auto font-medium">
                        别让机构的用心被“由于不可见”而埋没。立即体验星途与伴，重塑托管教育的影响力。
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-white text-orange-600 px-12 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                            进入真实系统试用
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                    <p className="mt-12 text-[10px] font-black opacity-40 uppercase tracking-widest italic">© 2025 星途与伴 · 让成长清晰可见</p>
                </section>

            </div>
        </div>
    );
};

export default ExperienceAccounts;

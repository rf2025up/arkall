import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Zap,
    Map,
    Share2,
    Trophy,
    Users,
    CheckCircle2,
    ChevronRight,
    ArrowRight,
    BarChart3,
    Layout,
    Smartphone,
    Sparkles,
    Heart,
    Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmpowermentHub = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('standard');

    // 模拟数据：全学期过关地图
    const progressData = [
        { subject: '语文', modules: [85, 70, 95, 40, 60, 30, 0, 0], color: 'bg-orange-500' },
        { subject: '数学', modules: [90, 85, 50, 80, 45, 20, 0, 0], color: 'bg-blue-500' },
        { subject: '英语', modules: [100, 90, 80, 70, 60, 50, 40, 20], color: 'bg-green-500' },
    ];

    return (
        <div className="min-h-screen bg-[#FFF8F4] text-[#2D2D2F] relative overflow-hidden pb-24">
            {/* 动态背景 Orbs */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-100px] right-[-150px] w-[500px] h-[500px] bg-[#FFD194] rounded-full blur-[100px] opacity-40 animate-pulse" />
                <div className="absolute bottom-[-50px] left-[-100px] w-[400px] h-[400px] bg-[#FF9966] rounded-full blur-[100px] opacity-40 animate-pulse delay-700" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 pt-12">
                {/* Hero Section */}
                <section className="text-center mb-16 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block bg-orange-100/50 text-orange-600 px-4 py-1.5 rounded-full text-sm font-bold border border-orange-200/50 mb-6"
                    >
                        2025 托管机构差异化增长引擎
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent leading-tight"
                    >
                        拒绝同质化竞争<br />打造“看得见”的专业教育
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 max-w-2xl mx-auto"
                    >
                        从“催骂吼”的对抗场，到“比学赶超”的竞技场。让每一次教育服务都有回响，让家长的信任有据可依。
                    </motion.p>
                </section>

                {/* 核心引擎切换 */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                    {[
                        { id: 'standard', label: '标准化交付', icon: Map },
                        { id: 'gamified', label: '游戏化驱动', icon: Zap },
                        { id: 'parent', label: '家长端看板', icon: Smartphone },
                        { id: 'fission', label: '口碑裂变', icon: Share2 },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200 scale-105'
                                    : 'bg-white/80 text-slate-600 hover:bg-white active:scale-95'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 动态内容展示区 */}
                <div className="bg-white/95 backdrop-blur-xl rounded-[40px] p-8 min-h-[500px] border border-white/80 shadow-2xl shadow-orange-100/20">
                    <AnimatePresence mode="wait">
                        {activeTab === 'standard' && (
                            <motion.div
                                key="standard"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid md:grid-cols-2 gap-12"
                            >
                                <div>
                                    <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                                        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl"><Map /></div>
                                        全学期过关地图
                                    </h2>
                                    <p className="text-slate-600 mb-8 leading-relaxed">
                                        托管不只是看管，更是有规划的成长。将抽象的辅导具象化为每一课的进度卡片。
                                        <span className="block mt-4 p-4 bg-orange-50 rounded-2xl border-l-4 border-orange-500 text-sm text-orange-700 font-medium">
                                            "当中途换老师或家长质疑时，这张地图是机构最硬核的数据资产。"
                                        </span>
                                    </p>
                                    <button
                                        onClick={() => navigate('/qc')}
                                        className="flex items-center gap-2 text-orange-500 font-bold group"
                                    >
                                        前往管理过关库 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs font-black text-slate-400">校区进度热力图</span>
                                        <span className="text-xs text-green-500 font-bold">● 本周已更新</span>
                                    </div>
                                    <div className="space-y-8">
                                        {progressData.map((row, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <div className="flex justify-between text-xs font-bold">
                                                    <span className="text-slate-700">{row.subject}</span>
                                                    <span className="text-slate-400">进度: {Math.max(...row.modules)}%</span>
                                                </div>
                                                <div className="flex gap-1.5 h-6">
                                                    {row.modules.map((val, mIdx) => (
                                                        <div
                                                            key={mIdx}
                                                            className={`flex-1 rounded-md transition-all ${val > 0 ? row.color : 'bg-slate-200'
                                                                }`}
                                                            style={{ opacity: val > 0 ? val / 100 : 1 }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'gamified' && (
                            <motion.div
                                key="gamified"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid md:grid-cols-2 gap-12"
                            >
                                <div>
                                    <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Zap /></div>
                                        把枯燥变成挑战
                                    </h2>
                                    <p className="text-slate-600 mb-8 leading-relaxed">
                                        利用“即时反馈”原理，将坐姿、书写、纠错等抽象行为，通过积分与虚拟奖励固化为内在动力。
                                    </p>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 min-w-[140px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                            <Trophy className="mx-auto text-yellow-500 mb-2" />
                                            <div className="text-sm font-black">荣誉成就</div>
                                            <div className="text-[11px] text-slate-400">数字化奖状体系</div>
                                        </div>
                                        <div className="flex-1 min-w-[140px] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
                                            <Sparkles className="mx-auto text-blue-500 mb-2" />
                                            <div className="text-sm font-black">限时挑战</div>
                                            <div className="text-[11px] text-slate-400">比学赶超氛围</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/pk')}
                                        className="mt-8 flex items-center gap-2 text-blue-500 font-bold group"
                                    >
                                        开启竞技对决 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                                <Users size={24} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold opacity-80">当前教研PK活跃</div>
                                                <div className="text-2xl font-black">挑战进行中...</div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <img src="/avatar.jpg" className="w-8 h-8 rounded-full border border-white/30" />
                                                    <span className="font-bold text-sm">小明</span>
                                                </div>
                                                <div className="text-xs font-black px-2 py-1 bg-yellow-500 rounded-lg">Win x3</div>
                                            </div>
                                            <div className="p-4 bg-white/10 rounded-2xl border border-white/20 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <img src="/avatar.jpg" className="w-8 h-8 rounded-full border border-white/30" />
                                                    <span className="font-bold text-sm">小红</span>
                                                </div>
                                                <div className="text-xs font-bold opacity-60">Wait...</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'parent' && (
                            <motion.div
                                key="parent"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid md:grid-cols-2 gap-12"
                            >
                                <div>
                                    <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                                        <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl"><Smartphone /></div>
                                        服务外化：给家长“定心丸”
                                    </h2>
                                    <p className="text-slate-600 mb-8 leading-relaxed">
                                        解决“家长看不见我们的用心”的问题。每一课生字、每一道错题、每一个专注瞬间，都自动生成为精美的成长轨迹。
                                    </p>
                                    <ul className="space-y-4 mb-8 text-sm">
                                        <li className="flex items-center gap-3 text-slate-700">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            每日时间轴动态，沉淀过程性评价
                                        </li>
                                        <li className="flex items-center gap-3 text-slate-700">
                                            <CheckCircle2 size={16} className="text-green-500" />
                                            勋章自动同步，增加家长荣誉参与感
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex justify-center">
                                    <div className="w-[280px] h-[580px] bg-slate-900 rounded-[40px] border-[8px] border-slate-800 shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 flex justify-center items-end pb-1">
                                            <div className="w-16 h-4 bg-black rounded-b-xl" />
                                        </div>
                                        <div className="bg-white h-full pt-10 px-4 space-y-6 overflow-y-auto custom-scrollbar">
                                            <div className="flex justify-between items-baseline mb-4">
                                                <h4 className="font-black text-slate-800">今日成长</h4>
                                                <span className="text-[10px] text-slate-400">2025-12-28</span>
                                            </div>

                                            <div className="relative pl-6 border-l-2 border-orange-100 space-y-8">
                                                <div className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-orange-500 border-4 border-white" />
                                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                        <div className="text-[11px] font-bold text-slate-700">【习惯培养】作业规范全A</div>
                                                        <div className="text-[10px] text-slate-400 mt-1">获得经验 +10</div>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white" />
                                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                        <div className="text-[11px] font-bold text-slate-700">【数学】第三单元备考加餐</div>
                                                        <div className="text-[10px] text-slate-400 mt-1">错题点：混合运算括号优先级</div>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-yellow-500 border-4 border-white" />
                                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                        <div className="text-[11px] font-bold text-slate-700">获得「专注小达人」勋章</div>
                                                        <div className="flex mt-2 gap-1 group">
                                                            <Trophy size={14} className="text-yellow-500" />
                                                            <span className="text-[10px] font-bold">查看证书</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'fission' && (
                            <motion.div
                                key="fission"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid md:grid-cols-2 gap-12"
                            >
                                <div>
                                    <h2 className="text-3xl font-black mb-6 flex items-center gap-3">
                                        <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><Share2 /></div>
                                        挑战复活：口碑裂变引擎
                                    </h2>
                                    <p className="text-slate-600 mb-8 leading-relaxed">
                                        利用“损失厌恶”心理。当孩子21天挑战中断时，家长可以通过转发机构海报获得“助力复活”。
                                        在帮助孩子挽回连续性的同时，为机构完成高信任度的社交裂变。
                                    </p>
                                    <div className="p-6 bg-red-50 rounded-[32px] border border-red-100">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Target className="text-red-500" />
                                            <div className="text-sm font-black text-red-800">21天硬笔书法挑战 (第18天)</div>
                                        </div>
                                        <div className="flex items-center gap-2 mb-4">
                                            {[1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1].map((v, i) => (
                                                <div key={i} className={`h-1.5 flex-1 rounded-full ${v ? 'bg-red-500' : 'bg-red-200'}`} />
                                            ))}
                                        </div>
                                        <div className="bg-white p-4 rounded-2xl text-center shadow-lg shadow-red-200/50">
                                            <div className="text-xs text-slate-400 mb-2">挑战中断！</div>
                                            <div className="text-sm font-black text-slate-800 mb-4">发送海报到朋友圈，获得 3 位好友助力即可“复活”挑战进度。</div>
                                            <button className="bg-red-500 text-white px-6 py-2 rounded-xl text-xs font-bold hover:scale-105 transition-all">生成复活海报</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-6 animate-bounce">
                                        <Heart className="text-red-500" fill="currentColor" />
                                    </div>
                                    <h3 className="text-xl font-black mb-4">不再是“生硬”的广告</h3>
                                    <p className="text-sm text-slate-500">
                                        家长转发的是孩子“坚持”的过程，好友点赞的是孩子“努力”的精神。
                                        这种最高级的软广，转化率是传统传单的 10 倍以上。
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 角色价值总结 */}
                <section className="mt-24 mb-24 text-center">
                    <h2 className="text-3xl font-black mb-12">为什么选择星途与伴？</h2>
                    <div className="grid md:grid-cols-4 gap-6 px-4">
                        {[
                            { icon: 'baby', title: '对孩子', desc: '枯燥作业变挑战\n获取即时正反馈' },
                            { icon: 'user-check', title: '对老师', desc: '标准备课流程\n减少重复沟通' },
                            { icon: 'heart-handshake', title: '对家长', desc: '看见服务细节\n感知专业深度' },
                            { icon: 'crown', title: '对校长', desc: '统揽全局进度\n沉淀校区资产' },
                        ].map((card, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
                            >
                                <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <Layout size={24} /> {/* 此处可以用更具体的图标 */}
                                </div>
                                <h3 className="font-black mb-2">{card.title}</h3>
                                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{card.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="bg-gradient-to-r from-orange-500 to-rose-500 rounded-[48px] p-12 text-center text-white shadow-2xl shadow-orange-200">
                    <h2 className="text-4xl font-black mb-6">让每一次教学服务都有深度</h2>
                    <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
                        别让机构的用心被“由于不可见”而埋没。立即部署品牌赋能中心，重塑托管教育的影响力。
                    </p>
                    <div className="flex justify-center gap-4">
                        <button className="bg-white text-orange-600 px-10 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">
                            立即开启全校看板
                        </button>
                    </div>
                </section>

                <p className="text-center text-slate-400 text-xs py-12">© 2025 星途与伴 · 让成长清晰可见</p>
            </div>
        </div>
    );
};

export default EmpowermentHub;

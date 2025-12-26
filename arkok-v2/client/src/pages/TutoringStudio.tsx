import React, { useState } from 'react';
import {
    GraduationCap,
    Stethoscope,
    Target,
    Sparkles,
    History,
    Save,
    ChevronRight,
    User,
    Brain,
    Zap,
    CheckCircle2,
    Clock,
    ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TutoringStudio: React.FC = () => {
    const navigate = useNavigate();
    const [activeStage, setActiveStage] = useState<'diagnosis' | 'strategy' | 'assessment'>('diagnosis');

    // 模拟当前正在处理的学生
    const currentStudent = {
        name: "王小明",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
        grade: "三年级",
        className: "极客一班",
        recentFocus: "语文中段理解"
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] pb-20">
            {/* 🔮 顶部流光页眉 */}
            <div className="bg-white border-b border-purple-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-purple-50 rounded-full text-purple-600 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
                            <GraduationCap size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">1v1 教学工作坊</h1>
                            <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Tutoring Studio · Expert Edition</p>
                        </div>
                    </div>
                </div>

                <button className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-purple-200 hover:scale-105 active:scale-95 transition-all">
                    <Save size={18} />
                    <span>保存方案</span>
                </button>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-6 mt-6 md:mt-8 flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8">

                {/* 👤 左侧学生详情卡片 (在手机端变为顶部状态条或垂直堆叠) */}
                <div className="col-span-12 md:col-span-3 space-y-4 md:space-y-6">
                    <div className="bg-white rounded-[24px] p-5 md:p-6 shadow-sm border border-gray-100 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-3xl -mr-12 -mt-12" />
                        <div className="relative z-10 flex md:flex-col items-center gap-4 md:gap-0 md:text-center">
                            <div className="w-14 h-14 md:w-20 md:h-20 rounded-full p-1 border-2 border-purple-100 flex-shrink-0">
                                <img src={currentStudent.avatar} alt="" className="w-full h-full rounded-full bg-purple-50" />
                            </div>
                            <div className="flex-1 md:mt-4">
                                <h2 className="font-black text-lg md:text-xl mb-1">{currentStudent.name}</h2>
                                <div className="flex md:justify-center items-center gap-2">
                                    <span className="text-[10px] md:text-[11px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-500 font-bold">{currentStudent.grade}</span>
                                    <span className="text-[10px] md:text-[11px] px-2 py-0.5 bg-purple-50 rounded-full text-purple-600 font-bold">{currentStudent.className}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:block h-px bg-gray-50 w-full my-4" />

                        <div className="hidden md:block space-y-3">
                            <div className="flex items-center gap-2 text-xs">
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-gray-500">最近辅导：2天前</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Brain size={14} className="text-purple-400" />
                                <span className="text-gray-500">薄弱项：{currentStudent.recentFocus}</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block bg-white/50 backdrop-blur-sm rounded-[24px] p-4 border border-white/60">
                        <h3 className="text-xs font-bold text-gray-400 flex items-center gap-2 mb-4 px-2">
                            <History size={14} />
                            历史诊断
                        </h3>
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white p-3 rounded-xl border border-gray-50 shadow-sm hover:border-purple-200 transition-colors cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[11px] font-bold">12月22日 辅导</span>
                                        <ChevronRight size={12} className="text-gray-300 group-hover:text-purple-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 line-clamp-1">解决应用题读题理解问题...</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🧬 右侧核心诊断区域 */}
                <div className="col-span-12 md:col-span-9 space-y-4 md:space-y-6">
                    {/* 阶段切换导航 */}
                    <div className="flex items-center gap-2 md:gap-4 bg-white/40 p-1 md:p-1.5 rounded-2xl border border-white/60 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveStage('diagnosis')}
                            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all ${activeStage === 'diagnosis' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Stethoscope size={16} className="md:w-[18px]" />
                            问题诊断
                        </button>
                        <button
                            onClick={() => setActiveStage('strategy')}
                            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all ${activeStage === 'strategy' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Target size={16} className="md:w-[18px]" />
                            讲解方案
                        </button>
                        <button
                            onClick={() => setActiveStage('assessment')}
                            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-bold text-xs md:text-sm transition-all ${activeStage === 'assessment' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <CheckCircle2 size={16} className="md:w-[18px]" />
                            执行评估
                        </button>
                    </div>

                    {/* 内容面板 */}
                    <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-gray-100 min-h-[400px] md:min-h-[500px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-30" />

                        {activeStage === 'diagnosis' && (
                            <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-tighter mb-3 md:mb-4 block">1. 核心问题主诉 Diagnosis</label>
                                    <textarea
                                        className="w-full h-24 md:h-32 bg-purple-50/30 border-2 border-transparent focus:border-purple-100 focus:bg-white rounded-2xl p-4 text-sm font-medium transition-all outline-none"
                                        placeholder="例如：王小明在阅读理解中，无法准确提取作者的次要论点..."
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-tighter mb-3 md:mb-4 block">2. 根源诱因分析 Root Cause</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                        {['基础不扎实', '逻辑跳跃', '专注度波动', '情绪性抗拒', '策略不当', '其他'].map(tag => (
                                            <div key={tag} className="flex items-center gap-3 p-3 md:p-4 border border-gray-100 rounded-xl md:rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors group">
                                                <div className="w-5 h-5 rounded-md border-2 border-gray-200 group-hover:border-purple-400 transition-colors" />
                                                <span className="text-sm font-bold text-gray-600">{tag}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeStage === 'strategy' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-3xl border border-purple-50">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                            <Sparkles className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-indigo-900">核心教学法匹配</h4>
                                            <p className="text-xs text-indigo-400/80">根据诊断结果自动推荐</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex flex-wrap gap-3">
                                        {['分步拆解法', 'Socratic 启发式', '双色笔修正法', '可视化思维导图'].map((m, i) => (
                                            <button key={m} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${i === 0 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-indigo-100 text-indigo-400'}`}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-tighter mb-4 block">教学处方录入 Instruction Prescription</label>
                                    <div className="bg-gray-50 rounded-3xl p-6 border border-dashed border-gray-200">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Zap size={16} className="text-orange-400" />
                                            <span className="text-xs font-bold text-gray-400">分步步骤</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black">1</span>
                                                <input className="flex-1 bg-transparent border-b border-gray-200 py-1 text-sm outline-none font-medium" placeholder="第一步：引导孩子找出关键词..." />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black">2</span>
                                                <input className="flex-1 bg-transparent border-b border-gray-200 py-1 text-sm outline-none font-medium" placeholder="第二步：..." />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeStage === 'assessment' && (
                            <div className="flex flex-col items-center justify-center h-full py-12 animate-in zoom-in-95 duration-500">
                                <div className="relative mb-8">
                                    <div className="w-40 h-40 rounded-full border-[10px] border-purple-50 flex items-center justify-center">
                                        <div className="text-center">
                                            <span className="text-5xl font-black text-purple-600 tracking-tighter">80</span>
                                            <span className="text-xs font-bold text-purple-400 block">%已达成</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 p-3 bg-white rounded-2xl shadow-xl border border-purple-100">
                                        <Sparkles className="text-yellow-400" />
                                    </div>
                                </div>

                                <h3 className="font-black text-xl mb-4">设定此次辅导的达成度</h3>
                                <div className="flex gap-4">
                                    {['理解完全', '基本掌握', '尚需复练'].map((s, i) => (
                                        <button key={s} className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${i === 1 ? 'bg-purple-600 text-white' : 'bg-white border border-gray-100 text-gray-400'}`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutoringStudio;

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Swords, Target, CheckCircle2, XCircle, Award, Rocket, Zap, TrendingUp, Star, Layout } from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';

// 类型定义
interface Student {
    id: string;
    name: string;
    avatarUrl?: string;
    level: number;
    exp: number;
    expProgress: number;
    expForNextLevel: number;
    points: number;
    rank: number;
}

interface PKResult {
    id: string;
    winner: { id: string; name: string; avatarUrl?: string; score: number };
    loser: { id: string; name: string; avatarUrl?: string; score: number };
    topic: string;
    finishedAt: string;
    rewardPoints?: number;
    rewardExp?: number;
}

interface ChallengeResult {
    id: string;
    studentName: string;
    title: string;
    success: boolean;
    expAwarded: number;
    finishedAt: string;
}

interface ActivityItem {
    id: string;
    type: 'habit' | 'badge' | 'challenge' | 'pk' | 'progress' | 'methodology' | 'growth' | 'personalized' | 'special' | 'task';
    studentName: string;
    content: string;
    expAwarded: number;
    timestamp: string;
}

interface BadgeItem {
    id: string;
    badgeName: string;
    badgeIcon: string;
    badgeDescription: string;
    studentName: string;
    earnedAt: string;
}

interface BigscreenData {
    schoolName?: string;
    taskCompletionRate: number;
    students: Student[];
    pkResults: PKResult[];
    challengeResults: ChallengeResult[];
    activities: ActivityItem[];
    publicBounties?: { title: string, points: number, exp: number }[];
    recentBadges: BadgeItem[];
    recentSkillUps?: {
        studentName: string;
        skillCode: string;
        skillName: string;
        level: number;
        levelTitle: string;
    }[];
}

// CSS 样式
const styles = `
  .glass-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
  .text-glow-gold { text-shadow: 0 0 12px rgba(253, 224, 71, 0.6); }
  .progress-bar-striped {
    background-image: linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent);
    background-size: 1rem 1rem;
    animation: stripes 1s linear infinite;
  }
  @keyframes stripes { 0% { background-position: 1rem 0; } 100% { background-position: 0 0; } }
  .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
  @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 10px #22c55e; } 50% { box-shadow: 0 0 20px #22c55e; } }
  .lv-tag-gold {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 900;
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: inline-flex;
    align-items: center;
    line-height: 1;
    margin-left: 6px;
  }
`;

// 内容限制
// 移除静态 LIMITS，改用组件内部动态 limits

const DataDashboard: React.FC = () => {
    const [data, setData] = useState<BigscreenData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [scrollIndex, setScrollIndex] = useState(0);
    const [pkIndex, setPkIndex] = useState(0);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);
    const [recentAchievements, setRecentAchievements] = useState<any[]>([]);

    useEffect(() => {
        const socket = io();

        socket.on('connect', () => console.log('✅ BigScreen Socket Connected'));

        socket.on('skill_levelup', (data) => {
            console.log('🎉 Achievement:', data);
            setRecentAchievements(prev => [data, ...prev].slice(0, 3));
        });

        return () => { socket.disconnect(); };
    }, []);

    // 动态限额
    const limits = {
        VISIBLE_STUDENTS: windowHeight < 900 ? 6 : windowHeight < 1200 ? 8 : 12,
        ACTIVITIES: windowHeight < 900 ? 8 : windowHeight < 1200 ? 12 : 20,
        BOUNTIES: windowHeight < 900 ? 4 : windowHeight < 1200 ? 5 : 8,
    };

    useEffect(() => {
        const handleResize = () => setWindowHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [searchParams] = useSearchParams();
    const schoolId = searchParams.get('schoolId');

    const fetchData = useCallback(async () => {
        try {
            const url = schoolId ? `/dashboard/bigscreen?schoolId=${schoolId}` : '/dashboard/bigscreen';
            const response = await apiService.get<BigscreenData>(url);
            if (response.success && response.data) setData(response.data);
        } catch (err) {
            console.error('[DataDashboard] Error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [schoolId]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // 同步历史数据
    useEffect(() => {
        if (data?.recentSkillUps) {
            setRecentAchievements(data.recentSkillUps.slice(0, 4));
        }
    }, [data]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 循环展示学生
    useEffect(() => {
        if (!data || data.students.length <= limits.VISIBLE_STUDENTS) return;
        const timer = setInterval(() => {
            setScrollIndex(prev => {
                const maxIndex = Math.max(0, data.students.length - limits.VISIBLE_STUDENTS);
                return prev >= maxIndex ? 0 : prev + 5;
            });
        }, 4000);
        return () => clearInterval(timer);
    }, [data, limits.VISIBLE_STUDENTS]);

    // PK 结果循环展示
    useEffect(() => {
        if (!data || data.pkResults.length <= 1) return;
        const timer = setInterval(() => {
            setPkIndex(prev => (prev + 1) % data.pkResults.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [data]);

    if (isLoading && !data) {
        return (
            <div className="h-screen w-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const displayedStudents = data?.students.slice(scrollIndex, scrollIndex + limits.VISIBLE_STUDENTS) || [];
    const currentPK = data?.pkResults[pkIndex];

    return (
        <>
            <style>{styles}</style>
            <div
                className="h-screen w-screen flex flex-col p-4 gap-4 overflow-hidden text-white"
                style={{
                    backgroundColor: '#0F172A',
                    backgroundImage: `
          radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),
          radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%),
          radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%)
        `,
                    fontFamily: "'SF Pro Display', system-ui, sans-serif"
                }}>
                <div className="h-full flex flex-col gap-4">

                    {/* 顶部导航栏 */}
                    <header className="flex justify-between items-center shrink-0 h-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">星途成长方舟 · {data?.schoolName || '加载中'}</h1>
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">LIVE CONNECTED</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-3 border border-white/20">
                                <div className="text-xl font-black font-mono text-white">
                                    {currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="w-[1px] h-4 bg-white/20" />
                                <div className="text-sm font-medium text-slate-300 whitespace-nowrap">
                                    {currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* 主要内容区 */}
                    <main className="flex-1 grid grid-cols-12 gap-4 min-h-0">

                        {/* 左侧：等级天梯 */}
                        <div className="col-span-3 glass-card rounded-3xl p-4 flex flex-col min-h-0">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-base font-bold flex items-center gap-2 text-glow-gold">
                                    <Trophy className="text-yellow-400 w-4 h-4" /> 等级天梯
                                </h2>
                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
                                    共 {data?.students.length || 0} 人
                                </span>
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                {/* 冠军常驻面板 - 压缩版 */}
                                {data?.students[0] && (
                                    <div className="mb-2 text-center">
                                        <div className="relative inline-block">
                                            {/* 皇冠图标 */}
                                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                                <span className="text-2xl">👑</span>
                                            </div>
                                            {/* 大头像 */}
                                            <div className="w-20 h-20 rounded-full border-3 border-yellow-500/50 p-0.5 bg-slate-900 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                                                <img
                                                    src={data.students[0].avatarUrl || "/avatar.jpg"}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                            {/* 排名装饰 */}
                                            <div className="absolute -bottom-1 right-0 bg-yellow-500 text-slate-900 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900">
                                                01
                                            </div>
                                        </div>
                                        <h3 className="text-base font-bold mt-2 tracking-wide text-white">
                                            {data.students[0].name}
                                            <span className="lv-tag-gold">Lv.{data.students[0].level}</span>
                                        </h3>

                                        {/* 冠军等级经验进度 */}
                                        <div className="mt-2 px-6">
                                            <div className="flex justify-between text-[9px] mb-0.5">
                                                <span className="text-slate-400 font-bold">等级经验值</span>
                                                <span className="text-blue-400 font-mono">{data.students[0].expProgress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                                                    style={{ width: `${data.students[0].expProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex-1 space-y-2 overflow-hidden mt-2">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={scrollIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.5 }}
                                            className="space-y-2"
                                        >
                                            {(() => {
                                                // 跳过第一名，从第2名开始循环展示
                                                const restStudents = data?.students.slice(1) || [];
                                                const displayCount = 5; // 每次显示5个学生，确保完整显示
                                                const startIdx = scrollIndex % Math.max(1, restStudents.length);
                                                const displayStudents = [];
                                                for (let i = 0; i < Math.min(displayCount, restStudents.length); i++) {
                                                    displayStudents.push(restStudents[(startIdx + i) % restStudents.length]);
                                                }
                                                return displayStudents.map((student, i) => (
                                                    <div
                                                        key={student.id}
                                                        className="flex items-center gap-3 group"
                                                    >
                                                        {/* 排名序号 */}
                                                        <div className="font-mono text-sm font-bold text-slate-500 w-5">
                                                            {String(student.rank).padStart(2, '0')}
                                                        </div>

                                                        {/* 小头像 */}
                                                        <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden border border-white/10">
                                                            <img
                                                                src={student.avatarUrl || "/avatar.jpg"}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>

                                                        {/* 信息区 */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-end mb-1">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="font-bold text-sm text-slate-100 truncate">{student.name}</span>
                                                                    <span className="lv-tag-gold scale-90 origin-left">Lv.{student.level}</span>
                                                                </div>
                                                                <span className="text-[11px] font-mono font-bold text-cyan-400">
                                                                    积分 {student.points.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            {/* 亮蓝色经验条 */}
                                                            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                                                <div
                                                                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] rounded-full animate-pulse-subtle"
                                                                    style={{ width: `${student.expProgress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* 中间区域 */}
                        <div className="col-span-6 flex flex-col gap-4">
                            {/* PK 竞技场 - 大头像循环展示 */}
                            <div className="flex-[2] glass-card rounded-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 to-blue-600/30 z-0" />
                                <div className="relative z-10 h-full flex flex-col p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm font-bold text-red-400 uppercase flex items-center gap-2">
                                            <Swords className="w-4 h-4" /> 巅峰对决
                                        </div>
                                        <div className="text-xs font-mono text-slate-400">今日 {data?.pkResults.length || 0} 场</div>
                                    </div>

                                    {/* PK 大头像展示 */}
                                    <div className="flex-1 flex items-center justify-center">
                                        {!currentPK ? (
                                            <div className="text-slate-500">暂无 PK 记录</div>
                                        ) : (
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={pkIndex}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    className="flex items-center justify-between w-full px-8"
                                                >
                                                    <div className="flex flex-col items-center flex-1">
                                                        <div className="relative">
                                                            {/* 胜利皇冠 */}
                                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">
                                                                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                                                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                                                                </svg>
                                                            </div>
                                                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                                                                <img src={currentPK.winner.avatarUrl || '/avatar.jpg'} className="w-full h-full object-cover" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 font-bold text-base text-slate-100 text-center">{currentPK.winner.name}</div>
                                                    </div>

                                                    {/* VS */}
                                                    <div className="flex flex-col items-center px-4">
                                                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 italic">VS</div>
                                                        <div className="text-xs font-bold text-slate-300 mt-1">{currentPK.topic}</div>

                                                        {/* PK 奖励 - 横向呈现 */}
                                                        <div className="mt-3 flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                                                            <div className="flex items-center gap-1 text-[10px] font-black text-yellow-500">
                                                                <span>⭐</span> 积分 {currentPK.rewardPoints || 100}
                                                            </div>
                                                            <div className="w-px h-3 bg-white/10" />
                                                            <div className="flex items-center gap-1 text-[10px] font-black text-blue-400">
                                                                <span>⚡</span> 经验 {currentPK.rewardExp || 50}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-center flex-1">
                                                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-700/50 shadow-lg opacity-60 grayscale-[0.5]">
                                                            <img src={currentPK.loser.avatarUrl || '/avatar.jpg'} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="mt-2 font-bold text-base text-slate-400 opacity-70 text-center">{currentPK.loser.name}</div>
                                                    </div>
                                                </motion.div>
                                            </AnimatePresence>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 挑战悬赏榜 - 核心信息公示区 */}
                            <div className="flex-[3] glass-card rounded-2xl p-5 flex flex-col border border-yellow-500/20 bg-gradient-to-b from-yellow-500/5 to-transparent">
                                <div className="flex justify-center items-center mb-4">
                                    <h2 className="text-lg font-black flex items-center gap-3 text-yellow-400 tracking-wide">
                                        <Target className="w-6 h-6" /> 本周悬赏令
                                    </h2>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                                    {(data?.publicBounties || []).length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-3xl mb-3">🎯</div>
                                            <div className="text-slate-400 text-sm">暂无全班悬赏任务</div>
                                            <div className="text-slate-600 text-xs mt-1">教师可在挑战页发布公开悬赏</div>
                                        </div>
                                    ) : (
                                        <div className="w-full space-y-4 overflow-y-auto px-4 custom-scrollbar">
                                            {data?.publicBounties.slice(0, limits.BOUNTIES).map((bounty, idx) => (
                                                <div
                                                    key={idx}
                                                    className="group relative p-5 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 hover:border-yellow-400/50 transition-all text-center shadow-lg hover:shadow-yellow-500/10"
                                                >
                                                    {/* 序号徽章 */}
                                                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-black text-sm shadow-lg">
                                                        {idx + 1}
                                                    </div>

                                                    {/* 悬赏标题 */}
                                                    <div className="text-xl font-black text-white mb-3 tracking-wide">
                                                        {bounty.title}
                                                    </div>

                                                    {/* 奖励信息 */}
                                                    <div className="flex justify-center gap-6 text-sm font-bold">
                                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-500/30">
                                                            <span className="text-yellow-400">⭐</span>
                                                            <span className="text-yellow-300">积分 +{bounty.points}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30">
                                                            <span className="text-blue-400">⚡</span>
                                                            <span className="text-blue-300">经验 +{bounty.exp}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 右侧区域：实时动态与成就达成 */}
                        <div className="col-span-3 flex flex-col gap-4 min-h-0">
                            {/* 实时动态 - 上半部分 (70%) */}
                            <div className="flex-[7] glass-card rounded-2xl p-4 flex flex-col min-h-0">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-base font-bold flex items-center gap-2">
                                        <Zap className="text-purple-400 w-5 h-5" /> 实时动态
                                    </h2>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                                        <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase">Live</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                                    {(data?.activities || [])
                                        .filter(a => ['habit', 'methodology', 'growth', 'progress', 'challenge'].includes(a.type))
                                        .slice(0, limits.ACTIVITIES)
                                        .map(activity => {
                                            const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string; textColor: string }> = {
                                                habit: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: '习惯打卡', textColor: 'text-yellow-400' },
                                                methodology: { icon: <Zap className="w-4 h-4" />, color: 'text-red-400', bg: 'bg-red-500/20', label: '核心教学法', textColor: 'text-red-400' },
                                                growth: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/20', label: '综合成长', textColor: 'text-blue-400' },
                                                progress: { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-400', bg: 'bg-green-500/20', label: '阅读记录', textColor: 'text-green-400' },
                                                challenge: { icon: <Target className="w-4 h-4" />, color: 'text-purple-400', bg: 'bg-purple-500/20', label: '挑战判定', textColor: 'text-purple-400' },
                                            };
                                            const config = typeConfig[activity.type] || { icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-slate-400', bg: 'bg-slate-500/20', label: '任务', textColor: 'text-slate-400' };
                                            const timeStr = activity.timestamp ? new Date(activity.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '';
                                            return (
                                                <div key={activity.id} className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div className={`w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center ${config.bg} ${config.color}`}>
                                                        {config.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="text-xs font-bold text-slate-100">{activity.studentName}</span>
                                                            <span className="text-[9px] text-slate-500 font-mono">{timeStr}</span>
                                                        </div>
                                                        <div className={`text-[11px] leading-relaxed ${config.textColor} font-medium line-clamp-2`}>
                                                            {activity.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* 成就达成 - 下半部分 (30%) - 样式预留 */}
                            <div className="flex-[3] glass-card rounded-2xl p-4 flex flex-col min-h-0 border-t border-yellow-500/10">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-sm font-bold flex items-center gap-2 text-yellow-500/80">
                                        <Award className="w-4 h-4" /> 成就达成
                                    </h2>
                                    <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase italic">Upcoming</span>
                                </div>

                                <div className="flex-1 w-full overflow-hidden flex flex-col gap-2">
                                    {recentAchievements.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/5 rounded-xl bg-black/20">
                                            <Star className="w-6 h-6 text-slate-700 animate-pulse" />
                                            <span className="text-[10px] text-slate-600 font-bold tracking-widest">等待成就触发...</span>
                                        </div>
                                    ) : (
                                        <AnimatePresence>
                                            {recentAchievements.map((ach) => (
                                                <motion.div
                                                    key={`${ach.studentId}-${ach.skillCode}-${ach.level}`}
                                                    layout
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-2 rounded-xl flex items-center gap-3"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-slate-900 border border-yellow-500/50 flex items-center justify-center text-xs text-yellow-500 font-bold shrink-0">
                                                        {ach.skillName?.[0]}
                                                    </div>
                                                    <div className="min-w-0 flex-1 flex items-center gap-2">
                                                        <span className="text-xs font-bold text-yellow-200 shrink-0">{ach.studentName}</span>
                                                        <span className="text-[10px] text-yellow-500/80 truncate flex-1">
                                                            点亮 {ach.skillName} · {ach.levelTitle}
                                                        </span>
                                                        <span className="text-[10px] bg-yellow-500 text-black px-1 rounded font-black shrink-0">Lv.{ach.level}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* 底部勋章轮播 - 优化版本 */}
                    <footer className="h-44 shrink-0 overflow-hidden mt-1 relative border-t border-yellow-500/20">
                        {/* 左右渐变遮罩 - 更宽更柔和的多层渐变 */}
                        <div className="absolute top-0 left-0 w-48 h-full bg-gradient-to-r from-[#0F172A] via-[#0F172A]/60 to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-[#0F172A] via-[#0F172A]/60 to-transparent z-10 pointer-events-none" />

                        <div className="h-full flex items-stretch">
                            {/* 标题 - 垂直排列 */}
                            <div className="flex flex-col items-center justify-center gap-1 px-3 shrink-0 z-20 border-r border-yellow-500/10">
                                <Award className="w-5 h-5 text-yellow-400" />
                                <div className="flex flex-col items-center text-yellow-400/90 font-bold text-xs tracking-widest">
                                    <span>勋</span>
                                    <span>章</span>
                                    <span>荣</span>
                                    <span>誉</span>
                                    <span>墙</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden h-full flex items-center">
                                {data?.recentBadges && data.recentBadges.length > 0 ? (
                                    <motion.div
                                        className="flex gap-6 px-8"
                                        animate={{ x: ['0%', '-50%'] }}
                                        transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
                                    >
                                        {[...(data.recentBadges), ...(data.recentBadges)].map((badge, i) => (
                                            <div
                                                key={`${badge.id}-${i}`}
                                                className="relative w-80 h-40 flex-shrink-0 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border border-yellow-500/25 rounded-2xl shadow-xl p-4 flex gap-4 overflow-hidden hover:border-yellow-500/50 transition-all"
                                            >
                                                {/* 左侧: 头像 + 姓名 */}
                                                <div className="flex flex-col items-center shrink-0">
                                                    <div className="w-16 h-16 rounded-full border-2 border-yellow-400/70 p-0.5 bg-slate-900 shadow-lg">
                                                        <img
                                                            src="/avatar.jpg"
                                                            alt={badge.studentName}
                                                            className="w-full h-full rounded-full object-cover"
                                                            onError={(e) => (e.currentTarget.src = '/avatar.jpg')}
                                                        />
                                                    </div>
                                                    <h3 className="text-xs font-bold text-slate-100 mt-2 text-center">{badge.studentName}</h3>
                                                </div>

                                                {/* 右侧: 勋章信息 */}
                                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                                    <div>
                                                        <p className="text-sm font-bold text-yellow-400 truncate">{badge.badgeName}</p>
                                                        <p className="text-[11px] text-slate-300 mt-2 line-clamp-3 leading-relaxed">{badge.badgeDescription}</p>
                                                    </div>
                                                    <p className="text-[9px] text-slate-500 text-right">加冕于 {new Date(badge.earnedAt).toLocaleDateString('zh-CN')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="flex items-center justify-center text-slate-500 w-full h-full text-sm italic">暂无勋章加冕记录</div>
                                )}
                            </div>
                        </div>
                    </footer>
                </div >
            </div >
        </>
    );
};

export default DataDashboard;

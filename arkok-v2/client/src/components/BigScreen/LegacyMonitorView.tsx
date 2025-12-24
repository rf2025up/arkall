import React, { useState, useEffect, useCallback } from 'react';
import { Crown, Trophy, Target, Users, Activity, Sparkles, TrendingUp } from 'lucide-react';
import { API, apiService } from '../../services/api.service';
import { motion, AnimatePresence } from 'framer-motion';

interface Student {
  id: string;
  name: string;
  className: string;
  level: number;
  points: number;
  exp: number;
  avatarUrl?: string;
  teamId?: string;
}

interface PKMatch {
  id: string;
  playerA: {
    id: string;
    name: string;
    className: string;
    avatarUrl?: string;
  };
  playerB: {
    id: string;
    name: string;
    className: string;
    avatarUrl?: string;
  };
  topic: string;
  status: string;
  createdAt: string;
}

interface Challenge {
  id: string;
  title: string;
  description?: string;
  type: string;
  expAwarded: number;
  student: {
    id: string;
    name: string;
    className: string;
    avatarUrl?: string;
  };
  submittedAt: string;
}

interface DashboardData {
  schoolStats: {
    totalStudents: number;
    totalPoints: number;
    totalExp: number;
  };
  topStudents: Student[];
  ongoingPKs: PKMatch[];
  recentChallenges: Challenge[];
  recentActivities: any[];
}

interface LegacyMonitorViewProps {
  schoolId: string;
}

const LegacyMonitorView: React.FC<LegacyMonitorViewProps> = ({ schoolId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // 获取数据逻辑 - 接入 SWR 渲染心智
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      console.log(`[SWR] LegacyMonitorView: Loading data (force: ${forceRefresh})`);

      // 使用带缓存的请求
      const response = await apiService.get<DashboardData>('/dashboard',
        { schoolId },
        { useCache: !forceRefresh }
      );

      if (response.success && response.data) {
        setDashboardData(response.data);
        setError(null);
        setLastRefreshed(new Date());

        // 如果是从缓存返回的，静默发起一个后台刷新
        if ((response as any)._fromCache) {
          console.log("[SWR] ⚡ Rendering from cache, revalidating in background...");
          loadDashboardData(true);
        }
      } else {
        throw new Error(response.message || "数据加载异常");
      }
    } catch (error) {
      console.error('[FIX] LegacyMonitorView error:', error);
      const errorMessage = error instanceof Error ? error.message : "连接服务失败";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [schoolId]);

  useEffect(() => {
    loadDashboardData();
    // 保持 15 秒一轮的后台同步（配合 SWR 无感更新）
    const interval = setInterval(() => loadDashboardData(true), 15000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  if (isLoading && !dashboardData) {
    return (
      <div className="h-screen bg-[#0F172A] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full mb-6"
        />
        <div className="text-orange-100/60 font-medium tracking-widest animate-pulse">
          INITIALIZINGGrowth RIVER...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0f1d] text-white p-6 flex flex-col overflow-hidden relative font-sans">
      {/* 氛围背景装饰 */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-orange-600/10 blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-600/10 blur-[120px] -z-10 pointer-events-none" />

      {/* Header - V5 "流光" 规范 */}
      <header className="flex items-center justify-between mb-8 flex-shrink-0">
        <div className="flex flex-col">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-5xl font-black tracking-tighter italic"
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-600">
              ARKOK GROWTH STREAM
            </span>
          </motion.h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/30 text-[10px] font-bold text-orange-400 uppercase tracking-tighter">
              Real-time Intelligence
            </div>
            <span className="text-slate-500 text-xs font-medium">
              Last Synced: {lastRefreshed.toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Global Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              <span className="text-sm font-bold text-slate-300 tracking-tight">V5.1 LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Dashboard - V5 智简风格 */}
      <div className="grid grid-cols-3 gap-6 mb-8 flex-shrink-0">
        {[
          { label: '探索者总数', value: dashboardData?.schoolStats.totalStudents, icon: Users, color: 'from-blue-500 to-cyan-400' },
          { label: '累积成长点', value: dashboardData?.schoolStats.totalPoints, icon: Trophy, color: 'from-orange-500 to-amber-400' },
          { label: '智慧经验值', value: dashboardData?.schoolStats.totalExp, icon: Target, color: 'from-purple-600 to-pink-500' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative group overflow-hidden bg-slate-800/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all"
          >
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color} opacity-60`} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                <p className="text-4xl font-black tracking-tighter text-white">
                  {stat.value?.toLocaleString()}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} p-[1px]`}>
                <div className="w-full h-full rounded-2xl bg-[#0a0f1d] flex items-center justify-center">
                  <stat.icon className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Grid - Ranking vs Activities */}
      <main className="grid grid-cols-12 gap-8 flex-grow min-h-0">
        {/* Left: Leaderboard (7 cols) */}
        <div className="col-span-12 lg:col-span-7 h-full min-h-0">
          <div className="bg-slate-800/20 backdrop-blur-xl border border-white/5 rounded-[40px] flex flex-col h-full overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <TrendingUp className="text-orange-500 w-8 h-8" />
                巅峰精英榜
              </h2>
              <div className="text-slate-500 text-xs font-bold uppercase italic tracking-widest">
                Top 10 Pioneers
              </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar px-6 py-4">
              <AnimatePresence mode="popLayout">
                {dashboardData?.topStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-5 p-5 mb-3 rounded-3xl transition-all ${index === 0 ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-white/5 hover:bg-white/10'
                      }`}
                  >
                    {/* Rank Identity */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${index === 0 ? 'bg-gradient-to-br from-orange-400 to-red-600 text-white shadow-lg shadow-orange-500/40' :
                          index === 1 ? 'bg-slate-200 text-slate-800' :
                            index === 2 ? 'bg-amber-700 text-white' :
                              'bg-slate-800 text-slate-400'
                        }`}>
                        {index + 1}
                      </div>
                      {index === 0 && (
                        <motion.div
                          animate={{ y: [-2, 2, -2] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
                        >
                          👑
                        </motion.div>
                      )}
                    </div>

                    <img
                      src={student.avatarUrl || '/avatar.jpg'}
                      className="w-16 h-16 rounded-full border-2 border-slate-700 object-cover"
                      alt=""
                    />

                    <div className="flex-grow">
                      <div className="text-xl font-black tracking-tight">{student.name}</div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{student.className}</div>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-black tracking-tighter ${index === 0 ? 'text-orange-400' : 'text-slate-200'}`}>
                        {student.points}
                      </div>
                      <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Point Units</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Social Stream (5 cols) */}
        <div className="col-span-12 lg:col-span-5 h-full min-h-0">
          <div className="bg-slate-800/20 backdrop-blur-xl border border-white/5 rounded-[40px] flex flex-col h-full overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <Sparkles className="text-cyan-400 w-8 h-8" />
                成长波动
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                <span className="text-slate-500 text-[10px] font-black tracking-widest uppercase">Live Stream</span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
              {/* PK Section */}
              {dashboardData?.ongoingPKs.length ? (
                <div className="space-y-3">
                  <div className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Active Duels</div>
                  {dashboardData.ongoingPKs.map(pk => (
                    <motion.div
                      key={pk.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-20"><Activity className="w-8 h-8" /></div>
                      <div className="text-sm font-bold text-indigo-400 mb-4 tracking-tight px-2 py-0.5 rounded bg-indigo-500/10 inline-block uppercase italic">
                        {pk.topic}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col items-center gap-2 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-lg font-black">{pk.playerA.name.charAt(0)}</div>
                          <span className="text-xs font-bold truncate w-full text-center">{pk.playerA.name}</span>
                        </div>
                        <div className="text-3xl font-black italic text-white/20 select-none">VS</div>
                        <div className="flex flex-col items-center gap-2 flex-1">
                          <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center text-lg font-black">{pk.playerB.name.charAt(0)}</div>
                          <span className="text-xs font-bold truncate w-full text-center">{pk.playerB.name}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : null}

              {/* Recent Accomplishments */}
              <div className="space-y-3 mt-6">
                <div className="px-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Latest Achievements</div>
                {dashboardData?.recentChallenges.map(ch => (
                  <motion.div
                    key={ch.id}
                    className="bg-green-500/5 border border-green-500/20 rounded-3xl p-5 flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                      <Trophy size={28} />
                    </div>
                    <div>
                      <div className="text-lg font-black tracking-tight leading-tight">{ch.title}</div>
                      <div className="text-xs font-bold text-slate-500 mt-1">
                        <span className="text-green-400">{ch.student.name}</span> • {ch.student.className}
                      </div>
                      <div className="mt-2 text-[10px] font-black text-slate-400 bg-white/5 inline-block px-2 py-0.5 rounded uppercase">
                        Rewarded +{ch.expAwarded} EXP
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {(!dashboardData?.ongoingPKs.length && !dashboardData?.recentChallenges.length) && (
                <div className="h-40 flex flex-col items-center justify-center text-slate-600">
                  <Activity className="w-10 h-10 mb-3 opacity-20" />
                  <span className="text-xs font-bold italic tracking-widest uppercase">Waiting for new breakthroughs...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 底部状态条 */}
      <footer className="mt-6 flex items-center justify-between px-6 py-4 bg-white/5 rounded-3xl border border-white/5 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">School ID</span>
            <span className="text-xs font-bold text-slate-300 tracking-tight italic underline decoration-orange-500/50">{schoolId}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">ArkOK Engine Powered</span>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white font-black text-[10px]">V5</div>
        </div>
      </footer>

      {/* 错误提示层 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-10 left-10 right-10 z-50 bg-red-600 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">⚠️</div>
              <div>
                <div className="font-black text-sm uppercase italic">Datalink Error</div>
                <div className="text-xs font-medium text-white/80">{error}</div>
              </div>
            </div>
            <button
              onClick={() => { setError(null); loadDashboardData(true); }}
              className="px-6 py-2 bg-white text-red-600 rounded-2xl font-black text-xs uppercase"
            >
              Re-Establish
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LegacyMonitorView;
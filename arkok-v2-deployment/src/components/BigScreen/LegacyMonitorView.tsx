import React, { useState, useEffect } from 'react';
import { Crown, Trophy, Target, Users, Activity } from 'lucide-react';
import { API } from '../../services/api.service';

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

  // 获取用户信息
  const getUserInfo = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  };

  // 获取数据
  const loadDashboardData = async () => {
    try {
      console.log("[FIX] LegacyMonitorView: 开始加载数据，schoolId:", schoolId);

      const response = await API.dashboard.getData(schoolId);

      if (response.success && response.data) {
        setDashboardData(response.data as DashboardData);
        setError(null);
        console.log("[FIX] LegacyMonitorView: ✅ 大屏数据加载成功", response.data);
      } else {
        throw new Error(response.message || "数据格式错误");
      }
    } catch (error) {
      console.error('[FIX] LegacyMonitorView: 加载大屏数据失败:', error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";

      if (errorMessage.includes('401') || errorMessage.includes('未找到登录凭证')) {
        setError("认证失败，请重新登录后刷新页面");
      } else {
        setError("大屏加载错误，正在尝试重连...");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000); // 每5秒刷新一次
    return () => clearInterval(interval);
  }, [schoolId]);

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl">正在加载大屏数据...</div>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-2xl font-bold mb-2 text-red-400">加载失败</div>
          <div className="text-gray-400 mb-6">{error || "未知错误"}</div>
          <button
            onClick={() => {
              setIsLoading(true);
              setError(null);
              loadDashboardData();
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-4 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="text-center flex-shrink-0 mb-4">
        <h1 className="text-4xl font-bold tracking-tighter">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            星途成长方舟
          </span>
        </h1>
        <p className="text-gray-400 mt-2">实时数据监控</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6 flex-shrink-0">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">总学生数</p>
              <p className="text-2xl font-bold text-orange-400">{dashboardData.schoolStats.totalStudents}</p>
            </div>
            <Users className="w-8 h-8 text-orange-400/50" />
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">总积分</p>
              <p className="text-2xl font-bold text-yellow-400">{dashboardData.schoolStats.totalPoints}</p>
            </div>
            <Trophy className="w-8 h-8 text-yellow-400/50" />
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">总经验</p>
              <p className="text-2xl font-bold text-purple-400">{dashboardData.schoolStats.totalExp}</p>
            </div>
            <Target className="w-8 h-8 text-purple-400/50" />
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow min-h-0">
        {/* Left - Leaderboard */}
        <div className="h-full min-h-0">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                积分排行榜
              </h2>
            </div>
            <div className="flex-grow overflow-y-auto">
              <div className="p-4 space-y-3">
                {dashboardData.topStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30' :
                      index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-orange-700/20 border border-orange-600/30' :
                      'bg-slate-700/30'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-slate-600 text-gray-300'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-600">
                      <img
                        src={student.avatarUrl || '/avatar.jpg'}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-grow">
                      <div className="font-semibold">{student.name}</div>
                      <div className="text-sm text-gray-400">{student.className}</div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="font-bold text-lg">{student.points}</div>
                      <div className="text-sm text-gray-400">积分</div>
                    </div>

                    {/* Crown for top 3 */}
                    {index < 3 && (
                      <Crown className={`w-6 h-6 ${
                        index === 0 ? 'text-yellow-400' :
                        index === 1 ? 'text-gray-300' :
                        'text-orange-400'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right - Activity Feed */}
        <div className="h-full min-h-0">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg h-full flex flex-col">
            <div className="px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-cyan-400" />
                最新动态
              </h2>
            </div>
            <div className="flex-grow overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* PK Matches */}
                {dashboardData.ongoingPKs.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-orange-400">进行中的PK</h3>
                    <div className="space-y-3">
                      {dashboardData.ongoingPKs.map((pk) => (
                        <div key={pk.id} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                          <div className="font-semibold text-orange-400 mb-2">{pk.topic}</div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                                {pk.playerA.name.charAt(0)}
                              </div>
                              <span>{pk.playerA.name}</span>
                            </div>
                            <span className="text-orange-400 font-bold">VS</span>
                            <div className="flex items-center gap-2">
                              <span>{pk.playerB.name}</span>
                              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold">
                                {pk.playerB.name.charAt(0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Challenges */}
                {dashboardData.recentChallenges.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-green-400">最近完成的挑战</h3>
                    <div className="space-y-3">
                      {dashboardData.recentChallenges.map((challenge) => (
                        <div key={challenge.id} className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                          <div className="font-semibold text-green-400">{challenge.title}</div>
                          <div className="text-sm text-gray-400 mt-1">
                            完成: {challenge.student.name} ({challenge.student.className})
                          </div>
                          <div className="text-sm text-yellow-400 mt-1">
                            +{challenge.expAwarded} 经验值
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dashboardData.ongoingPKs.length === 0 && dashboardData.recentChallenges.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <div>暂无最新动态</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegacyMonitorView;
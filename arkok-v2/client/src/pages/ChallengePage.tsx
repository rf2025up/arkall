import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, Plus, Trophy, Target, Users, Zap, Crown, Star, Sparkles, ArrowRight, X, Swords, CheckCircle2, UserCheck, Award, Loader2, Search, Calendar, MessageSquare, Clock, XCircle, ArrowLeft } from 'lucide-react'
import { apiService } from '../services/api.service'
import { useAuth } from '../context/AuthContext'
// 移除已删除的 MessageCenter 导入

interface Challenge {
  id: string
  title: string
  description: string
  type: 'PERSONAL' | 'GROUP' | 'CLASS'
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED'
  startDate: string
  endDate?: string
  rewardPoints: number
  rewardExp: number
  maxParticipants: number
  participantCount: number
  teachers: {
    name: string
  }
}

interface Student {
  id: string
  name: string
  className: string
  avatarUrl: string
}

interface Participant {
  id: string
  studentId: string
  challengeId: string
  status: string
  result?: 'COMPLETED' | 'FAILED'
  students: {
    id: string
    name: string
    avatarUrl: string
  }
}

const ChallengePage: React.FC = () => {
  const navigate = useNavigate()
  const { user: userInfo } = useAuth()

  // 状态管理
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  // 🆕 移除旧的结算模态框状态，现在卡片内直接判定
  const [participants, setParticipants] = useState<Participant[]>([])

  const [createLoading, setCreateLoading] = useState(false)

  // 表单状态
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'PERSONAL' as 'PERSONAL' | 'CLASS',
    rewardPoints: 100,
    rewardExp: 50,
    studentIds: [] as string[]
  })

  // 初始数据加载
  const fetchData = async (forceRefresh = false) => {
    const hasData = challenges.length > 0 || students.length > 0;
    if (!hasData) setLoading(true);

    try {
      const challengeUrl = `/challenges?schoolId=${userInfo?.schoolId}`;
      const studentUrl = `/students?schoolId=${userInfo?.schoolId}&limit=100`;

      // 🚀 SWR 第一阶段
      const [challengesRes, studentsRes] = await Promise.all([
        apiService.get<any>(challengeUrl, {}, { useCache: !forceRefresh }),
        apiService.get<any>(studentUrl, {}, { useCache: !forceRefresh })
      ]);

      const processData = (cRes: any, sRes: any) => {
        if (cRes.success || (cRes as any)._fromCache) {
          const cData = Array.isArray(cRes.data || cRes) ? cRes.data || cRes : (cRes.data as any)?.challenges || [];
          setChallenges(cData as Challenge[]);
        }
        if (sRes.success || (sRes as any)._fromCache) {
          const studentList = Array.isArray(sRes.data || sRes) ? sRes.data || sRes : (sRes.data as any)?.students || [];
          setStudents(studentList.map((s: any) => ({
            ...s,
            avatarUrl: s.avatarUrl || s.avatar_url || '/avatar.jpg'
          })));
        }
      };

      processData(challengesRes, studentsRes);

      // SWR 静默刷新
      const isFromCache = (challengesRes as any)._fromCache || (studentsRes as any)._fromCache;
      if (isFromCache) {
        setLoading(false);
        console.log('[SWR] ⚡ ChallengePage rendered from cache, revalidating...');
        Promise.all([
          apiService.get<any>(challengeUrl, {}, { useCache: false }),
          apiService.get<any>(studentUrl, {}, { useCache: false })
        ]).then(([fc, fs]) => {
          processData(fc, fs);
          console.log('[SWR] ✅ ChallengePage revalidated');
        });
      }

    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 🆕 loadParticipants 已移除 - 每个卡片自己加载参与者

  // 创建挑战
  const handleCreateChallenge = async () => {
    console.log('[DEBUG CHALLENGE] Start creation process', newChallenge);

    if (!newChallenge.title.trim() || !newChallenge.description.trim()) {
      console.warn('[DEBUG CHALLENGE] Validation failed: missing title or description');
      toast.error('请填写完整的挑战信息');
      return;
    }

    if (newChallenge.type === 'PERSONAL' && newChallenge.studentIds.length === 0) {
      console.warn('[DEBUG CHALLENGE] Validation failed: no students selected for personal challenge');
      toast.error('请选择参与挑战的学生');
      return;
    }

    setCreateLoading(true);
    try {
      console.log('[DEBUG CHALLENGE] Calling POST /challenges', {
        ...newChallenge,
        schoolId: userInfo?.schoolId,
        creatorId: userInfo?.userId || userInfo?.id
      });

      // 1. 创建挑战本身
      const res = await apiService.post('/challenges', {
        ...newChallenge,
        schoolId: userInfo?.schoolId,
        creatorId: userInfo?.userId || userInfo?.id,
        status: 'ACTIVE' // 直接开启
      });

      console.log('[DEBUG CHALLENGE] API Response:', res);

      if (res.success) {
        const challengeId = (res.data as any).id;
        console.log('[DEBUG CHALLENGE] Challenge created successfully, ID:', challengeId);

        // 2. 如果是个人挑战或指定了学生，批量添加参与者
        if (newChallenge.type === 'PERSONAL' && newChallenge.studentIds.length > 0) {
          await Promise.all(
            newChallenge.studentIds.map(studentId =>
              apiService.post('/challenges/join', {
                challengeId,
                studentId,
                schoolId: userInfo?.schoolId
              })
            )
          );
        } else if (newChallenge.type === 'CLASS') {
          // 全班挑战：遍历所有学生加入
          await Promise.all(
            students.map(s =>
              apiService.post('/challenges/join', {
                challengeId,
                studentId: s.id,
                schoolId: userInfo?.schoolId
              })
            )
          );
        }

        toast.success('挑战发布成功！');
        apiService.invalidateCache('/challenges');
        setShowCreateModal(false);
        fetchData(true);
        setNewChallenge({ title: '', description: '', type: 'PERSONAL', rewardPoints: 100, rewardExp: 50, studentIds: [] });
      }
    } catch (error) {
      toast.error('发布失败');
    } finally {
      setCreateLoading(false);
    }
  };

  // 🆕 直接判定单个学生结果（不需要确认模态框）
  const handleQuickSettle = async (challengeId: string, studentId: string, result: 'COMPLETED' | 'FAILED') => {
    try {
      const res = await apiService.post('/challenges/participant/batch', {
        challengeId,
        schoolId: userInfo?.schoolId,
        updates: [{ studentId, result }]
      })

      if (res.success) {
        toast.success(result === 'COMPLETED' ? '🎉 挑战成功！' : '挑战结束')
        apiService.invalidateCache('/challenges');
        // 刷新数据
        fetchData(true)
        // 更新本地参与者状态
        setParticipants(prev => prev.map(p =>
          p.studentId === studentId ? { ...p, result } : p
        ))
      }
    } catch (error) {
      toast.error('判定失败')
    }
  }

  // 🆕 紧凑型挑战卡片 - 直接显示参与者和成功/失败按钮
  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const isCompleted = challenge.status === 'COMPLETED'
    const [cardParticipants, setCardParticipants] = useState<Participant[]>([])
    const [loadingParticipants, setLoadingParticipants] = useState(false)

    // 加载该挑战的参与者
    const loadCardParticipants = async () => {
      if (cardParticipants.length > 0) return // 已加载
      setLoadingParticipants(true)
      try {
        const res = await apiService.get(`/challenges/${challenge.id}/participants?schoolId=${userInfo?.schoolId}`)
        if (res.success) {
          setCardParticipants((res.data as any[]).map((p: any) => ({
            ...p,
            students: {
              ...p.students,
              avatarUrl: p.students?.avatarUrl || p.students?.avatar_url || '/avatar.jpg'
            }
          })))
        }
      } catch (error) {
        console.error('Load participants error:', error)
      } finally {
        setLoadingParticipants(false)
      }
    }

    // 🆕 组件挂载时立即加载参与者（不需要点击展开）
    useEffect(() => {
      if (!isCompleted) {
        loadCardParticipants()
      }
    }, [])

    return (
      <div className={`bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/50 border-2 transition-all ${isCompleted ? 'border-slate-100 opacity-60' : 'border-slate-50'}`}>
        {/* 卡片头部 */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-slate-100' : 'bg-purple-100'}`}>
            <Target size={18} className={isCompleted ? 'text-slate-400' : 'text-purple-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-800 truncate">{challenge.title}</h3>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="font-bold text-amber-500">+{challenge.rewardExp} EXP</span>
              <span>·</span>
              <span>{challenge.participantCount}人</span>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black ${isCompleted ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-600'}`}>
            {isCompleted ? '已结束' : '进行中'}
          </div>
        </div>

        {/* 🆕 直接显示参与者和判定按钮 */}
        {!isCompleted && (
          <div className="mt-3 pt-3 border-t border-slate-50">
            {loadingParticipants ? (
              <div className="py-4 text-center text-slate-400 text-xs">加载中...</div>
            ) : cardParticipants.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">暂无参与者</div>
            ) : (
              <div className="space-y-2">
                {cardParticipants.map(p => {
                  const hasResult = p.result === 'COMPLETED' || p.result === 'FAILED'
                  return (
                    <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <img src={p.students.avatarUrl || '/avatar.jpg'} className="w-7 h-7 rounded-full" alt="" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                        <span className="text-xs font-bold text-slate-700">{p.students.name}</span>
                      </div>
                      {hasResult ? (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-full ${p.result === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {p.result === 'COMPLETED' ? '✅ 成功' : '❌ 失败'}
                        </span>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleQuickSettle(challenge.id, p.studentId, 'COMPLETED') }}
                            className="text-[9px] font-black px-2 py-1 rounded-full bg-green-500 text-white active:scale-95"
                          >
                            成功
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleQuickSettle(challenge.id, p.studentId, 'FAILED') }}
                            className="text-[9px] font-black px-2 py-1 rounded-full bg-red-500 text-white active:scale-95"
                          >
                            失败
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F9FC] pb-24">
      {/* === 统一头部 (橙色渐变) === */}
      <header
        className="pt-12 pb-16 px-5 rounded-b-[2.5rem] shadow-xl shadow-orange-500/10 relative overflow-hidden z-30"
        style={{ background: 'linear-gradient(180deg, #FF7E36 0%, #FF9D5C 100%)' }}
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Target size={140} className="text-white rotate-12" />
        </div>

        <div className="relative z-10 flex flex-col gap-6">
          {/* 顶栏 */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-xl text-white active:scale-90 transition-transform"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-lg font-black text-white">挑战赛场</h1>
            <div className="w-10 h-10" /> {/* 占位平衡 */}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-orange-600 w-full py-4 rounded-2xl text-sm font-black shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-white"
          >
            <Plus size={18} /> 发布新挑战
          </button>
        </div>
      </header>

      {/* 状态概览岛 */}
      <div className="px-5 -mt-8 relative z-40">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 flex justify-around items-center shadow-xl shadow-orange-200/20 border border-white/80">
          <div className="text-center">
            <div className="text-2xl font-black text-orange-600 leading-none mb-1">
              {challenges.filter(c => c.status === 'ACTIVE').length}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">进行中</div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <div className="text-2xl font-black text-slate-800 leading-none mb-1">
              {challenges.filter(c => c.status === 'COMPLETED').length}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已结束</div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 border border-orange-100/50 flex items-center justify-center shadow-sm mx-auto mb-1">
              <Trophy size={18} />
            </div>
            <div className="text-[10px] font-bold text-orange-600">荣誉墙</div>
          </div>
        </div>
      </div>

      <main className="p-5 space-y-6">
        {/* 标题 */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
          <h2 className="text-base font-black text-slate-800">所有挑战任务</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map(c => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
          {challenges.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm">暂无挑战，快去发布一个吧！</p>
            </div>
          )}
        </div>
      </main>

      {/* 发布挑战模态框 - 增强 Z-Index 并添加滚动支持 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] p-5 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2 shrink-0">
              <Plus className="text-purple-600" /> 发布新挑战
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4 py-1">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">挑战名称</label>
                <input
                  type="text"
                  placeholder="例如：每日朗读打卡"
                  value={newChallenge.title}
                  onChange={e => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">具体要求</label>
                <textarea
                  placeholder="详细描述挑战的具体规则..."
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* 学生选择网格 - 仅在 PERSONAL 或 CLASS 下作为补充 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">参与学生</label>
                  <button
                    onClick={() => {
                      if (newChallenge.studentIds.length === students.length) {
                        setNewChallenge({ ...newChallenge, studentIds: [] });
                      } else {
                        setNewChallenge({ ...newChallenge, studentIds: students.map(s => s.id) });
                      }
                    }}
                    className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline"
                  >
                    {newChallenge.studentIds.length === students.length ? '全部取消' : '一键全选'}
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5 max-h-[120px] overflow-y-auto p-1.5 bg-slate-50 rounded-xl">
                  {students.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        const ids = newChallenge.studentIds.includes(s.id)
                          ? newChallenge.studentIds.filter(id => id !== s.id)
                          : [...newChallenge.studentIds, s.id];
                        setNewChallenge({ ...newChallenge, studentIds: ids });
                      }}
                      className={`flex flex-col items-center gap-0.5 p-1 rounded-lg border transition-all ${newChallenge.studentIds.includes(s.id)
                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-400'
                        : 'bg-white border-transparent'
                        }`}
                    >
                      <img src={s.avatarUrl || '/avatar.jpg'} className="w-7 h-7 rounded-full shadow-sm" alt={s.name} draggable={false} onContextMenu={(e) => e.preventDefault()} />
                      <span className="text-[9px] font-bold text-slate-600 truncate w-full text-center">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">经验奖励</label>
                  <input
                    type="number"
                    value={newChallenge.rewardExp}
                    onChange={(e) => setNewChallenge({ ...newChallenge, rewardExp: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">积分奖励</label>
                  <input
                    type="number"
                    value={newChallenge.rewardPoints}
                    onChange={(e) => setNewChallenge({ ...newChallenge, rewardPoints: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">挑战类型</label>
                <div className="grid grid-cols-2 gap-2">
                  {['PERSONAL', 'CLASS'].map(type => (
                    <button
                      key={type}
                      onClick={() => setNewChallenge({ ...newChallenge, type: type as 'PERSONAL' | 'CLASS' })}
                      className={`py-2 rounded-xl border-2 font-black text-[10px] transition-all ${newChallenge.type === type ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-50 bg-slate-50 text-slate-500'
                        }`}
                    >
                      {type === 'PERSONAL' ? '个人' : '全班'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5 pt-3 border-t border-slate-50 shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl active:scale-95 transition-all text-sm"
              >
                取消
              </button>
              <button
                onClick={handleCreateChallenge}
                disabled={createLoading}
                className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-purple-200 active:scale-95 transition-all text-sm disabled:opacity-50"
              >
                {createLoading ? '发布中...' : '立即发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChallengePage
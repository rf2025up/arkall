import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, Plus, Trophy, Target, Users, Zap, Crown, Star, Sparkles, ArrowRight, X, Swords, CheckCircle2, UserCheck, Award, Loader2, Search, Calendar, MessageSquare, Clock, XCircle } from 'lucide-react'
import { apiService } from '../services/api.service'
import { useAuth } from '../context/AuthContext'

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
  const fetchData = async () => {
    setLoading(true)
    try {
      const [challengesRes, studentsRes] = await Promise.all([
        apiService.get(`/challenges?schoolId=${userInfo?.schoolId}`),
        apiService.get(`/students?schoolId=${userInfo?.schoolId}&limit=100`)
      ])

      if (challengesRes.success) setChallenges(challengesRes.data as Challenge[])
      if (studentsRes.success) {
        const studentList = Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data as any).students || [];
        setStudents(studentList.map((s: any) => ({
          ...s,
          avatarUrl: s.avatarUrl || s.avatar_url || '/avatar.jpg'
        })));
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
        setShowCreateModal(false);
        fetchData();
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
        // 刷新数据
        fetchData()
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
      <div className={`bg-white rounded-xl p-3 shadow-sm border transition-all ${isCompleted ? 'border-slate-100 opacity-60' : 'border-purple-100'}`}>
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
                        <img src={p.students.avatarUrl || '/avatar.jpg'} className="w-7 h-7 rounded-full" alt="" />
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
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">挑战赛场</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-purple-200 active:scale-95 transition-all flex items-center gap-1"
        >
          <Plus size={18} /> 发布挑战
        </button>
      </header>

      <main className="flex-1 p-4 pb-20 space-y-6">
        {/* 顶部统计卡片 */}
        <section className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-purple-200 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <div className="text-purple-100 text-[10px] font-black uppercase tracking-widest mb-1">正在进行</div>
              <div className="text-4xl font-black">{challenges.filter(c => c.status === 'ACTIVE').length}</div>
            </div>
            <div className="text-right">
              <div className="text-purple-100 text-[10px] font-black uppercase tracking-widest mb-1">已完赛</div>
              <div className="text-4xl font-black">{challenges.filter(c => c.status === 'COMPLETED').length}</div>
            </div>
          </div>
          <Sparkles className="absolute -top-10 -right-10 w-48 h-48 text-white/10" />
        </section>

        {/* 标题 */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
          <h2 className="text-base font-extrabold text-slate-800">所有挑战任务</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {challenges.map(c => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
          {challenges.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
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
                      <img src={s.avatarUrl || '/avatar.jpg'} className="w-7 h-7 rounded-full shadow-sm" alt={s.name} />
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
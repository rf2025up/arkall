import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, Trophy, Target, Users, Zap, Crown, Star, Sparkles, ArrowRight, X, Swords } from 'lucide-react'
import { apiService } from '../services/api.service'
import { useAuth } from '../context/AuthContext'

// 龙老师班学生数据 (保持原有模拟数据作为备份)
const mockStudents = [
  { id: '65697759-b4ba-49ae-9f18-101730f7bf47', name: '刘梓萌', className: '龙老师班', avatarUrl: '/avatar.jpg' },
  { id: '1896c410-1a91-4281-ac02-797756c638cc', name: '宁可歆', className: '龙老师班', avatarUrl: '/avatar.jpg' },
  { id: '47938c35-a307-4191-84a8-bf798d599505', name: '廖潇然', className: '龙老师班', avatarUrl: '/avatar.jpg' },
  { id: '83147758-d2d7-4541-a7c1-5892b809ccc8', name: '彭斯晟', className: '龙老师班', avatarUrl: '/avatar.jpg' },
  { id: '31895b6e-8fb0-4eb8-838c-3c0d3d71bbcb', name: '曾欣媛', className: '龙老师班', avatarUrl: '/avatar.jpg' },
  { id: 'a3a72793-7c76-4f14-b18c-d786db55ff26', name: '樊牧宸', className: '龙老师班', avatarUrl: '/avatar.jpg' },
  { id: 'b043aea7-874b-4505-8274-50526192fde8', name: '肖浩轩', className: '龙老师班', avatarUrl: '/avatar.jpg' },
  { id: 'bb61ac5c-9bee-4ff9-95ef-1d9e25728f76', name: '肖雨虹', className: '龙老师班', avatarUrl: '/avatar.jpg' }
]

interface Student {
  id: string
  name: string
  className: string
  avatarUrl: string
}

interface PKMatch {
  id: string
  studentA: Student
  studentB: Student
  topic: string
  status: string
  createdAt: string
  winnerId?: string | null
  expReward?: number
  pointsReward?: number
}

const PKPage: React.FC = () => {
  const navigate = useNavigate()
  const { user: userInfo } = useAuth()

  // 状态管理
  const [pkMatches, setPKMatches] = useState<PKMatch[]>([])
  const [students, setStudents] = useState<Student[]>(mockStudents)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newPK, setNewPK] = useState({
    studentA: '',
    studentB: '',
    topic: '',
    expReward: 50,
    pointsReward: 20
  })


  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const [pkRes, studentRes] = await Promise.all([
        apiService.get(`/pkmatches?schoolId=${userInfo?.schoolId}&limit=100`),
        apiService.get(`/students?schoolId=${userInfo?.schoolId}&limit=100`)
      ]);

      if (pkRes.success) {
        // 🆕 修复：确保 PK 对象中的选手头像也有回退机制
        const mappedMatches = (pkRes.data as any[]).map((pk: any) => ({
          ...pk,
          studentA: { ...pk.studentA, avatarUrl: pk.studentA?.avatarUrl || pk.studentA?.avatar_url || '/avatar.jpg' },
          studentB: { ...pk.studentB, avatarUrl: pk.studentB?.avatarUrl || pk.studentB?.avatar_url || '/avatar.jpg' }
        }));
        setPKMatches(mappedMatches);
      }
      if (studentRes.success) {
        const studentList = Array.isArray(studentRes.data) ? studentRes.data : (studentRes.data as any).students || [];
        setStudents(studentList.map((s: any) => ({
          id: s.id,
          name: s.name,
          className: s.className,
          avatarUrl: s.avatarUrl || '/avatar.jpg'
        })));
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('获取数据失败，已加载演示数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ongoingMatches = pkMatches.filter(pk => pk.status === 'ONGOING')
  const completedMatches = pkMatches.filter(pk => {
    const pkDate = new Date(pk.createdAt);
    const now = new Date();
    const diffDays = (now.getTime() - pkDate.getTime()) / (1000 * 3600 * 24);
    return pk.status === 'COMPLETED' && diffDays <= 7;
  })

  // 创建PK
  const handleCreatePK = async () => {
    if (!newPK.studentA || !newPK.studentB || !newPK.topic.trim()) {
      toast.error('请填写完整的PK信息');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await apiService.post('/pkmatches', {
        ...newPK,
        schoolId: userInfo?.schoolId
      });
      if (res.success) {
        toast.success('PK对战发起成功！');
        setShowCreateModal(false);
        fetchData();
        setNewPK({ studentA: '', studentB: '', topic: '', expReward: 50, pointsReward: 20 });
      }
    } catch (error) {
      toast.error('发起失败');
    } finally {
      setCreateLoading(false);
    }
  };

  // 快捷结算功能 (点名获胜)
  const handleSettlePK = async (pkId: string, winnerId: string | null) => {
    try {
      const res = await apiService.put(`/pkmatches/${pkId}`, {
        schoolId: userInfo?.schoolId,
        status: 'COMPLETED',
        winnerId: winnerId
      });
      if (res.success) {
        toast.success(winnerId ? '对决完成，奖励已派发！' : '平局结算完成');
        fetchData();
      }
    } catch (error) {
      toast.error('结算失败');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header - 统一风格 (高度缩减) */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">PK 对决管理</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center gap-1"
        >
          <Plus size={18} /> 发起PK
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-3.5 pb-20 space-y-4">
        {/* 进行中的 PK */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Zap size={18} className="text-red-500 fill-red-500" /> 进行中的 PK
            </h2>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {ongoingMatches.length} 场
            </span>
          </div>

          <div className="space-y-4">
            {ongoingMatches.length > 0 ? ongoingMatches.map(pk => (
              <div key={pk.id} className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 p-3.5 border border-slate-50 transition-all">
                {/* PK 主题栏 (更紧凑) */}
                <div className="flex justify-center mb-2.5">
                  <div className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-600 min-w-[80px] text-center">
                    {pk.topic}
                  </div>
                </div>

                {/* 对决区域 */}
                <div className="flex items-center justify-between gap-4">
                  {/* 选手 A */}
                  <button
                    onClick={() => handleSettlePK(pk.id, pk.studentA.id)}
                    className="flex-1 flex flex-col items-center gap-2 group active:scale-95 transition-all"
                  >
                    <div className="relative">
                      <img src={pk.studentA.avatarUrl || '/avatar.jpg'} className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover group-hover:border-red-100 transition-all" />
                      <div className="absolute -bottom-1.5 bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm border border-white">WINNER?</div>
                    </div>
                    <span className="text-sm font-black text-slate-800">{pk.studentA.name}</span>
                  </button>

                  {/* VS / 平局 */}
                  <button
                    onClick={() => handleSettlePK(pk.id, null)}
                    className="flex flex-col items-center justify-center p-2 hover:bg-slate-50 rounded-2xl transition-all group"
                  >
                    <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center mb-1 group-hover:bg-slate-100 transition-colors">
                      <Swords size={16} className="text-slate-400" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">平局</span>
                  </button>

                  {/* 选手 B */}
                  <button
                    onClick={() => handleSettlePK(pk.id, pk.studentB.id)}
                    className="flex-1 flex flex-col items-center gap-2 group active:scale-95 transition-all"
                  >
                    <div className="relative">
                      <img src={pk.studentB.avatarUrl || '/avatar.jpg'} className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover group-hover:border-red-100 transition-all" />
                      <div className="absolute -bottom-1.5 bg-orange-100 text-orange-600 text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm border border-white">WINNER?</div>
                    </div>
                    <span className="text-sm font-black text-slate-800">{pk.studentB.name}</span>
                  </button>
                </div>

                {/* 奖励提示 (缩减间距) */}
                <div className="mt-4 pt-2.5 border-t border-dashed border-slate-100 flex justify-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-bold text-slate-500">{pk.expReward || 50} 经验值</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    <span className="text-[10px] font-bold text-slate-500">{pk.pointsReward || 20} 积分</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                  <Swords size={32} />
                </div>
                <p className="text-sm font-bold text-slate-400">暂无进行中的 PK，点击上方发起</p>
              </div>
            )}
          </div>
        </section>

        {/* 历史记录 - 七天内 */}
        <section>
          <h2 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-orange-500 fill-orange-500" /> 近一周战报
          </h2>
          <div className="space-y-2">
            {completedMatches.length > 0 ? completedMatches.map(pk => {
              const studentAWon = pk.winnerId === pk.studentA.id;
              const studentBWon = pk.winnerId === pk.studentB.id;
              const isDraw = !pk.winnerId;

              return (
                <div key={pk.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`text-sm font-black ${studentAWon ? 'text-red-600' : 'text-slate-400'}`}>
                      {pk.studentA.name}
                    </div>
                    <div className="text-[10px] font-black text-slate-200">VS</div>
                    <div className={`text-sm font-black ${studentBWon ? 'text-red-600' : 'text-slate-400'}`}>
                      {pk.studentB.name}
                    </div>
                  </div>
                  <div className="text-center px-4 border-x border-slate-100">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{pk.topic}</div>
                    <div className="text-[10px] font-black text-slate-700">
                      {isDraw ? '🤝 平局' : (studentAWon ? `🏆 ${pk.studentA.name} 胜` : `🏆 ${pk.studentB.name} 胜`)}
                    </div>
                  </div>
                  <div className="text-right flex-1 pl-4">
                    <div className="text-[10px] font-bold text-slate-300">{new Date(pk.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-10 text-center text-xs font-bold text-slate-300 bg-slate-100/50 rounded-3xl">
                暂无历史战报
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 创建 PK Modal - V11 风格 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-900">发起巅峰对决</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 主题 */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">PK 主题</label>
                <input
                  type="text"
                  placeholder="例如：口算竞赛、古诗词背诵..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-red-100 transition-all"
                  value={newPK.topic}
                  onChange={e => setNewPK({ ...newPK, topic: e.target.value })}
                />
              </div>

              {/* 学生选择 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">选手 A</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-red-100"
                    value={newPK.studentA}
                    onChange={e => setNewPK({ ...newPK, studentA: e.target.value })}
                  >
                    <option value="">点击选择</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">选手 B</label>
                  <select
                    className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-red-100"
                    value={newPK.studentB}
                    onChange={e => setNewPK({ ...newPK, studentB: e.target.value })}
                  >
                    <option value="">点击选择</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* 奖励设置 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">经验奖励 (EXP)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold"
                    value={newPK.expReward}
                    onChange={e => setNewPK({ ...newPK, expReward: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">积分奖励 (PTS)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold"
                    value={newPK.pointsReward}
                    onChange={e => setNewPK({ ...newPK, pointsReward: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreatePK}
              disabled={createLoading}
              className="w-full mt-6 bg-slate-900 text-white h-14 rounded-full font-black shadow-xl shadow-slate-200 active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
            >
              {createLoading ? '正在开启...' : '进入格斗场'} <ArrowRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PKPage
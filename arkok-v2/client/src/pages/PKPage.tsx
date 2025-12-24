import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, Trophy, Target, Users, Zap, Crown, Star, Sparkles, ArrowRight, X, Swords, ArrowLeft } from 'lucide-react'
import { apiService } from '../services/api.service'
import { useAuth } from '../context/AuthContext'
// 移除已删除的 MessageCenter 导入

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
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      {/* === 统一头部 (橙色渐变) === */}
      <header
        className="pt-12 pb-10 px-5 rounded-b-[2.5rem] shadow-xl shadow-orange-500/10 relative overflow-hidden z-30"
        style={{ background: 'linear-gradient(180deg, #FF7E36 0%, #FF9D5C 100%)' }}
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap size={140} className="text-white rotate-12" />
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
            <h1 className="text-lg font-black text-white">PK 巅峰赛</h1>
            <div className="w-10 h-10" /> {/* 占位平衡 */}
          </div>
        </div>
      </header>

      {/* 🆕 内容区域 */}
      <main
        className="flex-1 -mt-8 relative z-30 p-4 pb-24 space-y-6 cursor-pointer"
        onClick={(e) => {
          // 如果点击的是 main 容器本身（即背景空白处），则返回首页
          if (e.target === e.currentTarget) {
            navigate('/');
          }
        }}
      >

        {/* === 发起对决集发表单卡片 === */}
        <section
          className="bg-white/95 backdrop-blur-xl rounded-3xl p-5 shadow-xl shadow-orange-200/20 border border-white animate-in fade-in slide-in-from-bottom-4 duration-500 cursor-default"
          onClick={(e) => e.stopPropagation()} // 防止点击卡片内部触发返回
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <Zap size={16} className="text-orange-600 fill-orange-600" />
            </div>
            <h3 className="text-lg font-black text-gray-800">发起巅峰对决</h3>
          </div>

          <div className="space-y-4">
            {/* 主题 */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">对决主题</label>
              <input
                type="text"
                placeholder="例如：口算竞赛、古诗词背诵..."
                className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-100 rounded-xl p-3 text-xs font-black placeholder:text-gray-300 transition-all focus:ring-0"
                value={newPK.topic}
                onChange={e => setNewPK({ ...newPK, topic: e.target.value })}
              />
            </div>

            {/* 学生选择 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">选手 A</label>
                <select
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-100 rounded-xl p-3 text-xs font-black transition-all focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_10px_center] bg-no-repeat"
                  value={newPK.studentA}
                  onChange={e => setNewPK({ ...newPK, studentA: e.target.value })}
                >
                  <option value="">选择选手</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">选手 B</label>
                <select
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-100 rounded-xl p-3 text-xs font-black transition-all focus:ring-0 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_10px_center] bg-no-repeat"
                  value={newPK.studentB}
                  onChange={e => setNewPK({ ...newPK, studentB: e.target.value })}
                >
                  <option value="">选择选手</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* 奖励设置 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">经验 (EXP)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-100 rounded-xl p-3 pl-9 text-xs font-black focus:ring-0"
                    value={newPK.expReward}
                    onChange={e => setNewPK({ ...newPK, expReward: parseInt(e.target.value) || 0 })}
                  />
                  <Star size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">积分 (PTS)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-100 rounded-xl p-3 pl-9 text-xs font-black focus:ring-0"
                    value={newPK.pointsReward}
                    onChange={e => setNewPK({ ...newPK, pointsReward: parseInt(e.target.value) || 0 })}
                  />
                  <Crown size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreatePK}
              disabled={createLoading}
              className="w-full mt-2 bg-gray-900 text-white h-12 rounded-xl font-black shadow-lg shadow-gray-200 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>发起对决 <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </section>

        {/* 进行中的 PK */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 px-1">
            <div className="w-1.5 h-5 bg-orange-500 rounded-full" />
            <h2 className="text-base font-black text-gray-800">激战正酣</h2>
          </div>

          <div className="space-y-5">
            {ongoingMatches.length > 0 ? ongoingMatches.map(pk => (
              <div key={pk.id} className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-6 border border-white relative overflow-hidden group">
                {/* 装饰性背景 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform" />

                {/* PK 主题 */}
                <div className="flex justify-center mb-6 relative">
                  <div className="bg-orange-50 border border-orange-100 px-4 py-1.5 rounded-2xl text-[11px] font-black text-orange-600 shadow-sm">
                    {pk.topic}
                  </div>
                </div>

                {/* 对决主视觉 */}
                <div className="flex items-center justify-between gap-2 relative">
                  {/* 选手 A */}
                  <div className="flex-1 flex flex-col items-center gap-3">
                    <button
                      onClick={() => handleSettlePK(pk.id, pk.studentA.id)}
                      className="relative group/avatar active:scale-90 transition-all"
                    >
                      <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg relative z-10">
                        <img src={pk.studentA.avatarUrl || '/avatar.jpg'} className="w-full h-full object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                      </div>
                      <div className="absolute -inset-2 bg-orange-500 rounded-[2rem] opacity-0 group-hover/avatar:opacity-10 transition-all -z-10" />
                      <div className="absolute -bottom-2 inset-x-0 mx-auto w-fit bg-white border border-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-xl shadow-sm">结算获胜</div>
                    </button>
                    <span className="text-base font-black text-gray-800">{pk.studentA.name}</span>
                  </div>

                  {/* VS 核心 */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center relative z-10 border border-gray-100">
                        <Swords size={24} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                      </div>
                      <div className="absolute inset-0 bg-orange-500 rounded-2xl animate-ping opacity-10" />
                    </div>
                    <button
                      onClick={() => handleSettlePK(pk.id, null)}
                      className="text-[10px] font-black text-gray-300 hover:text-gray-500 uppercase tracking-widest transition-colors"
                    >
                      平局
                    </button>
                  </div>

                  {/* 选手 B */}
                  <div className="flex-1 flex flex-col items-center gap-3">
                    <button
                      onClick={() => handleSettlePK(pk.id, pk.studentB.id)}
                      className="relative group/avatar active:scale-90 transition-all"
                    >
                      <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg relative z-10">
                        <img src={pk.studentB.avatarUrl || '/avatar.jpg'} className="w-full h-full object-cover" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                      </div>
                      <div className="absolute -inset-2 bg-orange-500 rounded-[2rem] opacity-0 group-hover/avatar:opacity-10 transition-all -z-10" />
                      <div className="absolute -bottom-2 inset-x-0 mx-auto w-fit bg-white border border-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-xl shadow-sm">结算获胜</div>
                    </button>
                    <span className="text-base font-black text-gray-800">{pk.studentB.name}</span>
                  </div>
                </div>

                {/* 奖励预览 */}
                <div className="mt-8 pt-5 border-t border-gray-50 flex justify-center gap-6">
                  <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1 rounded-xl">
                    <Star size={14} className="text-blue-500 fill-blue-500" />
                    <span className="text-xs font-black text-blue-600">{pk.expReward || 50} EXP</span>
                  </div>
                  <div className="flex items-center gap-2 bg-orange-50/50 px-3 py-1 rounded-xl">
                    <Crown size={14} className="text-orange-500 fill-orange-500" />
                    <span className="text-xs font-black text-orange-600">{pk.pointsReward || 20} PTS</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                <div className="w-16 h-16 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-gray-200">
                  <Swords size={32} />
                </div>
                <p className="text-sm font-bold text-gray-400">目前格斗场空无一人</p>
              </div>
            )}
          </div>
        </section>

        {/* 历史战报 */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-1.5 h-5 bg-gray-300 rounded-full" />
            <h2 className="text-base font-black text-gray-600">荣誉战报</h2>
          </div>

          <div className="space-y-3">
            {completedMatches.length > 0 ? completedMatches.map(pk => {
              const studentAWon = pk.winnerId === pk.studentA.id;
              const studentBWon = pk.winnerId === pk.studentB.id;
              const isDraw = !pk.winnerId;

              return (
                <div key={pk.id} className="bg-white rounded-2xl p-4 shadow-sm border border-white flex items-center justify-between gap-3 group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <img src={pk.studentA.avatarUrl} className={`w-10 h-10 rounded-xl object-cover ${studentAWon ? 'ring-2 ring-orange-400' : 'grayscale opacity-50'}`} draggable={false} onContextMenu={(e) => e.preventDefault()} />
                      {studentAWon && <Crown size={12} className="absolute -top-1.5 -right-1.5 text-orange-500 fill-orange-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-black truncate ${studentAWon ? 'text-gray-800' : 'text-gray-400'}`}>
                        {pk.studentA.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-4 border-x border-gray-50 min-w-[80px]">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{pk.topic}</span>
                    <span className="text-[10px] font-black text-gray-700">{isDraw ? '🤝 平局' : '🏆 RESULT'}</span>
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="flex-1 min-w-0 text-right">
                      <div className={`text-sm font-black truncate ${studentBWon ? 'text-gray-800' : 'text-gray-400'}`}>
                        {pk.studentB.name}
                      </div>
                    </div>
                    <div className="relative">
                      <img src={pk.studentB.avatarUrl} className={`w-10 h-10 rounded-xl object-cover ${studentBWon ? 'ring-2 ring-orange-400' : 'grayscale opacity-50'}`} draggable={false} onContextMenu={(e) => e.preventDefault()} />
                      {studentBWon && <Crown size={12} className="absolute -top-1.5 -right-1.5 text-orange-500 fill-orange-500" />}
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="py-10 text-center text-xs font-bold text-gray-300 bg-gray-50/50 rounded-3xl border border-gray-100">
                暂无历史战报
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );

}

export default PKPage
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, Trophy, Target, Users, Zap, Crown, Star, Sparkles, ArrowRight, X, Swords, ArrowLeft, Loader2 } from 'lucide-react'
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
  const [showStudentSelector, setShowStudentSelector] = useState<'A' | 'B' | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [newPK, setNewPK] = useState({
    studentAId: '',
    studentBId: '',
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
    if (!newPK.studentAId || !newPK.studentBId || !newPK.topic.trim()) {
      toast.error('请填写完整的PK信息');
      return;
    }
    if (newPK.studentAId === newPK.studentBId) {
      toast.error('选手 A 和选手 B 不能是同一人');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await apiService.post('/pkmatches', {
        studentA: newPK.studentAId,
        studentB: newPK.studentBId,
        topic: newPK.topic,
        expReward: newPK.expReward,
        pointsReward: newPK.pointsReward,
        schoolId: userInfo?.schoolId
      });
      if (res.success) {
        toast.success('PK对战发起成功！');
        fetchData();
        setNewPK({ studentAId: '', studentBId: '', topic: '', expReward: 50, pointsReward: 20 });
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
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* 顶部大橙色背景区 */}
      <div
        className="h-40 absolute top-0 left-0 w-full z-0 rounded-b-3xl"
        style={{ background: 'linear-gradient(135deg, #FF9A5E 0%, #FF502E 100%)' }}
      ></div>

      {/* 导航栏 */}
      <header className="relative z-10 flex justify-between items-center px-5 pt-12 pb-4 text-white">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center opacity-90 active:scale-95"
        >
          <X size={24} />
        </button>
        <h1 className="text-lg font-bold">PK 对决</h1>
        <button
          onClick={() => navigate('/badges')}
          className="w-10 h-10 flex items-center justify-center opacity-90 active:scale-95"
        >
          <ArrowRight size={24} />
        </button>
      </header>

      {/* 内容区域 */}
      <main className="flex-1 relative z-10 p-4 pb-24 space-y-4">

        {/* 发起对决页卡片 (对齐 HTML Page 3) */}
        <section className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-50">
          <input
            type="text"
            placeholder="输入对决主题 (如: 口算比拼)"
            className="w-full border-none bg-[#F7F8FA] rounded-xl p-3.5 text-base font-bold text-center placeholder:text-slate-300 focus:ring-1 focus:ring-orange-200"
            value={newPK.topic}
            onChange={e => setNewPK({ ...newPK, topic: e.target.value })}
          />

          <div className="flex items-center justify-between my-5">
            {/* 选手 A - 仅下拉框 */}
            <div className="flex-1 px-2">
              <select
                value={newPK.studentAId}
                onChange={(e) => setNewPK({ ...newPK, studentAId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-orange-200 appearance-none cursor-pointer"
              >
                <option value="">选择选手 A</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-[#FFF0E6] text-[#FF5E33] font-black italic px-4 py-2 rounded-full text-sm mx-2">VS</div>

            {/* 选手 B - 仅下拉框 */}
            <div className="flex-1 px-2">
              <select
                value={newPK.studentBId}
                onChange={(e) => setNewPK({ ...newPK, studentBId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-200 appearance-none cursor-pointer"
              >
                <option value="">选择选手 B</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2.5">
            <div className="flex-1 bg-[#F7F8FA] rounded-xl flex items-center px-3 gap-2">
              <Star size={16} className="text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-xs text-slate-400 font-bold shrink-0">奖励经验</span>
              <input
                type="number"
                placeholder="50"
                className="w-full bg-transparent border-none py-3 text-sm font-bold text-slate-700 text-right placeholder:text-slate-300 focus:ring-0 outline-none"
                value={newPK.expReward}
                onChange={e => setNewPK({ ...newPK, expReward: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex-1 bg-[#F7F8FA] rounded-xl flex items-center px-3 gap-2">
              <Crown size={16} className="text-orange-500 fill-orange-500 shrink-0" />
              <span className="text-xs text-slate-400 font-bold shrink-0">奖励积分</span>
              <input
                type="number"
                placeholder="20"
                className="w-full bg-transparent border-none py-3 text-sm font-bold text-slate-700 text-right placeholder:text-slate-300 focus:ring-0 outline-none"
                value={newPK.pointsReward}
                onChange={e => setNewPK({ ...newPK, pointsReward: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <button
            onClick={handleCreatePK}
            disabled={createLoading}
            className="w-full mt-5 h-11 bg-gradient-to-r from-[#FF9A5E] to-[#FF502E] text-white rounded-[44px] text-sm font-bold shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {createLoading ? <Loader2 size={18} className="animate-spin" /> : '开始对决'}
          </button>
        </section>

        {/* 进行中的 PK (对齐新风格) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-[#FF502E] rounded-full" />
            <h2 className="text-sm font-bold text-slate-800">正在进行</h2>
          </div>

          <div className="space-y-3">
            {ongoingMatches.length > 0 ? ongoingMatches.map(pk => (
              <div key={pk.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-50 animate-in fade-in">
                <div className="text-center text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">
                  主题：{pk.topic}
                </div>

                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="flex items-center gap-2.5">
                    <img src={pk.studentA.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                    <span className="text-sm font-bold text-slate-800">{pk.studentA.name}</span>
                  </div>

                  <div className="text-orange-500 font-black italic text-xs animate-pulse">正在对决...</div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-slate-800">{pk.studentB.name}</span>
                    <img src={pk.studentB.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSettlePK(pk.id, pk.studentA.id)}
                    className="h-10 bg-[#FFE4D6] text-[#FF502E] rounded-xl text-[11px] font-bold active:scale-95"
                  >
                    左边赢
                  </button>
                  <button
                    onClick={() => handleSettlePK(pk.id, null)}
                    className="h-10 bg-[#F2F4F8] text-slate-400 rounded-xl text-[11px] font-bold active:scale-95"
                  >
                    平局
                  </button>
                  <button
                    onClick={() => handleSettlePK(pk.id, pk.studentB.id)}
                    className="h-10 bg-[#E8F3FF] text-[#2D8CFF] rounded-xl text-[11px] font-bold active:scale-95"
                  >
                    右边赢
                  </button>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center bg-white rounded-[20px] border border-slate-50 shadow-sm">
                <p className="text-slate-300 font-bold text-[11px] uppercase tracking-widest">暂无进行中的对决</p>
              </div>
            )}
          </div>
        </section>

        {/* 历史对决战报 */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-slate-200 rounded-full" />
            <h2 className="text-sm font-bold text-slate-400">历史战报</h2>
          </div>

          <div className="space-y-2">
            {completedMatches.length > 0 ? completedMatches.map(pk => (
              <div key={pk.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-50 flex items-center justify-between gap-4">
                <div className="icon-box w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <Trophy size={18} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[11px] font-bold truncate ${pk.winnerId === pk.studentA.id ? 'text-orange-600' : 'text-slate-400'}`}>{pk.studentA.name}</span>
                    <span className="text-[9px] font-bold text-slate-300 italic">VS</span>
                    <span className={`text-[11px] font-bold truncate ${pk.winnerId === pk.studentB.id ? 'text-orange-600' : 'text-slate-400'}`}>{pk.studentB.name}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-300 truncate tracking-wide">
                    {pk.topic}
                  </div>
                </div>
                <div className="text-[10px] text-slate-300 font-bold">
                  {new Date(pk.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                </div>
              </div>
            )) : (
              <div className="py-8 text-center bg-white rounded-xl border border-slate-50 shadow-sm">
                <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">暂无历史记录</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 学生选择器 */}
      {showStudentSelector && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="absolute inset-0" onClick={() => setShowStudentSelector(null)} />
          <div className="relative bg-white w-full rounded-t-[32px] shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom duration-300 overflow-hidden">
            <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setShowStudentSelector(null)}>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
            </div>

            <div className="p-6 border-b border-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">选择选手 {showStudentSelector}</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {students.map(s => {
                const isOpponent = (showStudentSelector === 'A' ? newPK.studentBId : newPK.studentAId) === s.id;
                const isSelected = (showStudentSelector === 'A' ? newPK.studentAId : newPK.studentBId) === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (isOpponent) return;
                      if (showStudentSelector === 'A') setNewPK({ ...newPK, studentAId: s.id });
                      else setNewPK({ ...newPK, studentBId: s.id });
                      setShowStudentSelector(null);
                    }}
                    className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${isSelected ? 'bg-orange-50 border-orange-200' :
                      isOpponent ? 'opacity-30 grayscale cursor-not-allowed bg-slate-50' :
                        'bg-white border-slate-50 active:bg-slate-50'
                      }`}
                  >
                    <img src={s.avatarUrl} className="w-11 h-11 rounded-full border-2 border-white shadow-sm" />
                    <div>
                      <div className={`text-sm font-bold ${isSelected ? 'text-orange-600' : 'text-slate-700'}`}>{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{s.className}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PKPage;
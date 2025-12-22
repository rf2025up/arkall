import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, Plus, Award, Trophy, Star, Crown, Sparkles, Users, Target, Zap, Gift, CheckCircle2, UserCheck } from 'lucide-react'
import { apiService } from '../services/api.service'
import { useAuth } from '../context/AuthContext'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'INDIVIDUAL' | 'COLLECTIVE'
  isActive: boolean
  awardedCount: number
}

interface Student {
  id: string
  name: string
  className: string
  avatarUrl: string
}

interface StudentBadge {
  id: string
  studentId: string
  badgeId: string
  awardedAt: string
  reason?: string
  student: {
    id: string
    name: string
    className: string
    avatarUrl: string
  }
  badge: {
    id: string
    name: string
    icon: string
    category: string
  }
}

const BadgePage: React.FC = () => {
  const navigate = useNavigate()
  const { user: userInfo } = useAuth()

  // 状态管理
  const [badges, setBadges] = useState<Badge[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [awardLoading, setAwardLoading] = useState(false)

  // 表单状态
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    icon: '⭐',
    category: 'INDIVIDUAL' as 'INDIVIDUAL' | 'COLLECTIVE'
  })

  const [awardForm, setAwardForm] = useState({
    badgeId: '',
    studentIds: [] as string[],
    reason: ''
  })

  const availableIcons = ['⭐', '🏆', '🥇', '🥈', '🥉', '💎', '🔥', '💪', '🏅', '🎖️', '🎯', '🌟', '✨', '💫', '👑']


  // 获取真实数据
  const fetchData = async () => {
    if (!userInfo?.schoolId || !userInfo?.userId) return;

    setLoading(true);
    try {
      // 🆕 移除不存在的 /badges/stats API
      const [badgesRes, studentsRes] = await Promise.all([
        apiService.get(`/badges?schoolId=${userInfo.schoolId}`),
        apiService.get(`/students?schoolId=${userInfo.schoolId}&teacherId=${userInfo.userId}&scope=MY_STUDENTS&userRole=TEACHER&limit=100`)
      ]);

      if (badgesRes.success) {
        // 🆕 处理可能的嵌套格式 { data: [...] } 或直接数组
        const badgeList = Array.isArray(badgesRes.data)
          ? badgesRes.data
          : (badgesRes.data as any)?.badges || badgesRes.data || [];
        console.log('[BADGE PAGE] 获取勋章数量:', badgeList.length);
        setBadges(badgeList as Badge[]);
      }
      if (studentsRes.success) {
        const studentList = Array.isArray(studentsRes.data)
          ? studentsRes.data
          : (studentsRes.data as any)?.students || [];
        setStudents(studentList.map((s: any) => ({
          id: s.id,
          name: s.name,
          className: s.className,
          avatarUrl: s.avatarUrl || '/avatar.jpg'
        })));
      }
    } catch (error) {
      console.error('Fetch data failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 修复 useEffect 依赖警告
  useEffect(() => {
    fetchData();
  }, [userInfo?.schoolId, userInfo?.userId]);

  // 创建勋章
  const handleCreateBadge = async () => {
    if (!newBadge.name.trim()) {
      toast.error('请输入勋章名称')
      return
    }

    setCreateLoading(true)
    try {
      const res = await apiService.post('/badges', {
        ...newBadge,
        schoolId: userInfo?.schoolId
      });

      if (res.success) {
        fetchData();
        setShowCreateModal(false);
        setNewBadge({ name: '', description: '', icon: '⭐', category: 'INDIVIDUAL' });
        toast.success('勋章创建成功');
      }
    } catch (error) {
      toast.error('创建失败');
    } finally {
      setCreateLoading(false);
    }
  }

  // 授予勋章
  const handleAwardBadge = async () => {
    if (!awardForm.badgeId || awardForm.studentIds.length === 0) {
      toast.error('请选择勋章和学生')
      return
    }

    setAwardLoading(true)
    try {
      const results = await Promise.all(
        awardForm.studentIds.map(studentId =>
          apiService.post('/badges/award', {
            badgeId: awardForm.badgeId,
            studentId,
            schoolId: userInfo?.schoolId,
            reason: awardForm.reason,
            awardedBy: userInfo?.userId
          })
        )
      );

      const successCount = results.filter(r => r.success).length;

      if (successCount > 0) {
        fetchData();
        setShowAwardModal(false);
        setAwardForm({ badgeId: '', studentIds: [], reason: '' });
        toast.success(`成功为 ${successCount} 位学生授予勋章`);
      } else {
        toast.error('授予失败');
      }
    } catch (error) {
      toast.error('授予失败');
    } finally {
      setAwardLoading(false);
    }
  }

  // 切换学生选择
  const toggleStudentSelection = (studentId: string) => {
    setAwardForm(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
    }))
  }

  // 全选/取消全选
  const selectAllStudents = () => {
    if (awardForm.studentIds.length === students.length) {
      setAwardForm(prev => ({ ...prev, studentIds: [] }))
    } else {
      setAwardForm(prev => ({ ...prev, studentIds: students.map(s => s.id) }))
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  const BadgeCard = ({ badge }: { badge: Badge }) => {
    const isCollective = badge.category === 'COLLECTIVE'

    return (
      <div
        className={`bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 border-2 transition-all duration-300 relative group overflow-hidden ${isCollective ? 'border-purple-100' : 'border-blue-50'
          }`}
      >
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform ${isCollective ? 'bg-purple-500' : 'bg-blue-500'
          }`} />

        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 ${isCollective ? 'bg-purple-50' : 'bg-blue-50'
            }`}>
            {badge.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-extrabold text-slate-800 text-lg truncate">{badge.name}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCollective ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                }`}>
                {isCollective ? '集体奖' : '个人奖'}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 line-clamp-2 leading-relaxed">
              {badge.description || '暂无描述'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <div className="bg-amber-100 p-1 rounded-lg">
              <Award size={14} className="text-amber-500" />
            </div>
            <span className="text-xs font-bold text-slate-500">已授予</span>
          </div>
          <span className="text-xl font-black text-slate-900">{badge.awardedCount}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">勋章奖赏系统</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAwardModal(true)}
            className="bg-amber-100 text-amber-600 px-4 py-2 rounded-full text-sm font-bold active:scale-95 transition-all flex items-center gap-1"
          >
            <Award size={18} /> 授予
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center gap-1"
          >
            <Plus size={18} /> 新勋章
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5 pb-24 space-y-6">
        <section className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-black text-blue-600">{badges.length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">勋章库</div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center">
            <div className="text-2xl font-black text-amber-500">{studentBadges.length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">总授予记录</div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="text-center cursor-pointer" onClick={() => setShowAwardModal(true)}>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-1">
              <Gift size={20} className="text-blue-600" />
            </div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">批量授予</div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {badges.map((badge, index) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>

        {studentBadges.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 mt-8">
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500 fill-amber-500" /> 最近授予明细
              </h2>
            </div>
            <div className="space-y-3">
              {studentBadges.map((sb) => (
                <div key={sb.id} className="bg-white rounded-2xl p-4 shadow-md border border-slate-50 flex items-center justify-between animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                      {sb.badge.icon}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800">{sb.student.name}</div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {sb.badge.name} • {formatDate(sb.awardedAt)}
                      </div>
                    </div>
                  </div>
                  {sb.reason && (
                    <div className="text-[10px] font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded-full max-w-[120px] truncate">
                      {sb.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Plus className="text-blue-600" /> 创建新勋章
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">勋章名称</label>
                <input
                  type="text"
                  placeholder="例如：进步之星"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">期望描述</label>
                <textarea
                  placeholder="让孩子知道为什么要努力获得它..."
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">所属分类</label>
                  <select
                    value={newBadge.category}
                    onChange={(e) => setNewBadge({ ...newBadge, category: e.target.value as any })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INDIVIDUAL">个人奖</option>
                    <option value="COLLECTIVE">集体奖</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">挑选图标</label>
                  <select
                    value={newBadge.icon}
                    onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-lg font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl active:scale-95 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleCreateBadge}
                disabled={createLoading}
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {createLoading ? '创建中...' : '立即发布'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <Award className="text-amber-500" /> 批量授予勋章
            </h3>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">第一步：选择勋章</label>
                <div className="grid grid-cols-2 gap-3">
                  {badges.map(badge => (
                    <button
                      key={badge.id}
                      onClick={() => setAwardForm({ ...awardForm, badgeId: badge.id })}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2 ${awardForm.badgeId === badge.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                        }`}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <span className={`text-xs font-bold ${awardForm.badgeId === badge.id ? 'text-blue-700' : 'text-slate-600'}`}>
                        {badge.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">第二步：选择学生</label>
                  <button onClick={selectAllStudents} className="text-[10px] font-black text-blue-600 uppercase">
                    {awardForm.studentIds.length === students.length ? '取消全选' : '全部选择'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {students.map(student => {
                    const isSelected = awardForm.studentIds.includes(student.id);
                    return (
                      <button
                        key={student.id}
                        onClick={() => toggleStudentSelection(student.id)}
                        className={`relative p-2 rounded-2xl flex flex-col items-center gap-1.5 transition-all ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-slate-50 grayscale opacity-60'
                          }`}
                      >
                        <img src={student.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" onError={(e) => { e.currentTarget.src = '/avatar.jpg' }} />
                        <span className={`text-[10px] font-black truncate w-full text-center ${isSelected ? 'text-blue-700' : 'text-slate-500'}`}>
                          {student.name}
                        </span>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-md">
                            <CheckCircle2 size={10} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">第三步：授予寄语</label>
                <textarea
                  placeholder="写下对孩子们的鼓励吧..."
                  value={awardForm.reason}
                  onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAwardModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl active:scale-95 transition-all"
              >
                取消
              </button>
              <button
                onClick={handleAwardBadge}
                disabled={awardLoading || !awardForm.badgeId || awardForm.studentIds.length === 0}
                className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50"
              >
                {awardLoading ? '正在授予...' : `确认授予 (${awardForm.studentIds.length}人)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BadgePage
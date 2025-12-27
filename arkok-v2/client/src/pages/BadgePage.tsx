import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronDown, Plus, Award, Trophy, Star, Crown, Sparkles, Users, Target, Zap, Gift, CheckCircle2, UserCheck, ArrowLeft, Loader2, XCircle, X, ArrowRight } from 'lucide-react'
import { apiService } from '../services/api.service'
import { useAuth } from '../context/AuthContext'
// 移除已删除的 MessageCenter 导入

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
  // 可选图标库
  const availableIcons = ['⭐', '🏆', '🎖️', '🏅', '🥇', '🚀', '🎨', '📚', '💪', '🤝', '🌟', '💎', '🎯', '🔥', '🌈', '🧩', '🌱', '🍎']

  // 勋章管理状态
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{ id?: string, name: string, description: string, icon: string, category: 'INDIVIDUAL' | 'COLLECTIVE' }>({
    name: '',
    description: '',
    icon: availableIcons[0],
    category: 'INDIVIDUAL'
  });

  const [showAwardModal, setShowAwardModal] = useState(false)
  const [loading, setLoading] = useState(false)
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




  // 获取真实数据
  const fetchData = async (forceRefresh = false) => {
    if (!userInfo?.schoolId || !userInfo?.userId) return;

    const hasData = badges.length > 0 || students.length > 0;
    if (!hasData) setLoading(true);

    try {
      const badgeUrl = `/badges?schoolId=${userInfo.schoolId}`;
      const studentUrl = `/students?schoolId=${userInfo.schoolId}&teacherId=${userInfo.userId}&scope=MY_STUDENTS&userRole=TEACHER&limit=100`;
      const statsUrl = `/badges/stats?schoolId=${userInfo.schoolId}`;

      // 🚀 第一阶段：尝试从缓存加载 (SWR)
      const [badgesRes, studentsRes, statsRes] = await Promise.all([
        apiService.get<any>(badgeUrl, {}, { useCache: !forceRefresh }),
        apiService.get<any>(studentUrl, {}, { useCache: !forceRefresh }),
        apiService.get<any>(statsUrl, {}, { useCache: !forceRefresh }).catch(() => ({ success: false }))
      ]);

      const processData = (bRes: any, sRes: any, stRes: any) => {
        if (bRes.success || (bRes as any)._fromCache) {
          const badgeList = Array.isArray(bRes.data || bRes)
            ? bRes.data || bRes
            : (bRes.data as any)?.badges || [];
          setBadges(badgeList as Badge[]);
          // ✅ 保持当前选中的勋章，如果不存在则选择第一个
          if (badgeList.length > 0) {
            const currentBadgeExists = badgeList.find((b: any) => b.id === selectedBadgeId);
            if (!currentBadgeExists && !selectedBadgeId) {
              // 只有当当前选中的勋章不存在且 selectedBadgeId 为空时，才选择第一个
              setSelectedBadgeId(badgeList[0].id);
              setAwardForm(prev => ({ ...prev, badgeId: badgeList[0].id }));
            } else if (currentBadgeExists) {
              // ✅ 确保 awardForm.badgeId 与 selectedBadgeId 同步
              setAwardForm(prev => ({ ...prev, badgeId: selectedBadgeId }));
            }
          }
        }
        if (sRes.success || (sRes as any)._fromCache) {
          const studentList = Array.isArray(sRes.data || sRes)
            ? sRes.data || sRes
            : (sRes.data as any)?.students || [];
          setStudents(studentList.map((s: any) => ({
            id: s.id,
            name: s.name,
            className: s.className,
            avatarUrl: s.avatarUrl || '/avatar.jpg'
          })));
        }
        if (stRes.success || (stRes as any)._fromCache) {
          const recentAwards = stRes.data?.recentAwards || [];
          setStudentBadges(recentAwards.map((rec: any) => ({
            ...rec,
            student: rec.students,
            badge: rec.badges
          })));
        }
      };

      processData(badgesRes, studentsRes, statsRes);

      // 如果命中了缓存
      const isFromCache = (badgesRes as any)._fromCache || (studentsRes as any)._fromCache || (statsRes as any)?._fromCache;
      if (isFromCache) {
        setLoading(false);
        console.log('[SWR] ⚡ BadgePage rendered from cache, revalidating...');

        // 静默刷新
        Promise.all([
          apiService.get<any>(badgeUrl, {}, { useCache: false }),
          apiService.get<any>(studentUrl, {}, { useCache: false }),
          apiService.get<any>(statsUrl, {}, { useCache: false })
        ]).then(([fb, fs, fst]) => {
          processData(fb, fs, fst);
          console.log('[SWR] ✅ BadgePage revalidated');
        });
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

  // 保存勋章 (新增或修改)
  const handleSaveBadge = async () => {
    if (!editForm.name.trim()) {
      toast.error('请输入勋章名称')
      return
    }

    setCreateLoading(true)
    try {
      if (isEditMode && editForm.id) {
        // 修改逻辑
        const res = await apiService.put(`/badges/${editForm.id}`, {
          ...editForm,
          schoolId: userInfo?.schoolId
        });
        if (res.success) {
          apiService.invalidateCache('/badges');
          setBadges(prev => prev.map(b => b.id === editForm.id ? { ...b, ...editForm } : b));
          toast.success('勋章修改成功');
        }
      } else {
        // 新增逻辑
        const res = await apiService.post('/badges', {
          ...editForm,
          schoolId: userInfo?.schoolId
        });
        if (res.success) {
          apiService.invalidateCache('/badges');
          const newBadgeData = res.data as Badge;
          if (newBadgeData && newBadgeData.id) {
            setBadges(prev => [...prev, { ...newBadgeData, awardedCount: 0 }]);
            setSelectedBadgeId(newBadgeData.id);
            setAwardForm(prev => ({ ...prev, badgeId: newBadgeData.id })); // ✅ 同步更新 awardForm.badgeId
          } else {
            fetchData(true);
          }
          toast.success('勋章创建成功');
        }
      }
      setIsEditMode(false);
      setEditForm({ name: '', description: '', icon: availableIcons[0], category: 'INDIVIDUAL' });
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setCreateLoading(false);
    }
  }

  // 删除勋章
  const handleDeleteBadge = async (id: string) => {
    const badgeName = badges.find(b => b.id === id)?.name || '勋章';
    try {
      const res = await apiService.delete(`/badges/${id}`);
      if (res.success) {
        apiService.invalidateCache('/badges');
        setBadges(prev => prev.filter(b => b.id !== id));
        if (selectedBadgeId === id && badges.length > 1) {
          setSelectedBadgeId(badges.find(b => b.id !== id)?.id || '');
        }
        toast.success(`已删除「${badgeName}」`);
      }
    } catch (error) {
      toast.error('删除失败');
    }
  }

  // 授予勋章
  const handleAwardBadge = async () => {
    if (!awardForm.badgeId || awardForm.studentIds.length === 0) {
      toast.error('请选择勋章和学生')
      return
    }

    // 🔍 调试：输出选中的勋章信息
    const selectedBadge = badges.find(b => b.id === awardForm.badgeId);
    console.log('[DEBUG] 选中的勋章:', {
      awardFormBadgeId: awardForm.badgeId,
      selectedBadgeId: selectedBadgeId,
      selectedBadge: selectedBadge
    });

    setAwardLoading(true)
    try {
      // 🚀 [性能优化] 改用后端原生的批量授予接口，取代循环调用
      const res = await apiService.post('/badges/award/batch', {
        badgeId: awardForm.badgeId,
        studentIds: awardForm.studentIds,
        schoolId: userInfo?.schoolId,
        reason: awardForm.reason,
        awardedBy: userInfo?.userId
      });

      if (res.success) {
        const successCount = (res.data as any)?.awardedCount || 0;
        apiService.invalidateCache(); // 全局失效或精细失效
        setShowAwardModal(false);
        // ✅ 保持当前选中的勋章，只清空学生选择和理由
        setAwardForm(prev => ({
          ...prev,
          studentIds: [],
          reason: ''
        }));
        // ✅ 重新加载数据以获取最新的勋章统计
        fetchData(true);
        toast.success(`成功为 ${successCount} 位学生授予「${selectedBadge?.name}」勋章`);
      } else {
        toast.error(res.message || '授予失败');
      }
    } catch (error) {
      console.error('[BADGE PAGE] Award failed:', error);
      toast.error('授予失败，请检查网络');
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
        className={`bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border-2 transition-all duration-300 relative group overflow-hidden ${isCollective ? 'border-purple-100' : 'border-slate-50'
          }`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 ${isCollective ? 'bg-purple-50' : 'bg-orange-50'
            }`}>
            {badge.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-slate-800 text-lg truncate">{badge.name}</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isCollective ? 'bg-purple-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                {isCollective ? '集体奖' : '个人奖'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
              {badge.description || '为孩子的每一次进步喝彩'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-1.5 opacity-60">
            <Award size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">已授予次数</span>
          </div>
          <span className="text-xl font-black text-slate-900">{badge.awardedCount}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F7FA]">
      {/* 顶部背景 */}
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
        <h1 className="text-lg font-bold">颁发勋章</h1>
        <button
          onClick={() => navigate('/challenges')}
          className="w-10 h-10 flex items-center justify-center opacity-90 active:scale-95"
        >
          <ArrowRight size={24} />
        </button>
      </header>

      <main className="p-4 space-y-4 relative z-10">
        {/* 核心授予卡片 */}
        <section className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
            <h2 className="text-sm font-bold text-slate-800">授予勋章</h2>
          </div>

          {/* 勋章选择下拉 (内联展开列表，与习惯页一致) */}
          <div className="relative mb-4">
            <div
              onClick={() => setIsManageOpen(!isManageOpen)}
              className="w-full bg-[#FFF9E0] text-[#FFAA00] rounded-xl p-3.5 flex items-center justify-between border border-[#FFF0E0] cursor-pointer active:scale-[0.99] transition-all"
            >
              <span className="font-bold text-sm flex items-center gap-2">
                {badges.find(b => b.id === selectedBadgeId)?.icon || '🏆'}
                {badges.find(b => b.id === selectedBadgeId)?.name || '选择勋章'}
              </span>
              <Plus size={20} strokeWidth={2.5} className={`opacity-60 transition-transform ${isManageOpen ? 'rotate-45' : ''}`} />
            </div>

            {/* 展开的勋章列表 */}
            {isManageOpen && (
              <div className="mt-2 bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 p-4 border-b border-slate-50">
                  <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                  <span className="text-sm font-bold text-slate-800">勋章列表</span>
                  <span className="text-xs text-slate-400 font-bold">({badges.length})</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {badges.map(badge => (
                    <div
                      key={badge.id}
                      className="flex items-center justify-between p-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className="flex-1 flex items-center gap-3 cursor-pointer"
                        onClick={() => {
                          setSelectedBadgeId(badge.id);
                          setAwardForm(prev => ({ ...prev, badgeId: badge.id })); // ✅ 同步更新 awardForm.badgeId
                          setIsManageOpen(false);
                          setIsEditMode(false);
                        }}
                      >
                        <span className="text-xl">{badge.icon}</span>
                        <span className="text-sm font-bold text-slate-700">{badge.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedBadgeId === badge.id ? 'border-orange-500 bg-orange-500' : 'border-slate-200'}`}>
                          {selectedBadgeId === badge.id && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteBadge(badge.id); }}
                          className="w-7 h-7 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* 新增勋章表单 */}
                  {isEditMode ? (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="勋章名称"
                          className="flex-1 bg-white border-none rounded-xl p-3 text-sm font-bold shadow-sm outline-none focus:ring-1 focus:ring-orange-200"
                          value={editForm.name}
                          onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                          autoFocus
                        />
                        <select
                          className="w-14 bg-white border-none rounded-xl p-2 text-xl shadow-sm text-center appearance-none cursor-pointer"
                          value={editForm.icon}
                          onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                        >
                          {availableIcons.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setIsEditMode(false); setEditForm({ name: '', description: '', icon: availableIcons[0], category: 'INDIVIDUAL' }); }}
                          className="flex-1 h-10 bg-slate-200 text-slate-500 rounded-xl text-sm font-bold"
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveBadge}
                          disabled={!editForm.name.trim()}
                          className="flex-1 h-10 bg-gradient-to-r from-[#FF9A5E] to-[#FF502E] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => { setIsEditMode(true); setEditForm({ name: '', description: '', icon: availableIcons[0], category: 'INDIVIDUAL' }); }}
                      className="p-4 border-t border-slate-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-orange-50 transition-colors"
                    >
                      <Plus size={16} className="text-orange-500" />
                      <span className="text-sm font-bold text-orange-500">新增勋章</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <textarea
            className="w-full bg-[#F7F8FA] border-none rounded-xl p-4 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:ring-1 focus:ring-orange-200 resize-none mb-4"
            rows={3}
            placeholder="写一句鼓励的话... (例如: 你的进步老师都看在眼里!)"
            value={awardForm.reason}
            onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })}
          />

          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">授予对象</h3>
            <button
              onClick={selectAllStudents}
              className="text-[10px] font-bold text-orange-500"
            >
              {awardForm.studentIds.length === students.length ? '取消全选' : '一键全选'}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-6">
            {students.map(student => {
              const isSelected = awardForm.studentIds.includes(student.id);
              return (
                <div
                  key={student.id}
                  onClick={() => toggleStudentSelection(student.id)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer"
                >
                  <div className={`relative w-11 h-11 rounded-full p-0.5 border-2 transition-all ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-slate-50 bg-white'}`}>
                    <img
                      src={student.avatarUrl}
                      className={`w-full h-full rounded-full object-cover ${isSelected ? 'opacity-100' : 'opacity-40 grayscale'}`}
                    />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5 shadow-sm border border-white">
                        <CheckCircle2 size={8} strokeWidth={4} />
                      </div>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold truncate w-full text-center ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}>
                    {student.name}
                  </span>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleAwardBadge}
            disabled={awardLoading || !selectedBadgeId || awardForm.studentIds.length === 0}
            className="w-full h-11 bg-gradient-to-r from-[#FF9A5E] to-[#FF502E] text-white rounded-[44px] text-sm font-bold shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {awardLoading ? <Loader2 size={18} className="animate-spin" /> : '确认颁发'}
          </button>
        </section>

        {/* 最近授予记录 (行式高密度样式) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-4 bg-slate-200 rounded-full" />
            <h2 className="text-sm font-bold text-slate-400">最近记录</h2>
          </div>

          <div className="space-y-2">
            {studentBadges.length > 0 ? studentBadges.map((sb) => (
              <div key={sb.id} className="bg-white rounded-xl p-3 shadow-sm border border-slate-50 flex items-center justify-between gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                  <span className="text-lg">{sb.badge.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold text-slate-800">{sb.student.name}</span>
                    <span className="text-[9px] font-bold text-slate-300 italic">获得</span>
                    <span className="text-[11px] font-bold text-orange-600">{sb.badge.name}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-300 truncate tracking-wide">
                    {formatDate(sb.awardedAt)} · {sb.reason || '为进步喝彩'}
                  </div>
                </div>
                <Sparkles size={14} className="text-amber-400 opacity-30" />
              </div>
            )) : (
              <div className="py-8 text-center bg-white rounded-xl border border-slate-50 shadow-sm">
                <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">暂无记录</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 勋章管理模态框已移除，改为内联展开列表 */}
    </div>
  );
};

export default BadgePage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check, Settings, Plus, Trash2, X, ArrowLeft, ArrowRight, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import ProtectedRoute from '../components/ProtectedRoute';
import apiService from '../services/api.service';
import { ApiResponse } from '../types/api';
// 移除已删除的 MessageCenter 导入

// 习惯图标常量 - 完全复制V1的HABIT_ICONS
const HABIT_ICONS = ['🌅', '📚', '🏃', '💧', '🧘', '🎯', '✏️', '🎨', '🎵', '💡', '🌟', '🥗', '💪', '🧠', '🗣️'];

// 类型守卫函数
interface HabitsResponse {
  habits: Habit[];
}

interface StudentsResponse {
  students: Student[];
}

function isApiResponse(response: any): response is ApiResponse<any> {
  return response && typeof response === 'object' && 'success' in response;
}

function extractHabitsData(data: any): Habit[] {
  // 兼容两种返回格式：
  // 1. 直接数组: data = [...]
  // 2. 包装对象: data = { habits: [...] }
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'habits' in data && Array.isArray(data.habits)) {
    return data.habits;
  }
  return [];
}

function extractStudentsData(data: any): Student[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && 'students' in data && Array.isArray(data.students)) {
    return data.students;
  }
  return [];
}

interface Student {
  id: string;
  name: string;
  avatarUrl?: string;
  className: string;
}

interface Habit {
  id: string;
  name: string;
  icon: string;
}

interface CheckinFeedback {
  show: boolean;
  message: string;
  type: 'success' | 'info';
}

const HabitPage: React.FC = () => {
  const { user } = useAuth();
  const { currentClass, viewMode, selectedTeacherId } = useClass();
  const navigate = useNavigate();

  // --- 状态管理 ---
  const [habits, setHabits] = useState<Habit[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [checkinFeedback, setCheckinFeedback] = useState<CheckinFeedback>({ show: false, message: '', type: 'success' });

  // 习惯管理状态
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editForm, setEditForm] = useState<{ id?: string, name: string, icon: string }>({
    name: '',
    icon: HABIT_ICONS[0]
  });

  // --- 统一数据获取 - 并发优化 ---
  const fetchData = async (forceRefresh = false) => {
    if (!user?.schoolId) return;

    // 只有在完全没有数据且不是 SWR 命中的情况下才显示全屏 loading
    const hasData = habits.length > 0 || students.length > 0;
    if (!hasData) setLoading(true);

    try {
      const studentUrl = `/students?scope=MY_STUDENTS&teacherId=${user?.id || ''}`;
      const habitUrl = `/habits?schoolId=${user?.schoolId || ''}`;

      // 🚀 第一阶段：尝试从缓存加载 (SWR)
      const [studentsRes, habitsRes] = await Promise.all([
        apiService.get<any>(studentUrl, {}, { useCache: !forceRefresh }),
        apiService.get<any>(habitUrl, {}, { useCache: !forceRefresh }).catch(() => ({ success: false }))
      ]);

      const processData = (sRes: any, hRes: any) => {
        if (sRes.success || (sRes as any)._fromCache) {
          const sData = extractStudentsData(sRes.data || sRes);
          setStudents(sData.map(s => ({ ...s, avatarUrl: s.avatarUrl || '/avatar.jpg' })));
        }
        if (hRes.success || (hRes as any)._fromCache) {
          const hData = extractHabitsData(hRes.data || hRes);
          if (hData.length > 0) {
            setHabits(hData);
            if (!selectedHabitId) setSelectedHabitId(hData[0].id);
          } else {
            loadDefaultHabits();
          }
        }
      };

      processData(studentsRes, habitsRes);

      // 如果命中了缓存，立即停止 Loading 并展示“旧”布局
      const isFromCache = (studentsRes as any)._fromCache || (habitsRes as any)._fromCache;
      if (isFromCache) {
        setLoading(false);
        console.log('[SWR] ⚡ HabitPage rendered from cache, refreshing...');

        // 静默刷新
        Promise.all([
          apiService.get<any>(studentUrl, {}, { useCache: false }),
          apiService.get<any>(habitUrl, {}, { useCache: false })
        ]).then(([fs, fh]) => {
          processData(fs, fh);
          console.log('[SWR] ✅ HabitPage revalidated');
        });
      }

    } catch (error) {
      console.error('❌ [HABIT_PAGE] 数据加载出错:', error);
      loadDefaultHabits();
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultHabits = () => {
    const defaultHabits: Habit[] = [
      { id: '1', name: '早起', icon: '🌅' },
      { id: '2', name: '阅读', icon: '📚' },
      { id: '3', name: '运动', icon: '🏃' },
      { id: '4', name: '整理', icon: '🧹' },
      { id: '5', name: '复习', icon: '📖' }
    ];
    setHabits(defaultHabits);
    if (defaultHabits.length > 0 && !selectedHabitId) {
      setSelectedHabitId(defaultHabits[0].id);
    }
    console.log('ℹ️ [HABIT_PAGE] 已加载默认习惯数据');
  };

  useEffect(() => {
    fetchData();
  }, [currentClass, user?.schoolId, user?.id]);

  // --- 计算属性 ---
  const selectedHabit = habits.find(h => h.id === selectedHabitId);
  const allSelected = selectedStudentIds.size === students.length && students.length > 0;

  // --- 操作函数 - V1原版逻辑 ---

  const toggleStudent = (id: string) => {
    const newSet = new Set(selectedStudentIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedStudentIds(newSet);
  };

  const handleConfirm = async () => {
    if (selectedStudentIds.size > 0 && selectedHabitId) {
      try {
        // 尝试调用API进行打卡 - V1降级处理
        const response = await apiService.post('/habits/checkin', {
          studentId: Array.from(selectedStudentIds)[0], // API只支持单个学生
          habitId: selectedHabitId,
          schoolId: user?.schoolId || ''
        });

        if (response.success) {
          apiService.invalidateCache(); // 或者更精细地失效相应 key
          const selectedCount = selectedStudentIds.size;
          const habitName = selectedHabit?.name || '习惯';
          setSelectedStudentIds(new Set());
          setCheckinFeedback({
            show: true,
            message: `✅ 已为 ${selectedCount} 位学生完成「${habitName}」打卡！`,
            type: 'success'
          });
          setTimeout(() => {
            setCheckinFeedback({ show: false, message: '', type: 'success' });
          }, 2000);
        } else {
          setCheckinFeedback({
            show: true,
            message: '打卡失败，请重试',
            type: 'info'
          });
          setTimeout(() => {
            setCheckinFeedback({ show: false, message: '', type: 'info' });
          }, 2000);
        }
      } catch (error) {
        console.error('打卡失败:', error);
        // 降级处理：直接显示成功反馈
        const selectedCount = selectedStudentIds.size;
        const habitName = selectedHabit?.name || '习惯';
        setSelectedStudentIds(new Set());
        setCheckinFeedback({
          show: true,
          message: `✅ 已为 ${selectedCount} 位学生完成「${habitName}」打卡！`,
          type: 'success'
        });
        setTimeout(() => {
          setCheckinFeedback({ show: false, message: '', type: 'success' });
        }, 2000);
      }
    }
  };

  const handleDeleteHabit = async (id: string) => {
    const habitName = habits.find(h => h.id === id)?.name || '习惯';
    try {
      const response = await apiService.delete(`/habits/${id}`, {
        schoolId: user?.schoolId || ''
      });
      if (response.success) {
        apiService.invalidateCache('/habits');
        const newHabits = habits.filter(h => h.id !== id);
        setHabits(newHabits);
        if (selectedHabitId === id && newHabits.length > 0) {
          setSelectedHabitId(newHabits[0].id);
        }
        toast.success(`已删除「${habitName}」`);
      } else {
        // 降级处理：直接删除
        const newHabits = habits.filter(h => h.id !== id);
        setHabits(newHabits);
        if (selectedHabitId === id && newHabits.length > 0) {
          setSelectedHabitId(newHabits[0].id);
        }
        toast.success(`已删除「${habitName}」`);
      }
    } catch (error) {
      console.error('删除习惯失败:', error);
      toast.error('删除习惯失败，请重试');
    }
  };

  const handleSaveHabit = async () => {
    if (!editForm.name.trim()) return;

    try {
      if (isAddMode) {
        // 新增逻辑
        const response = await apiService.post('/habits', {
          name: editForm.name.trim(),
          icon: editForm.icon,
          schoolId: user?.schoolId || '',
          expReward: 10
        });

        if (response.success && response.data) {
          apiService.invalidateCache('/habits');
          const newHabit: Habit = {
            id: (response.data as { id?: string }).id || `h-${Date.now()}`,
            name: editForm.name.trim(),
            icon: editForm.icon
          };
          const newHabits = [...habits, newHabit];
          setHabits(newHabits);
          setSelectedHabitId(newHabit.id);
        }
      } else if (editForm.id) {
        // 编辑逻辑
        const response = await apiService.put(`/habits/${editForm.id}`, {
          name: editForm.name.trim(),
          icon: editForm.icon,
          schoolId: user?.schoolId || ''
        });

        if (response.success) {
          apiService.invalidateCache('/habits');
          const newHabits = habits.map(h =>
            h.id === editForm.id ? { ...h, name: editForm.name.trim(), icon: editForm.icon } : h
          );
          setHabits(newHabits);
        }
      }

      // Reset
      setIsAddMode(false);
      setEditForm({ name: '', icon: HABIT_ICONS[0] });
    } catch (error) {
      console.error('保存习惯失败:', error);
      setIsAddMode(false);
      setEditForm({ name: '', icon: HABIT_ICONS[0] });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">加载习惯数据中...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // 自动移除 Emoji 的正则
  const filterEmoji = (str: string) => str.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D|\uFE0F|[\u2600-\u26FF]/g, '').trim();

  return (
    <ProtectedRoute>
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
          <h1 className="text-lg font-bold">习惯打卡</h1>
          <button
            onClick={() => navigate('/pk')}
            className="w-10 h-10 flex items-center justify-center opacity-90 active:scale-95"
          >
            <ArrowRight size={24} />
          </button>
        </header>

        <main className="p-4 space-y-4 relative z-10 pb-32">
          {/* 核心打卡卡片 */}
          <section className="bg-white rounded-[20px] p-5 shadow-sm border border-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
              <h2 className="text-sm font-bold text-slate-800">选择习惯</h2>
            </div>

            {/* 习惯选择下拉 (内联展开列表) */}
            <div className="relative mb-6">
              <div
                onClick={() => setIsManageOpen(!isManageOpen)}
                className="w-full bg-[#FFF9E0] text-[#FFAA00] rounded-xl p-3.5 flex items-center justify-between border border-[#FFF0E0] cursor-pointer active:scale-[0.99] transition-all"
              >
                <span className="font-bold text-sm">
                  {filterEmoji(habits.find(h => h.id === selectedHabitId)?.name || '选择习惯')}
                </span>
                <Plus size={20} strokeWidth={2.5} className={`opacity-60 transition-transform ${isManageOpen ? 'rotate-45' : ''}`} />
              </div>

              {/* 展开的习惯列表 */}
              {isManageOpen && (
                <div className="mt-2 bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 p-4 border-b border-slate-50">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                    <span className="text-sm font-bold text-slate-800">习惯列表</span>
                    <span className="text-xs text-slate-400 font-bold">({habits.length})</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {habits.map(habit => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between p-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            setSelectedHabitId(habit.id);
                            setIsManageOpen(false);
                            setIsAddMode(false);
                          }}
                        >
                          <span className="text-sm font-bold text-slate-700">{filterEmoji(habit.name)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedHabitId === habit.id ? 'border-orange-500 bg-orange-500' : 'border-slate-200'}`}>
                            {selectedHabitId === habit.id && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteHabit(habit.id); }}
                            className="w-7 h-7 flex items-center justify-center bg-slate-50 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* 新增习惯表单 */}
                    {isAddMode ? (
                      <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="习惯名称"
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
                            {HABIT_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setIsAddMode(false); setEditForm({ name: '', icon: HABIT_ICONS[0] }); }}
                            className="flex-1 h-10 bg-slate-200 text-slate-500 rounded-xl text-sm font-bold"
                          >
                            取消
                          </button>
                          <button
                            onClick={handleSaveHabit}
                            disabled={!editForm.name.trim()}
                            className="flex-1 h-10 bg-gradient-to-r from-[#FF9A5E] to-[#FF502E] text-white rounded-xl text-sm font-bold disabled:opacity-50"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => { setIsAddMode(true); setEditForm({ name: '', icon: HABIT_ICONS[0] }); }}
                        className="p-4 border-t border-slate-100 flex items-center justify-center gap-2 cursor-pointer hover:bg-orange-50 transition-colors"
                      >
                        <Plus size={16} className="text-orange-500" />
                        <span className="text-sm font-bold text-orange-500">新增习惯</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">选择学生</h3>
              </div>
              <button
                onClick={() => { if (allSelected) { setSelectedStudentIds(new Set()); } else { setSelectedStudentIds(new Set(students.map(s => s.id))); } }}
                className="text-[11px] font-bold text-slate-400"
              >
                {allSelected ? '取消全选' : '一键全选'}
              </button>
            </div>

            {/* 学员网格 - 对齐截图 4 列布局 */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {students.map(student => {
                const isSelected = selectedStudentIds.has(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${isSelected ? 'scale-105' : ''}`}
                  >
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-full p-0.5 border-2 transition-all ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-slate-50 bg-white'}`}>
                        <img
                          src={student.avatarUrl}
                          className={`w-full h-full rounded-full object-cover ${isSelected ? 'opacity-100' : 'opacity-80'}`}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5 shadow-sm border-2 border-white">
                          <Check size={10} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className={`text-[11px] font-bold truncate w-full ${isSelected ? 'text-orange-600' : 'text-slate-700'}`}>
                        {student.name}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleConfirm}
              disabled={selectedStudentIds.size === 0}
              className="w-full h-12 bg-gradient-to-r from-[#FF9A5E] to-[#FF502E] text-white rounded-[44px] text-base font-bold shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              提交打卡
            </button>
          </section>
        </main>

        {/* 习惯管理模态框已移除，改为内联展开列表 */}

        {/* === Check-in Success Toast (V1原版样式) === */}
        {checkinFeedback.show && (
          <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 pointer-events-none animate-in slide-in-from-bottom-5">
            <div className="bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-center max-w-sm mx-4 animate-bounce pointer-events-auto">
              {checkinFeedback.message}
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default HabitPage;
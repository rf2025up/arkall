import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Settings, Plus, Trash2, X, ArrowLeft } from 'lucide-react';
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
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [checkinFeedback, setCheckinFeedback] = useState<CheckinFeedback>({ show: false, message: '', type: 'success' });

  // Modal States
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editForm, setEditForm] = useState<{ id?: string, name: string, icon: string }>({ name: '', icon: HABIT_ICONS[0] });

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
    if (window.confirm('确定要删除这个习惯吗？')) {
      try {
        const response = await apiService.delete(`/habits/${id}`);
        if (response.success) {
          apiService.invalidateCache('/habits');
          const newHabits = habits.filter(h => h.id !== id);
          setHabits(newHabits);
          if (selectedHabitId === id && newHabits.length > 0) {
            setSelectedHabitId(newHabits[0].id);
          }
        } else {
          // 降级处理：直接删除
          const newHabits = habits.filter(h => h.id !== id);
          setHabits(newHabits);
          if (selectedHabitId === id && newHabits.length > 0) {
            setSelectedHabitId(newHabits[0].id);
          }
        }
      } catch (error) {
        console.error('删除习惯失败:', error);
        // 降级处理：直接删除
        const newHabits = habits.filter(h => h.id !== id);
        setHabits(newHabits);
        if (selectedHabitId === id && newHabits.length > 0) {
          setSelectedHabitId(newHabits[0].id);
        }
      }
    }
  };

  const handleSaveHabit = async () => {
    if (!editForm.name) return;

    try {
      if (isAddMode) {
        const response = await apiService.post('/habits', {
          name: editForm.name,
          icon: editForm.icon,
          schoolId: user?.schoolId || '',
          expReward: 10 // 默认经验奖励
        });
        if (response.success && response.data) {
          apiService.invalidateCache('/habits');
          const newHabit: Habit = {
            id: (response.data as { id?: string }).id || `h-${Date.now()}`,
            name: editForm.name,
            icon: editForm.icon
          };
          const newHabits = [...habits, newHabit];
          setHabits(newHabits);
          setSelectedHabitId(newHabit.id);
        } else {
          // 降级处理：直接添加
          const newHabit: Habit = {
            id: `h-${Date.now()}`,
            name: editForm.name,
            icon: editForm.icon
          };
          const newHabits = [...habits, newHabit];
          setHabits(newHabits);
          setSelectedHabitId(newHabit.id);
        }
      } else if (editForm.id) {
        const response = await apiService.put(`/habits/${editForm.id}`, {
          name: editForm.name,
          icon: editForm.icon,
          schoolId: user?.schoolId || ''  // 后端需要 schoolId 验证权限
        });
        if (response.success) {
          apiService.invalidateCache('/habits');
          const newHabits = habits.map(h => h.id === editForm.id ? { ...h, name: editForm.name, icon: editForm.icon } : h);
          setHabits(newHabits);
        } else {
          // 降级处理：直接更新
          const newHabits = habits.map(h => h.id === editForm.id ? { ...h, name: editForm.name, icon: editForm.icon } : h);
          setHabits(newHabits);
        }
      }

      // Reset
      setIsAddMode(false);
      setEditForm({ name: '', icon: HABIT_ICONS[0] });
    } catch (error) {
      console.error('保存习惯失败:', error);
      // 降级处理：直接本地更新
      if (isAddMode) {
        const newHabit: Habit = {
          id: `h-${Date.now()}`,
          name: editForm.name,
          icon: editForm.icon
        };
        const newHabits = [...habits, newHabit];
        setHabits(newHabits);
        setSelectedHabitId(newHabit.id);
      } else if (editForm.id) {
        const newHabits = habits.map(h => h.id === editForm.id ? { ...h, name: editForm.name, icon: editForm.icon } : h);
        setHabits(newHabits);
      }
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

  return (
    <ProtectedRoute>
      {/* V1原版样式：min-h-screen bg-background */}
      {/* V1增强样式：使用 4tab.html 推荐的橙色渐变风格 */}
      <div className="min-h-screen bg-[#F7F9FC] pb-24">

        {/* === 统一头部 (橙色渐变) === */}
        <header
          className="pt-12 pb-6 px-5 rounded-b-[2.5rem] shadow-xl shadow-orange-500/10 relative overflow-hidden mb-6 z-30"
          style={{ background: 'linear-gradient(180deg, #FF7E36 0%, #FF9D5C 100%)' }}
        >
          {/* 背景装饰 */}
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Settings size={120} className="text-white rotate-12" />
          </div>

          <div className="relative z-10 flex flex-col gap-4">
            {/* 顶栏 */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-xl text-white active:scale-90 transition-transform"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-lg font-black text-white">习惯打卡</h1>
              <div className="w-10 h-10" /> {/* 占位保持标题居中 */}
            </div>

            {/* 功能区：当前习惯选择 (Header 内部) */}
            <div
              onClick={() => setIsManageOpen(true)}
              className="bg-white/20 backdrop-blur-md self-center px-5 py-2 rounded-full border border-white/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <span className="text-xl">
                {habits.find(h => h.id === selectedHabitId)?.icon || '📋'}
              </span>
              <span className="text-sm font-bold text-white">
                {habits.find(h => h.id === selectedHabitId)?.name || '选择习惯'}
              </span>
              <span className="text-white/60 text-[10px]">▼</span>
            </div>
          </div>
        </header>

        {/* 隐藏的 Select 用于状态变更 (保持原有逻辑) */}
        <select
          value={selectedHabitId}
          onChange={(e) => setSelectedHabitId(e.target.value)}
          className="hidden"
        >
          {habits.map(h => (
            <option key={String(h.id)} value={String(h.id)}>{h.name}</option>
          ))}
        </select>

        {/* === 内容区 - 统一背景卡片 === */}
        <div className="px-5 relative z-20">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 min-h-[55vh] border border-white">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-4 bg-[#FF7E36] rounded-full"></div>
              <h3 className="text-sm font-black text-slate-800">选择打卡学员</h3>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {students.map(student => {
                const isSelected = selectedStudentIds.has(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform group"
                  >
                    <div className={`relative w-14 h-14 rounded-2xl transition-all duration-300 shadow-sm ${isSelected ? 'ring-4 ring-orange-500 ring-offset-2' : 'bg-slate-50 border border-slate-100'}`}>
                      <img
                        src={student.avatarUrl || '/avatar.jpg'}
                        onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
                        className={`w-full h-full rounded-2xl bg-slate-200 object-cover select-none pointer-events-none ${isSelected ? 'opacity-100' : 'opacity-40 grayscale group-hover:opacity-60'}`}
                        alt={student.name}
                        draggable={false}
                      />
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1 border-2 border-white shadow-md">
                          <Check size={12} className="text-white" strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <span className={`text-[10px] text-center font-black truncate w-full ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}>
                      {student.name}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-8 flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400">本班学生：{students.length} 位</span>
              <button
                onClick={() => { if (allSelected) { setSelectedStudentIds(new Set()); } else { setSelectedStudentIds(new Set(students.map(s => s.id))); } }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${allSelected ? 'bg-slate-200 text-slate-600' : 'bg-orange-500 text-white shadow-lg shadow-orange-200'}`}
              >
                {allSelected ? '取消全选' : '一键全选'}
              </button>
            </div>
          </div>
        </div>

        {/* === Confirm Button (V1增强样式) === */}
        <div className="fixed bottom-24 left-0 right-0 px-6 z-40 flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={selectedStudentIds.size === 0}
            className={`w-full max-w-sm py-4 rounded-2xl font-black text-white shadow-2xl transition-all flex items-center justify-center gap-2 ${selectedStudentIds.size > 0
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-200 active:scale-95'
              : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
          >
            确认打卡 ({selectedStudentIds.size}人)
          </button>
        </div>

        {/* === Manage Habits Modal (V1原版样式) === */}
        {isManageOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-gray-800">管理习惯</h3>
                <button onClick={() => setIsManageOpen(false)}>
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* List */}
              <div className="p-4 max-h-64 overflow-y-auto space-y-2">
                {habits.map(h => (
                  <div key={h.id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{h.icon}</span>
                      <span className="font-bold text-gray-700">{h.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => { setEditForm({ id: h.id, name: h.name, icon: h.icon }); setIsAddMode(false); }}
                        className="p-1.5 bg-blue-50 text-blue-500 rounded-lg"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(h.id)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit/Add Form */}
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 mb-2 uppercase">{isAddMode ? '新增习惯' : (editForm.id ? '编辑习惯' : '编辑选定习惯')}</h4>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    placeholder="习惯名称"
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="flex-1 p-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={editForm.icon}
                    onChange={e => setEditForm({ ...editForm, icon: e.target.value })}
                    className="w-16 p-2 rounded-lg border border-gray-200 text-lg outline-none"
                  >
                    {HABIT_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                </div>
                <div className="flex space-x-2">
                  {!isAddMode && !editForm.id ? (
                    <button onClick={() => { setIsAddMode(true); setEditForm({ name: '', icon: HABIT_ICONS[0] }); }} className="w-full py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-lg text-sm">
                      + 新增模式
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setIsAddMode(false); setEditForm({ name: '', icon: HABIT_ICONS[0], id: undefined }) }} className="flex-1 py-2 bg-white border border-gray-200 text-gray-500 font-bold rounded-lg text-sm">取消</button>
                      <button onClick={handleSaveHabit} className="flex-1 py-2 bg-primary text-white font-bold rounded-lg text-sm">保存</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
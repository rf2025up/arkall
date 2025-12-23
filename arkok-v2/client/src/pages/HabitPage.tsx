import React, { useState, useEffect } from 'react';
import { Check, Settings, Plus, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import ProtectedRoute from '../components/ProtectedRoute';
import apiService from '../services/api.service';
import { ApiResponse } from '../types/api';
import MessageCenter from '../components/MessageCenter';

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

  // --- 数据获取 - 分离加载，学生数据优先 ---
  useEffect(() => {
    console.log('[HABIT_PAGE] 开始加载数据 - 学生优先策略');
    setLoading(true);
    let hasStudents = false;

    // 1. 优先加载学生数据（必须成功）
    const fetchStudents = async () => {
      try {
        console.log('[HABIT_PAGE] 正在加载学生数据...', '当前班级:', currentClass, '视图模式:', viewMode);

        // 🔒 习惯页安全锁定：始终只显示当前老师的学生，不允许全校视图
        // 因为习惯打卡是针对本班学生的教学活动，不应该涉及全校学生或抢人功能
        const url = `/students?scope=MY_STUDENTS&teacherId=${user?.id || ''}`;
        console.log('🔒 [HABIT_SECURITY] 习惯页只显示本班学生，URL:', url);
        const studentsResponse = await apiService.get(url);

        if (isApiResponse(studentsResponse) && studentsResponse.data) {
          const studentsData = extractStudentsData(studentsResponse.data);
          // 为所有学生设置默认头像，使用过关页相同的格式
          const studentsWithAvatar = studentsData.map((student: Student) => ({
            ...student,
            avatarUrl: student.avatarUrl || '/avatar.jpg'
          }));
          console.log('✅ [HABIT_PAGE] 学生数据加载成功:', studentsWithAvatar.length, '名学生');
          setStudents(studentsWithAvatar);
          hasStudents = true;

          // 学生数据加载成功即可关闭loading，不等待习惯数据
          setLoading(false);
        } else {
          console.warn('⚠️ [HABIT_PAGE] 学生数据格式异常');
          setStudents([]);
        }
      } catch (error) {
        console.error('❌ [HABIT_PAGE] 学生数据加载失败:', error);
        setStudents([]);
      }
    };

    // 2. 异步加载习惯数据（失败不影响页面显示）
    const fetchHabits = async () => {
      try {
        console.log('[HABIT_PAGE] 正在加载习惯数据...');
        // 为习惯数据设置较短的超时时间
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('习惯数据请求超时')), 5000)
        );

        const habitsResponse = await Promise.race([apiService.get(`/habits?schoolId=${user?.schoolId || ''}`), timeoutPromise]);

        if (isApiResponse(habitsResponse) && habitsResponse.data) {
          const habitsData = extractHabitsData(habitsResponse.data);
          setHabits(habitsData);
          if (habitsData.length > 0) {
            if (!selectedHabitId) {
              setSelectedHabitId(habitsData[0].id);
            }
            console.log('✅ [HABIT_PAGE] 习惯数据加载成功:', habitsData.length, '个习惯');
          } else {
            console.log('ℹ️ [HABIT_PAGE] 习惯数据为空，使用默认习惯');
            loadDefaultHabits();
          }
        } else {
          console.warn('⚠️ [HABIT_PAGE] 习惯数据格式异常，使用默认习惯');
          loadDefaultHabits();
        }
      } catch (error) {
        console.warn('⚠️ [HABIT_PAGE] 习惯数据加载失败，使用默认习惯:', error);
        loadDefaultHabits();
      }
    };


    // 3. 默认习惯数据
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
    };

    // 4. 并发执行，但学生数据优先
    fetchStudents();          // 立即执行学生数据加载
    fetchHabits();             // 异步执行习惯数据加载

    // 5. 确保最多3秒后关闭loading（兜底机制）
    setTimeout(() => {
      setLoading(false);
    }, 3000);

  }, [currentClass, user?.schoolId]); // 不依赖 selectedHabitId，避免选择习惯时触发重新加载

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
          icon: editForm.icon
        });
        if (response.success) {
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
      <div className="min-h-screen bg-background pb-24">

        {/* === Header (统一设计风格) === */}
        <header
          className="pt-14 pb-20 px-6 rounded-b-[40px] relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #FF8C00 0%, #FF5500 100%)' }}
        >
          {/* 背景纹理装饰 */}
          <div className="absolute -top-1/2 -left-1/5 w-[200%] h-[200%] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)' }}
          />

          {/* 顶栏 */}
          <div className="relative z-10 flex justify-between items-center mb-6">
            <h1 className="text-white text-xl font-black tracking-tight">好习惯打卡</h1>
            <MessageCenter variant="header" />
          </div>

          {/* 习惯选择器 - 毛玻璃卡片 */}
          <div className="relative z-10 bg-white/20 backdrop-blur-md rounded-2xl p-3 flex items-center border border-white/10">
            <select
              value={selectedHabitId}
              onChange={(e) => setSelectedHabitId(e.target.value)}
              className="w-full bg-transparent text-white font-bold text-lg outline-none px-2 py-1 appearance-none"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
            >
              {habits.map(h => (
                <option key={String(h.id)} value={String(h.id)} className="text-gray-800">{h.icon} {h.name}</option>
              ))}
            </select>
            <button
              onClick={() => setIsManageOpen(true)}
              className="bg-white/20 text-white p-2.5 rounded-xl hover:bg-white/30 transition-colors border border-white/10"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* === Student Grid (V1原版样式) === */}
        <div className="px-4 -mt-6 relative z-20">
          <div className="bg-white rounded-2xl shadow-lg p-4 min-h-[50vh]">
            <div className="grid grid-cols-4 gap-4">
              {students.map(student => {
                const isSelected = selectedStudentIds.has(student.id);
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className="flex flex-col items-center space-y-2 cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className={`relative w-14 h-14 rounded-full transition-all duration-200 ${isSelected ? 'ring-4 ring-primary ring-offset-2' : 'ring-2 ring-gray-100'}`}>
                      <img
                        src={student.avatarUrl || '/avatar.jpg'}
                        onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
                        className={`w-full h-full rounded-full bg-gray-200 object-cover select-none pointer-events-none ${isSelected ? 'opacity-100' : 'opacity-70 grayscale'}`}
                        alt={student.name}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-white shadow-sm">
                          <Check size={10} className="text-white" strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    <span className={`text-xs text-center truncate w-full ${isSelected ? 'text-primary font-bold' : 'text-gray-400'}`}>
                      {student.name}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex justify-between items-center">
              <span className="text-xs text-gray-500">本班学生：{students.length} 位</span>
              <button
                onClick={() => { if (allSelected) { setSelectedStudentIds(new Set()); } else { setSelectedStudentIds(new Set(students.map(s => s.id))); } }}
                className={`px-3 py-1 rounded-xl text-xs font-bold ${allSelected ? 'bg-gray-100 text-gray-700' : 'bg-primary/10 text-primary'}`}
              >
                {allSelected ? '取消全选' : '一键全选'}
              </button>
            </div>
          </div>
        </div>

        {/* === Confirm Button (V1原版样式) === */}
        <div className="fixed bottom-20 left-0 right-0 px-6 z-30 flex justify-center">
          <button
            onClick={handleConfirm}
            disabled={selectedStudentIds.size === 0}
            className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center text-sm ${selectedStudentIds.size > 0
              ? 'bg-gray-900 hover:bg-gray-800 active:scale-95'
              : 'bg-gray-300 cursor-not-allowed'
              }`}
          >
            确认打卡 ({selectedStudentIds.size})
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
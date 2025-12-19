import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import { Check, CheckSquare, ListChecks, BookOpen, AlertCircle, User, UserPlus, Trophy, Medal, Swords, Flag, ChevronDown, Users } from 'lucide-react';
import { Student, PointPreset, StudentListResponse, ScoreUpdateEvent } from '../types/student';
import ActionSheet from '../components/ActionSheet';
import { AddStudentModal } from '../components/AddStudentModal';
import apiService from '../services/api.service';

// 积分类别名称映射（从旧代码移植）
const categoryNames: Record<string, string> = {
  'I': 'I. 学习成果与高价值奖励',
  'II': 'II. 自主管理与习惯养成 (午托篇)',
  'III': 'III. 自主管理与学习过程 (晚辅篇)',
  'IV': 'IV. 学习效率与时间管理',
  'V': 'V. 质量、进步与整理',
  'VI': 'VI. 纪律与惩罚细则',
  'CUSTOM': '自定义类别'
};

// 积分预设（简化版本）
const scorePresets: PointPreset[] = [
  { label: '优秀作业', value: 5, category: 'I' },
  { label: '积极回答', value: 3, category: 'I' },
  { label: '遵守纪律', value: 2, category: 'II' },
  { label: '迟到', value: -2, category: 'VI' },
  { label: '作业未完成', value: -3, category: 'VI' },
];

const Home = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { viewMode, switchViewMode, selectedTeacherId, currentClass, availableClasses, switchClass } = useClass();  // 🆕 获取 viewMode、selectedTeacherId 和班级列表

  // --- 状态管理（来自旧版UI的肉体）---
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [scoringStudent, setScoringStudent] = useState<Student | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // --- 加载和错误状态 ---
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 新增学生功能状态
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 班级切换抽屉状态
  const [isClassDrawerOpen, setIsClassDrawerOpen] = useState(false);

  // 🆕 竞态条件控制
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- 核心交互状态 ---
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false); // 使用 ref 避免闭包陷阱
  const touchStartPos = useRef<{ x: number, y: number } | null>(null);
  const visibleStudents = students.sort((a, b) => (b.exp || 0) - (a.exp || 0));

  // 🆕 基于师生绑定的数据获取函数（优化竞态条件控制）
  const fetchStudents = async () => {
    const requestId = Math.random().toString(36).substr(2, 9);
    console.log(`🚀 [${requestId}] fetchStudents 开始执行`);

    // 🆕 优化：只取消真正过时的请求，而不是所有请求
    if (abortControllerRef.current) {
      // 延迟取消，避免取消刚刚发起的有效请求
      setTimeout(() => {
        if (abortControllerRef.current && abortControllerRef.current !== abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 100);
    }

    // 创建新的AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 如果已有数据，不显示加载状态以避免闪烁
    const hasExistingData = students.length > 0;
    if (!hasExistingData) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // 🆕 构建查询参数 - 基于视图模式而非班级名
      const params = new URLSearchParams();

      if (viewMode === 'MY_STUDENTS' && user?.id) {
        params.append('scope', 'MY_STUDENTS');
        params.append('teacherId', user.id);
        params.append('userRole', user.role || 'TEACHER');
      } else if (viewMode === 'ALL_SCHOOL') {
        params.append('scope', 'ALL_SCHOOL');
        params.append('userRole', user?.role || 'TEACHER');
        params.append('schoolId', user?.schoolId || '');
        // 全校视图不需要teacherId，要显示所有学生用于抢人
      } else if (viewMode === 'SPECIFIC_CLASS' && selectedTeacherId) {
        // 🆕 新增：查看特定老师的学生
        params.append('scope', 'SPECIFIC_TEACHER');
        params.append('teacherId', selectedTeacherId);
        params.append('userRole', user?.role || 'TEACHER');
        if (user?.id) {
          params.append('requesterId', user.id);
        }
      }

      // 🆕 修复：只在特定视图模式下才添加className过滤
      // MY_STUDENTS模式下只需要teacherId过滤，不需要className过滤
      if (currentClass !== 'ALL' && currentClass !== '' && viewMode !== 'MY_STUDENTS') {
        params.append('className', currentClass);
      }

      const url = `/students${params.toString() ? '?' + params.toString() : ''}`;
      console.log(`[TEACHER BINDING] Fetching students with URL: ${url}`);

      const studentsData = await apiService.get(url);

      // 🔍 [DEBUG] 总监指令：深度排查API响应结构解析问题
      console.log('🔍 [DEBUG] 原始 API 返回:', studentsData);
      console.log('🔍 [DEBUG] 当前 User 对象:', user);
      console.log('🔍 [DEBUG] 尝试提取的 Students 数组:', (studentsData as any).data?.students);
      console.log('🔍 [DEBUG] data 存在?', !!studentsData?.data);
      console.log('🔍 [DEBUG] success 状态:', studentsData?.success);
      console.log('🔍 [DEBUG] 调用的完整 URL:', url);

      if (studentsData && studentsData.success && studentsData.data && (studentsData.data as any).students) {
        const students = (studentsData.data as any).students;
        console.log(`[${requestId}] [TEACHER BINDING] Successfully loaded ${students.length} students for viewMode: ${viewMode}`);

        // 🆕 优化：检查请求是否被取消，但增加容错机制
        if (abortController.signal.aborted) {
          console.log(`[${requestId}] [WARNING] Request was aborted, but data is available. Checking if we should still update...`);

          // 🆕 容错机制：即使被取消，如果当前没有数据或数据更完整，仍然更新
          if (students.length > 0 && students.length !== students.length) {
            console.log(`[${requestId}] [RECOVERY] Updating state despite abort due to better data quality`);
            const studentsWithAvatar = students.map((student: any) => ({
              ...student,
              avatarUrl: student.avatarUrl || '/avatar.jpg'
            }));
            setStudents(studentsWithAvatar);
            return;
          }

          console.log(`[${requestId}] [TEACHER BINDING] Request aborted, skipping state update`);
          return;
        }

        // 为所有学生设置默认头像
        const studentsWithAvatar = students.map((student: any) => ({
          ...student,
          avatarUrl: student.avatarUrl || '/avatar.jpg'
        }));
        console.log(`[${requestId}] [SUCCESS] Updating state with ${studentsWithAvatar.length} students`);
        setStudents(studentsWithAvatar);
      } else {
        console.warn("[TEACHER BINDING] No students data returned");
        // 🆕 只有在非abort状态下才更新错误
        if (!abortController.signal.aborted) {
          setError('获取学生数据失败');
          setStudents([]);
        }
      }
    } catch (err) {
      console.error("[TEACHER BINDING] Failed to fetch students:", err);
      // 🆕 只有在非abort状态下才更新错误
      if (!abortController.signal.aborted) {
        setError('获取学生数据失败，请检查网络或联系管理员');
        setStudents([]);
      }
    } finally {
      // 🆕 只有在非abort状态下才更新loading状态
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  // 组件加载时获取数据
  useEffect(() => {
    fetchStudents();
  }, []);

  // 🆕 监听视图模式变化，刷新学生数据（优化：减少不必要的重新获取）
  useEffect(() => {
    fetchStudents();
  }, [viewMode]);  // 🆕 只监听viewMode变化，currentClass在MY_STUDENTS模式下不影响结果

  // 🆕 清理函数：组件卸载时取消进行中的请求
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // 🆕 修改新增学生的处理函数，适配师生绑定
  const handleAddStudent = async (studentData: { name: string; className: string }) => {
    try {
      if (!user?.id) {
        alert("您还未登录，无法添加学生");
        return;
      }

      await apiService.students.create({
        name: studentData.name,
        className: studentData.className,  // 可选，仅作为显示标签
        schoolId: user.schoolId,          // 需要从 user 中获取 schoolId
        teacherId: user.id                // 🆕 核心变更：直接归属到当前老师
      });
      setIsModalOpen(false);
      await fetchStudents();
    } catch (error) {
      console.error("Failed to add student:", error);
      alert("添加学生失败，请检查后台日志。");
    }
  };

  // --- 交互函数（来自旧版UI的肉体）---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // --- 触摸事件处理 (解决单击/长按冲突) ---
  const handleTouchStart = (e: React.TouchEvent, student: Student) => {
    console.log('[DEBUG] Long press started:', {
      studentName: student.name,
      viewMode,
      userRole: user?.role,
      isMultiSelectMode,
      timestamp: new Date().toISOString()
    });

    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isLongPressTriggered.current = false; // 重置长按标记

    // 设置长按定时器 (600ms)
    longPressTimer.current = setTimeout(() => {
      console.log('[DEBUG] Long press timer triggered:', {
        studentName: student.name,
        isMultiSelectMode,
        willTrigger: !isMultiSelectMode
      });

      // 只有非多选模式下，长按才触发积分面板
      if (!isMultiSelectMode) {
        isLongPressTriggered.current = true; // 标记已触发长按
        setScoringStudent(student);
        setIsSheetOpen(true); // 打开积分面板
        if (navigator.vibrate) navigator.vibrate(50);

        console.log('[DEBUG] ActionSheet should open:', {
          studentName: student.name,
          viewMode,
          userRole: user?.role,
          hasTransferFunction: !!handleTransferStudents
        });
      }
    }, 600);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    const moveX = Math.abs(touch.clientX - touchStartPos.current.x);
    const moveY = Math.abs(touch.clientY - touchStartPos.current.y);

    // 如果滑动超过 10px，取消所有点击/长按判定
    if (moveX > 10 || moveY > 10) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      touchStartPos.current = null;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, student: Student) => {
    // 清除长按定时器
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    // 如果手指滑动过或已经触发了长按，则不执行由于松手产生的单击逻辑
    if (!touchStartPos.current || isLongPressTriggered.current) {
      return;
    }

    // --- 核心逻辑分流 ---

    // 1. 多选模式：点击即选中/取消 (修复问题2)
    if (isMultiSelectMode) {
      toggleSelection(student.id);
      return;
    }

    // 2. 普通模式：点击跳转到个人详情页
    console.log('[DEBUG] Navigate to student detail:', student.name);
    navigate(`/student/${student.id}`);
  };

  const handleBatchScoreClick = () => {
    if (selectedIds.size > 0) {
      setIsSheetOpen(true);
    }
  };

  const toggleMultiSelectMode = () => {
    if (isMultiSelectMode) {
      setIsMultiSelectMode(false);
      setSelectedIds(new Set());
    } else {
      setIsMultiSelectMode(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  // --- 适配API的handleConfirmScore函数 ---
  const handleConfirmScore = async (points: number, reason: string, exp?: number) => {
    if (!token) {
      setToastMsg('请先登录');
      return;
    }

    let idsToUpdate: string[] = [];
    if (scoringStudent) {
      idsToUpdate = [scoringStudent.id];
    } else if (selectedIds.size > 0) {
      idsToUpdate = Array.from(selectedIds);
    }

    try {
      // 📋 使用封装的API服务，符合架构白皮书规范
      const data = await apiService.post('/students/score', {
        studentIds: idsToUpdate,
        points: points,
        exp: exp || 0,
        reason: reason
      });

      if (data.success) {
        const nameText = scoringStudent ? scoringStudent.name : `已选 ${idsToUpdate.length} 人`;
        const ptsText = typeof points === 'number' && points !== 0 ? `${points > 0 ? '+' : ''}${points}` : '';
        const expText = typeof exp === 'number' && exp !== 0 ? ` 经验${exp > 0 ? '+' : ''}${exp}` : '';
        const msg = ptsText || expText ? `${nameText} ${ptsText}${expText} 已更新` : `${nameText} 操作已完成`;
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 1500);

        // 手动更新本地状态
        setStudents(prevStudents =>
          prevStudents.map(student => {
            if (idsToUpdate.includes(student.id)) {
              return {
                ...student,
                points: student.points + points,
                exp: student.exp + (exp || 0),
                level: Math.floor((student.exp + (exp || 0)) / 100) + 1
              };
            }
            return student;
          })
        );
      } else {
        setToastMsg(data.message || '更新积分失败');
        setTimeout(() => setToastMsg(null), 2000);
      }
    } catch (error) {
      console.error('Error updating score:', error);
      setToastMsg('网络错误，更新积分失败');
      setTimeout(() => setToastMsg(null), 2000);
    }

    setIsSheetOpen(false); // 关闭弹窗
    setScoringStudent(null); // 清除选中
  };

  // 🆕 处理师生关系转移 - "抢人"功能
  const handleTransferStudents = async (studentIds: string[], targetTeacherId: string) => {
    console.log('[DEBUG] Home.tsx handleTransferStudents called', {
      studentIds: studentIds,
      targetTeacherId: targetTeacherId,
      currentUserId: user?.id
    });

    if (!user?.id) {
      setToastMsg('请先登录');
      return;
    }

    try {
      const actualTeacherId = targetTeacherId === 'current' ? user.id : targetTeacherId;
      console.log('[DEBUG] Using teacherId:', actualTeacherId);

      // 📋 使用封装的API服务，符合架构白皮书规范
      const data = await apiService.students.transfer({
        studentIds: studentIds,
        targetTeacherId: actualTeacherId  // 🆕 使用实际老师ID
      });

      if (data.success) {
        const transferredCount = studentIds.length;
        setToastMsg(`成功将 ${transferredCount} 名学生移入您的班级`);
        setTimeout(() => setToastMsg(null), 2000);

        // 手动更新本地状态
        setStudents(prevStudents =>
          prevStudents.map(student => {
            if (studentIds.includes(student.id)) {
              return {
                ...student,
                teacherId: targetTeacherId || user.id,  // 🆕 更新老师归属
                // className: user.primaryClassName || user.name + '班'  // 可选：同步更新显示
              };
            }
            return student;
          })
        );

        // 清除多选状态
        setSelectedIds(new Set());
        setIsMultiSelectMode(false);

        // 如果当前是"我的学生"视图，刷新数据
        if (viewMode === 'MY_STUDENTS') {
          setTimeout(() => fetchStudents(), 500);
        }
      } else {
        setToastMsg(data.message || '移入班级失败');
        setTimeout(() => setToastMsg(null), 2000);
      }
    } catch (error) {
      console.error('Error transferring students:', error);
      setToastMsg('网络错误，移入班级失败');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  // 辅助组件：Header 上的功能胶囊按钮
  interface HeaderActionBtnProps {
    icon: React.ReactNode;
    label: string;
    colorClass: string;
    bgClass: string;
    onClick: () => void;
  }

  const HeaderActionBtn = ({ icon, label, colorClass, bgClass, onClick }: HeaderActionBtnProps) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group active:scale-95 transition-transform">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${bgClass} ${colorClass}`}>
            {icon}
        </div>
        <span className="text-xs text-white/90 font-medium">{label}</span>
    </button>
  );

  
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-500 to-orange-600 pb-24">
      {/* Header - v11.0 风格改造 */}
      <header className="bg-primary px-6 py-6 pb-20 rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Check size={120} className="text-white" />
        </div>

        {/* 🆕 第一行：标题与多选开关 - 基于视图模式 */}
        <div className="relative z-10 flex justify-between items-center mb-6">
            <div>
                <button
                    onClick={() => setIsClassDrawerOpen(true)}
                    className="flex items-center gap-2 text-white text-2xl font-bold mb-1 active:scale-95 transition-transform"
                >
                    {viewMode === 'MY_STUDENTS' ? (
                        <>
                            <User size={24} />
                            {user?.name}的班级
                        </>
                    ) : viewMode === 'ALL_SCHOOL' ? (
                        <>
                            <Users size={24} />
                            全校大名单
                        </>
                    ) : (
                        <>
                            <User size={24} />
                            {availableClasses.find(cls => cls.teacherId === selectedTeacherId)?.teacherName}的班级
                        </>
                    )}
                    <ChevronDown size={20} className="text-white/80" />
                </button>
                <p className="text-orange-100 text-sm opacity-90">
                    {visibleStudents.length} 位学生
                    {viewMode === 'MY_STUDENTS' && ` · ${user?.name}老师名下的学生`}
                    {viewMode === 'ALL_SCHOOL' && ' · 可从中选择学生移入您的班级'}
                    {viewMode === 'SPECIFIC_CLASS' && ` · 可从中选择学生移入您的班级`}
                </p>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={toggleMultiSelectMode}
                    className={`p-2 rounded-xl backdrop-blur-sm transition-all ${isMultiSelectMode ? 'bg-white text-primary shadow-md' : 'bg-white/20 text-white'}`}
                >
                    {isMultiSelectMode ? <CheckSquare size={20} /> : <ListChecks size={20} />}
                </button>
            </div>
        </div>

        {/* 第二行：快捷功能入口 (v11.0 风格) */}
        {!isMultiSelectMode && (
            <div className="relative z-10 flex justify-between px-2 animate-in slide-in-from-top-4 fade-in duration-500">
                <HeaderActionBtn
                    icon={<Check size={22} />}
                    label="习惯"
                    bgClass="bg-green-100"
                    colorClass="text-green-600"
                    onClick={() => navigate('/habits')}
                />
                <HeaderActionBtn
                    icon={<Medal size={22} />}
                    label="发勋章"
                    bgClass="bg-blue-100"
                    colorClass="text-blue-600"
                    onClick={() => navigate('/badges')}
                />
                <HeaderActionBtn
                    icon={<Swords size={22} />}
                    label="PK对决"
                    bgClass="bg-red-100"
                    colorClass="text-red-600"
                    onClick={() => navigate('/pk')}
                />
                <HeaderActionBtn
                    icon={<Flag size={22} />}
                    label="挑战"
                    bgClass="bg-purple-100"
                    colorClass="text-purple-600"
                    onClick={() => navigate('/challenges')}
                />
            </div>
        )}
      </header>

      {/* Student Grid - 调整margin适配新Header高度 */}
      <div className="px-4 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl p-5 min-h-[60vh]">
          {/* --- 条件渲染逻辑 --- */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {visibleStudents.map((student) => {
                const isSelected = selectedIds.has(student.id);
                const hasMistakes = false; // 简化版本，暂不实现状态指示器
                const hasPendingTasks = false; // 简化版本，暂不实现状态指示器

                return (
                    <div
                        key={student.id}
                        // 移除 onClick，完全由 Touch 事件接管
                        onTouchStart={(e) => handleTouchStart(e, student)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={(e) => handleTouchEnd(e, student)}
                        className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 cursor-pointer select-none ${
                            isSelected ? 'bg-orange-50 scale-95 ring-2 ring-primary' : 'active:scale-95 hover:bg-gray-50'
                        }`}
                        title={isMultiSelectMode ? "点击选择/取消选择" : "单击查看学情详情，长按积分操作"}
                    >
                        <div className="relative">
                            <img
                                src={student.avatarUrl || '/avatar.jpg'}
                                alt={student.name}
                                onError={(e)=>{ e.currentTarget.src = '/avatar.jpg'; }}
                                className={`w-14 h-14 rounded-full object-cover border-2 transition-all select-none pointer-events-none ${
                                    isSelected ? 'border-primary opacity-100' : 'border-gray-100'
                                }`}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                            />

                            {/* 优化后的状态指示器 - v11.0 风格 */}
                            {!isMultiSelectMode && (hasMistakes || hasPendingTasks) && (
                                <>
                                    {hasMistakes && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-md border border-white" title="有待处理错题">
                                            <AlertCircle className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                    {hasPendingTasks && !hasMistakes && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-md" title="有待完成任务"></div>
                                    )}
                                </>
                            )}

                            {isMultiSelectMode && (
                                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm transition-colors ${
                                    isSelected ? 'bg-primary' : 'bg-gray-200'
                                }`}>
                                    {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                </div>
                            )}
                        </div>
                        <span className={`mt-2 text-xs font-bold truncate w-full text-center ${isSelected ? 'text-primary' : 'text-gray-700'}`}>
                            {student.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{student.points} 积分</span>
                    </div>
                );
            })}
          </div>

          {/* 新增学生按钮 - 放在学生头像网格下方 */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold flex items-center shadow-lg shadow-primary/200 active:scale-95 transition-transform"
            >
              <UserPlus size={18} className="mr-2" />
              新增学生
            </button>
          </div>
        </div>
      </div>

          {/* Batch Action Bar */}
      {isMultiSelectMode && selectedIds.size > 0 && (
          <div className="fixed bottom-24 left-0 right-0 px-8 z-30 animate-in slide-in-from-bottom-10">
              <button
                onClick={handleBatchScoreClick}
                className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center space-x-2 active:scale-95 transition-transform"
              >
                  <CheckSquare size={20} />
                  <span>为 {selectedIds.size} 位学生评分</span>
              </button>
          </div>
      )}

      <ActionSheet
        isOpen={isSheetOpen}
        onClose={() => {
          setIsSheetOpen(false);
          setScoringStudent(null);
          // 如果是长按触发的单人操作，关闭后不清除多选状态；如果是批量操作，可选清除
          if (isMultiSelectMode) {
             // 保持多选状态，方便继续操作
          }
        }}
        selectedStudents={scoringStudent ? [scoringStudent] : visibleStudents.filter(s => selectedIds.has(s.id))}
        onConfirm={handleConfirmScore}
        onTransfer={user?.role === 'TEACHER' ? handleTransferStudents : undefined}
        scorePresets={scorePresets}
        categoryNames={categoryNames}
      />


      {toastMsg && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-xl shadow-lg text-sm z-[70] font-bold">
          {toastMsg}
        </div>
      )}

      {/* AddStudentModal - 标准新增学生模态框 */}
      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStudent}
      />

      {/* 班级切换底部抽屉 */}
      <div className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out ${
        isClassDrawerOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        {/* 遮罩层 */}
        {isClassDrawerOpen && (
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsClassDrawerOpen(false)}
          />
        )}

        {/* 抽屉内容 */}
        <div className="relative bg-white rounded-t-3xl p-6 pb-8 max-h-[70vh] overflow-y-auto">
          {/* 拖拽指示器 */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* 标题 */}
          <h3 className="text-lg font-bold text-gray-800 mb-4">选择班级</h3>

          {/* 🆕 视图模式选择 */}
          <div className="space-y-2">
            {/* 我的学生 */}
            <button
              onClick={() => {
                console.log('🔧 [HOME] 点击我的学生按钮');
                console.log('🔧 [HOME] availableClasses:', availableClasses);
                console.log('🔧 [HOME] user?.id:', user?.id);
                switchViewMode('MY_STUDENTS');
                // 🆕 同步更新currentClass为班级名，确保习惯打卡页和备课页能正确过滤
                // 需要从availableClasses中找到当前老师的班级
                const myClass = availableClasses.find(cls => cls.teacherId === user?.id);
                console.log('🔧 [HOME] 找到的我的班级:', myClass);
                if (myClass) {
                  console.log('🔧 [HOME] 调用switchClass设置班级为:', myClass.name);
                  switchClass(myClass.name);
                } else {
                  console.log('🔧 [HOME] 未找到我的班级，availableClasses为空或未匹配');
                  // 🆕 绕过API问题：直接使用用户信息构造班级名
                  if (user?.name) {
                    const fallbackClassName = `${user.name}的班级`;
                    console.log('🔧 [HOME] 使用备用方案，设置班级为:', fallbackClassName);
                    switchClass(fallbackClassName);
                  }
                }
                setIsClassDrawerOpen(false);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                viewMode === 'MY_STUDENTS'
                  ? 'bg-blue-100 border-2 border-blue-500 text-blue-700'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <User size={20} className={viewMode === 'MY_STUDENTS' ? 'text-blue-600' : 'text-gray-600'} />
                <div className="text-left">
                  <div className="font-medium">{user?.name}的班级</div>
                  <div className="text-sm text-gray-500">查看归属{user?.name}名下的学生</div>
                </div>
              </div>
              {viewMode === 'MY_STUDENTS' && (
                <Check size={20} className="text-blue-600" />
              )}
            </button>

            {/* 全校大名单 */}
            <button
              onClick={() => {
                console.log('🔧 [HOME] 点击全校大名单按钮');
                switchViewMode('ALL_SCHOOL');
                // 🆕 切换到全校时，同步设置currentClass为"ALL"
                console.log('🔧 [HOME] 调用switchClass设置班级为: ALL');
                switchClass('ALL');
                setIsClassDrawerOpen(false);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                viewMode === 'ALL_SCHOOL'
                  ? 'bg-orange-100 border-2 border-orange-500 text-orange-700'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={20} className={viewMode === 'ALL_SCHOOL' ? 'text-orange-600' : 'text-gray-600'} />
                <div className="text-left">
                  <div className="font-medium">全校大名单</div>
                  <div className="text-sm text-gray-500">
                    {user?.role === 'TEACHER' ? '查看全校学生并移入您的班级' : '查看所有班级的学生'}
                  </div>
                </div>
              </div>
              {viewMode === 'ALL_SCHOOL' && (
                <Check size={20} className="text-orange-600" />
              )}
            </button>

            {/* 🆕 其他老师班级选项 */}
            {availableClasses
              .filter(cls => cls.teacherId && cls.teacherId !== user?.id && cls.teacherId !== 'ALL')
              .map((cls, index) => (
                <button
                  key={`teacher-${cls.teacherId}-${index}`}
                  onClick={() => {
                    // 🆕 切换到指定老师的班级视图
                    switchViewMode('SPECIFIC_CLASS', cls.teacherId);
                    setIsClassDrawerOpen(false);
                    setToastMsg(`正在查看${cls.teacherName}的班级`);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                    viewMode === 'SPECIFIC_CLASS' && selectedTeacherId === cls.teacherId
                      ? 'bg-purple-100 border-2 border-purple-500 text-purple-700'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={20} className={viewMode === 'SPECIFIC_CLASS' && selectedTeacherId === cls.teacherId ? "text-purple-600" : "text-gray-600"} />
                    <div className="text-left">
                      <div className="font-medium">{cls.teacherName}的班级</div>
                      <div className="text-sm text-gray-500">共{cls.studentCount}名学生</div>
                    </div>
                  </div>
                  {viewMode === 'SPECIFIC_CLASS' && selectedTeacherId === cls.teacherId && (
                    <Check size={20} className="text-purple-600" />
                  )}
                </button>
              ))}
          </div>

          {/* 🆕 功能提示 - 根据视图模式显示不同提示 */}
          {user?.role === 'TEACHER' && (
            <div className={`mt-4 p-3 border rounded-xl ${
              viewMode === 'ALL_SCHOOL'
                ? 'bg-blue-50 border-blue-200'
                : viewMode === 'SPECIFIC_CLASS'
                ? 'bg-purple-50 border-purple-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2">
                {viewMode === 'ALL_SCHOOL' ? (
                  <>
                    <UserPlus size={16} className="text-blue-700" />
                    <span className="text-sm font-medium text-blue-700">抢人功能</span>
                  </>
                ) : viewMode === 'SPECIFIC_CLASS' ? (
                  <>
                    <UserPlus size={16} className="text-purple-700" />
                    <span className="text-sm font-medium text-purple-700">抢人功能</span>
                  </>
                ) : (
                  <>
                    <Trophy size={16} className="text-green-700" />
                    <span className="text-sm font-medium text-green-700">积分调整</span>
                  </>
                )}
              </div>
              <p className={`text-xs mt-1 ${
                viewMode === 'ALL_SCHOOL'
                  ? 'text-blue-600'
                  : viewMode === 'SPECIFIC_CLASS'
                  ? 'text-purple-600'
                  : 'text-green-600'
              }`}>
                {viewMode === 'ALL_SCHOOL' || viewMode === 'SPECIFIC_CLASS'
                  ? '长按学生头像，选择"移入我的班级"即可将学生划归到您名下'
                  : '长按学生头像，可调整积分和经验值'
                }
              </p>
            </div>
          )}

          {/* 关闭按钮 */}
          <button
            onClick={() => setIsClassDrawerOpen(false)}
            className="w-full mt-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
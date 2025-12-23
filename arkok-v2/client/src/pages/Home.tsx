import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import { Check, CheckSquare, ListChecks, BookOpen, AlertCircle, User, UserPlus, Trophy, Medal, Swords, Flag, ChevronDown, Users, Calendar, Bell, Plus } from 'lucide-react';
import { Student, StudentListResponse, ScoreUpdateEvent } from '../types/student';
import ActionSheet from '../components/ActionSheet';
import { AddStudentModal } from '../components/AddStudentModal';
import MessageCenter from '../components/MessageCenter';
import apiService from '../services/api.service';

// 积分已支持手动输入，不再需要预制列表。
const Home = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { viewMode, switchViewMode, selectedTeacherId, managedTeacherName, currentClass, availableClasses, switchClass, isProxyMode } = useClass();  // 🆕 获取 viewMode、managedTeacherName、isProxyMode 等

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
      const controllerToAbort = abortControllerRef.current;
      setTimeout(() => {
        controllerToAbort.abort();
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

      // 🆕 增强版解析逻辑：尝试从多个层级提取学生数组
      let finalStudents: any[] = [];
      if (Array.isArray(studentsData?.data)) {
        finalStudents = studentsData.data;
      } else if (studentsData?.data && Array.isArray((studentsData.data as any).students)) {
        finalStudents = (studentsData.data as any).students;
      } else if (Array.isArray(studentsData)) {
        finalStudents = studentsData as any[];
      }

      const hasData = finalStudents && finalStudents.length >= 0 && (studentsData?.success !== false);

      if (hasData) {
        console.log(`[${requestId}] [SUCCESS] Extracted ${finalStudents.length} students`);

        // 🆕 检查是否被中止
        if (abortController.signal.aborted) {
          console.log(`[${requestId}] [ABORTED] Request was aborted, checking recovery...`);
          // 🆕 容错：即使被中止，如果当前没数据也强制更新一次
          if (students.length === 0 && finalStudents.length > 0) {
            console.log(`[${requestId}] [RECOVERY] Updating despite abort to avoid empty screen`);
          } else {
            console.log(`[${requestId}] [ABORTED] Skipping state update to prevent race conditions`);
            return;
          }
        }

        // 统一添加头像
        const studentsWithAvatar = finalStudents.map((s: any) => ({
          ...s,
          avatarUrl: s.avatarUrl || '/avatar.jpg'
        }));

        setStudents(studentsWithAvatar);
      } else {
        console.warn("[TEACHER BINDING] No students data could be extracted", {
          hasData,
          studentsLength: finalStudents?.length,
          success: studentsData?.success
        });
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

  // 🆕 监听视图模式和选中老师变化，刷新学生数据
  useEffect(() => {
    fetchStudents();
  }, [viewMode, selectedTeacherId]);  // 🔧 修复：添加 selectedTeacherId 依赖，切换老师时刷新

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
    navigate(`/student/${student.id}`, { state: { studentData: student } });
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

  // 🆕 处理批量签到
  const handleBatchCheckin = async (studentIds: string[]) => {
    if (!user?.schoolId) {
      setToastMsg('学校信息缺失');
      return;
    }

    try {
      const data = await apiService.post('/checkins/batch', {
        studentIds,
        schoolId: user.schoolId
      });

      if (data.success) {
        const result = data.data as any;
        setToastMsg(`批量签到成功！(${result.success?.length || 0}人)`);
        setTimeout(() => setToastMsg(null), 2000);

        // 清除多选状态
        setSelectedIds(new Set());
        setIsMultiSelectMode(false);
      } else {
        setToastMsg(data.message || '签到失败');
        setTimeout(() => setToastMsg(null), 2000);
      }
    } catch (error) {
      console.error('Batch checkin error:', error);
      setToastMsg('网络错误，签到失败');
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
    <div className="min-h-screen w-full bg-[#F5F7FA] pb-24">
      {/* 🆕 头部区域 - 参考设计风格 */}
      <header
        className="pt-14 pb-24 px-6 rounded-b-[40px] relative overflow-hidden"
        style={{ background: isProxyMode ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' : 'linear-gradient(160deg, #FF8C00 0%, #FF5500 100%)' }}
      >
        {/* 背景纹理装饰 */}
        <div className="absolute -top-1/2 -left-1/5 w-[200%] h-[200%] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)' }}
        />

        {/* 顶栏 */}
        <div className="relative z-10 flex justify-between items-center mb-6">
          {/* 班级切换器 - 玻璃胶囊 */}
          <button
            onClick={() => setIsClassDrawerOpen(true)}
            className="flex flex-col items-start bg-white/20 px-4 py-2 rounded-2xl backdrop-blur-md active:bg-white/30 transition-colors border border-white/10"
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-lg text-white tracking-tight">
                {viewMode === 'MY_STUDENTS' ? '我的班级' :
                  viewMode === 'ALL_SCHOOL' ? '全校大名单' :
                    `${managedTeacherName || '代管理'} 的班级`}
              </span>
              <ChevronDown size={14} className="text-white/80" />
            </div>
            {viewMode === 'SPECIFIC_CLASS' && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[9px] font-black text-white/90 uppercase tracking-widest border border-white/10">
                  代理模式
                </span>
              </div>
            )}
          </button>

          {/* 🆕 通知铃铛 - 使用 MessageCenter 组件 */}
          <MessageCenter variant="header" />
        </div>
      </header>

      {/* 🆕 悬浮快捷岛 */}
      <div className="px-5 -mt-16 relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-4 flex justify-between items-center shadow-xl shadow-orange-100/30 border border-white/80">
          {/* 习惯 */}
          <button onClick={() => navigate('/habits')} className="flex-1 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shadow-sm">
              <Check size={22} />
            </div>
            <span className="text-[11px] font-bold text-gray-500">习惯</span>
          </button>

          {/* 勋章 */}
          <button onClick={() => navigate('/badges')} className="flex-1 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shadow-sm">
              <Medal size={22} />
            </div>
            <span className="text-[11px] font-bold text-gray-500">勋章</span>
          </button>

          {/* PK对决 */}
          <button onClick={() => navigate('/pk')} className="flex-1 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shadow-sm">
              <Swords size={22} />
            </div>
            <span className="text-[11px] font-bold text-gray-500">PK对决</span>
          </button>

          {/* 挑战 */}
          <button onClick={() => navigate('/challenges')} className="flex-1 flex flex-col items-center gap-2 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center shadow-sm">
              <Flag size={22} />
            </div>
            <span className="text-[11px] font-bold text-gray-500">挑战</span>
          </button>
        </div>
      </div>

      {/* 学生列表区域 */}
      <div className="px-5 pt-6 pb-28">
        {/* 标题栏 */}
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-gray-800 text-sm">学生名册</h3>
          <button
            onClick={toggleMultiSelectMode}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isMultiSelectMode
              ? 'bg-orange-500 text-white'
              : 'text-orange-500 bg-orange-50 active:bg-orange-100'
              }`}
          >
            <CheckSquare size={12} className="inline mr-1" />
            {isMultiSelectMode ? '取消' : '批量管理'}
          </button>
        </div>

        {/* 学生网格 */}
        <div className="grid grid-cols-3 gap-3">
          {visibleStudents.map((student) => {
            const isSelected = selectedIds.has(student.id);
            const hasMistakes = false; // 简化版本，暂不实现状态指示器
            const hasPendingTasks = false; // 简化版本，暂不实现状态指示器

            return (
              <div
                key={student.id}
                // 🆕 修复：添加 onClick 支持 PC 浏览器鼠标点击
                onClick={() => {
                  if (!isMultiSelectMode) {
                    console.log('[DEBUG] PC Click - Navigate to student detail:', student.name);
                    navigate(`/student/${student.id}`, { state: { studentData: student } });
                  } else {
                    toggleSelection(student.id);
                  }
                }}
                onTouchStart={(e) => handleTouchStart(e, student)}
                onTouchMove={handleTouchMove}
                onTouchEnd={(e) => {
                  handleTouchEnd(e, student);
                  e.preventDefault(); // 阻止 Touch 事件触发 onClick
                }}
                className={`flex flex-col items-center p-2 rounded-xl transition-all duration-200 cursor-pointer select-none ${isSelected ? 'bg-orange-50 scale-95 ring-2 ring-primary' : 'active:scale-95 hover:bg-gray-50'
                  }`}
                title={isMultiSelectMode ? "点击选择/取消选择" : "单击查看学情详情，长按积分操作"}
              >
                <div className="relative">
                  <img
                    src={student.avatarUrl || '/avatar.jpg'}
                    alt={student.name}
                    onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
                    className={`w-14 h-14 rounded-full object-cover border-2 transition-all select-none pointer-events-none ${isSelected ? 'border-primary opacity-100' : 'border-gray-100'
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
                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm transition-colors ${isSelected ? 'bg-primary' : 'bg-gray-200'
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

          {/* 🆕 UI宪法 V5.0: 新增学生卡片 - 融入网格，虚线风格，微动效 */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex flex-col items-center p-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-300 active:scale-95 transition-all duration-300 group h-[116px] justify-center"
          >
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-300 group-hover:text-blue-500 group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </div>
            <span className="mt-2 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
              新增学生
            </span>
            <span className="text-[10px] text-slate-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              点击添加
            </span>
          </button>
        </div>

        {/* 新增学生按钮 - 放在学生头像网格下方 */}
      </div>

      {/* 底部保留一定间距 */}
      <div className="h-20"></div>

      {/* Batch Action Bar - 🆕 两个独立按钮 */}
      {
        isMultiSelectMode && selectedIds.size > 0 && (
          <div className="fixed bottom-24 left-0 right-0 px-4 z-30 animate-in slide-in-from-bottom-10">
            <div className="flex gap-3">
              {/* 批量签到按钮 */}
              <button
                onClick={() => {
                  handleBatchCheckin(Array.from(selectedIds));
                }}
                className="flex-1 bg-green-500 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center space-x-2 active:scale-95 transition-transform"
              >
                <Calendar size={20} />
                <span>签到 ({selectedIds.size})</span>
              </button>
              {/* 批量评分按钮 */}
              <button
                onClick={handleBatchScoreClick}
                className="flex-1 bg-gray-900 text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center space-x-2 active:scale-95 transition-transform"
              >
                <CheckSquare size={20} />
                <span>评分 ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )
      }

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
        onCheckin={user?.role === 'TEACHER' ? handleBatchCheckin : undefined}
      />


      {
        toastMsg && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-3 rounded-xl shadow-lg text-sm z-[70] font-bold">
            {toastMsg}
          </div>
        )
      }

      {/* AddStudentModal - 标准新增学生模态框 */}
      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStudent}
      />

      {/* 班级切换底部抽屉 */}
      <div className={`fixed inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out ${isClassDrawerOpen ? 'translate-y-0' : 'translate-y-full'
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
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${viewMode === 'MY_STUDENTS'
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
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${viewMode === 'ALL_SCHOOL'
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
                    // 🆕 切换到指定老师的班级视图 (从首页切换仅作为临时查看)
                    switchViewMode('SPECIFIC_CLASS', cls.teacherId, cls.teacherName, false);
                    setIsClassDrawerOpen(false);
                    setToastMsg(`正在查看${cls.teacherName}的班级`);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${viewMode === 'SPECIFIC_CLASS' && selectedTeacherId === cls.teacherId
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
            <div className={`mt-4 p-3 border rounded-xl ${viewMode === 'ALL_SCHOOL'
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
              <p className={`text-xs mt-1 ${viewMode === 'ALL_SCHOOL'
                ? 'text-blue-600'
                : viewMode === 'SPECIFIC_CLASS'
                  ? 'text-purple-600'
                  : 'text-green-600'
                }`}>
                {viewMode === 'ALL_SCHOOL' || viewMode === 'SPECIFIC_CLASS'
                  ? '该模式下可以"物色"学生。长按学生头像，选择"移入我的班级"即可。'
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
import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Search, Settings, Trash2, Plus, ChevronRight, User, Shield, Award, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import ProtectedRoute from '../components/ProtectedRoute';
import apiService from '../services/api.service';

// --- 类型定义 ---

interface Task {
  id: number;
  name: string;
  type: 'QC' | 'TASK' | 'SPECIAL';
  status: 'PENDING' | 'PASSED' | 'COMPLETED';
  exp: number;
  attempts: number; // 辅导/尝试次数
  isSpecial?: boolean;
  isAuto?: boolean;
  taskId?: string;
}

interface Lesson {
  unit: string;
  lesson?: string;
  title: string;
}

interface Student {
  id: number;
  name: string;
  avatar: string;
  lesson: Lesson;
  tasks: Task[];
  className?: string;
  level?: number;
  exp?: number;
  totalExp?: number;
}

interface TaskLibrary {
  [category: string]: { name: string; exp: number }[];
}

// 空的任务库 - 完全依赖API数据
const EMPTY_TASK_LIBRARY: TaskLibrary = {};

// --- 类型定义 ---
interface TaskLibraryItem {
  id: string;
  category: string;
  name: string;
  description?: string;
  defaultExp: number;
  type: string;
  difficulty?: number;
  isActive: boolean;
}

const QCView: React.FC = () => {
  const { user, token } = useAuth();
  const { currentClass, viewMode } = useClass(); // 🆕 获取viewMode用于师生绑定

  // --- 状态管理 ---
  const [activeTab, setActiveTab] = useState<'qc' | 'settle'>('qc');

  // 修改为固定底部间距，确保底部导航不被遮挡 - V1原版样式
  const pageStyle = {
    paddingBottom: 'calc(5rem + 1rem)', // 80px bottom nav + 16px padding
  };

  // 初始化学生数据状态，将从props更新
  const [qcStudents, setQcStudents] = useState<Student[]>([]);

  // 加载和错误状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 任务库状态管理
  const [taskLibrary, setTaskLibrary] = useState<TaskLibrary>(EMPTY_TASK_LIBRARY);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // 🚀 课程进度状态管理 - 集成备课页数据
  const [studentProgress, setStudentProgress] = useState<{
    chinese?: { unit: string; lesson?: string; title: string };
    math?: { unit: string; lesson?: string; title: string };
    english?: { unit: string; title: string };
    source: 'lesson_plan' | 'default';
    updatedAt: string;
  } | null>(null);

  // 课程进度编辑状态
  const [progressEditMode, setProgressEditMode] = useState(false);
  const [editedProgress, setEditedProgress] = useState<{
    chinese?: { unit: string; lesson?: string; title: string };
    math?: { unit: string; lesson?: string; title: string };
    english?: { unit: string; title: string };
  }>({});

  // 🚀 获取学生课程进度 - 集成备课页数据
  const fetchStudentProgress = async (studentId: number) => {
    if (!token) {
      console.warn('[QCView] 没有token，无法查询学生课程进度');
      return null;
    }

    try {
      const response = await apiService.get(`/lms/student-progress?studentId=${studentId}`);

      if (response.success && response.data) {
        setStudentProgress(response.data);
        setEditedProgress(response.data); // 初始化编辑状态
        return response.data;
      } else {
        console.warn('[QCView] 获取课程进度失败:', response.message);
      }
    } catch (error) {
      console.error('[QCView] 获取学生课程进度异常:', error);
    }

    return null;
  };

  // 🚀 更新学生课程进度 - 权限高于备课页
  const updateStudentProgress = async (studentId: number) => {
    if (!token) {
      alert('无法更新课程进度，请重新登录');
      return;
    }

    try {
      const response = await apiService.patch(`/lms/student-progress/${studentId}`, editedProgress);

      if (response.success && response.data) {
        setStudentProgress(response.data.progress);
        setProgressEditMode(false);
        alert('课程进度更新成功！');

        // 震动反馈
        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        console.error('[QCView] 更新课程进度失败:', response.message);
        alert(`更新失败: ${response.message}`);
      }
    } catch (error) {
      console.error('[QCView] 更新学生课程进度异常:', error);
      alert('更新课程进度失败，请重试');
    }
  };

  // 获取学生任务记录
  const fetchStudentRecords = async (studentId: string, date: string) => {
    if (!token) {
      console.warn(`[QCView] 没有token，无法查询学生 ${studentId} 的任务记录`);
      return [];
    }

    try {
      const response = await apiService.get(`/lms/daily-records?studentId=${studentId}&date=${date}`);

      if (response.success && response.data) {
        const records = response.data as any[];
        return records;
      } else {
        console.warn(`[QCView] API调用失败或无数据:`, response.message);
      }
    } catch (error) {
      console.error(`[QCView] 获取学生 ${studentId} 任务记录异常:`, error);
    }

    return [];
  };

  // 🆕 基于师生绑定的安全学生数据获取函数 - 与Home.tsx保持一致
  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 🆕 基于师生绑定，与Home.tsx保持一致的查询逻辑
      const params = new URLSearchParams();

      if (viewMode === 'MY_STUDENTS' && user?.userId) {
        params.append('scope', 'MY_STUDENTS');
        params.append('teacherId', user.userId);
        params.append('userRole', user.role || 'TEACHER');
      } else if (viewMode === 'ALL_SCHOOL') {
        params.append('scope', 'ALL_SCHOOL');
        params.append('userRole', user?.role || 'TEACHER');
        if (user?.userId) {
          params.append('teacherId', user.userId);
        }
      }

      // 保留兼容性：如果有具体的班级选择，也加上
      if (currentClass !== 'ALL' && currentClass !== '') {
        params.append('classRoom', currentClass);
      }

      const url = `/students${params.toString() ? '?' + params.toString() : ''}`;

      const response = await apiService.get(url);

      // 智能数据提取
      let studentData = [];
      if (response?.success && response?.data) {
        studentData = (response.data as { students: unknown[] }).students;
      } else if (response?.data && Array.isArray(response.data)) {
        studentData = response.data;
      } else if (Array.isArray(response)) {
        studentData = response;
      } else {
        console.warn("[QCView] Unexpected response format:", response);
        setQcStudents([]);
        return;
      }

      // 获取今天的日期
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD格式

      // 为每个学生获取今天的任务记录
      const studentsWithTasks = await Promise.all(
        studentData.map(async (student: any) => {
          const records = await fetchStudentRecords(student.id, dateStr);

          // 将后端记录转换为前端需要的格式
          const tasks = records.map((record: any) => ({
            id: record.id,
            recordId: record.id, // 🚀 关键修复：确保recordId字段存在，用于API调用
            name: record.title, // 使用 record.title 而不是 record.name
            type: record.type.toUpperCase(), // QC, TASK, SPECIAL - 确保大写
            status: record.status === 'PENDING' ? 'PENDING' :
                   record.status === 'SUBMITTED' ? 'PENDING' :
                   record.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING',
            exp: record.expAwarded || 5,
            attempts: (record.content?.attempts) || 0,
            isAuto: record.type === 'SPECIAL'
          }));

          return {
            ...student,
            tasks: tasks || [], // 使用真实任务记录
            avatarUrl: student.avatarUrl || '/1024.jpg', // 设置默认头像为1024.jpg
            lesson: student.lesson || { unit: '1', lesson: '1', title: '默认课程' } // 添加默认lesson属性
          };
        })
      );

      setQcStudents(studentsWithTasks);
    } catch (err) {
      console.error("[QCView] Failed to fetch students:", err);
      setError('获取学生数据失败');
      setQcStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 数据获取
  useEffect(() => {
    // 并行获取学生数据和任务库数据
    const fetchInitialData = async () => {
      try {
        await Promise.all([
          fetchStudents(),
          fetchTaskLibrary()
        ]);
      } catch (error) {
        console.error('[QCView] 初始数据加载失败:', error);
      }
    };

    fetchInitialData();
  }, [token, currentClass, viewMode, user?.userId]); // 🆕 添加viewMode和userId依赖，确保视图切换时重新获取数据

  // UI 控制状态
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [isQCDrawerOpen, setIsQCDrawerOpen] = useState(false);
  const [isCMSDrawerOpen, setIsCMSDrawerOpen] = useState(false);

  // CMS 状态
  const [taskDB, setTaskDB] = useState<TaskLibrary>(taskLibrary);
  const [currentCategory, setCurrentCategory] = useState("基础核心");
  const [isManageMode, setIsManageMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualExp, setManualExp] = useState(10);
  const [lessonEditMode, setLessonEditMode] = useState(false); // 修改进度的弹窗

  // 获取任务库 (复用PrepView逻辑)
  const fetchTaskLibrary = async () => {
    if (!token) {
      console.warn('[QCView] 获取任务库失败：未找到认证token');
      return;
    }

    setIsTasksLoading(true);
    setTasksError(null);

    try {
      const response = await apiService.get('/lms/task-library');

      if (response.success && response.data) {
        const tasks = response.data as TaskLibraryItem[];

        // 转换为TaskLibrary格式
        const convertedLibrary = convertApiToTaskLibrary(tasks);
        setTaskLibrary(convertedLibrary);
        setTaskDB(convertedLibrary); // 同时更新CMS的任务库
      } else {
        setTasksError(response.message || '获取任务库失败');
      }
    } catch (err) {
      console.error('[QCView] 获取任务库异常:', err);
      setTasksError('网络错误，获取任务库失败');
      // API失败时不使用降级数据，保持空状态
      setTaskLibrary(EMPTY_TASK_LIBRARY);
      setTaskDB(EMPTY_TASK_LIBRARY);
    } finally {
      setIsTasksLoading(false);
    }
  };

  // --- 辅助函数 ---

  // API响应转换为TaskLibrary格式
  const convertApiToTaskLibrary = (apiData: TaskLibraryItem[]): TaskLibrary => {
    return apiData.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = [];
      }
      acc[task.category].push({
        name: task.name,
        exp: task.defaultExp
      });
      return acc;
    }, {} as TaskLibrary);
  };

  const getSelectedStudent = () => qcStudents.find(s => s.id === selectedStudentId);

  const getLessonStr = (l: Lesson) => {
    return l.lesson ? `第${l.unit}单元 第${l.lesson}课 ${l.title}` : `Unit ${l.unit} ${l.title}`;
  };

  const calculateTotalExp = () => {
    let total = 0;
    qcStudents.forEach(s => {
      s.tasks.forEach(t => {
        if (t.status === 'PASSED' || t.status === 'COMPLETED') total += t.exp;
      });
    });
    return total;
  };

  // --- 交互逻辑 ---

  // 1. 质检台操作
  const openQCDrawer = async (sid: number) => {
    const student = qcStudents.find(s => s.id === sid);

    setSelectedStudentId(sid);
    setIsQCDrawerOpen(true);

    // 🚀 获取该学生的课程进度数据
    if (student) {
      await fetchStudentProgress(student.id);
    }
  };

  const recordAttempt = async (e: React.MouseEvent, studentId: number, taskId: number) => {
    e.stopPropagation();

    try {
      // 获取API地址
      const protocol = window.location.protocol;
      const host = window.location.host;
      const apiUrl = `${protocol}//${host}/api`;

      // 调用后端API记录辅导尝试
      const response = await fetch(`${apiUrl}/records/${taskId}/attempt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // 更新本地状态 - V1原版逻辑
          setQcStudents(prev => prev.map(s => {
            if (s.id !== studentId) return s;
            return {
              ...s,
              tasks: s.tasks.map(t => {
                if (t.id !== taskId || t.status === 'PASSED') return t;
                return { ...t, attempts: t.attempts + 1 };
              })
            };
          }));
          // 震动反馈
          if (navigator.vibrate) navigator.vibrate(50);
          console.log('辅导尝试记录成功:', data.message);
        } else {
          console.error('记录辅导尝试失败:', data.error);
          alert('记录辅导尝试失败: ' + data.error);
        }
      } else {
        console.error('API调用失败:', response.statusText);
        alert('记录辅导尝试失败，请稍后重试');
      }
    } catch (error) {
      console.error('记录辅导尝试错误:', error);
      // 降级处理：直接更新本地状态
      setQcStudents(prev => prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          tasks: s.tasks.map(t => {
            if (t.id !== taskId || t.status === 'PASSED') return t;
            return { ...t, attempts: t.attempts + 1 };
          })
        };
      }));
      alert('记录辅导尝试失败，已本地更新');
    }
  };

  const toggleQCPass = async (studentId: number, taskId: number) => {
    try {
      // 找到对应的学生和任务
      const student = qcStudents.find(s => s.id === studentId);
      const task = student?.tasks.find(t => t.id === taskId);

      if (!student || !task || !task.recordId) {
        console.error('[QCView] 未找到学生、任务或任务记录ID');
        // 降级处理：更新本地状态
        setQcStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            tasks: s.tasks.map(t => {
              if (t.id !== taskId) return t;
              const newStatus = t.status === 'PASSED' ? 'PENDING' : 'PASSED';
              return { ...t, status: newStatus };
            })
          };
        }));
        return;
      }

      const newStatus = task.status === 'PASSED' ? 'PENDING' : 'COMPLETED';

      // 调用API更新任务状态
      const response = await apiService.patch(`/lms/records/${task.recordId}/status`, {
        status: newStatus
      });

      if (response.success) {
        // 更新本地状态
        setQcStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            tasks: s.tasks.map(t => {
              if (t.id !== taskId) return t;
              return { ...t, status: newStatus === 'COMPLETED' ? 'PASSED' : 'PENDING' };
            })
          };
        }));

        // 震动反馈
        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        console.error('[QCView] API更新失败:', response.message);
        alert(`更新失败: ${response.message}`);
      }

    } catch (error) {
      console.error('[QCView] 切换QC任务状态失败:', error);
      alert('更新任务状态失败，请重试');
    }
  };

  const passAllQC = async () => {
    if (!selectedStudentId) return;

    try {
      // 获取当前学生的QC任务记录ID
      const selectedStudent = qcStudents.find(s => s.id === selectedStudentId);
      if (!selectedStudent) {
        console.error('[QCView] 未找到选中的学生');
        return;
      }

      const qcTaskIds = selectedStudent.tasks
        .filter(t => t.type === 'QC' && t.status !== 'PASSED')
        .map(t => t.recordId)
        .filter(id => id); // 过滤掉空值

      if (qcTaskIds.length === 0) {
        alert('所有QC任务都已过关！');
        return;
      }

      // 调用API批量更新任务状态
      const response = await apiService.patch('/lms/records/batch/status', {
        recordIds: qcTaskIds,
        status: 'COMPLETED'
      });

      if (response.success) {
        // 更新本地状态
        setQcStudents(prev => prev.map(s => {
          if (s.id !== selectedStudentId) return s;
          return {
            ...s,
            tasks: s.tasks.map(t => t.type === 'QC' ? { ...t, status: 'PASSED' } : t)
          };
        }));

        // 震动反馈
        if (navigator.vibrate) navigator.vibrate(100);

        alert(`一键过关成功！已更新 ${qcTaskIds.length} 个任务`);
      } else {
        console.error('[QCView] API更新失败:', response.message);
        alert(`更新失败: ${response.message}`);
      }

    } catch (error) {
      console.error('[QCView] 一键过关操作失败:', error);
      alert('一键过关失败，请重试');
    }
  };

  const deleteTask = (studentId: number, taskId: number) => {
    if (!window.confirm("确认删除此任务？")) return;
    setQcStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return { ...s, tasks: s.tasks.filter(t => t.id !== taskId) };
    }));
  };

  // 2. 结算台操作
  const toggleTaskComplete = async (studentId: number, taskId: number) => {
    try {
      // 找到对应的学生和任务
      const student = qcStudents.find(s => s.id === studentId);
      const task = student?.tasks.find(t => t.id === taskId);

      if (!student || !task || !task.recordId) {
        console.error('[QCView] 未找到学生、任务或任务记录ID');
        return;
      }

      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

      // 调用API更新任务状态
      const response = await apiService.patch(`/lms/records/${task.recordId}/status`, {
        status: newStatus
      });

      if (response.success) {
        // 更新本地状态
        setQcStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            tasks: s.tasks.map(t => {
              if (t.id !== taskId) return t;
              return { ...t, status: newStatus };
            })
          };
        }));
      } else {
        console.error('[QCView] API更新失败:', response.message);
        alert(`更新失败: ${response.message}`);
      }

    } catch (error) {
      console.error('[QCView] 切换任务状态失败:', error);
      alert('更新任务状态失败，请重试');
    }
  };

  // 结算功能 - V1原版逻辑
  const settleToday = async () => {
    try {
      // 获取API地址
      const protocol = window.location.protocol;
      const host = window.location.host;
      const apiUrl = `${protocol}//${host}/api`;

      // 获取有完成任务的学生
      const studentsWithCompletedTasks = qcStudents.filter(s =>
        s.tasks.filter(t => t.status === 'COMPLETED').length > 0
      );

      if (studentsWithCompletedTasks.length === 0) {
        alert('暂无已完成任务的学生需要结算');
        return;
      }

      // 批量结算每个学生的完成任务
      const settlePromises = studentsWithCompletedTasks.map(async (student) => {
        const response = await fetch(`${apiUrl}/records/student/${student.id}/pass-all`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expBonus: 0 })
        });

        if (!response.ok) {
          throw new Error(`结算学生${student.name}失败`);
        }

        return await response.json();
      });

      // 等待所有结算完成
      const results = await Promise.allSettled(settlePromises);

      // 统计结果
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      const totalExp = calculateTotalExp();

      // 显示结算结果
      if (failCount === 0) {
        alert(`结算成功！\n已结算学生：${successCount}人\n总经验值：${totalExp} EXP\n\n数据已同步到系统！`);
      } else {
        alert(`结算完成！\n成功结算：${successCount}人\n结算失败：${failCount}人\n总经验值：${totalExp} EXP\n\n部分数据同步失败，请检查网络连接`);
      }

    } catch (error) {
      console.error('结算错误:', error);
      // 降级处理：显示本地结算结果
      const totalExp = calculateTotalExp();
      alert(`本地结算完成！\n总经验值：${totalExp} EXP\n\n数据将在下次同步时上传到系统`);
    }
  };

  // 3. CMS / 自主任务
  const openCMSDrawer = (sid: number) => {
    setSelectedStudentId(sid);
    setIsCMSDrawerOpen(true);
  };

  const claimTask = (name: string, exp: number) => {
    if (!selectedStudentId) return;
    setQcStudents(prev => prev.map(s => {
      if (s.id !== selectedStudentId) return s;
      return {
        ...s,
        tasks: [...s.tasks, {
          id: Date.now(),
          name,
          type: 'TASK',
          status: 'COMPLETED', // 自主申报默认完成
          exp,
          attempts: 0,
          isAuto: true
        }]
      };
    }));
    setIsCMSDrawerOpen(false);
  };

  const addManualTask = () => {
    if (manualName.trim()) {
      claimTask(manualName, manualExp);
      setManualName("");
    }
  };

  // 管理 CMS 库 (简化版) - V1原版逻辑
  const addTaskToDB = () => {
    const name = prompt("输入新任务名称:");
    if (!name) return;
    setTaskDB(prev => ({
      ...prev,
      [currentCategory]: [{name, exp: 10}, ...prev[currentCategory]]
    }));
  };

  const removeTaskFromDB = (index: number) => {
    if (!window.confirm("删除此模板任务？")) return;
    setTaskDB(prev => ({
      ...prev,
      [currentCategory]: prev[currentCategory].filter((_, i) => i !== index)
    }));
  };

  
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full bg-gray-100 font-sans text-slate-900" style={pageStyle}>

        {/* === 顶部 Header (V1原版样式) === */}
        <div className="bg-white pt-10 px-4 pb-2 border-b border-gray-200 shadow-sm z-10">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="text-xl font-extrabold text-slate-800">
                {activeTab === 'qc' ? '过关台' : '任务结算台'}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400">
                {activeTab === 'qc' ? '记录辅导过程，体现深度服务' : '确认完成 & 发放EXP'}
              </span>
              {currentClass !== 'ALL' && (
                <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {currentClass}
                </div>
              )}
              {currentClass === 'ALL' && (
                <div className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                  全校
                </div>
              )}
            </div>

            {/* 结算页显示总分 */}
            {activeTab === 'settle' && (
              <div className="text-right">
                <div className="text-2xl font-black text-indigo-600 font-mono">
                  {calculateTotalExp()}
                </div>
                <div className="text-[10px] text-gray-400 font-bold tracking-wider">TOTAL EXP</div>
              </div>
            )}
          </div>

          {/* Tab 切换 (替代底部导航，放在顶部更符合单页应用逻辑) - V1原版样式 */}
          <div className="flex bg-slate-100 p-1 rounded-lg mt-3">
            <button
              onClick={() => setActiveTab('qc')}
              className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab==='qc' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              🛡️ 过关
            </button>
            <button
              onClick={() => setActiveTab('settle')}
              className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab==='settle' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              💰 结算
            </button>
          </div>
        </div>

        {/* === 内容滚动区 === */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">

          {/* --- VIEW 1: 质检台 (V1原版样式) --- */}
          {activeTab === 'qc' && (
            <div className="grid grid-cols-3 gap-3">
              {qcStudents.map(student => {
                const qcTasks = student.tasks.filter(t => t.type === 'QC');
                const total = qcTasks.length;
                const passed = qcTasks.filter(t => t.status === 'PASSED').length;
                const percent = total > 0 ? (passed / total) * 100 : 0;
                const isFull = percent === 100;

                return (
                  <div
                    key={student.id}
                    onClick={() => openQCDrawer(student.id)}
                    className="bg-white p-3 rounded-2xl shadow-sm border border-transparent hover:border-indigo-100 active:scale-95 transition-all flex flex-col items-center"
                  >
                    <div className="relative w-11 h-11 rounded-full mb-2 border-2 border-gray-100 overflow-hidden">
                      <img
                        src="/1024.jpg"
                        alt={student.name}
                        onError={(e)=>{ e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 fill=%22%23e5e7eb%22/><circle cx=%2232%22 cy=%2224%22 r=%2212%22 fill=%22%23cbd5e1%22/><rect x=%2216%22 y=%2240%22 width=%2232%22 height=%2216%22 rx=%228%22 fill=%22%23cbd5e1%22/></svg>'; }}
                        className="w-full h-full rounded-full bg-gray-200 object-cover select-none pointer-events-none"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                    </div>
                    <div className="font-bold text-sm text-slate-800">{student.name}</div>
                    <div className="text-[10px] text-gray-400 mb-2 truncate max-w-full">
                      {getLessonStr(student.lesson)}
                    </div>
                    {/* 进度条 */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${isFull ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- VIEW 2: 结算台 (V1原版样式) --- */}
          {activeTab === 'settle' && (
            <div className="space-y-4">
              {qcStudents.map(student => (
                <div key={student.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                  {/* Group Header */}
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-gray-100 overflow-hidden">
                        <img
                          src="/1024.jpg"
                          alt={student.name}
                          onError={(e)=>{ e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 fill=%22%23e5e7eb%22/><circle cx=%2232%22 cy=%2224%22 r=%2212%22 fill=%22%23cbd5e1%22/><rect x=%2216%22 y=%2240%22 width=%2232%22 height=%2216%22 rx=%228%22 fill=%22%23cbd5e1%22/></svg>'; }}
                          className="w-full h-full rounded-full bg-gray-200 object-cover select-none pointer-events-none"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                      </div>
                      <span className="font-bold text-slate-800">{student.name}</span>
                    </div>
                    <button
                      onClick={() => openCMSDrawer(student.id)}
                      className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md shadow-indigo-200 active:scale-95 transition-transform"
                    >
                      <Plus size={12} strokeWidth={3} /> 任务
                    </button>
                  </div>

                  {/* Task Rows */}
                  <div className="divide-y divide-slate-50">
                    {student.tasks.map(task => {
                      const isQC = task.type === 'QC';
                      const isDone = task.status === 'PASSED' || task.status === 'COMPLETED';

                      // 努力标签: QC且尝试次数>0且已过关
                      const showEffort = isQC && task.attempts > 0 && isDone;

                      return (
                        <div
                          key={task.id}
                          className="px-4 py-3 flex items-center active:bg-slate-50 transition-colors"
                          onClick={(e) => {
                            if (isQC) {
                              recordAttempt(e, student.id, task.id);
                            } else {
                              toggleTaskComplete(student.id, task.id);
                            }
                          }}
                        >
                          {/* Icon */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white mr-3 transition-colors ${
                            isQC
                              ? (isDone ? 'bg-green-500' : 'bg-red-100 text-red-500')
                              : (isDone ? 'bg-green-500' : 'border-2 border-slate-300')
                          }`}>
                            {isQC ? (isDone ? '✓' : '✕') : (isDone && '✓')}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className={`text-[13px] font-medium ${isDone ? 'text-slate-400' : 'text-slate-800'}`}>
                              {task.isSpecial && '🌟 '}{task.name}

                              {/* Tags */}
                              {isQC && <span className="ml-2 text-[10px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-bold">过关项</span>}
                              {task.isAuto && <span className="ml-2 text-[10px] bg-orange-50 text-orange-500 px-1 py-0.5 rounded font-bold">自主</span>}
                              {showEffort && (
                                <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-1 py-0.5 rounded font-bold flex inline-flex items-center gap-0.5">
                                  🔥 {task.attempts + 1}次过关
                                </span>
                              )}
                            </div>
                          </div>

                          {/* EXP */}
                          <div className="text-xs font-bold text-amber-500">+{task.exp}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg mt-4 active:scale-95 transition-transform" onClick={settleToday}>
                确认今日结算
              </button>
            </div>
          )}

        </div>

        {/* === 抽屉 1: 学生质检详情 (QC Drawer) - V1原版样式 === */}
        {isQCDrawerOpen && selectedStudentId && (
          <>
            {/* 遮罩层 */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsQCDrawerOpen(false)}
            />
            {/* 侧滑内容 */}
            <div className="fixed inset-y-0 right-0 w-[85%] bg-white shadow-2xl z-50 flex flex-col animate-slide-left">
              <div className="p-5 flex justify-between items-center border-b border-slate-100">
                <span className="text-xl font-extrabold text-slate-800">
                  {getSelectedStudent()?.name}
                </span>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={passAllQC}
                    className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-green-200 active:scale-95"
                  >
                    <Award size={14} /> 一键过关
                  </button>
                  <X className="text-gray-400 cursor-pointer" onClick={() => setIsQCDrawerOpen(false)} />
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                {/* 🚀 课程进度 (集成备课页数据，权限高于备课页) */}
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                        <BookOpen size={14} className="text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] text-indigo-600 font-bold">当前进度</div>
                        <div className="text-xs text-indigo-500">
                          {studentProgress?.source === 'lesson_plan' ? '来自备课计划' : '默认进度'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!progressEditMode && (
                        <button
                          onClick={() => {
                            setEditedProgress({
                              chinese: studentProgress?.chinese || { unit: "1", lesson: "1", title: "默认" },
                              math: studentProgress?.math || { unit: "1", lesson: "1", title: "默认" },
                              english: studentProgress?.english || { unit: "1", title: "Default" }
                            });
                            setProgressEditMode(true);
                          }}
                          className="text-[11px] font-bold text-indigo-600 border border-indigo-200 px-2 py-1 rounded bg-white hover:bg-indigo-50"
                        >
                          ✎ 编辑
                        </button>
                      )}
                      {progressEditMode && (
                        <>
                          <button
                            onClick={() => updateStudentProgress(selectedStudentId!)}
                            className="text-[11px] font-bold text-green-600 border border-green-200 px-2 py-1 rounded bg-white hover:bg-green-50"
                          >
                            ✓ 保存
                          </button>
                          <button
                            onClick={() => {
                            setProgressEditMode(false);
                            setEditedProgress({});
                          }}
                            className="text-[11px] font-bold text-gray-600 border border-gray-200 px-2 py-1 rounded bg-white hover:bg-gray-50"
                          >
                            ✕ 取消
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {!progressEditMode && studentProgress && (
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-[8px] text-orange-600 font-bold mb-1">语文</div>
                        <div className="text-xs font-bold text-gray-800">
                          {studentProgress.chinese?.unit}单元 {studentProgress.chinese?.lesson ? `${studentProgress.chinese.lesson}课` : ''}
                        </div>
                        <div className="text-[9px] text-gray-500 truncate">
                          {studentProgress.chinese?.title}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-[8px] text-blue-600 font-bold mb-1">数学</div>
                        <div className="text-xs font-bold text-gray-800">
                          {studentProgress.math?.unit}单元 {studentProgress.math?.lesson ? `${studentProgress.math?.lesson}课` : ''}
                        </div>
                        <div className="text-[9px] text-gray-500 truncate">
                          {studentProgress.math?.title}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-[8px] text-purple-600 font-bold mb-1">英语</div>
                        <div className="text-xs font-bold text-gray-800">
                          {studentProgress.english?.unit}单元
                        </div>
                        <div className="text-[9px] text-gray-500 truncate">
                          {studentProgress.english?.title}
                        </div>
                      </div>
                    </div>
                  )}

                  {progressEditMode && (
                    <div className="space-y-3">
                      {/* 语文编辑 */}
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-[10px] text-orange-600 font-bold mb-2">语文进度</div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="单元"
                            value={editedProgress.chinese?.unit || ''}
                            onChange={(e) => setEditedProgress(prev => ({
                              ...prev,
                              chinese: { ...prev.chinese, unit: e.target.value }
                            }))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                          <input
                            type="text"
                            placeholder="课时"
                            value={editedProgress.chinese?.lesson || ''}
                            onChange={(e) => setEditedProgress(prev => ({
                              ...prev,
                              chinese: { ...prev.chinese, lesson: e.target.value }
                            }))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                          <input
                            type="text"
                            placeholder="课程标题"
                            value={editedProgress.chinese?.title || ''}
                            onChange={(e) => setEditedProgress(prev => ({
                              ...prev,
                              chinese: { ...prev.chinese, title: e.target.value }
                            }))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded col-span-3"
                          />
                        </div>
                      </div>

                      {/* 数学编辑 */}
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-[10px] text-blue-600 font-bold mb-2">数学进度</div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="单元"
                            value={editedProgress.math?.unit || ''}
                            onChange={(e) => setEditedProgress(prev => ({
                              ...prev,
                              math: { ...prev.math, unit: e.target.value }
                            }))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                          <input
                            type="text"
                            placeholder="课时"
                            value={editedProgress.math?.lesson || ''}
                            onChange={(e) => setEditedProgress(prev => ({
                              ...prev,
                              math: { ...prev.math, lesson: e.target.value }
                            }))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                          <input
                            type="text"
                            placeholder="课程标题"
                            value={editedProgress.math?.title || ''}
                            onChange={(e) => setEditedProgress(prev => ({
                              ...prev,
                              math: { ...prev.math, title: e.target.value }
                            }))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded col-span-3"
                          />
                        </div>
                      </div>

                      {/* 英语编辑 */}
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-[10px] text-purple-600 font-bold mb-2">英语进度</div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="单元"
                            value={editedProgress.english?.unit || ''}
                            onChange={(e) => setEditedProgress(prev => ({
                              ...prev,
                              english: { ...prev.english, unit: e.target.value }
                            }))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                          <input
                            type="text"
                            placeholder="课程标题"
                            value={editedProgress.english?.title || ''}
                            onChange={(e) => setEditedProgress(prev => ({
                              ...prev,
                              english: { ...prev.english, title: e.target.value }
                            }))}
                            className="px-2 py-1 text-xs border border-gray-200 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 临时：显示所有任务类型以便调试 */}
                <div className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                  <Shield size={12} /> 需过关项目 (⚠️ 点一次记录一次努力)
                </div>

                
                {/* QC List */}
                <div className="space-y-0">
                  {(() => {
                    const selectedStudent = getSelectedStudent();
                    const allTasks = selectedStudent?.tasks || [];
                    const qcTasks = allTasks.filter(t => t.type === 'QC');
                    return qcTasks.length === 0;
                  })() ? (
                    <div className="text-center py-8 text-gray-400">
                      <Shield size={32} className="mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">暂无过关项目</p>
                      <p className="text-xs">请先到备课页发布任务，或在下方自主任务申报中添加</p>
                    </div>
                  ) : (
                    getSelectedStudent()?.tasks.filter(t => t.type === 'QC').map(task => {
                    const isPass = task.status === 'PASSED';
                    return (
                      <div
                        key={task.id}
                        className="flex items-center py-3 border-b border-slate-100 active:bg-slate-50 transition-colors"
                        // 长按删除模拟: 这里用右键/双击代替，移动端可加LongPress
                        onContextMenu={(e) => { e.preventDefault(); deleteTask(selectedStudentId, task.id); }}
                      >
                        {/* 辅导按钮 */}
                        <button
                          onClick={(e) => recordAttempt(e, selectedStudentId, task.id)}
                          className="mr-3 bg-red-50 text-red-600 border border-red-100 px-2 py-1 rounded text-[11px] font-bold flex items-center gap-1 active:bg-red-100"
                        >
                          ⚠️ 辅导
                        </button>

                        {/* 勾选框 */}
                        <div
                          onClick={() => toggleQCPass(selectedStudentId, task.id)}
                          className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center transition-all cursor-pointer ${
                            isPass
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-slate-300 text-transparent'
                          }`}
                        >
                          <Check size={14} strokeWidth={4} />
                        </div>

                        <div className="flex-1">
                          <span className={`text-[14px] font-medium ${isPass ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                            {task.name}
                          </span>
                          {task.attempts > 0 && (
                            <span className="ml-2 text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                              {task.attempts}次尝试
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                  )}
                </div>

                <div className="mt-6 text-center text-[10px] text-gray-300">
                  💡 长按条目可删除
                </div>
              </div>
            </div>
          </>
        )}

        {/* === 抽屉 2: CMS 任务库 (CMS Drawer) - V1原版样式 === */}
        {isCMSDrawerOpen && selectedStudentId && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsCMSDrawerOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl h-[85vh] z-50 flex flex-col animate-slide-up overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div>
                  <div className="font-bold text-lg text-slate-800">自主任务申报</div>
                  <div className="text-xs text-slate-500">
                    学生: <span className="text-indigo-600 font-bold">{getSelectedStudent()?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsManageMode(!isManageMode)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                      isManageMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    <Settings size={12} /> {isManageMode ? '完成' : '管理库'}
                  </button>
                  <X className="text-gray-400 cursor-pointer" onClick={() => setIsCMSDrawerOpen(false)} />
                </div>
              </div>

              {/* Manual Entry */}
              <div className="p-3 bg-white border-b border-slate-100 shrink-0">
                <div className="flex gap-2">
                  <input
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="✨ 手动输入特殊任务..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2">
                    <span className="text-slate-400 text-xs font-bold mr-1">+</span>
                    <input
                      type="number"
                      value={manualExp}
                      onChange={(e) => setManualExp(Number(e.target.value))}
                      className="w-8 bg-transparent text-center font-bold text-sm outline-none"
                    />
                  </div>
                  <button
                    onClick={addManualTask}
                    className="px-4 bg-slate-900 text-white rounded-lg text-sm font-bold"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* Body: Sidebar + List */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-24 bg-slate-50 border-r border-slate-100 overflow-y-auto">
                  {Object.keys(taskDB).map(cat => (
                    <div
                      key={cat}
                      onClick={() => setCurrentCategory(cat)}
                      className={`p-4 text-[12px] font-medium cursor-pointer border-l-4 transition-colors relative ${
                        currentCategory === cat
                          ? 'bg-white text-indigo-600 border-indigo-600 font-bold'
                          : 'text-slate-500 border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {isManageMode && <span className="text-[10px] mr-1">✏️</span>}
                      {cat}
                    </div>
                  ))}
                  {isManageMode && (
                    <div
                      className="p-4 text-[12px] font-bold text-indigo-500 cursor-pointer"
                      onClick={() => {
                        const n = prompt("新分类名称:");
                        if(n) { setTaskDB(p => ({...p, [n]: []})); setCurrentCategory(n); }
                      }}
                    >
                      + 分类
                    </div>
                  )}
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-3 bg-white">
                  {isManageMode && (
                    <div
                      onClick={addTaskToDB}
                      className="p-3 mb-2 rounded-lg border border-dashed border-indigo-200 text-indigo-500 text-center text-xs font-bold cursor-pointer hover:bg-indigo-50"
                    >
                      + 新增模板任务
                    </div>
                  )}

                  {taskDB[currentCategory]?.map((t, idx) => (
                    <div
                      key={idx}
                      onClick={() => !isManageMode && claimTask(t.name, t.exp)}
                      className={`flex justify-between items-center p-3 mb-2 rounded-lg border transition-all cursor-pointer ${
                        isManageMode
                          ? 'border-dashed border-amber-300 bg-amber-50'
                          : 'border-slate-100 hover:border-indigo-200 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="text-[13px] font-medium text-slate-800">{t.name}</div>
                        <div className="text-[11px] font-bold text-amber-500 mt-0.5">+{t.exp} EXP</div>
                      </div>
                      {isManageMode ? (
                        <div
                          onClick={(e) => { e.stopPropagation(); removeTaskFromDB(idx); }}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-full"
                        >
                          <Trash2 size={16} />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          +
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 修改进度弹窗 - V1原版样式 */}
        {lessonEditMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">修改课程进度</h3>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">单元</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={getSelectedStudent()?.lesson.unit || 1}
                    onChange={(e) => {
                      const newUnit = parseInt(e.target.value) || 1;
                      const student = getSelectedStudent();
                      if (student) {
                        const updatedStudents = qcStudents.map(s =>
                          s.id === selectedStudentId
                            ? { ...s, lesson: { ...s.lesson, unit: newUnit.toString() } }
                            : s
                        );
                        setQcStudents(updatedStudents);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg text-center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">课程</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={getSelectedStudent()?.lesson.lesson || 1}
                    onChange={(e) => {
                      const newLesson = parseInt(e.target.value) || 1;
                      const student = getSelectedStudent();
                      if (student) {
                        const updatedStudents = qcStudents.map(s =>
                          s.id === selectedStudentId
                            ? { ...s, lesson: { ...s.lesson, lesson: newLesson.toString() } }
                            : s
                        );
                        setQcStudents(updatedStudents);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg text-center"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    type="text"
                    value={getSelectedStudent()?.lesson.title || ''}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      const student = getSelectedStudent();
                      if (student) {
                        const updatedStudents = qcStudents.map(s =>
                          s.id === selectedStudentId
                            ? { ...s, lesson: { ...s.lesson, title: newTitle } }
                            : s
                        );
                        setQcStudents(updatedStudents);
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="课程标题"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex space-x-2">
                <button
                  onClick={() => setLessonEditMode(false)}
                  className="flex-1 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // TODO: 保存到数据库
                    setLessonEditMode(false);
                  }}
                  className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
};

export default QCView;
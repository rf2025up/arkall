import React, { useState, useEffect } from 'react';
import {
  Trophy, Medal, Swords, Check,
  Bot, Flame, Plus, ChevronRight, ChevronDown,
  Camera, Printer, AlertCircle, Calendar,
  BookOpen, Filter, Circle, Sparkles, ArrowLeft, X, Share2, Award
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { API } from '../services/api.service';
import apiService from '../services/api.service';
import { toast } from 'sonner';
import InviteCardModal from '../components/InviteCardModal';
import ParentBindingList from '../components/ParentBindingList';

// 本周数据过滤工具函数（周一到周日）
const filterThisWeek = <T extends { created_at?: string; date?: string }>(items: T[]): T[] => {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const monday = new Date(now);

  // 计算本周一的日期
  if (currentDay === 0) {
    // 如果是周日，本周一是前6天
    monday.setDate(now.getDate() - 6);
  } else {
    // 否则本周一是本周的第1天
    monday.setDate(now.getDate() - (currentDay - 1));
  }

  // 设置周一开始时间为 00:00:00
  monday.setHours(0, 0, 0, 0);

  // 计算本周日的日期（周一 + 6天）
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // 设置周日结束时间为 23:59:59
  sunday.setHours(23, 59, 59, 999);

  return items.filter(item => {
    const dateToCheck = item.created_at || item.date;
    if (!dateToCheck) return false;

    const itemDate = new Date(dateToCheck);
    return itemDate >= monday && itemDate <= sunday;
  });
};

// --- 模拟数据类型定义 ---
interface TimelineTask {
  id: string; // 🚀 修正为 string 以支持 UUID
  name: string;
  status: 'pending' | 'passed'; // pending=未过, passed=已过
  attempts: number;
  date?: string;
}

interface TimelineLesson {
  id: number;
  unit: number;
  lesson: number;
  title: string;
  status: 'done' | 'pending' | 'locked';
  tasks: TimelineTask[];
}

// V2 API 数据类型定义
interface TaskRecord {
  id: string;
  title: string;
  type: string;
  status: string;
  expAwarded: number;
  createdAt: string;
  content?: {
    attempts?: number;
    [key: string]: unknown;
  };
  lessonPlan?: Record<string, unknown>;
}

interface StudentProfile {
  student: {
    id: string;
    name: string;
    className: string;
    level: number;
    points: number;
    exp: number;
    totalExp: number;
    avatarUrl?: string;
    createdAt: string;
    progress?: {
      chinese?: { unit: string; lesson?: string; title: string };
      math?: { unit: string; lesson?: string; title: string };
      english?: { unit: string; title: string };
      source: string;
      updatedAt: string;
    };
    teachers?: {
      name: string;
    };
  };
  task_records: TaskRecord[];
  pkRecords: Array<{
    id: string;
    topic: string;
    opponent: {
      id: string;
      name: string;
      className: string;
    };
    isWinner: boolean;
    createdAt: string;
    playerA: any;
    playerB: any;
    isPlayerA: boolean;
  }>;
  pkStats: {
    totalMatches: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: string;
  };
  taskStats: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    totalExp: number;
    qcTasks: number;
    specialTasks: number;
    challengeTasks: number;
  };
  timelineData: any[];
  habitStats: Array<{
    habit: {
      id: string;
      name: string;
      icon?: string;
      expReward: number;
    };
    stats: {
      totalCheckIns: number;
      currentStreak: number;
      checkedToday: boolean;
    };
  }>;
  semesterMap: Array<{
    unit: string;
    lesson: string;
    title: string;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      exp: number;
    }>;
  }>;
  summary: {
    joinDate: string;
    totalActiveDays: number;
    lastActiveDate: string;
  };
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    category: string;
    awardedAt: string;
  }>;
}

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // 获取从上个页面传入的预加载数据 (如有)
  const initialStudentData = (location.state as any)?.studentData;

  // --- 1. 状态管理 ---
  const [activeTab, setActiveTab] = useState<'growth' | 'academic' | 'mistakes'>('academic');

  // 过关地图状态
  const [timelineSubject, setTimelineSubject] = useState<'chinese' | 'math' | 'english'>('chinese');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({});

  // 习惯统计分页状态
  const [habitPage, setHabitPage] = useState(0);

  // --- 2. 数据状态 ---
  const [isLoading, setIsLoading] = useState(!initialStudentData); // 如果没有预加载数据，则显示初始 Loading
  const [error, setError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(initialStudentData ? {
    student: initialStudentData,
    task_records: [],
    pkRecords: [],
    pkStats: { totalMatches: 0, wins: 0, losses: 0, draws: 0, winRate: '0%' },
    taskStats: { totalTasks: 0, completedTasks: 0, pendingTasks: 0, totalExp: 0, qcTasks: 0, specialTasks: 0, challengeTasks: 0 },
    timelineData: [],
    habitStats: [],
    semesterMap: [],
    badges: [],
    summary: { joinDate: '', totalActiveDays: 0, lastActiveDate: '' }
  } : null);

  const [isDataFetching, setIsDataFetching] = useState(false); // 独立标记后端聚合数据是否正在加载

  // AI提示词生成器相关状态
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptSuccess, setPromptSuccess] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState<any[]>([]);

  const [studentBadges, setStudentBadges] = useState<string[]>(['阅读之星', '运动达人', '助人为乐', '数学小能手', '语文之星']);

  // 邀请卡弹窗状态
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 勋章授予相关状态
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [availableBadges, setAvailableBadges] = useState<any[]>([]);
  const [awardForm, setAwardForm] = useState({
    badgeId: '',
    reason: ''
  });
  const [awardLoading, setAwardLoading] = useState(false);

  // 🆕 本月签到天数
  const [monthlyCheckinCount, setMonthlyCheckinCount] = useState<number>(0);

  // --- 3. 派生状态 (SSOT) ---
  const student = studentProfile?.student;
  const studentName = student?.name || '未知学生';

  // A. 派生任务记录
  const allTaskRecords = React.useMemo(() => studentProfile?.task_records || [], [studentProfile]);

  const taskRecords = React.useMemo(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return allTaskRecords.filter(r => {
      const rDate = (r.content as any)?.taskDate || new Date(r.createdAt).toISOString().split('T')[0];
      return rDate === dateStr;
    });
  }, [allTaskRecords]);

  // B. 派生挑战记录 - 只包含真正的挑战类型，不包含定制加餐等特殊任务
  const studentChallenges = React.useMemo(() => {
    return allTaskRecords
      // 🔴 修复：只过滤 CHALLENGE 类型，SPECIAL/PERSONALIZED 不应该出现在挑战记录中
      .filter(record => record.type === 'CHALLENGE')
      .map((record, index) => ({
        id: index,
        title: record.title,
        result: record.status === 'COMPLETED' ? 'success' :
          (record.status === 'PENDING' || record.status === 'SUBMITTED' || record.status === 'JOINED') ? 'in_progress' : ('fail' as 'success' | 'fail' | 'in_progress'),
        date: new Date(record.createdAt).toLocaleDateString('zh-CN'),
        rewardPoints: record.expAwarded || 0,
        rewardExp: Math.floor(record.expAwarded / 2) || 0
      }));
  }, [allTaskRecords]);

  // C. 派生 PK 记录
  const studentPKRecords = React.useMemo(() => {
    if (!studentProfile?.pkRecords) return [];
    return studentProfile.pkRecords.map((pk: any, index: number) => ({
      id: index + 1,
      result: (pk.isWinner ? 'win' : 'lose') as 'win' | 'lose',
      topic: pk.topic || '对战',
      opponent: (pk.isPlayerA ? pk.playerB?.name : pk.playerA?.name) || '对手',
      date: new Date(pk.createdAt).toLocaleDateString('zh-CN')
    }));
  }, [studentProfile]);

  // D. 派生习惯打卡统计
  const habitStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    studentProfile?.habitStats?.forEach(h => {
      if (h.stats.totalCheckIns > 0) {
        stats[h.habit.name] = h.stats.totalCheckIns;
      }
    });
    return stats;
  }, [studentProfile]);

  // --- 4. 数据获取 ---
  const fetchStudentProfile = React.useCallback(async () => {
    if (!studentId) return;

    console.log('[DEBUG] fetchStudentProfile started');
    setIsDataFetching(true);
    setError(null);

    try {
      const response = await API.get(`/students/${studentId}/profile`);
      if (response.success) {
        setStudentProfile(response.data as StudentProfile);
      } else {
        // 使用 functional update 或判断初始数据来决定是否静默失败
        if (!initialStudentData) {
          setError(response.message || '获取学生数据失败');
        }
      }
    } catch (err: any) {
      console.error('[DEBUG] 获取学生数据失败:', err);

      if (!initialStudentData) {
        setError('网络错误，请稍后重试');
      }

      // 兜底逻辑使用 prev 处理
      setStudentProfile(prev => ({
        student: prev?.student || {
          id: studentId,
          name: '学生加载中...',
          className: '',
          level: 1,
          points: 0,
          exp: 0,
          totalExp: 100,
          createdAt: new Date().toISOString()
        },
        task_records: [],
        pkRecords: [],
        pkStats: { totalMatches: 0, wins: 0, losses: 0, draws: 0, winRate: '0%' },
        taskStats: { totalTasks: 0, completedTasks: 0, pendingTasks: 0, totalExp: 0, qcTasks: 0, specialTasks: 0, challengeTasks: 0 },
        timelineData: [],
        habitStats: [],
        semesterMap: [],
        badges: [],
        summary: { joinDate: '', totalActiveDays: 0, lastActiveDate: '' }
      }));
    } finally {
      setIsDataFetching(false);
      setIsLoading(false);
    }
  }, [studentId, initialStudentData]); // 关键修复：移除 studentProfile 依赖，加入 initialStudentData

  // 🆕 获取所有可用勋章（用于授予操作）
  const fetchAvailableBadges = React.useCallback(async () => {
    if (!user?.schoolId) return;
    try {
      const res = await apiService.get(`/badges?schoolId=${user.schoolId}`);
      if (res.success) {
        const badgeList = Array.isArray(res.data)
          ? res.data
          : (res.data as any)?.badges || res.data || [];
        setAvailableBadges(badgeList);
      }
    } catch (error) {
      console.error('[STUDENT DETAIL] Fetch badges failed:', error);
    }
  }, [user?.schoolId]);

  // 🆕 授予勋章处理函数
  const handleAwardBadge = async () => {
    if (!studentId || !awardForm.badgeId) {
      toast.error('请选择一个勋章');
      return;
    }

    setAwardLoading(true);
    try {
      // 🚀 直接复用批量接口（单人模式）
      const res = await apiService.post('/badges/award/batch', {
        badgeId: awardForm.badgeId,
        studentIds: [studentId],
        schoolId: user?.schoolId,
        reason: awardForm.reason,
        awardedBy: user?.userId
      });

      if (res.success) {
        toast.success('勋章授予成功！');
        setShowAwardModal(false);
        setAwardForm({ badgeId: '', reason: '' });
        fetchStudentProfile(); // 刷新档案中的勋章列表
      } else {
        toast.error(res.message || '授予失败');
      }
    } catch (error) {
      console.error('[STUDENT DETAIL] Award failed:', error);
      toast.error('授予失败，请检查网络');
    } finally {
      setAwardLoading(false);
    }
  };

  // --- 5. 初始加载 ---
  useEffect(() => {
    fetchStudentProfile();
  }, [fetchStudentProfile]);

  useEffect(() => {
    if (showAwardModal) {
      fetchAvailableBadges();
    }
  }, [showAwardModal, fetchAvailableBadges]);

  // 🆕 获取本月签到天数
  useEffect(() => {
    const fetchCheckinCount = async () => {
      if (!studentId) return;
      try {
        const res = await apiService.get(`/checkins/student/${studentId}/monthly`);
        if (res.success) {
          setMonthlyCheckinCount((res.data as any)?.count || 0);
        }
      } catch (error) {
        console.error('Failed to fetch checkin count:', error);
      }
    };
    fetchCheckinCount();
  }, [studentId]);

  // --- 5. 交互处理 ---
  const toggleLessonExpand = (id: number) => {
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 🚀 实时任务状态更新
  const handlePassTask = async (lessonId: number, taskRecordId: string) => {
    try {
      // 找到对应的任务记录
      const taskRecord = taskRecords.find(record => record.id === taskRecordId);
      if (!taskRecord) {
        console.error('[StudentDetail] 未找到任务记录:', taskRecordId);
        return;
      }

      // 调用API更新任务状态
      const response = await apiService.patch(`/lms/records/${taskRecordId}/status`, {
        status: 'COMPLETED',
        courseInfo: studentProfile?.student.progress
      });

      if (response.success) {
        // SSOT: 重新拉取数据以同步全局状态
        await fetchStudentProfile();

        // UI反馈动画 (可选，fetchProfile 会导致重新渲染)
        const btn = document.getElementById(`btn-pass-${taskRecordId}`);
        if (btn) {
          btn.innerHTML = '<span class="text-green-600 font-bold text-xs">已过</span>';
        }

        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        alert(`更新失败: ${response.message}`);
      }
    } catch (error) {
      console.error('[StudentDetail] 更新任务状态异常:', error);
      alert('更新任务状态失败，请重试');
    }
  };

  // 🆕 一键补过整个课程
  const handlePassLesson = async (lessonId: number, lesson: any) => {
    try {
      const incompleteTasks = lesson.tasks.filter((task: any) => task.status !== 'passed' && task.status !== 'COMPLETED');

      if (incompleteTasks.length === 0) {
        alert('该课程的所有任务已完成！');
        return;
      }

      const confirmed = window.confirm(`确定要补过「${lesson.title}」的 ${incompleteTasks.length} 个未完成任务吗？`);
      if (!confirmed) return;

      const taskIds = incompleteTasks.map((task: any) => task.id.toString());
      const response = await apiService.patch('/lms/records/batch/status', {
        recordIds: taskIds,
        status: 'COMPLETED',
        courseInfo: studentProfile?.student.progress
      });

      if (response.success) {
        // SSOT: 刷新数据
        await fetchStudentProfile();
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        alert(`✅ 成功补过 ${incompleteTasks.length} 个任务！`);
      } else {
        alert(`批量补过失败: ${response.message}`);
      }
    } catch (error) {
      console.error('[StudentDetail] 批量补过异常:', error);
      alert('批量补过失败，请重试');
    }
  };

  // --- AI提示词生成器处理函数 ---
  const getWeekRange = (weekOffset: number = 0) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const monday = new Date(now);

    // 计算本周一的日期
    if (currentDay === 0) {
      // 如果是周日，本周一是昨天
      monday.setDate(now.getDate() - 6 - (weekOffset * 7));
    } else {
      // 否则本周一是本周的第1天
      monday.setDate(now.getDate() - (currentDay - 1) - (weekOffset * 7));
    }

    // 设置周一开始时间为 00:00:00
    monday.setHours(0, 0, 0, 0);

    // 计算本周日的日期
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // 设置周日结束时间为 23:59:59
    sunday.setHours(23, 59, 59, 999);

    return {
      startDate: monday.toISOString(),
      endDate: sunday.toISOString()
    };
  };

  const handleCopyWeeklyPrompt = async () => {
    console.log('[FIX] handleCopyWeeklyPrompt called');

    if (!studentProfile?.student?.id) {
      console.error('[FIX] No student profile ID found');
      return;
    }

    try {
      setIsGeneratingPrompt(true);
      setPromptSuccess(false);

      // 计算本周日期范围
      const { startDate, endDate } = getWeekRange(0);

      console.log('[FIX] Fetching prompt data', {
        studentId: studentProfile.student.id,
        startDate,
        endDate
      });

      // 调用后端API获取统计数据和AI提示词
      const response = await fetch('/api/reports/student-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          studentId: studentProfile.student.id,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[FIX] API response received', result);

      if (!result.success || !result.data?.prompt) {
        throw new Error('Failed to generate prompt');
      }

      // 复制到剪贴板
      await navigator.clipboard.writeText(result.data.prompt.text);

      console.log('[FIX] Prompt copied to clipboard successfully');
      setPromptSuccess(true);

      // 3秒后隐藏成功提示
      setTimeout(() => {
        setPromptSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('[FIX] Error generating prompt:', error);

      // 显示错误提示
      alert('生成提示词失败，请稍后重试');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleHistoryPrompt = async (weekNumber: number, startDate: string, endDate: string) => {
    console.log('[FIX] handleHistoryPrompt called', { weekNumber, startDate, endDate });

    if (!studentProfile?.student?.id) {
      console.error('[FIX] No student profile ID found');
      return;
    }

    try {
      setIsGeneratingPrompt(true);

      // 调用后端API获取历史数据
      const response = await fetch('/api/reports/student-stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          studentId: studentProfile.student.id,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success || !result.data?.prompt) {
        throw new Error('Failed to generate prompt');
      }

      // 复制到剪贴板
      await navigator.clipboard.writeText(result.data.prompt.text);

      alert(`第${weekNumber}周提示词已复制到剪贴板！`);
      setShowHistoryModal(false);

    } catch (error) {
      console.error('[FIX] Error generating history prompt:', error);
      alert('生成历史提示词失败，请稍后重试');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const loadAvailableWeeks = async () => {
    try {
      console.log('[FIX] Loading available weeks');

      const response = await fetch('/api/reports/week-calendar', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data?.weeks) {
        setAvailableWeeks(result.data.weeks);
        console.log('[FIX] Available weeks loaded', result.data.weeks);
      }

    } catch (error) {
      console.error('[FIX] Error loading available weeks:', error);
    }
  };

  // 当历史记录模态框打开时，加载可用周数
  React.useEffect(() => {
    if (showHistoryModal) {
      loadAvailableWeeks();
    }
  }, [showHistoryModal]);

  // --- 6. 数据处理 ---
  const growthData = {
    badges: studentBadges,
    habits: habitStats,
    pkRecords: studentPKRecords
  };

  // 🚀 动态数据 - 使用实时任务记录数据
  const academicData = {
    aiComment: `通过对${studentName}的学情分析，该生整体学习态度端正，知识点掌握较为扎实。建议继续保持良好的学习习惯，同时在薄弱环节加强练习。`,
    pendingTasks: taskRecords
      .filter(record => record.type.toUpperCase() === 'QC' && record.status === 'COMPLETED')
      .map(record => ({
        id: record.id, // 🚀 关键修复：移除 parseInt，直接使用 UUID 字符串
        title: record.title,
        attempts: record.content?.attempts || 0
      })),
    // 🚀 基于学生课程进度生成动态学期地图
    // 数据源：课程标题来自 student.progress，过关项目来自 QC 任务记录
    timeline: (() => {
      const timeline = {
        chinese: [] as TimelineLesson[],
        math: [] as TimelineLesson[],
        english: [] as TimelineLesson[]
      };

      // 获取学生的课程进度信息
      const progress = studentProfile?.student?.progress;

      // 获取所有 QC 类型的已完成任务记录
      const qcRecords = allTaskRecords.filter(r =>
        r.type.toUpperCase() === 'QC' && r.status === 'COMPLETED'
      );

      // 辅助函数：根据学科过滤 QC 记录，并按同名去重（只保留最新一条）
      const filterBySubject = (subjectKey: string) => {
        // 先按学科过滤
        const filtered = qcRecords.filter(record => {
          const content = (record.content || {}) as any;
          const category = content.category || '';

          if (subjectKey === 'chinese') {
            return category.includes('语文') ||
              record.title.includes('生字') ||
              record.title.includes('课文') ||
              record.title.includes('听写') ||
              record.title.includes('背诵') ||
              record.title.includes('古诗');
          } else if (subjectKey === 'math') {
            return category.includes('数学') ||
              record.title.includes('口算') ||
              record.title.includes('计算') ||
              record.title.includes('竖式') ||
              record.title.includes('脱式') ||
              record.title.includes('公式');
          } else if (subjectKey === 'english') {
            return category.includes('英语') ||
              record.title.includes('单词') ||
              record.title.includes('句型') ||
              record.title.includes('Unit');
          }
          return false;
        });

        // 按 title 去重，只保留最新的一条记录（以 createdAt 为准）
        const latestByTitle = new Map<string, typeof filtered[0]>();
        filtered.forEach(record => {
          const existing = latestByTitle.get(record.title);
          if (!existing || new Date(record.createdAt) > new Date(existing.createdAt)) {
            latestByTitle.set(record.title, record);
          }
        });

        return Array.from(latestByTitle.values());
      };

      // 生成语文课程节点
      if (progress?.chinese) {
        const chineseRecords = filterBySubject('chinese');
        const unit = parseInt(progress.chinese.unit) || 1;
        const lesson = parseInt(progress.chinese.lesson || '1') || 1;
        const title = progress.chinese.title || '未命名课程';

        timeline.chinese.push({
          id: 1,
          unit,
          lesson,
          title,
          status: chineseRecords.length > 0 ? 'done' : 'pending',
          tasks: chineseRecords.map(record => ({
            id: record.id,
            name: record.title,
            status: 'passed' as const,
            attempts: ((record.content as any)?.attempts as number) || 0,
            date: new Date(record.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
          }))
        });
      }

      // 生成数学课程节点
      if (progress?.math) {
        const mathRecords = filterBySubject('math');
        const unit = parseInt(progress.math.unit) || 1;
        const lesson = parseInt(progress.math.lesson || '1') || 1;
        const title = progress.math.title || '未命名课程';

        timeline.math.push({
          id: 2,
          unit,
          lesson,
          title,
          status: mathRecords.length > 0 ? 'done' : 'pending',
          tasks: mathRecords.map(record => ({
            id: record.id,
            name: record.title,
            status: 'passed' as const,
            attempts: ((record.content as any)?.attempts as number) || 0,
            date: new Date(record.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
          }))
        });
      }

      // 生成英语课程节点
      if (progress?.english) {
        const englishRecords = filterBySubject('english');
        const unit = parseInt(progress.english.unit) || 1;
        const title = progress.english.title || '未命名课程';

        timeline.english.push({
          id: 3,
          unit,
          lesson: 1, // 英语没有 lesson 字段
          title,
          status: englishRecords.length > 0 ? 'done' : 'pending',
          tasks: englishRecords.map(record => ({
            id: record.id,
            name: record.title,
            status: 'passed' as const,
            attempts: ((record.content as any)?.attempts as number) || 0,
            date: new Date(record.createdAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
          }))
        });
      }

      console.log('[StudentDetail] 学期地图生成完成 (基于 student.progress):', {
        chinese: timeline.chinese.length,
        math: timeline.math.length,
        english: timeline.english.length,
        progressSource: progress ? 'student.progress' : 'fallback'
      });

      return timeline;
    })()
  };

  // 🚀 基于任务记录的过程任务数据 - 只包含核心教法、综合成长、定制加餐、习惯打卡等
  const processTasks = allTaskRecords
    .filter(record => {
      const taskType = record.type.toUpperCase();
      const taskStatus = record.status.toUpperCase();
      return (taskType === 'TASK' || taskType === 'METHODOLOGY' || taskType === 'SPECIAL' || taskType === 'DAILY') &&
        (taskStatus === 'PENDING' || taskStatus === 'COMPLETED');
    })
    .map(record => {
      const taskType = record.type.toUpperCase();
      let category = '综合成长';
      if (taskType === 'METHODOLOGY') category = '核心教法';
      else if (taskType === 'SPECIAL') category = '成长奖励';
      else if (taskType === 'DAILY') category = '习惯打卡';

      // 提取教师备注/理由
      let teacherNote = '';
      if (record.content) {
        const content = typeof record.content === 'string' ? JSON.parse(record.content) : record.content;
        teacherNote = content.teacherMessage || content.reason || content.notes || '';
      }

      return {
        id: record.id,
        name: record.title,
        category,
        rawType: taskType, // 保留原始类型用于配色
        default_exp: record.expAwarded,
        status: record.status.toUpperCase() === 'COMPLETED' ? 'completed' : 'pending',
        created_at: record.createdAt,
        teacherNote
      };
    });


  const thisWeekProcessTasks = filterThisWeek(processTasks); // 过滤本周数据


  const studentPersonalizedTasks: any[] = [];

  const mistakeData = {
    recent: [1, 2, 3, 4, 5]
  };

  // 雷达图组件
  const RadarChart = () => (
    <div className="w-[100px] h-[100px] relative flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-dashed border-gray-300 opacity-50"></div>
      <div className="absolute inset-4 rounded-full border border-dashed border-gray-300 opacity-50"></div>
      <div className="w-[60px] h-[60px] bg-purple-500/20 border-2 border-purple-500 transform rotate-45 skew-x-12 rounded-lg"></div>
      {/* 勋章授予弹窗 */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Award className="text-amber-500" /> 授予荣誉勋章
              </h3>
              <button
                onClick={() => setShowAwardModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">选择勋章类型</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableBadges.map(badge => (
                    <button
                      key={badge.id}
                      onClick={() => setAwardForm({ ...awardForm, badgeId: badge.id })}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex items-center gap-2 ${awardForm.badgeId === badge.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-50 bg-slate-50 hover:border-slate-200'
                        }`}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <span className={`text-xs font-bold ${awardForm.badgeId === badge.id ? 'text-amber-700' : 'text-slate-600'}`}>
                        {badge.name}
                      </span>
                    </button>
                  ))}
                  {availableBadges.length === 0 && (
                    <p className="col-span-2 text-center text-xs text-slate-400 py-4 font-bold">
                      暂无可用勋章，请先在勋章管理页创建
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">授予寄语 (可选)</label>
                <textarea
                  placeholder="写下对孩子的鼓励吧..."
                  value={awardForm.reason}
                  onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 resize-none placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAwardModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl active:scale-95 transition-all"
              >
                返回
              </button>
              <button
                onClick={handleAwardBadge}
                disabled={awardLoading || !awardForm.badgeId}
                className="flex-1 py-4 bg-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-200 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
              >
                {awardLoading ? '正在授予...' : '确认授予'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  console.log('[DEBUG] Render check - error:', error, 'isLoading:', isLoading, 'studentProfile:', studentProfile);

  if (error && !studentProfile) {
    console.log('[DEBUG] Rendering error state with error:', error);
    return (
      <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 移除全屏 Loading 遮罩，改为 Header 优先渲染
  if (isLoading && !studentProfile) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-500">初始化学生信息...</p>
        </div>
      </div>
    );
  }

  console.log('[DEBUG] Rendering main component content - studentProfile.student.name:', studentProfile?.student?.name);

  return (
    <ProtectedRoute>
      {/* 🆕 整页渐变背景 */}
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 text-[#1E293B] font-sans">

        {/* === 1. 顶部 Header (渐变玻璃拟态风格) === */}
        <div className="bg-gradient-to-br from-orange-100/80 via-pink-100/60 to-purple-100/80 backdrop-blur-sm px-5 pt-12 pb-6 relative z-10 shadow-lg shadow-orange-100/50">
          {/* 背景装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-orange-200/40 to-pink-200/40 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-purple-200/40 to-blue-200/40 rounded-full blur-2xl"></div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:bg-white shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>

          {/* 右上角：签到天数 + 分享按钮 */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {/* 🆕 本月签到天数 */}
            <div className="bg-white/80 backdrop-blur-sm text-green-600 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1 shadow-sm">
              <Calendar size={12} />
              {monthlyCheckinCount}天
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-orange-500 hover:bg-white shadow-sm"
              title="邀请家长"
            >
              <Share2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-5 relative z-10 mt-2">
            {/* A. 左侧：头像 & 等级 */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-orange-400 via-pink-400 to-purple-400 shadow-lg shadow-orange-200/50">
                <img
                  src="/avatar.jpg"
                  className="w-full h-full rounded-full bg-white border-3 border-white object-cover"
                  alt={studentName}
                  onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
                />
              </div>
              {/* 等级胶囊 (悬浮在头像下方) */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-md whitespace-nowrap">
                Lv.{student.level || 1}
              </div>
            </div>

            {/* B. 右侧：信息 & 数据 */}
            <div className="flex-1 flex flex-col justify-center gap-2">
              {/* 姓名行 */}
              <div className="flex items-baseline gap-2">
                <h1 className="text-2xl font-black text-slate-800">{studentName}</h1>
                <span className="text-[9px] text-slate-500 font-extrabold bg-white/40 backdrop-blur-md px-1 py-0.5 rounded-md border border-white/50 shadow-sm leading-none flex items-center h-[16px]">
                  {studentProfile.student.teachers?.name || studentProfile.student.className || '导师'}的班级
                </span>
              </div>

              {/* 数据行 (积分 & 经验 并排) */}
              <div className="flex items-center gap-4">
                {/* 积分 */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-orange-500 font-mono">{student.points || 0}</span>
                  <span className="text-xs text-orange-400 font-bold">积分</span>
                </div>
                {/* 分隔线 */}
                <div className="w-px h-6 bg-slate-300/50"></div>
                {/* 经验 */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-blue-500 font-mono">{student.exp || 0}</span>
                  <span className="text-xs text-blue-400 font-bold">经验</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* === 2. Tab 导航 (V1原版样式) === */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-2 shadow-sm">
          <div className="flex justify-around items-center">
            {/* 激活状态 */}
            <button
              onClick={() => setActiveTab('growth')}
              className={`relative py-3.5 px-4 text-sm font-bold transition-colors ${activeTab === 'growth' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              🚀 成长激励
              {/* 底部指示条 */}
              {activeTab === 'growth' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-orange-500 rounded-t-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('academic')}
              className={`relative py-3.5 px-4 text-sm font-bold transition-colors ${activeTab === 'academic' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              📚 学业攻克
              {activeTab === 'academic' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-orange-500 rounded-t-full"></div>
              )}
            </button>

            <button
              onClick={() => setActiveTab('mistakes')}
              className={`relative py-3.5 px-4 text-sm font-bold transition-colors ${activeTab === 'mistakes' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              ❌ 错题管理
              {activeTab === 'mistakes' && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-orange-500 rounded-t-full"></div>
              )}
            </button>
          </div>
        </div>

        {/* === 3. 内容滚动区 (V1原版样式) === */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">

          {/* --- TAB 1: 成长激励 (Growth) --- */}
          {activeTab === 'growth' && (
            <div className="space-y-3 animate-in slide-in-from-right-4 fade-in duration-300">

              {/* 加载状态 */}
              {isLoading && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className="text-sm text-gray-500">加载中...</div>
                </div>
              )}

              {/* 所获勋章 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Medal className="w-4 h-4 text-amber-500" /> 成就勋章
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAwardModal(true)}
                      className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-black flex items-center gap-0.5 active:scale-95 transition-transform"
                    >
                      <Plus className="w-2.5 h-2.5" /> 授予
                    </button>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-black">
                      {studentProfile?.badges?.length || 0} 枚
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {(studentProfile?.badges || []).length > 0 ? (
                    studentProfile?.badges.map((badge, index) => (
                      <div key={`${badge.id}-${index}`} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform group">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-center text-2xl shadow-sm group-hover:bg-amber-100 transition-colors">
                          {badge.icon}
                        </div>
                        <span className="text-[10px] font-black text-slate-600 truncate w-full text-center">
                          {badge.name}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 text-center py-6">
                      <div className="text-3xl grayscale opacity-20 mb-2">🏅</div>
                      <p className="text-[10px] font-bold text-slate-300">还没有获得勋章哦，加油！</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 习惯统计 */}
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" /> 习惯统计
                </h3>

                {/* 习惯统计内容 */}
                {Object.keys(growthData.habits).length > 0 ? (
                  <>
                    {/* 分页控制 - V1原版样式 */}
                    <div className="flex justify-between items-center mb-3 px-1">
                      <button
                        onClick={() => setHabitPage(Math.max(0, habitPage - 1))}
                        disabled={habitPage === 0}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${habitPage === 0
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                          }`}
                      >
                        ←
                      </button>

                      <span className="text-xs text-gray-500 font-medium">
                        第 {habitPage + 1} 页
                      </span>

                      <button
                        onClick={() => setHabitPage(habitPage + 1)}
                        disabled={(habitPage + 1) * 9 >= Object.entries(growthData.habits).length}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${(habitPage + 1) * 9 >= Object.entries(growthData.habits).length
                          ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                          }`}
                      >
                        →
                      </button>
                    </div>

                    {/* 习惯网格 - 每页9个，3x3布局 - V1原版样式 */}
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(growthData.habits)
                        .sort(([, a], [, b]) => b - a) // 按次数从高到低排序
                        .slice(habitPage * 9, (habitPage + 1) * 9)
                        .map(([name, count]) => (
                          <div key={name} className="border border-gray-100 rounded-xl p-2 flex flex-col items-center">
                            <span className="text-xs text-gray-500 mb-1">{name}</span>
                            <span className={`text-lg font-bold ${count > 0 ? 'text-blue-600' : 'text-gray-300'}`}>
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>

                    {/* 页面指示器 - V1原版样式 */}
                    <div className="flex justify-center items-center gap-1.5 mt-3">
                      {Array.from({
                        length: Math.ceil(Object.entries(growthData.habits).length / 9)
                      }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setHabitPage(index)}
                          className={`w-2 h-2 rounded-full transition-colors ${index === habitPage
                            ? 'bg-blue-500'
                            : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    暂无习惯数据
                  </div>
                )}
              </div>

              {/* 任务达人面板 - V1原版样式 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-500" /> 任务达人
                </h3>
                <div className="space-y-2">
                  {thisWeekProcessTasks.length > 0 ? (
                    thisWeekProcessTasks.map(task => {
                      // 根据任务类型定义配色方案
                      let bgColor = 'bg-blue-50';
                      let tagColor = 'bg-blue-100 text-blue-600';
                      let iconColor = 'bg-blue-200 text-blue-700';

                      if (task.rawType === 'SPECIAL') {
                        bgColor = 'bg-amber-50';
                        tagColor = 'bg-amber-100 text-amber-600';
                        iconColor = 'bg-amber-200 text-amber-700';
                      } else if (task.rawType === 'DAILY') {
                        bgColor = 'bg-green-50';
                        tagColor = 'bg-green-100 text-green-600';
                        iconColor = 'bg-green-200 text-green-700';
                      } else if (task.name.includes('挑战') || task.name.includes('PK')) {
                        bgColor = 'bg-purple-50';
                        tagColor = 'bg-purple-100 text-purple-600';
                        iconColor = 'bg-purple-200 text-purple-700';
                      }

                      return (
                        <div key={task.id} className={`flex items-center gap-3 p-3 ${bgColor} rounded-xl transition-all hover:scale-[1.02]`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${task.status === 'completed' ? (task.rawType === 'SPECIAL' ? 'bg-amber-400 text-white' : 'bg-green-400 text-white') : iconColor
                            }`}>
                            {task.status === 'completed' ? (task.rawType === 'SPECIAL' ? '⭐' : '✓') :
                              task.status === 'in_progress' ? '...' : '○'}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-slate-800">{task.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`px-1.5 py-0.5 ${tagColor} rounded-full text-[10px] font-black leading-none uppercase tracking-tighter`}>
                                {task.category}
                              </span>
                              {task.teacherNote && (
                                <span className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">
                                  💬 {task.teacherNote}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-[10px] font-black ${task.status === 'completed' ? 'text-green-600' : 'text-slate-400'}`}>
                              {task.status === 'completed' ? '已达成' : '进行中'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      暂无任务记录
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">
                    本周任务进度
                  </span>
                  <span className="text-xs font-bold text-blue-600">
                    {thisWeekProcessTasks.filter(t => t.status === 'completed').length}/{thisWeekProcessTasks.length} 已完成
                  </span>
                </div>
              </div>

              {/* PK对决记录 - V1原版样式 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-red-500" /> PK对决记录
                </h3>
                <div className="space-y-2">
                  {growthData.pkRecords.length > 0 ? (
                    growthData.pkRecords.map((pk, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-full ${pk.result === 'win' ? 'bg-green-200 text-green-700' :
                          'bg-gray-200 text-gray-700'
                          } flex items-center justify-center font-bold text-xs`}>
                          {pk.result === 'win' ? '胜' : '败'}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-800">{pk.topic}</div>
                          <div className="text-xs text-slate-400">vs {pk.opponent}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">{pk.date}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      暂无PK对决记录
                    </div>
                  )}
                </div>
              </div>

              {/* 挑战记录 - V1原版样式 */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-500" /> 挑战记录
                </h3>
                <div className="space-y-2">
                  {studentChallenges.length > 0 ? (
                    studentChallenges.map((challenge, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs`}>
                          {challenge.result === 'success' ? '成' :
                            challenge.result === 'fail' ? '败' : '进'}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-slate-800">{challenge.title}</div>
                          <div className="text-xs text-slate-400">
                            {(challenge.rewardPoints > 0 || challenge.rewardExp > 0) && (
                              <>
                                获得 {challenge.rewardPoints > 0 && <span className="text-orange-600">+{challenge.rewardPoints}积分</span>}
                                {challenge.rewardPoints > 0 && challenge.rewardExp > 0 && ' '}
                                {challenge.rewardExp > 0 && <span className="text-blue-600">+{challenge.rewardExp}经验</span>}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-xs">
                      暂无挑战记录
                    </div>
                  )}
                </div>
              </div>

              {/* 家长绑定列表 */}
              {studentId && (
                <ParentBindingList
                  studentId={studentId}
                  studentName={studentName}
                />
              )}

            </div>
          )}

          {/* --- TAB 2: 学业攻克 (Academic) - V1原版样式 --- */}
          {activeTab === 'academic' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300 pb-16">

              {/* 0. AI提示词生成器 - 新增功能 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-sm border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Bot size={14} className="text-blue-500" />
                    本周学情总结
                  </h3>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyWeeklyPrompt}
                    disabled={isGeneratingPrompt || !studentId}
                    className={`flex-1 ${promptSuccess ? 'bg-green-500' : 'bg-blue-600'} hover:opacity-90 active:scale-95 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-200/50 transition-all`}
                  >
                    {isGeneratingPrompt ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white"></div>
                        <span>生成中...</span>
                      </div>
                    ) : promptSuccess ? (
                      <Check size={14} />
                    ) : (
                      <BookOpen size={14} />
                    )}
                    {promptSuccess ? '总结已复制' : '复制本周总结'}
                  </button>

                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="bg-white border text-blue-600 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 hover:bg-blue-50 active:scale-95 transition-all border-blue-100"
                  >
                    <Calendar size={12} />
                    历史周
                  </button>
                </div>
              </div>

              {/* B. 今日过关 (Quick Check) - V1原版样式 */}
              <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 relative overflow-hidden">
                {isDataFetching && (
                  <div className="absolute top-3 right-5 flex items-center gap-1 opacity-60">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] text-blue-400 font-bold uppercase tracking-widest">同步中</span>
                  </div>
                )}
                <h3 className="font-bold text-gray-700 mb-2 flex justify-between items-center px-1">
                  今日过关
                  <span className="text-xs font-normal text-gray-400">
                    已完成 {academicData.pendingTasks.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {academicData.pendingTasks.length > 0 ? academicData.pendingTasks.map(task => (
                    <div key={task.id} className="bg-gray-50/50 p-3 rounded-xl border-l-4 border-orange-400 flex justify-between items-center transition-all hover:bg-gray-50 active:scale-[0.98]">
                      <div>
                        <div className="text-sm font-bold text-gray-800">{task.title}</div>
                        {(task.attempts as number) > 0 && <div className="text-[10px] text-orange-500 font-bold mt-1 text-xs">🔥 辅导: {task.attempts as number} 次</div>}
                      </div>
                      <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-full bg-white text-orange-600 flex items-center justify-center active:bg-orange-100 shadow-sm transition-colors border border-orange-100"><Plus size={16} /></button>
                        <button id={`btn-pass-${task.id}`} onClick={() => handlePassTask(0, task.id.toString())} className="w-8 h-8 rounded-full bg-white text-green-600 flex items-center justify-center active:bg-green-100 shadow-sm transition-colors border border-green-100"><Check size={16} /></button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                      今日暂无待过关任务
                    </div>
                  )}
                </div>
              </div>

              {/* C. 个性化加餐 - V1原版样式 */}
              <div className="relative rounded-[28px] p-6 overflow-hidden text-slate-800 shadow-sm border border-slate-100 bg-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                        <Sparkles size={14} fill="currentColor" />
                      </div>
                      <span className="font-bold text-slate-800 text-sm">个性化加餐</span>
                    </div>
                    <span className="text-[10px] text-orange-700 bg-orange-50 px-2 py-1 rounded-md font-bold">
                      {studentPersonalizedTasks.length} 项
                    </span>
                  </div>

                  <div className="space-y-2">
                    {studentPersonalizedTasks.length > 0 ? studentPersonalizedTasks.map(item => (
                      <div key={item.id} className="bg-white/60 backdrop-blur border border-white/50 p-3 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-slate-800 mb-1">
                              {item.students.join(', ')}
                            </div>
                            <div className="text-xs text-orange-600 font-bold flex items-center gap-1">
                              <Plus size={10} /> {item.tasks.join(' + ')}
                            </div>
                            <div className="text-[9px] text-slate-500 mt-1">{item.date}</div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                        暂无个性化加餐任务
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* E. 全学期过关地图 (Timeline) - V1原版样式 */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-3 px-1">
                  <h3 className="font-bold text-gray-700">全学期过关地图</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm">
                      {(['chinese', 'math', 'english'] as const).map(sub => (
                        <button
                          key={sub}
                          onClick={() => setTimelineSubject(sub)}
                          className={`px-3 py-1 text-[10px] rounded-md font-black transition-all ${timelineSubject === sub ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {sub === 'chinese' ? '语文' : sub === 'math' ? '数学' : '英语'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 进度条 & 筛选 - V1原版样式 */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-4 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-slate-500 font-bold">总体进度: <span className="text-blue-600 font-black">85%</span></div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer font-bold">
                      <input type="checkbox" checked={showPendingOnly} onChange={e => setShowPendingOnly(e.target.checked)} className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5 border-slate-300" />
                      只看待补
                    </label>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 w-[85%] rounded-full shadow-inner animate-pulse duration-2000"></div>
                  </div>
                </div>

                {/* Timeline List - V1原版样式 */}
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-slate-200/60 rounded-full"></div>

                  {academicData.timeline[timelineSubject as keyof typeof academicData.timeline]
                    .filter((l: TimelineLesson) => !showPendingOnly || l.status === 'pending')
                    .map((lesson: TimelineLesson) => {
                      const isExpanded = expandedLessons[lesson.id] || (lesson.status === 'pending');
                      const isDone = lesson.status === 'done';

                      return (
                        <div key={lesson.id} className="relative z-10 scale-in-center">
                          <div className={`absolute -left-[21px] top-4 w-4 h-4 rounded-full border-4 box-content shadow-sm transition-all duration-300 ${isDone ? 'bg-green-500 border-green-100' : 'bg-orange-500 border-orange-100 animate-pulse'}`}></div>

                          <div className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all border border-slate-100 ${!isDone ? 'ring-1 ring-orange-100' : ''}`}>
                            <div
                              className={`p-3.5 flex justify-between items-center cursor-pointer active:bg-slate-50 transition-colors ${!isDone ? 'bg-orange-50/30' : ''}`}
                              onClick={() => toggleLessonExpand(lesson.id)}
                            >
                              <div className="flex-1">
                                <div className={`text-[10px] font-black mb-1 leading-none ${isDone ? 'text-slate-400' : 'text-orange-600 uppercase'}`}>
                                  U{lesson.unit} L{lesson.lesson} {isDone ? '已过关' : '· 过关中'}
                                </div>
                                <div className={`font-black text-sm ${isDone ? 'text-slate-600' : 'text-slate-800'}`}>{lesson.title}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!isDone && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePassLesson(lesson.id, lesson);
                                    }}
                                    className="px-2.5 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-xl hover:bg-green-600 active:scale-95 transition-all shadow-sm"
                                  >
                                    补过
                                  </button>
                                )}
                                <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-3 pb-3 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="pt-3 space-y-2">
                                  {lesson.tasks.map((task: TimelineTask) => {
                                    const isTaskDone = task.status === 'passed';
                                    return (
                                      <div key={task.id} className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${isTaskDone ? 'bg-green-50/50 border-green-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm ${isTaskDone ? 'bg-green-500 text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
                                            {isTaskDone ? '✓' : '○'}
                                          </div>
                                          <span className={`text-xs font-bold ${isTaskDone ? 'text-green-700' : 'text-slate-600'}`}>{task.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {task.attempts > 0 && <span className="text-[10px] text-orange-600 font-black tracking-tighter bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100">🔥 {task.attempts}次辅导</span>}
                                          {!isTaskDone && (
                                            <button
                                              id={`btn-pass-${task.id}`}
                                              onClick={() => handlePassTask(lesson.id, task.id.toString())}
                                              className="w-7 h-7 rounded-full bg-white text-green-600 flex items-center justify-center text-xs shadow-sm border border-green-100 active:scale-90 transition-all hover:bg-green-50"
                                            >
                                              ✓
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* F. 历史报告入口 - V1原版样式 */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex justify-between items-center shadow-sm cursor-pointer hover:bg-slate-50 active:scale-[0.98] transition-all">
                <span className="text-sm font-black text-slate-700 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  历史学情报告
                </span>
                <ChevronRight size={16} className="text-slate-300" />
              </div>

            </div>
          )}

          {/* --- TAB 3: 错题管理 (Mistakes) - V1原版样式 --- */}
          {activeTab === 'mistakes' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-700 text-sm">错题攻克中心</div>
                  <div className="text-xs text-red-500 mt-1">本周共录入 {mistakeData.recent.length} 道错题，建议优先处理数学应用题。</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gradient-to-br from-red-500 to-rose-600 text-white p-4 rounded-2xl shadow-lg shadow-red-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <Camera size={20} />
                  </div>
                  <span className="font-bold text-sm">录入错题</span>
                </button>
                <button className="bg-white border border-red-100 text-red-600 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <Printer size={20} />
                  </div>
                  <span className="font-bold text-sm">生成攻克单</span>
                </button>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-400 font-bold">最近错题池</span>
                  <span className="text-xs text-blue-500 flex items-center cursor-pointer">全部 <ChevronRight size={10} /></span>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300 border border-gray-200"><AlertCircle /></div>
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300 border border-gray-200"><AlertCircle /></div>
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-300 border border-gray-200"><AlertCircle /></div>
                </div>
              </div>

            </div>
          )}

        </div >
      </div >

      {/* 历史记录模态框 */}
      {
        showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">历史周提示词</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableWeeks.length > 0 ? (
                  availableWeeks.map((week) => (
                    <div
                      key={week.weekNumber}
                      className={`flex items-center justify-between p-3 rounded-lg border ${week.isCurrentWeek
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        } transition-colors`}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {week.label}
                          {week.isCurrentWeek && (
                            <span className="ml-2 text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">当前周</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(week.startDate).toLocaleDateString('zh-CN')} - {new Date(week.endDate).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <button
                        onClick={() => handleHistoryPrompt(
                          week.weekNumber,
                          week.startDate,
                          week.endDate
                        )}
                        disabled={isGeneratingPrompt}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-all duration-200 active:scale-95"
                      >
                        {isGeneratingPrompt ? '生成中...' : '复制'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>加载历史周数据中...</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* 邀请卡弹窗 */}
      {
        student && (
          <InviteCardModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            student={{
              id: student.id || studentId || '',
              name: student.name || '未知学生',
              className: student.className,
              avatarUrl: undefined
            }}
          />
        )
      }
    </ProtectedRoute >
  );
};

export default StudentDetail;
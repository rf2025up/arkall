import React, { useState, useEffect } from 'react';
import {
  Trophy, Medal, Swords, Check,
  Bot, Flame, Plus, ChevronRight, ChevronDown,
  Camera, Printer, AlertCircle, Calendar,
  BookOpen, Filter, Circle, Sparkles, ArrowLeft, X
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { API } from '../services/api.service';

// 本周数据过滤工具函数
const filterThisWeek = <T extends { created_at?: string; date?: string }>(items: T[]): T[] => {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const monday = new Date(now);

  // 计算本周一的日期
  if (currentDay === 0) {
    // 如果是周日，本周一是昨天
    monday.setDate(now.getDate() - 6);
  } else {
    // 否则本周一是本周的第1天
    monday.setDate(now.getDate() - (currentDay - 1));
  }

  // 设置周一开始时间为 00:00:00
  monday.setHours(0, 0, 0, 0);

  // 计算本周五的日期
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  // 设置周五结束时间为 23:59:59
  friday.setHours(23, 59, 59, 999);

  return items.filter(item => {
    const dateToCheck = item.created_at || item.date;
    if (!dateToCheck) return false;

    const itemDate = new Date(dateToCheck);
    return itemDate >= monday && itemDate <= friday;
  });
};

// --- 模拟数据类型定义 ---
interface TimelineTask {
  id: number;
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
  };
  taskRecords: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    expAwarded: number;
    createdAt: string;
    content?: Record<string, unknown>;
    lessonPlan?: Record<string, unknown>;
  }>;
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
  timelineData: Array<{
    date: string;
    items: Array<{
      id: string;
      date: string;
      type: 'task' | 'pk';
      title: string;
      description: string;
      status?: string;
      exp?: number;
      result?: string;
      metadata?: Record<string, unknown>;
    }>;
  }>;
  summary: {
    joinDate: string;
    totalActiveDays: number;
    lastActiveDate: string;
  };
}

const StudentDetail: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- 1. 状态管理 ---
  const [activeTab, setActiveTab] = useState<'growth' | 'academic' | 'mistakes'>('academic');

  // 过关地图状态
  const [timelineSubject, setTimelineSubject] = useState<'chinese' | 'math' | 'english'>('chinese');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [expandedLessons, setExpandedLessons] = useState<Record<number, boolean>>({});

  // 习惯统计分页状态
  const [habitPage, setHabitPage] = useState(0);

  // --- 2. 数据状态 ---
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  // AI提示词生成器相关状态
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [promptSuccess, setPromptSuccess] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState<any[]>([]);

  // V1 兼容状态
  const [habitStats, setHabitStats] = useState<Record<string, number>>({
    '早起': 15, '阅读': 23, '运动': 8, '思考': 12, '卫生': 20, '助人': 18,
    '作业': 25, '预习': 14, '复习': 16, '朗读': 19, '练字': 7, '绘画': 5
  });
  const [studentBadges, setStudentBadges] = useState<string[]>(['阅读之星', '运动达人', '助人为乐', '数学小能手', '语文之星']);
  const [studentPKRecords, setStudentPKRecords] = useState<Array<{
    id: number;
    result: 'win' | 'lose';
    topic: string;
    opponent: string;
    date: string;
  }>>([
    { id: 1, result: 'win', topic: '数学计算', opponent: '张小明', date: '2025-12-11' },
    { id: 2, result: 'lose', topic: '语文背诵', opponent: '李小红', date: '2025-12-10' },
    { id: 3, result: 'win', topic: '英语单词', opponent: '王小刚', date: '2025-12-09' }
  ]);
  const [studentChallenges, setStudentChallenges] = useState<Array<{
    id: number;
    title: string;
    result: 'success' | 'fail' | 'in_progress';
    date: string;
    rewardPoints: number;
    rewardExp: number;
  }>>([
    { id: 1, title: '阅读15分钟', result: 'success', date: '2025-12-11', rewardPoints: 10, rewardExp: 5 },
    { id: 2, title: '数学练习', result: 'fail', date: '2025-12-10', rewardPoints: 0, rewardExp: 0 },
    { id: 3, title: '运动打卡', result: 'success', date: '2025-12-09', rewardPoints: 15, rewardExp: 8 }
  ]);

  // --- 3. 获取学生信息 ---
  const student = studentProfile?.student;
  const studentName = student?.name || '未知学生';

  // --- 4. 数据获取 ---
  useEffect(() => {
    if (studentId) {
      const fetchStudentProfile = async () => {
        setIsLoading(true);
        setError(null);

        try {
          // 使用 V2 API 获取学生数据
          const response = await API.get(`/students/${studentId}/profile`);

          if (response.success) {
            setStudentProfile(response.data as StudentProfile);

            // 转换数据格式以兼容 V1 组件结构
            if ((response.data as StudentProfile).pkRecords) {
              const pkRecords = (response.data as StudentProfile).pkRecords.map((pk, index): {
                id: number;
                result: 'win' | 'lose';
                topic: string;
                opponent: string;
                date: string;
              } => ({
                id: index + 1,
                result: pk.isWinner ? 'win' : 'lose',
                topic: pk.topic,
                opponent: pk.opponent.name,
                date: new Date(pk.createdAt).toLocaleDateString('zh-CN')
              }));
              setStudentPKRecords(pkRecords);
            }
          } else {
            setError(response.message || '获取学生数据失败');
          }
        } catch (err) {
          console.error('获取学生数据失败:', err);
          setError('网络错误，请稍后重试');

          // 使用 V1 风格的模拟数据作为兜底
          const mockStudent = {
            student: {
              id: studentId,
              name: '张小明',
              className: '黄老师班',
              level: 15,
              points: 1250,
              exp: 3500,
              totalExp: 5000,
              createdAt: '2025-01-01'
            },
            taskRecords: [],
            pkRecords: [],
            pkStats: { totalMatches: 0, wins: 0, losses: 0, draws: 0, winRate: '0%' },
            taskStats: { totalTasks: 0, completedTasks: 0, pendingTasks: 0, totalExp: 0, qcTasks: 0, specialTasks: 0, challengeTasks: 0 },
            timelineData: [],
            summary: { joinDate: '2025-01-01', totalActiveDays: 0, lastActiveDate: '2025-01-01' }
          };
          setStudentProfile(mockStudent);
        } finally {
          setIsLoading(false);
        }
      };

      fetchStudentProfile();
    }
  }, [studentId]);

  // --- 5. 交互处理 ---
  const toggleLessonExpand = (id: number) => {
    setExpandedLessons(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // 模拟补过动画
  const handlePassTask = (lessonId: number, taskId: number) => {
    const btn = document.getElementById(`btn-pass-${taskId}`);
    if(btn) {
      btn.innerHTML = '<span class="text-green-600 font-bold text-xs">刚补过</span>';
      btn.parentElement!.style.opacity = '0.5';
      btn.parentElement!.style.backgroundColor = '#F9FAFB';
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

  // 静态数据（模拟）- 完全复制V1的数据结构
  const academicData = {
    aiComment: `通过对${studentName}的学情分析，该生整体学习态度端正，知识点掌握较为扎实。建议继续保持良好的学习习惯，同时在薄弱环节加强练习。`,
    pendingTasks: [
      { id: 1, title: '数学基础运算', attempts: 2 },
      { id: 2, title: '语文古诗词背诵', attempts: 0 }
    ],
    timeline: {
      chinese: [
        {
          id: 101, unit: 1, lesson: 1, title: '观潮', status: 'done',
          tasks: [
            { id: 1, name: '全文背诵', status: 'passed', attempts: 0, date: '12/01' },
            { id: 2, name: '生字听写', status: 'passed', attempts: 0, date: '12/01' },
            { id: 3, name: '课文理解', status: 'passed', attempts: 1, date: '12/02' },
            { id: 4, name: '小练笔', status: 'passed', attempts: 0, date: '12/03' },
          ]
        }
      ] as TimelineLesson[],
      math: [] as TimelineLesson[],
      english: [] as TimelineLesson[]
    }
  };

  // 过程任务数据 (模拟备课中的任务库)
  const processTasks = [
    { id: 1, name: '课堂笔记', category: '课堂任务', default_exp: 10, status: 'completed', created_at: '2025-12-11' },
    { id: 2, name: '小组讨论', category: '课堂任务', default_exp: 15, status: 'in_progress', created_at: '2025-12-10' },
    { id: 3, name: '课后练习', category: '课后任务', default_exp: 20, status: 'pending', created_at: '2025-12-09' },
    { id: 4, name: '实验报告', category: '实践任务', default_exp: 25, status: 'completed', created_at: '2025-12-08' },
    { id: 5, name: '拓展阅读', category: '拓展任务', default_exp: 12, status: 'pending', created_at: '2025-12-07' }
  ];
  const thisWeekProcessTasks = filterThisWeek(processTasks);

  // 个性化加餐数据 (模拟备课中的个性化加餐) - 使用真实学生姓名
  const personalizedTasks = [
    { id: 1, students: ['唐艺馨'], tasks: ['数学强化练习', '错题订正'], date: '2025-12-11' },
    { id: 2, students: ['宋子晨', '彭柏成'], tasks: ['英语朗读'], date: '2025-12-10' },
    { id: 3, students: ['余沁妍'], tasks: ['语文作文修改', '古诗词背诵'], date: '2025-12-09' },
    { id: 4, students: ['陈笑妍', '廖研曦'], tasks: ['口算练习', '阅读理解'], date: '2025-12-08' },
    { id: 5, students: ['刘凡兮'], tasks: ['科学实验报告'], date: '2025-12-07' }
  ];
  // 过滤只显示当前学生相关的个性化加餐
  const studentPersonalizedTasks = personalizedTasks.filter(item =>
    item.students.includes(studentName)
  );

  const mistakeData = {
    recent: [1, 2, 3, 4, 5]
  };

  // 雷达图组件
  const RadarChart = () => (
    <div className="w-[100px] h-[100px] relative flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border border-dashed border-gray-300 opacity-50"></div>
      <div className="absolute inset-4 rounded-full border border-dashed border-gray-300 opacity-50"></div>
      <div className="w-[60px] h-[60px] bg-purple-500/20 border-2 border-purple-500 transform rotate-45 skew-x-12 rounded-lg"></div>
    </div>
  );

  if (error) {
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

  if (!studentProfile || isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">
            {isLoading ? '加载学生数据中...' : '学生信息未找到'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] font-sans">

        {/* === 1. 顶部 Header (V1原版样式) === */}
        <div className="bg-white px-5 pt-12 pb-4 shadow-sm relative z-10">
          {/* 返回按钮 */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex items-center gap-4">
            {/* A. 左侧：头像 & 等级 */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-orange-400 to-purple-400">
                <img
                  src="/1024.jpg"
                  className="w-full h-full rounded-full bg-white border-2 border-white object-cover"
                  alt={studentName}
                  onError={(e)=>{ e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect width=%2264%22 height=%2264%22 fill=%22%23e5e7eb%22/><circle cx=%2232%22 cy=%2224%22 r=%2212%22 fill=%22%23cbd5e1%22/><rect x=%2216%22 y=%2240%22 width=%2232%22 height=%2216%22 rx=%228%22 fill=%22%23cbd5e1%22/></svg>'; }}
                />
              </div>
              {/* 等级胶囊 (悬浮在头像下方) */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white shadow-sm whitespace-nowrap">
                Lv.{student.level || 1}
              </div>
            </div>

            {/* B. 右侧：信息 & 数据 (水平铺开) */}
            <div className="flex-1 flex flex-col justify-center gap-1.5">
              {/* 姓名行 */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900">{studentName}</h1>
                  <span className="text-xs text-slate-400 font-medium">{student.className || '黄老师班'}</span>
                </div>
              </div>

              {/* 数据行 (积分 & 经验 并排) */}
              <div className="flex items-center gap-6">
                {/* 积分 */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-orange-500 font-mono">{student.points || 0}</span>
                  <span className="text-xs text-orange-300 font-bold">积分</span>
                </div>
                {/* 分隔线 */}
                <div className="w-px h-4 bg-slate-200"></div>
                {/* 经验 */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-blue-500 font-mono">{student.exp || 0}</span>
                  <span className="text-xs text-blue-300 font-bold">经验</span>
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
                    className={`relative py-3.5 px-4 text-sm font-bold transition-colors ${
                        activeTab === 'growth' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
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
                    className={`relative py-3.5 px-4 text-sm font-bold transition-colors ${
                        activeTab === 'academic' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    📚 学业攻克
                    {activeTab === 'academic' && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-orange-500 rounded-t-full"></div>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab('mistakes')}
                    className={`relative py-3.5 px-4 text-sm font-bold transition-colors ${
                        activeTab === 'mistakes' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'
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
                <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                      <Medal className="w-4 h-4 text-yellow-500" /> 所获勋章
                    </h3>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                      {growthData.badges.length} 枚
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {growthData.badges.length > 0 ? (
                      growthData.badges.map((badge, index) => (
                        <div key={`${badge}-${index}`} className="bg-yellow-50 border border-yellow-100 rounded-lg p-2 text-xs font-bold text-yellow-700 text-center">
                          {badge}
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-4 text-gray-400 text-xs">
                        暂无勋章记录
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            habitPage === 0
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            (habitPage + 1) * 9 >= Object.entries(growthData.habits).length
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
                          .sort(([,a], [,b]) => b - a) // 按次数从高到低排序
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
                            className={`w-2 h-2 rounded-full transition-colors ${
                              index === habitPage
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
                      thisWeekProcessTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            task.status === 'completed' ? 'bg-green-200 text-green-700' :
                            task.status === 'in_progress' ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {task.status === 'completed' ? '✓' :
                             task.status === 'in_progress' ? '...' : '○'}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-slate-800">{task.name}</div>
                            <div className="text-xs text-slate-400">
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-medium">
                                {task.category}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-blue-600 font-bold">+{task.default_exp} EXP</div>
                            <div className="text-[10px] text-slate-400">
                              {task.status === 'completed' ? '已完成' :
                               task.status === 'in_progress' ? '进行中' : '待开始'}
                            </div>
                          </div>
                        </div>
                      ))
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
                          <div className={`w-8 h-8 rounded-full ${
                            pk.result === 'win' ? 'bg-green-200 text-green-700' :
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

              </div>
            )}

            {/* --- TAB 2: 学业攻克 (Academic) - V1原版样式 --- */}
            {activeTab === 'academic' && (
              <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">

                {/* 0. AI提示词生成器 - 新增功能 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 shadow-sm border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-600" />
                      <h3 className="font-bold text-gray-800">AI 成长报告生成器</h3>
                    </div>
                    <button className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                      历史记录 ▼
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyWeeklyPrompt}
                      disabled={isGeneratingPrompt}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm"
                    >
                      {isGeneratingPrompt ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          生成中...
                        </>
                      ) : (
                        <>
                          <span className="text-lg">📑</span>
                          复制本周 AI 提示词
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setShowHistoryModal(true)}
                      className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-sm border border-gray-200"
                    >
                      <Calendar className="w-4 h-4" />
                      历史周
                    </button>
                  </div>

                  {promptSuccess && (
                    <div className="mt-3 text-sm text-green-600 bg-green-50 p-2 rounded-lg flex items-center gap-2 animate-in fade-in duration-300">
                      <Check className="w-4 h-4" />
                      提示词已复制到剪贴板！
                    </div>
                  )}
                </div>

                {/* A. AI Dashboard - V1原版样式 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-purple-100 text-purple-600 text-[10px] px-2 py-1 rounded-bl-lg font-bold">AI 实时分析</div>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0"><RadarChart /></div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-800 mb-2">状态: <span className="text-green-500">稳步上升 ↗</span></div>
                      <div className="bg-gray-50 p-2 rounded-lg text-xs text-gray-600 leading-relaxed border border-gray-100">
                        <Bot className="inline w-3 h-3 text-purple-500 mr-1 -mt-0.5" />
                        <span dangerouslySetInnerHTML={{ __html: academicData.aiComment }}></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* B. 今日过关 (Quick Check) - V1原版样式 */}
                <div>
                  <h3 className="font-bold text-gray-700 mb-2 flex justify-between items-center px-1">
                    今日过关
                    <span className="text-xs font-normal text-gray-400">进行中 2</span>
                  </h3>
                  <div className="space-y-2">
                    {academicData.pendingTasks.map(task => (
                      <div key={task.id} className="bg-white p-3 rounded-xl border-l-4 border-orange-400 shadow-sm flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-gray-800">{task.title}</div>
                          {task.attempts > 0 && <div className="text-[10px] text-orange-500 font-bold mt-1">🔥 辅导: {task.attempts} 次</div>}
                        </div>
                        <div className="flex gap-2">
                          <button className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center active:bg-orange-200"><Plus size={16} /></button>
                          <button id={`btn-pass-${task.id}`} onClick={() => handlePassTask(0, task.id)} className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center active:bg-green-200"><Check size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* C. 个性化加餐 (来自备课的个性化加餐) - V1原版样式 */}
                <div className="relative rounded-[24px] p-6 overflow-hidden text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7ED] via-[#FFF1F2] to-[#FFF7ED]"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur text-orange-500 flex items-center justify-center shadow-sm">
                          <Sparkles size={14} fill="currentColor" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">个性化加餐</span>
                      </div>
                      <span className="text-[10px] text-orange-700 bg-white/60 backdrop-blur px-2 py-1 rounded-md font-bold shadow-sm">
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
                        <div className="text-center py-4 text-slate-400 text-xs">
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
                      <div className="flex bg-white p-0.5 rounded-lg border border-gray-200">
                        {(['chinese', 'math', 'english'] as const).map(sub => (
                          <button
                            key={sub}
                            onClick={() => setTimelineSubject(sub)}
                            className={`px-3 py-1 text-[10px] rounded-md font-bold transition-all ${timelineSubject===sub ? 'bg-purple-100 text-purple-600' : 'text-gray-400'}`}
                          >
                            {sub === 'chinese' ? '语文' : sub === 'math' ? '数学' : '英语'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 进度条 & 筛选 - V1原版样式 */}
                  <div className="bg-white p-3 rounded-xl border border-gray-100 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs text-gray-500">总体进度: <span className="font-bold text-blue-600">85%</span></div>
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={showPendingOnly} onChange={e => setShowPendingOnly(e.target.checked)} className="rounded text-blue-600 focus:ring-0 w-3 h-3" />
                        只看未完成
                      </label>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[85%] rounded-full"></div>
                    </div>
                  </div>

                  {/* Timeline List - V1原版样式 */}
                  <div className="relative pl-6 space-y-6">
                    {/* Timeline Line */}
                    <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-gray-200"></div>

                    {academicData.timeline[timelineSubject as keyof typeof academicData.timeline]
                      .filter((l: TimelineLesson) => !showPendingOnly || l.status === 'pending')
                      .map((lesson: TimelineLesson) => {
                        const isExpanded = expandedLessons[lesson.id] || (lesson.status === 'pending');
                        const isDone = lesson.status === 'done';

                        return (
                          <div key={lesson.id} className="relative z-10">
                            {/* Dot */}
                            <div className={`absolute -left-[21px] top-4 w-4 h-4 rounded-full border-4 box-content ${isDone ? 'bg-green-500 border-green-100' : 'bg-orange-500 border-orange-100'}`}></div>

                            {/* Card */}
                            <div className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all border-l-4 ${isDone ? 'border-green-500' : 'border-orange-500'}`}>
                              {/* Card Header */}
                              <div
                                className={`p-3 flex justify-between items-center cursor-pointer ${!isDone ? 'bg-orange-50/50' : ''}`}
                                onClick={() => toggleLessonExpand(lesson.id)}
                              >
                                <div>
                                  <div className={`text-[10px] font-bold mb-0.5 ${isDone ? 'text-gray-400' : 'text-orange-600'}`}>
                                    第{lesson.lesson}课 {isDone ? '' : '· 待补过'}
                                  </div>
                                  <div className={`font-bold text-sm ${isDone ? 'text-gray-600' : 'text-gray-800'}`}>{lesson.title}</div>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </div>

                              {/* Card Content (Tasks) */}
                              {isExpanded && (
                                <div className="px-3 pb-3 border-t border-gray-100">
                                  <div className="pt-3 space-y-2">
                                    {lesson.tasks.map((task: TimelineTask) => {
                                      const isTaskDone = task.status === 'passed';
                                      return (
                                        <div key={task.id} className={`flex items-center justify-between p-2 rounded-lg border ${isTaskDone ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                                          <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${isTaskDone ? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}>
                                              {isTaskDone ? '✓' : '○'}
                                            </div>
                                            <span className={`text-xs font-medium ${isTaskDone ? 'text-green-700' : 'text-orange-700'}`}>{task.name}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            {task.attempts > 0 && <span className="text-[10px] text-orange-600">🔥 {task.attempts}次</span>}
                                            {!isTaskDone && (
                                              <button
                                                id={`btn-pass-${task.id}`}
                                                onClick={() => handlePassTask(lesson.id, task.id)}
                                                className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs"
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
                <div className="bg-white rounded-xl border border-gray-100 p-3 flex justify-between items-center mt-4">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500"/> 历史学情报告
                  </span>
                  <ChevronRight size={14} className="text-gray-300" />
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

        </div>
      </div>

      {/* 历史记录模态框 */}
      {showHistoryModal && (
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
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      week.isCurrentWeek
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
      )}
    </ProtectedRoute>
  );
};

export default StudentDetail;
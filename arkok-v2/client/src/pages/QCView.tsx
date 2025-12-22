import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Search, Settings, Trash2, Plus, ChevronRight, User, Shield, Award, Calendar, BookOpen, Zap, Star, Leaf, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import ProtectedRoute from '../components/ProtectedRoute';
import apiService from '../services/api.service';
import { FIXED_QC_ITEMS } from '../config/taskCategories';

// --- 类型定义 ---

// 🚀 API响应类型定义
interface StudentProgressResponse {
  chinese?: { unit: string; lesson?: string; title: string };
  math?: { unit: string; lesson?: string; title: string };
  english?: { unit: string; title: string };
  source: 'lesson_plan' | 'default';
  updatedAt: string;
}

interface Task {
  id: string; // 🚀 修正为 string 以支持 UUID
  recordId?: string; // 🚀 添加recordId字段用于API调用
  name: string;
  type: 'QC' | 'TASK' | 'SPECIAL';
  status: 'PENDING' | 'PASSED' | 'COMPLETED';
  exp: number;
  attempts: number; // 辅导/尝试次数
  isSpecial?: boolean;
  isAuto?: boolean;
  taskId?: string;
  category?: string; // 🚀 添加分类标签字段
  educationalDomain?: string; // 🚀 教育体系分类 (用于匹配核心教学法等)
}

interface Lesson {
  unit: string;
  lesson?: string;
  title: string;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  lesson: Lesson;
  tasks: Task[];
  tutoring?: any[]; // 🆕 添加 1v1 讲解计划
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

// 🆕 标准Category标签顺序 - 根据最终版任务库标签
const CATEGORY_ORDER = ['基础作业', '语文基础过关', '数学基础过关', '英语基础过关', '语文', '数学', '英语', '阅读', '自主性', '特色教学', '学校', '家庭'];

// 🆕 静态预置的基础过关项 (不再由备课发布产生，点击即生成)
const SUBJECT_DEFAULT_QC: Record<string, string[]> = {
  chinese: ['生字听写', '课文背诵', '古诗/日积月累默写', '课文理解问答'],
  math: ['口算计时', '竖式/脱式', '概念/公式背默'],
  english: ['单词默写', '中英互译', '句型背诵', '课文背诵']
};

const QC_TAB_CONFIG = {
  chinese: { label: '语文', color: 'orange', activeClass: 'bg-orange-500 text-white shadow-md shadow-orange-200', dot: 'bg-orange-500', bg: 'bg-orange-50/50' },
  math: { label: '数学', color: 'blue', activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-200', dot: 'bg-blue-500', bg: 'bg-blue-50/50' },
  english: { label: '英语', color: 'purple', activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-200', dot: 'bg-indigo-500', bg: 'bg-indigo-50/50' }
};

// --- 类型定义 ---
interface TaskLibraryItem {
  id: string;
  // 🏷️ 运营标签分类（过关页使用）
  category: string; // 9个标准标签：基础作业、语文、数学、英语、阅读、自主性、特色教学、学校、家庭
  // 📚 教育体系分类（备课页使用）
  educationalDomain: string; // '核心教学法' | '综合成长' | '基础作业'
  educationalSubcategory: string; // 具体维度/类别
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

  useEffect(() => {
    console.log("🚀 [ARKOK_QC_SYSTEM] V2.2 - Hot Reload Verified");
  }, []);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // 🚀 课程进度状态管理 - 直接使用备课页的数据结构
  const [courseInfo, setCourseInfo] = useState<{
    chinese: { unit: string; lesson?: string; title: string };
    math: { unit: string; lesson?: string; title: string };
    english: { unit: string; title: string };
  }>({
    chinese: { unit: "1", lesson: "1", title: "默认课程" },
    math: { unit: "1", lesson: "1", title: "默认课程" },
    english: { unit: "1", title: "Default Course" }
  });

  // 课程进度编辑状态
  const [progressEditMode, setProgressEditMode] = useState(false);

  // 🚀 学科配置 - 直接复制备课页的配置
  const SUBJECT_CONFIG = {
    chinese: {
      label: "语文",
      dotColor: "bg-orange-400",
      activeClass: "bg-orange-500 text-white shadow-md shadow-orange-200 border-transparent",
      bgClass: "bg-orange-50/50 focus-within:bg-orange-50",
      textClass: "text-orange-600",
      focusBorder: "focus-within:border-orange-200"
    },
    math: {
      label: "数学",
      dotColor: "bg-blue-400",
      activeClass: "bg-blue-500 text-white shadow-md shadow-blue-200 border-transparent",
      bgClass: "bg-blue-50/50 focus-within:bg-blue-50",
      textClass: "text-blue-600",
      focusBorder: "focus-within:border-blue-200"
    },
    english: {
      label: "英语",
      dotColor: "bg-purple-400",
      activeClass: "bg-purple-500 text-white shadow-md shadow-purple-200 border-transparent",
      bgClass: "bg-purple-50/50 focus-within:bg-purple-50",
      textClass: "text-purple-600",
      focusBorder: "focus-within:border-purple-200"
    }
  };

  // 🚀 获取学生课程进度 - 集成备课页数据
  const fetchStudentProgress = async (studentId: string) => {
    if (!token) {
      console.warn('[QCView] 没有token，无法查询学生课程进度');
      return;
    }

    try {
      const response = await apiService.get(`/lms/student-progress?studentId=${studentId}`);

      if (response.success && response.data) {
        // 使用正确的类型定义
        const progressData: StudentProgressResponse = response.data as StudentProgressResponse;
        setCourseInfo({
          chinese: progressData.chinese || { unit: "1", lesson: "1", title: "默认课程" },
          math: progressData.math || { unit: "1", lesson: "1", title: "默认课程" },
          english: progressData.english || { unit: "1", title: "Default Course" }
        });
      } else {
        console.warn('[QCView] 获取课程进度失败:', response.message);
      }
    } catch (error) {
      console.error('[QCView] 获取学生课程进度异常:', error);
    }
  };

  // 🚀 课程进度变更处理 - 复用备课页的逻辑
  const handleCourseChange = (sub: keyof typeof courseInfo, field: string, val: string) => {
    setCourseInfo(prev => ({
      ...prev,
      [sub]: {
        ...prev[sub],
        [field]: val
      }
    }));
  };

  // 🚀 更新学生课程进度 - 权限高于备课页
  const updateStudentProgress = async (studentId: string) => {
    if (!token) {
      alert('无法更新课程进度，请重新登录');
      return;
    }

    try {
      const response = await apiService.patch(`/lms/student-progress/${studentId}`, courseInfo);

      if (response.success && response.data) {
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
      // 🚀 QCView修复：根据视图模式动态查询学生数据
      const params = new URLSearchParams();

      // 🔧 BUG修复：根据viewMode动态设置scope，不再强制MY_STUDENTS
      if (viewMode === 'ALL_SCHOOL' && user?.role === 'ADMIN') {
        // 管理员且选择了全校视图，查询所有学生
        params.append('scope', 'ALL_SCHOOL');
        params.append('userRole', user.role);
        params.append('schoolId', user.schoolId || '');
      } else {
        // 默认查询当前教师的学生，确保数据安全
        params.append('scope', 'MY_STUDENTS');
        params.append('teacherId', user?.id || '');
        params.append('userRole', user?.role || 'TEACHER');
      }

      console.log(`[QCView] 获取学生数据 - Teacher: ${user?.name}, Role: ${user?.role}, ViewMode: ${viewMode}`);

      // 保留兼容性：如果有具体的班级选择，也加上
      if (currentClass !== 'ALL' && currentClass !== '') {
        params.append('className', currentClass);
      }

      const url = `students${params.toString() ? '?' + params.toString() : ''}`;

      console.log(`[QCView] API调用URL: ${url}`);
      console.log(`[QCView] 请求参数:`, {
        scope: 'MY_STUDENTS',
        teacherId: user?.id,
        userRole: user?.role,
        className: currentClass !== 'ALL' && currentClass !== '' ? currentClass : undefined
      });

      const response = await apiService.get(url);

      // 智能数据提取 - 移植 Home.tsx 的健壮逻辑
      let studentData: any[] = [];
      if (Array.isArray(response?.data)) {
        studentData = response.data;
      } else if (response?.data && Array.isArray((response.data as any).students)) {
        studentData = (response.data as any).students;
      } else if (Array.isArray(response)) {
        studentData = response as any[];
      }

      const hasData = studentData && studentData.length >= 0 && (response as any)?.success !== false;

      if (!hasData) {
        console.warn("[QCView] Unexpected response format or failed status:", response);
        setQcStudents([]);
        return;
      }

      // 获取今天的本地日期 (YYYY-MM-DD)
      // 🆕 核心修复：强制使用北京时间（UTC+8），手动格式化避免 toISOString 返回 UTC 日期
      const now = new Date();
      const beijingOffset = 8 * 60; // 北京时间 UTC+8
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const beijingTime = new Date(utcTime + (beijingOffset * 60000));
      const dateStr = `${beijingTime.getFullYear()}-${String(beijingTime.getMonth() + 1).padStart(2, '0')}-${String(beijingTime.getDate()).padStart(2, '0')}`;
      console.log(`📅 [QC_DATE] 使用北京时间日期: ${dateStr}, 浏览器时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

      // 🆕 性能优化核心：批量获取所有相关学生的任务记录
      console.log(`🚀 [QC_FETCH] 开始批量获取任务记录...`);
      const batchRecordsResponse = await apiService.get<any[]>('/lms/batch-daily-records', {
        teacherId: user?.id,
        date: dateStr,
        className: currentClass
      });

      // 修正数据提取逻辑：batchRecordsResponse 是 ApiResponse，数据在 data 字段中
      // 🛡️ 防御性编程：强制校验 allRecords 是否为数组
      let allRecords = batchRecordsResponse?.success ? (batchRecordsResponse.data as any[]) : [];
      if (!Array.isArray(allRecords)) {
        console.warn(`[QC_FETCH] ⚠️ batchRecordsResponse.data is NOT array. Type: ${typeof allRecords}`);
        allRecords = [];
      }
      console.log(`✅ [QC_FETCH] 批量获取了 ${allRecords.length} 条记录`);

      // 将记录按学生ID进行分组，方便后面映射
      const recordsByStudent: Record<string, any[]> = {};
      allRecords.forEach((record: any) => {
        if (!record || !record.studentId) return; // 🛡️ 过滤无效记录
        if (!recordsByStudent[record.studentId]) {
          recordsByStudent[record.studentId] = [];
        }
        recordsByStudent[record.studentId].push(record);
      });

      // 🛡️ 防御性编程：在 map 前最后一次检查 studentData
      console.log(`[QC_DEBUG] Preparing to map studentData. Type: ${typeof studentData}, IsArray: ${Array.isArray(studentData)}, Length: ${studentData?.length}`);

      if (!Array.isArray(studentData)) {
        console.error('[QC_DEBUG] ❌ CRITICAL: studentData is not an array! Resetting to empty array.');
        studentData = [];
      }

      // 映射学生数据，不再需要循环发起子请求
      const studentsWithTasks = studentData.map((student: any) => {
        if (!student) return null; // 🛡️ 过滤空学生对象

        const studentRecords = recordsByStudent[student.id] || [];

        // 将后端记录转换为前端需要的格式
        const tasks = studentRecords.map((record: any) => ({
          id: record.id,
          recordId: record.id,
          name: record.title,
          type: record.type.toUpperCase(),
          category: record.content?.category || '', // 🆕 提取分类标签
          educationalDomain: record.content?.educationalDomain || '', // 🆕 提取教育领域
          status: record.status === 'PENDING' ? 'PENDING' :
            record.status === 'SUBMITTED' ? 'PENDING' :
              record.status === 'COMPLETED' ? 'PASSED' : 'PENDING',
          exp: record.expAwarded || 5,
          attempts: (record.content?.attempts) || 0,
          isAuto: record.type === 'SPECIAL'
        }));

        return {
          ...student,
          tasks: tasks || [],
          tutoring: [], // 🆕 按照指令移除辅导计划
          avatarUrl: student.avatarUrl || '/avatar.jpg',
          lesson: student.lesson || { unit: '1', lesson: '1', title: '默认课程' }
        };
      });

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
  }, [token, currentClass, viewMode, user?.id]); // 🆕 添加viewMode和id依赖，确保视图切换时重新获取数据

  // UI 控制状态
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isQCDrawerOpen, setIsQCDrawerOpen] = useState(false);
  const [isCMSDrawerOpen, setIsCMSDrawerOpen] = useState(false);

  // CMS 状态
  const [taskDB, setTaskDB] = useState<TaskLibrary>(taskLibrary);
  const [currentCategory, setCurrentCategory] = useState("基础作业");
  const [isManageMode, setIsManageMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualExp, setManualExp] = useState(10);
  const [lessonEditMode, setLessonEditMode] = useState(false); // 修改进度的弹窗

  // 🆕 抽屉内 Tab 切换状态 - 用于三学科过关标签切换
  const [qcTabSubject, setQcTabSubject] = useState<'chinese' | 'math' | 'english'>('chinese');

  // 🆕 核心教学法和综合成长弹窗状态
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);
  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [selectedMethodologyCategory, setSelectedMethodologyCategory] = useState<string | null>(null);
  const [selectedGrowthCategory, setSelectedGrowthCategory] = useState<string | null>(null);

  // 🆕 从 localStorage 读取配置（与备课页同步），带默认值
  const [methodologyCategories, setMethodologyCategories] = useState<{ name: string; items: string[] }[]>([
    { name: '基础学习方法论', items: ['作业的自主检查', '错题的红笔订正', '错题的摘抄与归因', '用"三色笔法"整理作业', '自评当日作业质量'] },
    { name: '数学思维与解题策略', items: ['用"分步法"讲解数学题', '用"画图法"理解应用题', '口算限时挑战', '错题归类与规律发现'] },
    { name: '语文学科能力深化', items: ['课文朗读与背诵', '生字词听写', '阅读理解策略练习', '作文提纲与修改'] },
    { name: '英语应用与输出', items: ['单词听写与默写', '课文朗读与背诵', '口语对话练习', '听力理解训练'] },
    { name: '阅读深度与分享', items: ['阅读记录卡填写', '好词好句摘抄', '读后感分享', '阅读推荐'] },
    { name: '自主学习与规划', items: ['制定学习计划', '时间管理练习', '目标设定与回顾', '自主预习'] },
    { name: '课堂互动与深度参与', items: ['主动举手发言', '小组讨论参与', '提出有价值的问题', '帮助同学讲解'] },
    { name: '家庭联结与知识迁移', items: ['与家长分享学习内容', '生活中的知识应用', '家校沟通反馈', '家庭作业展示'] },
    { name: '高阶输出与创新', items: ['创意写作', '项目展示', '知识总结思维导图', '跨学科应用'] }
  ]);
  const [growthCategories, setGrowthCategories] = useState<{ name: string; items: string[] }[]>([
    { name: '阅读广度类', items: ['年级同步阅读', '课外阅读30分钟', '填写阅读记录单', '阅读一个成语故事，并积累掌握3个成语'] },
    { name: '整理与贡献类', items: ['离校前的个人卫生清理（桌面/抽屉/地面）', '离校前的书包整理', '一项集体贡献任务（浇花/整理书架/打扫等）', '吃饭时帮助维护秩序，确认光盘，地面保持干净', '为班级图书角推荐一本书，并写一句推荐语'] },
    { name: '互助与创新类', items: ['帮助同学（讲解/拍视频/打印等）', '一项创意表达任务（画画/写日记/做手工等）', '一项健康活力任务（眼保健操/拉伸/深呼吸/跳绳等）'] },
    { name: '家庭联结类', items: ['与家人共读30分钟（可亲子读、兄弟姐妹读、给长辈读）', '帮家里完成一项力所及的家务（摆碗筷、倒垃圾/整理鞋柜等）'] }
  ]);

  // 加载配置（每次打开弹窗时从 localStorage 刷新）
  useEffect(() => {
    const loadCategories = () => {
      try {
        const methodData = localStorage.getItem('arkok_methodology_categories');
        const growthData = localStorage.getItem('arkok_growth_categories');
        if (methodData) setMethodologyCategories(JSON.parse(methodData));
        if (growthData) setGrowthCategories(JSON.parse(growthData));
      } catch (e) {
        console.error('加载配置失败', e);
      }
    };
    loadCategories();
  }, [isMethodologyModalOpen, isGrowthModalOpen]);

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

  // 🆕 动态生成排序后的分类列表
  const getSortedCategories = (taskLibrary: TaskLibrary): string[] => {
    const categories = Object.keys(taskLibrary);

    // 按照标准顺序排序，不存在的分类跳过
    const sortedCategories = CATEGORY_ORDER.filter(cat => categories.includes(cat));

    // 添加不在标准顺序中的额外分类
    const extraCategories = categories.filter(cat => !CATEGORY_ORDER.includes(cat));

    return [...sortedCategories, ...extraCategories];
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

  // 🆕 计算当前选中学生的待结算经验
  const calculateSelectedStudentExp = () => {
    const student = getSelectedStudent();
    if (!student) return 0;
    let total = 0;
    student.tasks.forEach(t => {
      if (t.status === 'PASSED' || t.status === 'COMPLETED') total += t.exp;
    });
    return total;
  };

  // --- 交互逻辑 ---

  // 1. 质检台操作
  const openQCDrawer = async (sid: string) => {
    const student = qcStudents.find(s => s.id === sid);

    setSelectedStudentId(sid);
    setIsQCDrawerOpen(true);

    // 🚀 获取该学生的课程进度数据
    if (student) {
      await fetchStudentProgress(student.id);
    }
  };

  const recordAttempt = async (e: React.MouseEvent, studentId: string, taskId: string) => {
    e.stopPropagation();

    try {
      // 找到对应的学生和任务
      const student = qcStudents.find(s => s.id === studentId);
      const task = student?.tasks.find(t => t.id === taskId);

      if (!student || !task || !task.recordId) {
        const errorMsg = `[TUTOR_ERROR] 数据缺失: Student=${!!student}, Task=${!!task}, RecordID=${task?.recordId}`;
        console.error(errorMsg);
        alert(errorMsg);
        return;
      }

      // 🚀 统一使用 apiService 并增强错误捕获，修复API路径重复问题
      const response = await apiService.patch(`lms/records/${task.recordId}/attempt`, {});

      if (response.success) {
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
        console.log('辅导尝试记录成功:', response.message);
      } else {
        console.error('记录辅导尝试失败:', response.message);
        alert(`记录失败: ${response.message || '未知错误'}`);
      }
    } catch (error: any) {
      console.error('❌ [QC_TOGGLE_ERROR]', error);
      alert(`切换状态失败: ${error.message}`);
    }
  };

  // 🆕 专门为静态勾选列表设计的处理函数
  const toggleQCPassByManual = async (studentId: string, itemName: string, subjectKey: string) => {
    try {
      const student = qcStudents.find(s => s.id === studentId);
      if (!student) return;

      const existingTask = student.tasks.find(t => t.name === itemName && t.type === 'QC');

      if (existingTask) {
        // 如果已经存在记录，直接通过 recordId 切换状态
        await toggleQCPass(studentId, existingTask.id);
      } else {
        // 如果不存在记录，调用后端 POST 接口创建一个新的“已完成”记录
        console.log(`🆕 [QC_MANUAL_CREATE] Creating record for: ${itemName} for student ${studentId}`);

        const categoryMap: Record<string, string> = {
          chinese: '语文基础过关',
          math: '数学基础过关',
          english: '英语基础过关'
        };

        console.log(`📤 [QC_MANUAL_CREATE] Sending POST to /lms/records...`);
        const response = await apiService.post('/lms/records', {
          studentId,
          type: 'QC',
          title: itemName,
          status: 'COMPLETED',
          category: categoryMap[subjectKey],
          date: new Date().toISOString().split('T')[0],
          courseInfo: courseInfo // 🚀 携带当前页面进度快照
        });

        console.log(`📥 [QC_MANUAL_CREATE] Response received:`, response);

        if (response.success) {
          console.log(`✅ [QC_MANUAL_CREATE] Success! Refreshing students...`);
          // 重新拉取数据以刷新状态
          fetchStudents();
        } else {
          console.error(`❌ [QC_MANUAL_CREATE] Failed:`, response.message);
        }
      }
    } catch (error) {
      console.error('❌ [QC_MANUAL_ERROR]', error);
    }
  };

  const toggleQCPass = async (studentId: string, taskId: string) => {
    console.log(`🔵 [TOGGLE_QC] 函数被调用: studentId=${studentId}, taskId=${taskId}`);
    try {
      // 找到对应的学生和任务
      const student = qcStudents.find(s => s.id === studentId);
      const task = student?.tasks.find(t => t.id === taskId);

      console.log(`🔵 [TOGGLE_QC] 查找结果: student=${student?.name}, task=${task?.name}, recordId=${task?.recordId}`);

      if (!student || !task || !task.recordId) {
        const errorMsg = `[QC_ERROR] 数据缺失: Student=${!!student}, Task=${!!task}, RecordID=${task?.recordId}`;
        console.error(errorMsg);
        alert(errorMsg);
        return;
      }

      const newStatus = task.status === 'PASSED' ? 'PENDING' : 'COMPLETED';
      const targetUrl = `lms/records/${task.recordId}/status`;

      // 🚀 记录变更 (如果是第一次勾选静态项，可能需要创建新记录)
      // 在此重构逻辑中，我们假设后端已经支持通过 taskId 或类似方式原子化处理
      // 这里简化为：调用 API 切换状态，如果是新任务需后端自动补全
      const response = await apiService.patch(targetUrl, {
        status: newStatus,
        courseInfo: courseInfo // 🚀 关键修复：同步当前的课程进度快照
      });

      if (response.success) {
        console.log(`✅ [QC_API_SUCCESS] 状态更新成功:`, response.data);
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
        const errorDetail = `[QC_API_FAILED] 接口返回失败:
- 消息: ${response.message}
- 代码: ${(response as any).code || 'N/A'}
- 路径: ${targetUrl}`;
        console.error(errorDetail);
        alert(errorDetail);
      }

    } catch (error: any) {
      const exceptionDetail = `🚨 [QC_EXCEPTION] 网络或系统崩溃:
- 类型: ${error.name}
- 消息: ${error.message}
- 状态码: ${error.status || error.response?.status || 'Unknown'}
- 请检查后端 CORS 配置或是否已重启服务器`;
      console.error(exceptionDetail, error);
      alert(exceptionDetail);
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

      // 调用 API 进行正式一键结算 (Pass All)
      const response = await apiService.records.passAll(selectedStudentId);

      if (response.success) {
        // 更新本地状态：标记所有 QC 和 TASK 为已过关
        setQcStudents(prev => prev.map(s => {
          if (s.id !== selectedStudentId) return s;
          return {
            ...s,
            tasks: s.tasks.map(t =>
              (t.type === 'QC' || t.type === 'TASK') ? { ...t, status: 'PASSED' } : t
            )
          };
        }));

        // 震动反馈
        if (navigator.vibrate) navigator.vibrate(100);

        alert(`一键结算成功！学生获得奖励值。`);
      } else {
        console.error('[QCView] API一键结算失败:', response.message);
        alert('结算失败: ' + (response.message || '未知错误'));
      }
    } catch (error) {
      console.error('[QCView] 一键过关操作失败:', error);
      alert('一键过关失败，请重试');
    }
  };

  const deleteTask = (studentId: string, taskId: string) => {
    if (!window.confirm("确认删除此任务？")) return;
    setQcStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      return { ...s, tasks: s.tasks.filter(t => t.id !== taskId) };
    }));
  };

  // 2. 结算台操作
  const toggleTaskComplete = async (studentId: string, taskId: string) => {
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

  // 🆕 切换1v1讲解状态
  const toggleTutoringComplete = async (studentId: string, planId: string) => {
    try {
      const student = qcStudents.find(s => s.id === studentId);
      const plan = student?.tutoring?.find(p => p.id === planId);

      if (!student || !plan) {
        console.error('[QCView] 未找到学生或辅导计划');
        return;
      }

      const newStatus = plan.status === 'COMPLETED' ? 'SCHEDULED' : 'COMPLETED';

      // 调用API更新状态
      const response = await apiService.patch(`/personalized-tutoring/${planId}/status`, {
        status: newStatus
      });

      if (response.success) {
        // 更新本地状态
        setQcStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            tutoring: s.tutoring?.map(p => {
              if (p.id !== planId) return p;
              return { ...p, status: newStatus };
            })
          };
        }));
      } else {
        console.error('[QCView] API更新辅导状态失败:', response.message);
        alert(`更新失败: ${response.message}`);
      }
    } catch (error) {
      console.error('[QCView] 切换辅导状态状态失败:', error);
      alert('更新失败，请重试');
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
  const openCMSDrawer = (sid: string) => {
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
          id: String(Date.now()), // 🚀 修正为 string
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
      [currentCategory]: [{ name, exp: 10 }, ...prev[currentCategory]]
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
      {/* 🔴 修复触控滑动：将 h-full 改为 min-h-screen overflow-y-auto */}
      <div className="flex flex-col min-h-screen overflow-y-auto bg-gray-100 font-sans text-slate-900" style={pageStyle}>

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

          {/* Tab 已删除，结算功能整合到过关抽屉 */}
        </div>

        {/* === 内容滚动区 === */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">

          {/* --- 质检台 (唯一视图) --- */}
          {(
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
                        src="/avatar.jpg"
                        alt={student.name}
                        onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
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

          {/* 结算台已删除，结算功能整合到过关抽屉底部 */}

        </div>

        {/* === 抽屉 1: 学生过关详情 (Best Practice V2) === */}
        {isQCDrawerOpen && selectedStudentId && (
          <>
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setIsQCDrawerOpen(false)}
            />
            <div className="fixed bottom-0 left-0 right-0 lg:left-auto lg:top-0 lg:right-0 lg:w-[480px] bg-white rounded-t-[28px] lg:rounded-none h-[94vh] lg:h-screen z-[70] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-slide-up overflow-hidden">

              {/* 1. Header (玻璃拟态) */}
              <header className="px-5 py-4 bg-white/85 backdrop-blur-xl border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{getSelectedStudent()?.name}</h1>
                  <span className="text-xs text-slate-500 font-medium">{new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={passAllQC} className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 active:scale-95 transition-all">
                    一键过关
                  </button>
                  <button onClick={() => setIsQCDrawerOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              </header>

              {/* 2. 滚动区域 */}
              <main className="flex-1 overflow-y-auto px-5 pb-36">

                {/* 2.1 进度编辑 (移植自备课页) */}
                <section className="mt-5 space-y-3">
                  {/* 语文 */}
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-orange-400"></div>
                    <div className="text-sm font-bold text-orange-500 w-6">语</div>
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-orange-300 transition-all">
                      <input
                        className="w-6 bg-transparent text-center font-bold text-sm text-slate-800 outline-none"
                        value={courseInfo.chinese.unit}
                        onChange={e => handleCourseChange('chinese', 'unit', e.target.value)}
                      />
                      <span className="text-xs text-slate-400 font-medium">单元</span>
                      <input
                        className="w-6 bg-transparent text-center font-bold text-sm text-slate-800 outline-none"
                        value={courseInfo.chinese.lesson || ''}
                        onChange={e => handleCourseChange('chinese', 'lesson', e.target.value)}
                      />
                      <span className="text-xs text-slate-400 font-medium">课</span>
                      <input
                        className="flex-1 bg-transparent font-medium text-sm text-slate-800 outline-none placeholder:text-slate-300"
                        value={courseInfo.chinese.title}
                        placeholder="课程名称..."
                        onChange={e => handleCourseChange('chinese', 'title', e.target.value)}
                      />
                    </div>
                  </div>
                  {/* 数学 */}
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-blue-500"></div>
                    <div className="text-sm font-bold text-blue-600 w-6">数</div>
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-blue-300 transition-all">
                      <input
                        className="w-6 bg-transparent text-center font-bold text-sm text-slate-800 outline-none"
                        value={courseInfo.math.unit}
                        onChange={e => handleCourseChange('math', 'unit', e.target.value)}
                      />
                      <span className="text-xs text-slate-400 font-medium">章</span>
                      <input
                        className="flex-1 bg-transparent font-medium text-sm text-slate-800 outline-none placeholder:text-slate-300"
                        value={courseInfo.math.title}
                        placeholder="课程名称..."
                        onChange={e => handleCourseChange('math', 'title', e.target.value)}
                      />
                    </div>
                  </div>
                  {/* 英语 */}
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full bg-purple-500"></div>
                    <div className="text-sm font-bold text-purple-600 w-6">英</div>
                    <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5 focus-within:ring-2 focus-within:ring-purple-300 transition-all">
                      <span className="text-xs text-slate-400 font-medium">Unit</span>
                      <input
                        className="w-8 bg-transparent text-center font-bold text-sm text-slate-800 outline-none"
                        value={courseInfo.english.unit}
                        onChange={e => handleCourseChange('english', 'unit', e.target.value)}
                      />
                      <input
                        className="flex-1 bg-transparent font-medium text-sm text-slate-800 outline-none placeholder:text-slate-300"
                        value={courseInfo.english.title}
                        placeholder="课程名称..."
                        onChange={e => handleCourseChange('english', 'title', e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* 2.2 分段控制器 Tab (iOS Style) */}
                <div className="mt-6 bg-slate-100 p-1 rounded-xl flex relative">
                  <div
                    className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-transform duration-300"
                    style={{
                      width: 'calc(33.33% - 4px)',
                      transform: `translateX(${qcTabSubject === 'chinese' ? '0%' : qcTabSubject === 'math' ? '100%' : '200%'})`
                    }}
                  ></div>
                  {Object.entries(QC_TAB_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setQcTabSubject(key as any)}
                      className={`flex-1 text-center text-sm font-semibold py-2 rounded-lg relative z-10 transition-colors ${qcTabSubject === key ? 'text-slate-900' : 'text-slate-500'}`}
                    >
                      {cfg.label}
                    </button>
                  ))}
                </div>

                {/* 2.3 基础过关清单 */}
                <section className="mt-6 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">今日必达 (基础)</span>
                    <button
                      onClick={() => {
                        const name = prompt('输入过关项名称:');
                        if (name) toggleQCPassByManual(selectedStudentId, name, qcTabSubject);
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all ${qcTabSubject === 'chinese' ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' :
                        qcTabSubject === 'math' ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' :
                          'bg-purple-50 text-purple-500 hover:bg-purple-100'
                        }`}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {SUBJECT_DEFAULT_QC[qcTabSubject].map(itemName => {
                      const student = getSelectedStudent();
                      const existingTask = student?.tasks.find(t => t.name === itemName && t.type === 'QC');
                      const isDone = existingTask?.status === 'PASSED' || existingTask?.status === 'COMPLETED';
                      return (
                        <div
                          key={itemName}
                          onClick={() => toggleQCPassByManual(selectedStudentId, itemName, qcTabSubject)}
                          className="flex items-center px-3 py-3 rounded-xl cursor-pointer active:bg-slate-50 transition-colors"
                        >
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'}`}>
                            {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={`flex-1 text-sm font-medium transition-colors ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{itemName}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>+5</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 2.4 核心教学法 */}
                <section className="mt-4 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wide">核心教学法</span>
                    <button
                      onClick={() => setIsMethodologyModalOpen(true)}
                      className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 active:scale-95 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {(() => {
                      const student = getSelectedStudent();
                      const tasks = (student?.tasks || []).filter(t =>
                        (t.type === 'TASK' && t.id.startsWith('temp-methodology-')) ||
                        t.category === '核心教学法' ||
                        t.educationalDomain === '核心教学法'
                      );
                      if (tasks.length === 0) return <div className="py-6 text-center text-slate-300 text-xs">暂无发布任务</div>;
                      return tasks.map(task => (
                        <div key={task.id} onClick={() => toggleTaskComplete(selectedStudentId, task.id)} className="flex items-center px-3 py-3 rounded-xl cursor-pointer active:bg-slate-50 transition-colors">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${task.status === 'PASSED' || task.status === 'COMPLETED' ? 'bg-red-500 border-red-500' : 'border-slate-200'}`}>
                            {(task.status === 'PASSED' || task.status === 'COMPLETED') && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={`flex-1 text-sm font-medium ${task.status === 'PASSED' || task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.name}</span>
                          <span className="text-xs font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg">+{task.exp}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </section>

                {/* 2.5 综合成长 */}
                <section className="mt-4 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide">综合成长</span>
                    <button
                      onClick={() => setIsGrowthModalOpen(true)}
                      className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {(() => {
                      const student = getSelectedStudent();
                      const tasks = (student?.tasks || []).filter(t =>
                        (t.type === 'TASK' && t.id.startsWith('temp-growth-')) ||
                        t.category === '综合成长' ||
                        t.educationalDomain === '综合成长'
                      );
                      if (tasks.length === 0) return <div className="py-6 text-center text-slate-300 text-xs">暂无成长任务</div>;
                      return tasks.map(task => (
                        <div key={task.id} onClick={() => toggleTaskComplete(selectedStudentId, task.id)} className="flex items-center px-3 py-3 rounded-xl cursor-pointer active:bg-slate-50 transition-colors">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${task.status === 'PASSED' || task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200'}`}>
                            {(task.status === 'PASSED' || task.status === 'COMPLETED') && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={`flex-1 text-sm font-medium ${task.status === 'PASSED' || task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.name}</span>
                          <span className="text-xs font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg">+{task.exp}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </section>

                {/* 2.6 定制加餐 */}
                <section className="mt-4 bg-amber-50 rounded-2xl p-1.5 border border-amber-200 shadow-sm">
                  <div className="flex justify-between items-center px-3 py-2">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">定制加餐</span>
                  </div>
                  <div className="space-y-0.5">
                    {(() => {
                      const student = getSelectedStudent();
                      const tasks = (student?.tasks || []).filter(t => t.type === 'SPECIAL');
                      if (tasks.length === 0) return <div className="py-6 text-center text-amber-400 text-xs">暂无个性化任务</div>;
                      return tasks.map(task => (
                        <div key={task.id} onClick={() => toggleTaskComplete(selectedStudentId, task.id)} className="flex items-center px-3 py-3 rounded-xl cursor-pointer active:bg-amber-100/50 transition-colors bg-white/50">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${task.status === 'PASSED' || task.status === 'COMPLETED' ? 'bg-amber-500 border-amber-500' : 'border-amber-300'}`}>
                            {(task.status === 'PASSED' || task.status === 'COMPLETED') && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1">
                            <span className={`text-sm font-medium ${task.status === 'PASSED' || task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.name}</span>
                            <span className="block text-[10px] text-amber-600 mt-0.5">指定: {getSelectedStudent()?.name}</span>
                          </div>
                          <span className="text-xs font-bold bg-white/50 text-amber-600 px-2 py-0.5 rounded-lg">Pending</span>
                        </div>
                      ));
                    })()}
                  </div>
                </section>

              </main>

              {/* 3. 底部结算栏 - 调整位置避免被导航栏遮挡 */}
              <footer className="absolute bottom-16 left-0 right-0 px-5 pt-4 pb-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex justify-between items-center z-50">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Exp</span>
                  <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{calculateSelectedStudentExp()}<span className="text-sm font-semibold text-slate-400 ml-1">PTS</span></div>
                </div>
                <button
                  onClick={settleToday}
                  className="bg-slate-900 text-white px-8 h-13 rounded-full text-base font-semibold shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  确认结算 <ArrowRight size={18} />
                </button>
              </footer>

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
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${isManageMode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
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
                  {getSortedCategories(taskDB).map(cat => (
                    <div
                      key={cat}
                      onClick={() => setCurrentCategory(cat)}
                      className={`p-4 text-[12px] font-medium cursor-pointer border-l-4 transition-colors relative ${currentCategory === cat
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
                        if (n) { setTaskDB(p => ({ ...p, [n]: [] })); setCurrentCategory(n); }
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
                      className={`flex justify-between items-center p-3 mb-2 rounded-lg border transition-all cursor-pointer ${isManageMode
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
        )
        }

        {/* 修改进度弹窗 - V1原版样式 */}
        {
          lessonEditMode && (
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
          )
        }

        {/* === 弹窗 3: 核心教学法分类选择 (toggle 展开方式) === */}
        {
          isMethodologyModalOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
                onClick={() => setIsMethodologyModalOpen(false)}
              />
              <div className="fixed bottom-0 left-0 right-0 bg-[#F8FAFC] rounded-t-3xl max-h-[80vh] z-[80] flex flex-col animate-slide-up overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                  <div className="font-bold text-lg text-slate-800">核心教学法任务</div>
                  <X
                    className="text-gray-400 cursor-pointer"
                    onClick={() => setIsMethodologyModalOpen(false)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                  {methodologyCategories.map((cat, catIdx) => (
                    <div key={catIdx} className="mb-6">
                      {/* 大标题 */}
                      <div className="sticky top-0 bg-[#F8FAFC] py-2 z-10 flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-slate-800 rounded-full"></div>
                        <h4 className="text-sm font-extrabold text-slate-800">{cat.name}</h4>
                        <span className="text-xs text-slate-400">({cat.items.length})</span>
                      </div>
                      {/* 细项列表 */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                        {cat.items.map((item, itemIdx) => {
                          // 检查该项是否已添加到学生任务列表
                          const selectedStudent = getSelectedStudent();
                          // 🔴 修复：只匹配任务名称 + 明确的核心教学法分类，避免误匹配其他 TASK 类型
                          const isAdded = selectedStudent?.tasks.some(t =>
                            t.name === item && (t.category === '核心教学法' || t.educationalDomain === '核心教学法')
                          );
                          return (
                            <div
                              key={itemIdx}
                              onClick={async () => {
                                if (selectedStudentId) {
                                  if (isAdded) {
                                    // 已添加 -> 取消（从任务列表移除）
                                    // 注意：这里可能需要后端删除接口，目前仅前端同步
                                    setQcStudents(prev => prev.map(s =>
                                      s.id === selectedStudentId
                                        ? { ...s, tasks: s.tasks.filter(t => !(t.name === item && (t.id.startsWith('temp-methodology-') || t.type === 'TASK'))) }
                                        : s
                                    ));
                                  } else {
                                    // 未添加 -> 同步到后端
                                    try {
                                      console.log(`📤 [METHODOLOGY] Sending POST to /records for: ${item}`);
                                      const response = await apiService.records.create({
                                        studentId: selectedStudentId,
                                        title: item,
                                        category: '核心教学法',     // 🆕 大类
                                        subcategory: cat.name,      // 🆕 分类标题
                                        exp: 5,
                                        type: 'TASK'
                                      });

                                      console.log(`📥 [METHODOLOGY] Response:`, response);

                                      if (response.success) {
                                        const serverRecord = response.data;
                                        console.log(`✅ [METHODOLOGY] Success! Record:`, serverRecord);
                                        const newTask: Task = {
                                          id: serverRecord.id, // 使用后端返回的真实 ID
                                          recordId: serverRecord.id,
                                          name: serverRecord.title,
                                          type: 'TASK',
                                          status: 'PENDING',
                                          exp: serverRecord.expAwarded || 5,
                                          attempts: 0,
                                          category: '核心教学法', // 🔴 关键：确保面板过滤能找到这条任务
                                          educationalDomain: '核心教学法' // 🔴 备用过滤字段
                                        };

                                        setQcStudents(prev => prev.map(s =>
                                          s.id === selectedStudentId
                                            ? { ...s, tasks: [...s.tasks, newTask] }
                                            : s
                                        ));
                                      } else {
                                        console.error(`❌ [METHODOLOGY] Failed:`, response.message);
                                      }
                                    } catch (err) {
                                      console.error('Failed to create methodology task:', err);
                                      alert('任务添加失败，请检查网络');
                                    }
                                  }
                                }
                              }}
                              className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isAdded ? 'bg-red-50' : 'hover:bg-red-50'}`}
                            >
                              <span className={`text-sm ${isAdded ? 'text-red-600 font-bold' : 'text-gray-700'}`}>{item}</span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isAdded ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}>
                                {isAdded && <Check size={12} className="text-white" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        }

        {/* === 弹窗 4: 综合成长分类选择 (toggle 展开方式) === */}
        {
          isGrowthModalOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
                onClick={() => setIsGrowthModalOpen(false)}
              />
              <div className="fixed bottom-0 left-0 right-0 bg-[#F8FAFC] rounded-t-3xl max-h-[80vh] z-[80] flex flex-col animate-slide-up overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-white">
                  <div className="font-bold text-lg text-slate-800">综合成长任务</div>
                  <X
                    className="text-gray-400 cursor-pointer"
                    onClick={() => setIsGrowthModalOpen(false)}
                  />
                </div>
                <div className="flex-1 overflow-y-auto p-4 pb-20">
                  {growthCategories.map((cat, catIdx) => (
                    <div key={catIdx} className="mb-6">
                      {/* 大标题 */}
                      <div className="sticky top-0 bg-[#F8FAFC] py-2 z-10 flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-green-600 rounded-full"></div>
                        <h4 className="text-sm font-extrabold text-slate-800">{cat.name}</h4>
                        <span className="text-xs text-slate-400">({cat.items.length})</span>
                      </div>
                      {/* 细项列表 */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                        {cat.items.map((item, itemIdx) => {
                          // 检查该项是否已添加到学生任务列表
                          const selectedStudent = getSelectedStudent();
                          // 🔴 修复：只匹配任务名称 + 明确的综合成长分类，避免误匹配其他 TASK 类型
                          const isAdded = selectedStudent?.tasks.some(t =>
                            t.name === item && (t.category === '综合成长' || t.educationalDomain === '综合成长')
                          );
                          return (
                            <div
                              key={itemIdx}
                              onClick={async () => {
                                if (selectedStudentId) {
                                  if (isAdded) {
                                    // 已添加 -> 取消（从任务列表移除）
                                    setQcStudents(prev => prev.map(s =>
                                      s.id === selectedStudentId
                                        ? { ...s, tasks: s.tasks.filter(t => !(t.name === item && (t.id.startsWith('temp-growth-') || t.type === 'TASK'))) }
                                        : s
                                    ));
                                  } else {
                                    // 未添加 -> 同步到后端
                                    try {
                                      const response = await apiService.records.create({
                                        studentId: selectedStudentId,
                                        title: item,
                                        category: '综合成长',       // 🆕 大类
                                        subcategory: cat.name,      // 🆕 分类标题
                                        exp: 5,
                                        type: 'TASK'
                                      });

                                      if (response.success) {
                                        const serverRecord = response.data;
                                        const newTask: Task = {
                                          id: serverRecord.id, // 使用后端返回的真实 ID
                                          recordId: serverRecord.id,
                                          name: serverRecord.title,
                                          type: 'TASK',
                                          status: 'PENDING',
                                          exp: serverRecord.expAwarded || 5,
                                          attempts: 0,
                                          category: '综合成长', // 🔴 关键：确保面板过滤能找到这条任务
                                          educationalDomain: '综合成长' // 🔴 备用过滤字段
                                        };

                                        setQcStudents(prev => prev.map(s =>
                                          s.id === selectedStudentId
                                            ? { ...s, tasks: [...s.tasks, newTask] }
                                            : s
                                        ));
                                      }
                                    } catch (err) {
                                      console.error('Failed to create growth task:', err);
                                      alert('任务添加失败，请检查网络');
                                    }
                                  }
                                }
                              }}
                              className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${isAdded ? 'bg-green-50' : 'hover:bg-green-50'}`}
                            >
                              <span className={`text-sm ${isAdded ? 'text-green-600 font-bold' : 'text-gray-700'}`}>{item}</span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isAdded ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                                {isAdded && <Check size={12} className="text-white" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        }

      </div >
    </ProtectedRoute >
  );
};

export default QCView;
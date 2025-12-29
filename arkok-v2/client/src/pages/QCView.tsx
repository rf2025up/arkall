// VERSION: 2025-12-27-1915
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { X, Check, Search, Settings, Trash2, Plus, ChevronRight, User, Shield, Award, Calendar, BookOpen, Zap, Star, Leaf, ArrowRight, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import ProtectedRoute from '../components/ProtectedRoute';
import apiService from '../services/api.service';
import MessageCenter from '../components/MessageCenter';
import { FIXED_QC_ITEMS } from '../config/taskCategories';
import ReadingSection from '../components/ReadingSection';  // 🆕 阅读记录组件

// --- 类型定义 ---

// --- 类型定义与辅助工具 ---

const GRADE_MAP: Record<string, string> = {
  '一年级': '1', '二年级': '2', '三年级': '3', '四年级': '4', '五年级': '5', '六年级': '6'
};
const getNormGrade = (g?: string) => GRADE_MAP[g || ''] || g || '2';
const getNormSemester = (s?: string) => s?.includes('下') ? '下' : '上';

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
  settledAt?: string | null; // 🆕 结算时间戳，null 表示未结算
  unit?: string; // 🆕 任务关联的单元号（用于按进度过滤）
  lesson?: string; // 🆕 任务关联的课程号（用于按进度过滤）
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
  lesson: Lesson & {
    chinese?: Lesson;
    math?: Lesson;
    english?: Lesson;
  };
  tasks: Task[];
  tutoring?: any[];
  className?: string;
  grade?: string;
  semester?: string;
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

// 🆕 API响应转换为TaskLibrary格式 (Moved outside component)
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

const QCView: React.FC = () => {
  const { user, token } = useAuth();
  const { currentClass, viewMode, managedTeacherName, isProxyMode } = useClass(); // 🆕 获取完整视图状态，包含代理模式标志

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



  // 🆕 基础过关项状态管理
  const [customTaskLibrary, setCustomTaskLibrary] = useState<TaskLibraryItem[]>([]);
  const [activeBasicQCItems, setActiveBasicQCItems] = useState<string[]>([]);
  const [isBasicQCDrawerOpen, setIsBasicQCDrawerOpen] = useState(false);

  // 🆕 加载任务库 (动态 4 大类 + 基础过关)
  const fetchTaskLibrary = async () => {
    try {
      setIsTasksLoading(true);
      const response = await apiService.get('/lms/task-library');
      if (response.success && Array.isArray(response.data)) {
        const tasks = response.data as TaskLibraryItem[];
        setCustomTaskLibrary(tasks);

        // 1. 处理基础过关 (PROGRESS)
        const progressTasks = tasks.filter(t => t.educationalDomain === 'PROGRESS' || t.category.includes('过关'));
        if (typeof convertApiToTaskLibrary === 'function') {
          const convertedLibrary = convertApiToTaskLibrary(progressTasks);
          setTaskLibrary(convertedLibrary);
          setTaskDB(convertedLibrary);
        }

        // 2. 处理核心教学法 (METHODOLOGY)
        const methodologyTasks = tasks.filter(t => t.educationalDomain === 'METHODOLOGY');
        const methodGroups: Record<string, string[]> = {};
        methodologyTasks.forEach(t => {
          if (!methodGroups[t.educationalSubcategory]) methodGroups[t.educationalSubcategory] = [];
          methodGroups[t.educationalSubcategory].push(t.name);
        });
        setMethodologyCategories(Object.entries(methodGroups).map(([name, items]) => ({ name, items })));

        // 3. 处理综合成长 & 习惯养成 (GROWTH & HABIT)
        const growthHabitTasks = tasks.filter(t => t.educationalDomain === 'GROWTH' || t.educationalDomain === 'HABIT');
        const growthGroups: Record<string, string[]> = {};
        growthHabitTasks.forEach(t => {
          if (!growthGroups[t.educationalSubcategory]) growthGroups[t.educationalSubcategory] = [];
          growthGroups[t.educationalSubcategory].push(t.name);
        });
        setGrowthCategories(Object.entries(growthGroups).map(([name, items]) => ({ name, items })));
      }

      // 加载本地Active配置
      const savedActive = localStorage.getItem(`ARKOK_ACTIVE_BASIC_QC_${user?.schoolId}`);
      if (savedActive) {
        setActiveBasicQCItems(JSON.parse(savedActive));
      } else {
        const allDefaults = [
          ...SUBJECT_DEFAULT_QC['chinese'],
          ...SUBJECT_DEFAULT_QC['math'],
          ...SUBJECT_DEFAULT_QC['english']
        ];
        setActiveBasicQCItems(allDefaults);
      }
    } catch (error) {
      console.error('[QCView] Failed to fetch task library:', error);
      setTasksError('获取任务库失败');
    } finally {
      setIsTasksLoading(false);
    }
  };

  // 🆕 添加自定义任务项
  const addLibraryItem = async (domain: string, sub: string, name: string) => {
    try {
      const response = await apiService.post('/lms/task-library', {
        name,
        educationalDomain: domain,
        educationalSubcategory: sub,
        defaultExp: 5,
        type: domain === 'PROGRESS' ? 'QC' : 'TASK'
      });

      if (response.success) {
        toast.success('添加成功');
        await fetchTaskLibrary();
        if (domain === 'PROGRESS') toggleActiveQCItem(name);
      }
    } catch (error) {
      console.error('Failed to add library item:', error);
      toast.error('添加失败');
    }
  };

  // 🆕 删除任务项
  const deleteLibraryItem = async (taskId: string) => {
    if (!confirm('确定要删除这个任务项吗？')) return;
    try {
      const response = await apiService.delete(`/lms/task-library/${taskId}`);
      if (response.success) {
        toast.success('已删除');
        fetchTaskLibrary();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('删除失败');
    }
  };

  // 🆕 切换激活状态 (Today's Must-Do)
  const toggleActiveQCItem = (name: string) => {
    setActiveBasicQCItems(prev => {
      const newItems = prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name];

      // 持久化
      localStorage.setItem(`ARKOK_ACTIVE_BASIC_QC_${user?.schoolId}`, JSON.stringify(newItems));
      return newItems;
    });
  };

  // 🚀 课程进度状态管理 - 直接使用备课页的数据结构
  const [courseInfo, setCourseInfo] = useState<{
    chinese: { unit: string; lesson?: string; title: string };
    math: { unit: string; lesson?: string; title: string };
    english: { unit: string; title: string };
    grade?: string;
    semester?: string;
  }>({
    chinese: { unit: "1", lesson: "1", title: "默认课程" },
    math: { unit: "1", lesson: "1", title: "默认课程" },
    english: { unit: "1", title: "Default Course" },
    grade: undefined,  // 🔧 不再硬编码，等待从学生数据初始化
    semester: undefined
  });

  // 课程进度编辑状态
  const [progressEditMode, setProgressEditMode] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [isMethodologyModalOpen, setIsMethodologyModalOpen] = useState(false);
  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // 🆕 进度拨盘 (The Dial) 状态
  const [dialStudentId, setDialStudentId] = useState<string | null>(null);
  const [dialSubject, setDialSubject] = useState<'chinese' | 'math' | 'english' | null>(null);
  const [syllabuses, setSyllabuses] = useState<Record<string, any[]>>({}); // 缓存各科大纲 [subject_grade]: items

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

  const dateStr = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  // 🚀 获取学生课程进度 - 集成备课页数据
  const fetchStudentProgress = async (studentId: string) => {
    if (!token) {
      console.warn('[QCView] 没有token，无法查询学生课程进度');
      return;
    }

    // 🔧 先从已加载的学生列表中读取年级信息作为备选
    const student = qcStudents.find(s => s.id === studentId);
    const fallbackGrade = student?.grade || courseInfo.grade;
    const fallbackSemester = student?.semester || courseInfo.semester;

    try {
      const response = await apiService.get(`/lms/student-progress?studentId=${studentId}`);

      if (response.success && response.data) {
        // 使用正确的类型定义
        const progressData: any = response.data;
        setCourseInfo({
          chinese: progressData.chinese || { unit: "1", lesson: "1", title: "默认课程" },
          math: progressData.math || { unit: "1", lesson: "1", title: "默认课程" },
          english: progressData.english || { unit: "1", title: "Default Course" },
          grade: progressData.grade || fallbackGrade,
          semester: progressData.semester || fallbackSemester
        });
      } else {
        // 🔧 API返回无数据时，使用学生自身的年级信息
        setCourseInfo(prev => ({
          ...prev,
          grade: fallbackGrade,
          semester: fallbackSemester
        }));
      }
    } catch (error) {
      console.error('[QCView] 获取学生课程进度异常:', error);
      // 🔧 异常时也使用备选年级
      setCourseInfo(prev => ({
        ...prev,
        grade: fallbackGrade,
        semester: fallbackSemester
      }));
    }
  };

  // 🚀 从缓存的大纲中查找课文标题
  const findTitleInSyllabus = (subject: 'chinese' | 'math' | 'english', unit: string, lesson?: string) => {
    // 获取当前学生的年级和学期
    const student = qcStudents.find(s => s.id === (selectedStudentId || editingStudentId));
    const studentGrade = getNormGrade(student?.grade || courseInfo.grade);
    const studentSemester = getNormSemester(student?.semester || courseInfo.semester);

    // 根据学科自动选择教材版本
    const version = subject === 'english' ? '湘少版' : '人教版';
    const gradeStr = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'][parseInt(studentGrade) - 1] || '二年级';
    const semesterStr = studentSemester === '下' ? '下册' : '上册';
    const key = `${subject}_${gradeStr}_${semesterStr}_${version}`;

    const syllabus = syllabuses[key];
    if (!syllabus || !Array.isArray(syllabus)) {
      console.log(`[findTitleInSyllabus] 大纲未缓存: ${key}`);
      return null;
    }

    // 在大纲中查找匹配的单元和课程
    const targetUnit = parseInt(unit) || 1;
    const targetLesson = lesson ? parseInt(lesson) : 1;

    for (const unitData of syllabus) {
      if (parseInt(unitData.unit) === targetUnit || unitData.unit === unit) {
        if (unitData.lessons && Array.isArray(unitData.lessons)) {
          for (const lessonData of unitData.lessons) {
            const lessonNum = parseInt(lessonData.lesson) || lessonData.order || 1;
            if (lessonNum === targetLesson || lessonData.lesson === lesson) {
              return lessonData.title || lessonData.name || null;
            }
          }
        }
        // 英语可能直接有 title
        if (subject === 'english' && unitData.title) {
          return unitData.title;
        }
      }
    }

    console.log(`[findTitleInSyllabus] 未找到匹配: subject=${subject}, unit=${unit}, lesson=${lesson}`);
    return null;
  };

  // 🚀 课程进度变更处理 - 复用备课页的逻辑
  const handleCourseChange = async (sub: string, field: string, value: string) => {
    if (sub === 'grade' || sub === 'semester') {
      setCourseInfo(prev => {
        const updated = { ...prev, [sub]: value };
        saveStudentProgress(updated); // Auto-save grade/semester changes
        return updated;
      });
      return;
    }

    // 1. 同步更新局部状态
    setCourseInfo(prev => {
      const subject = sub as 'chinese' | 'math' | 'english';
      const updated = {
        ...prev,
        [subject]: { ...prev[subject], [field]: value }
      };

      // 如果改变了单元或课，尝试自动修正标题
      if (field === 'unit' || field === 'lesson') {
        const lesson = subject === 'english' ? undefined : (updated[subject] as any).lesson;
        const title = findTitleInSyllabus(subject, updated[subject].unit, lesson);
        if (title) updated[subject].title = title;
      }

      // 🚀 核心闭环：自动触发后端更新
      saveStudentProgress(updated);

      return updated;
    });
  };

  /**
   * 🆕 异步保存学生进度到后端
   */
  const saveStudentProgress = async (info: typeof courseInfo) => {
    const studentId = selectedStudentId || editingStudentId;
    if (!studentId || !user) return;
    try {
      await apiService.records.updateProgress({
        studentId: studentId,
        schoolId: user.schoolId || '',
        teacherId: user.id || '',
        courseInfo: info
      });
      console.log('✅ [QCView] 学生进度自动保存成功');

      // 🆕 同步更新本地 qcStudents 列表，防止 useEffect 基于旧数据回滚 UI
      setQcStudents(prev => prev.map(s =>
        s.id === studentId ? { ...s, grade: info.grade, semester: info.semester } : s
      ));
    } catch (error) {
      console.error('❌ [QCView] 学生进度自动保存失败:', error);
    }
  };

  // 🚀 更新学生课程进度 - 权限高于备课页
  const updateStudentProgress = async (studentId: string) => {
    try {
      setIsUpdatingProgress(true);
      const response = await apiService.records.updateProgress({
        studentId,
        schoolId: user?.schoolId || '',
        teacherId: user?.id || '',
        courseInfo: courseInfo
      });
      if (response.success) {
        alert("进度修正成功！");
        setLessonEditMode(false);
        // 更新本地学生进度显示
        setQcStudents(prev => prev.map(s => {
          if (s.id !== studentId) return s;
          const newLesson = {
            unit: courseInfo.chinese.unit,
            lesson: courseInfo.chinese.lesson || '1',
            title: courseInfo.chinese.title
          };
          return { ...s, lesson: newLesson };
        }));
      }
    } catch (error) {
      console.error('[QCView] 更新进度失败:', error);
      alert("更新进度失败，请重试");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  // 🚀 获取大纲数据 (用于自动标题填充)
  const fetchSyllabus = async (subject: string, grade: string = "一年级", semester: string = "上", version?: string) => {
    // 根据学科自动选择教材版本：语文、数学为人教版(PEP)，英语为湘少版
    const autoVersion = version || (subject === 'english' ? '湘少版' : '人教版');
    // 🔧 关键修复：缓存键必须使用标准化后的值，以对齐下拉列表的读取逻辑
    const normG = getNormGrade(grade);
    const normS = getNormSemester(semester);
    const key = `${subject}_${normG}_${normS}_${autoVersion}`;

    if (syllabuses[key]) return syllabuses[key];

    try {
      const response = await apiService.get('/records/curriculum/syllabus', {
        subject,
        grade: normG, // 向后端发送标准化后的值
        semester: normS,
        version: autoVersion
      });

      if (response.success && Array.isArray(response.data)) {
        setSyllabuses(prev => ({ ...prev, [key]: response.data as any[] }));
        return response.data;
      }
    } catch (error) {
      console.error('[QCView] 获取大纲失败:', error);
    }
    return [];
  };

  // 🚀 核心联动：当年级或学期变化时，自动获取大纲，确保下拉列表有数据
  useEffect(() => {
    const grade = courseInfo.grade;
    const semester = courseInfo.semester?.includes('下') ? '下' : '上';
    if (!grade) return;

    console.log(`[QCView] 联动更新：正在拉取 ${grade} ${semester} 的大纲...`);
    // 并发请求三科大纲
    fetchSyllabus('chinese', grade, semester);
    fetchSyllabus('math', grade, semester);
    fetchSyllabus('english', grade, semester);
  }, [courseInfo.grade, courseInfo.semester]);

  // 🚀 拨盘调整处理 (The Dial)
  const handleDialUpdate = async (studentId: string, subject: 'chinese' | 'math' | 'english', field: 'unit' | 'lesson', direction: 'up' | 'down') => {
    const student = qcStudents.find(s => s.id === studentId);
    if (!student) return;

    // 获取当前该学科进度 (优先从 courseInfo 取，如果没有则从 student.lesson 取)
    const currentInfo = studentId === editingStudentId ? courseInfo[subject] : {
      unit: (student.lesson as any)?.[subject]?.unit || (student.lesson as any)?.unit || "1",
      lesson: (student.lesson as any)?.[subject]?.lesson || (student.lesson as any)?.lesson || "1",
      title: (student.lesson as any)?.[subject]?.title || (student.lesson as any)?.title || ""
    };

    const info = currentInfo as any;
    let newVal = parseInt(field === 'unit' ? (info.unit || "1") : (info.lesson || "1"));
    if (isNaN(newVal)) newVal = 1;

    if (direction === 'up') newVal++;
    else if (direction === 'down' && newVal > 1) newVal--;

    const updatedValue = newVal.toString();

    // 自动寻找标题
    const finalGrade = studentId === editingStudentId ? courseInfo.grade : (student.grade || courseInfo.grade);
    const finalSemester = studentId === editingStudentId ? courseInfo.semester : (student.semester || courseInfo.semester);

    const syllabus = await fetchSyllabus(subject, getNormGrade(finalGrade), getNormSemester(finalSemester));
    let newTitle = currentInfo.title;
    if (syllabus && syllabus.length > 0) {
      const match = syllabus.find((item: any) => {
        const itemUnit = item.unit?.toString();
        const itemLesson = item.lesson?.toString();
        const targetUnit = field === 'unit' ? updatedValue : (currentInfo as any).unit;
        const targetLesson = field === 'lesson' ? updatedValue : ((currentInfo as any).lesson || "1");

        if (field === 'unit') {
          // 切换单元时，尝试匹配该单元的第一课或直接匹配单元
          return itemUnit === targetUnit && (!itemLesson || itemLesson === "1");
        } else {
          // 切换课时时，匹配当前单元下的特定课时
          return itemUnit === targetUnit && itemLesson === targetLesson;
        }
      });
      if (match) newTitle = match.title;
    }

    const newCourseInfo = {
      ...courseInfo,
      [subject]: {
        ...currentInfo,
        [field]: updatedValue,
        title: newTitle
      }
    };

    // 如果当前正在编辑此学生，更新全局状态
    if (studentId === editingStudentId) {
      setCourseInfo(newCourseInfo);
    }

    // 立即持久化同步 (SSOT 模式)
    try {
      await apiService.post('/records/progress-override', {
        studentId,
        courseInfo: {
          ...student.lesson, // 保留其他科目
          [subject]: {
            ...currentInfo,
            [field]: updatedValue,
            title: newTitle
          }
        }
      });

      // 更新本地学生列表中的进度，实现 UI 实时反馈
      setQcStudents(prev => prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            lesson: {
              ...s.lesson,
              [subject]: {
                ...currentInfo,
                [field]: updatedValue,
                title: newTitle
              }
            } as any
          };
        }
        return s;
      }));
    } catch (error) {
      console.error('[QCView] 拨盘同步失败:', error);
    }
  };

  const handleOpenProgressModal = async (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setEditingStudentId(student.id);
    fetchStudentProgress(student.id);

    // 🆕 预加载该学生年级学期的大纲数据，确保 findTitleInSyllabus 能找到课文标题
    const studentGrade = getNormGrade(student.grade);
    const studentSemester = getNormSemester(student.semester);
    const gradeStr = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'][parseInt(studentGrade) - 1] || '二年级';
    const semesterStr = studentSemester === '下' ? '下册' : '上册';

    // 并行加载语数英大纲
    Promise.all([
      fetchSyllabus('chinese', gradeStr, semesterStr),
      fetchSyllabus('math', gradeStr, semesterStr),
      fetchSyllabus('english', gradeStr, semesterStr)
    ]).then(() => {
      console.log(`✅ [QCView] 大纲预加载完成: ${gradeStr} ${semesterStr}`);
    }).catch(err => {
      console.warn('[QCView] 大纲预加载部分失败:', err);
    });

    setIsQCDrawerOpen(true); // 打开详情抽屉进行精准编辑
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

        // 🆕 核心优化：按名称去重任务记录，并合并尝试次数
        const taskMap = new Map<string, any>();
        studentRecords.forEach((record: any) => {
          const key = `${record.type.toUpperCase()}_${record.title}`;
          const current = taskMap.get(key);
          if (current) {
            // 已存在，合并数据
            // 经验值取单次奖励（去重），尝试次数累加
            current.attempts += (record.attempts || 0);
          } else {
            // 新记录
            taskMap.set(key, {
              id: record.id,
              recordId: record.id,
              name: record.title,
              type: record.type.toUpperCase(),
              category: record.content?.category || '',
              educationalDomain: record.content?.educationalDomain || '',
              status: record.status === 'COMPLETED' ? 'PASSED' : record.status,
              exp: record.expAwarded || 5,
              attempts: record.attempts || 0,
              isAuto: record.type === 'SPECIAL',
              settledAt: record.settledAt || null,
              // 🆕 保存任务关联的单元/课程信息，用于按进度过滤
              unit: record.content?.unit || '',
              lesson: record.content?.lesson || ''
            });
          }
        });
        const tasks = Array.from(taskMap.values());

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

  // 🆕 监听selectedStudentId变化，自动加载该学生的进度（解决年级进度重置问题）
  // 🔧 关键修复：移除 qcStudents 依赖，避免保存后触发重新加载导致覆盖用户选择
  useEffect(() => {
    if (selectedStudentId) {
      console.log(`[QCView] selectedStudentId 变化，加载学生进度: ${selectedStudentId}`);
      // 🔧 先从已加载的学生列表中读取年级信息，立即更新UI
      const student = qcStudents.find(s => s.id === selectedStudentId);
      if (student) {
        setCourseInfo(prev => ({
          ...prev,
          grade: student.grade || prev.grade,
          semester: student.semester || prev.semester
        }));
      }
      fetchStudentProgress(selectedStudentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudentId]); // 🆕 只依赖 selectedStudentId，移除 qcStudents
  const [isQCDrawerOpen, setIsQCDrawerOpen] = useState(false);
  const [isCMSDrawerOpen, setIsCMSDrawerOpen] = useState(false);

  //CMS 状态已移除 (整合到激励库)
  const [taskDB, setTaskDB] = useState<TaskLibrary>(taskLibrary);
  const [currentCategory, setCurrentCategory] = useState("基础作业");
  const [isManageMode, setIsManageMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualExp, setManualExp] = useState(10);
  const [lessonEditMode, setLessonEditMode] = useState(false);

  // 🆕 抽屉内 Tab 切换状态 - 用于三学科过关标签切换
  const [qcTabSubject, setQcTabSubject] = useState<'chinese' | 'math' | 'english'>('chinese');

  // 🆕 核心教学法和综合成长弹窗状态 (统称为激励库)
  // isMethodologyModalOpen 和 isGrowthModalOpen 已在上方声明

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

  // 加载配置已迁移至 fetchTaskLibrary
  useEffect(() => {
    fetchTaskLibrary();
  }, [token]);

  // 获取任务库 (复用PrepView逻辑)


  // --- 辅助函数 ---



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

  const getLessonStr = (l: any, subject?: string) => {
    const targetKey = subject || qcTabSubject;
    const target = l[targetKey] || l;
    if (!target) return '未设进度';
    const unitStr = target.unit || '1';
    const lessonStr = target.lesson ? `-L${target.lesson}` : '';
    const titleStr = target.title ? ` ${target.title}` : '';
    return `U${unitStr}${lessonStr}${titleStr}`;
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

  // 🆕 计算当前选中学生的待结算经验（只计算过关页任务，不含PK/挑战/勋章/习惯）
  const calculateSelectedStudentExp = () => {
    const student = getSelectedStudent();
    if (!student) return { exp: 0, count: 0, items: [] };
    let total = 0;
    let count = 0;
    const items: string[] = [];
    // 只计算过关页相关任务类型
    const qcTaskTypes = ['QC', 'TASK', 'SPECIAL'];
    student.tasks.forEach(t => {
      // 🆕 只计算过关页任务（QC/TASK/SPECIAL），已完成且未结算
      const isQcTask = qcTaskTypes.includes(t.type);
      const isDone = t.status === 'PASSED' || t.status === 'COMPLETED';
      if (isQcTask && isDone && !t.settledAt) {
        total += t.exp;
        count++;
        items.push(`${t.name}(+${t.exp})`);
      }
    });
    return { exp: total, count, items };
  };

  // --- 交互逻辑 ---

  // 1. 质检台操作
  const openQCDrawer = async (sid: string) => {
    const student = qcStudents.find(s => s.id === sid);

    setSelectedStudentId(sid);
    setIsQCDrawerOpen(true);

    // 🚀 获取该学生的课程进度数据并预加载大纲
    if (student) {
      await fetchStudentProgress(student.id);
    }

    // 预加载当前年级/学期的三科大纲，提升下拉菜单响应速度
    const g = getNormGrade(student.grade);
    const s = getNormSemester(student.semester);
    Promise.all([
      fetchSyllabus('chinese', g, s),
      fetchSyllabus('math', g, s),
      fetchSyllabus('english', g, s)
    ]);
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
              if (t.id !== taskId) return t;
              // 🆕 允许所有状态的任务增加尝试次数（包括 PENDING）
              return { ...t, attempts: (t.attempts || 0) + 1 };
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
          console.log(`✅ [QC_MANUAL_CREATE] Success! Updating local state...`);
          // 🚀 立即更新本地状态，避免异步刷新延迟
          const newRecord = response.data as any;
          const newTask: Task = {
            id: newRecord.id,
            recordId: newRecord.id,
            name: newRecord.title,
            type: 'QC',
            status: 'PASSED', // 已创建为COMPLETED，前端显示为PASSED
            exp: newRecord.expAwarded || 5,
            attempts: 0,
            category: categoryMap[subjectKey]
          };

          setQcStudents(prev => prev.map(s => {
            if (s.id !== studentId) return s;
            return {
              ...s,
              tasks: [...s.tasks, newTask]
            };
          }));

          // 震动反馈
          if (navigator.vibrate) navigator.vibrate(50);
        } else {
          console.error(`❌ [QC_MANUAL_CREATE] Failed:`, response.message);
        }
      }
    } catch (error) {
      console.error('❌ [QC_MANUAL_ERROR]', error);
    }
  };

  const toggleQCPass = async (studentId: string, taskId: string) => {
    try {
      // 找到对应的学生和任务
      const student = qcStudents.find(s => s.id === studentId);
      const task = student?.tasks.find(t => t.id === taskId);

      if (!student || !task || !task.recordId) {
        return;
      }

      const isAlreadyPassed = task.status === 'PASSED' || task.status === 'COMPLETED';
      const newStatus = isAlreadyPassed ? task.status : 'COMPLETED';

      // 🆕 基础过关项：已过关时点击可以取消勾选
      if (isAlreadyPassed) {
        // 将状态改回 PENDING
        const rollbackRes = await apiService.patch(`lms/records/${task.recordId}/status`, {
          status: 'PENDING'
        });
        if (rollbackRes.success) {
          setQcStudents(prev => prev.map(s => {
            if (s.id !== studentId) return s;
            return {
              ...s,
              tasks: s.tasks.map(t => {
                if (t.id !== taskId) return t;
                return { ...t, status: 'PENDING' };
              })
            };
          }));
          if (navigator.vibrate) navigator.vibrate(50);
          return;
        }
      }

      const targetUrl = `lms/records/${task.recordId}/status`;
      const response = await apiService.patch(targetUrl, {
        status: newStatus,
        courseInfo: courseInfo
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


  const deleteTask = (studentId: string, taskId: string) => {
    // 🆕 直接退回抽屉，无需确认弹窗
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

      const isAlreadyDone = task.status === 'COMPLETED' || task.status === 'PASSED';

      // 🆕 核心调整：根据用户要求，非基础过关项处理逻辑如下：
      // 1. 核心教学法 (Methodology) 和 综合成长 (Growth) 再次点击时，退回抽屉 (状态改为 PENDING)
      // 2. 基础过关项 (QC) 保留原有点击增加尝试次数的逻辑 (由 toggleQCPass/toggleQCPassByManual 处理)
      if (isAlreadyDone) {
        const isMethodologyOrGrowth =
          task.category === '核心教学法' ||
          task.educationalDomain === '核心教学法' ||
          task.category === '综合成长' ||
          task.educationalDomain === '综合成长';

        if (isMethodologyOrGrowth) {
          // 退回抽屉逻辑
          const rollbackRes = await apiService.patch(`/lms/records/${task.recordId}/status`, {
            status: 'PENDING'
          });
          if (rollbackRes.success) {
            setQcStudents(prev => prev.map(s => {
              if (s.id !== studentId) return s;
              return {
                ...s,
                tasks: s.tasks.map(t => {
                  if (t.id !== taskId) return t;
                  return { ...t, status: 'PENDING' };
                })
              };
            }));
            if (navigator.vibrate) navigator.vibrate(50);
            return;
          }
        } else {
          // 其他非基础过关项 (如定制加餐) 暂时不做二次点击处理
          console.log('[QCView] 该项目已过关，无需进一步操作');
          return;
        }
      }

      const newStatus = 'COMPLETED';

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

  // 结算功能 - 只结算当前选中的学生
  const settleToday = async () => {
    if (!selectedStudentId) {
      setToastMsg('请先选择学生');
      setTimeout(() => setToastMsg(null), 2000);
      return;
    }

    try {
      // 只获取当前选中的学生
      const selectedStudent = qcStudents.find(s => s.id === selectedStudentId);
      if (!selectedStudent) {
        setToastMsg('未找到选中的学生');
        setTimeout(() => setToastMsg(null), 2000);
        return;
      }

      // 🆕 检查当前学生是否有已完成且未结算的任务
      const hasUnsettledTasks = selectedStudent.tasks.some(t =>
        (t.status === 'COMPLETED' || t.status === 'PASSED') && !t.settledAt
      );

      if (!hasUnsettledTasks) {
        setToastMsg('该学生暂无需要结算的任务（可能已结算过）');
        setTimeout(() => setToastMsg(null), 2000);
        return;
      }

      // 只结算当前选中的学生
      const response = await apiService.patch(`/records/student/${selectedStudentId}/pass-all`, {
        teacherId: user?.id || '',
        schoolId: user?.schoolId || '',
        expBonus: 0,
        courseInfo: courseInfo // 🆕 传递当前课程进度
      });

      if (response.success) {
        // 计算该学生的总经验值
        const studentExp = calculateSelectedStudentExp();
        setToastMsg(`结算成功！学生：${selectedStudent.name}，经验值：${studentExp} 经验`);
        setTimeout(() => setToastMsg(null), 3000);

        // 刷新学生数据
        const today = new Date().toISOString().split('T')[0];
        await fetchStudentRecords(selectedStudentId, today);
      } else {
        setToastMsg(`结算失败：${response.message}`);
        setTimeout(() => setToastMsg(null), 2000);
      }

    } catch (error) {
      console.error('结算错误:', error);
      setToastMsg('结算失败，请检查网络连接');
      setTimeout(() => setToastMsg(null), 2000);
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

        {/* 🆕 “精致沉浸·精准排版” Header (与备课页统一) */}
        <div
          className="pt-8 pb-5 px-6 rounded-b-[30px] shadow-lg shadow-orange-200/20 overflow-hidden mb-6 relative"
          style={{ background: isProxyMode ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
        >
          {/* 背景装饰 */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-white/10 blur-[80px] rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col gap-4">
            {/* 第一行：标题 + 日期 | 通知 */}
            <div className="flex justify-between items-center">
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-black text-white tracking-tight drop-shadow-sm">
                  今日过关
                </h1>
                <span className="text-[10px] font-bold text-white/50 tracking-wider">
                  {dateStr}
                </span>
              </div>

              <div className="scale-90 active:scale-100 transition-transform">
                <MessageCenter variant="header" />
              </div>
            </div>

            {/* 第二行：班级标签 */}
            <div className="flex justify-between items-center">
              {/* 精细玻璃态班级选择器 */}
              <button
                onClick={() => {/* 逻辑保持不变 */ }}
                className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 active:bg-white/20 transition-all group"
              >
                <span className="text-white font-black text-[10px] tracking-tight">
                  {viewMode === 'MY_STUDENTS' ? '我的班级' :
                    viewMode === 'ALL_SCHOOL' ? '全校名册' :
                      `${managedTeacherName || '代管理'} 的班级`}
                </span>
                <ChevronDown size={10} className="text-white/40 group-hover:text-white/70 transition-colors" />
              </button>

              {/* 右侧空位 (可放其他动作) */}
              <div className="flex-1"></div>
            </div>
            {/* 结算页显示总分 */}
            {activeTab === 'settle' && (
              <div className="text-right mt-2">
                <div className="text-2xl font-black text-indigo-100 font-mono">
                  {calculateTotalExp()}
                </div>
                <div className="text-[10px] text-white/40 font-bold tracking-wider uppercase">总经验值</div>
              </div>
            )}
          </div>
        </div>

        {/* Tab 已删除，结算功能整合到过关抽屉 */}

        {/* === 内容滚动区 === */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">

          {/* --- 质检台 (唯一视图) --- */}
          {(
            <div className="grid grid-cols-3 gap-3">
              {qcStudents.map(student => {
                // 🔧 修复：进度条只统计基础过关项（SUBJECT_DEFAULT_QC）
                // 分母：3科 × 各4项 = 12 个固定基础过关项
                const totalQCItems =
                  SUBJECT_DEFAULT_QC.chinese.length +
                  SUBJECT_DEFAULT_QC.math.length +
                  SUBJECT_DEFAULT_QC.english.length;

                // 分子：学生已完成的属于基础过关项的任务数
                const allDefaultItems = [
                  ...SUBJECT_DEFAULT_QC.chinese,
                  ...SUBJECT_DEFAULT_QC.math,
                  ...SUBJECT_DEFAULT_QC.english
                ];
                const passedQCItems = student.tasks.filter(t =>
                  t.type === 'QC' &&
                  (t.status === 'PASSED' || t.status === 'COMPLETED') &&
                  allDefaultItems.includes(t.name)
                ).length;

                const percent = totalQCItems > 0 ? (passedQCItems / totalQCItems) * 100 : 0;
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
        {
          isQCDrawerOpen && selectedStudentId && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                onClick={() => setIsQCDrawerOpen(false)}
              />
              <div className="fixed bottom-0 left-0 right-0 lg:left-auto lg:top-0 lg:right-0 lg:w-[480px] bg-white rounded-t-[28px] lg:rounded-none h-[94vh] lg:h-screen z-[70] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.15)] animate-slide-up overflow-hidden">

                {/* 1. Header (玻璃拟态) */}
                <header className="px-5 py-4 bg-white/85 backdrop-blur-xl border-b border-slate-100 flex justify-between items-center sticky top-0 z-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-slate-900">{getSelectedStudent()?.name}</span>
                    <button onClick={() => setIsQCDrawerOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </header>

                {/* 2. 滚动区域 */}
                <main className="flex-1 overflow-y-auto px-5 pb-36">

                  {/* 2.1 课程进度 (横向胶囊布局 - 移植自备课页) */}
                  <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                        <BookOpen size={12} /> 课程进度
                      </div>
                      <div className="flex gap-1.5">
                        <div className="relative">
                          <select
                            value={courseInfo.grade}
                            onChange={e => handleCourseChange('grade', '', e.target.value)}
                            className="text-[10px] font-bold bg-slate-100 text-slate-600 pl-2.5 pr-6 py-1 rounded-lg border-none outline-none appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                          >
                            {['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'].map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                          <select
                            value={courseInfo.semester}
                            onChange={e => handleCourseChange('semester', '', e.target.value)}
                            className="text-[10px] font-bold bg-slate-100 text-slate-600 pl-2.5 pr-6 py-1 rounded-lg border-none outline-none appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                          >
                            {['上册', '下册'].map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* 三科进度选择 - 横向胶囊 */}
                    <div className="space-y-2">
                      {/* 语文 */}
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-red-50/50">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs text-red-500 shadow-sm">语</div>
                        <div className="flex-1 relative">
                          <select
                            className="w-full bg-white/80 border-none outline-none rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
                            value={`${courseInfo.chinese.unit}-${courseInfo.chinese.lesson || '1'}`}
                            onChange={async (e) => {
                              const [unit, lesson] = e.target.value.split('-');
                              if (!unit) return; // 防止空值

                              const syllabusKey = `chinese_${getNormGrade(courseInfo.grade)}_${getNormSemester(courseInfo.semester)}_人教版`;
                              const syllabus = syllabuses[syllabusKey] || [];

                              // 🆕 改进匹配逻辑：优先精确匹配，否则用第一个单元项
                              const match = syllabus.find((item: any) =>
                                item.unit === unit && (item.lesson === lesson || (!item.lesson && !lesson))
                              ) || syllabus.find((item: any) => item.unit === unit);

                              const newTitle = match?.title || `第${unit}单元${lesson ? ` 第${lesson}课` : ''}`;
                              const newInfo = { ...courseInfo, chinese: { unit, lesson: lesson || '1', title: newTitle } };
                              setCourseInfo(newInfo);
                              await saveStudentProgress(newInfo);
                            }}
                          >
                            <option value="">选择语文进度...</option>
                            {(syllabuses[`chinese_${getNormGrade(courseInfo.grade)}_${getNormSemester(courseInfo.semester)}_人教版`] || []).map((item: any, idx: number) => (
                              <option key={idx} value={`${item.unit}-${item.lesson || ''}`}>
                                第{item.unit}单元{item.lesson ? ` 第${item.lesson}课` : ''} · {item.title}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* 数学 */}
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/50">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs text-blue-500 shadow-sm">数</div>
                        <div className="flex-1 relative">
                          <select
                            className="w-full bg-white/80 border-none outline-none rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
                            value={`${courseInfo.math.unit}-${courseInfo.math.lesson || '1'}`}
                            onChange={async (e) => {
                              const [unit, lesson] = e.target.value.split('-');
                              const syllabus = syllabuses[`math_${getNormGrade(courseInfo.grade)}_${getNormSemester(courseInfo.semester)}_人教版`] || [];
                              const match = syllabus.find((item: any) => item.unit === unit && (item.lesson === lesson || !item.lesson));
                              if (match) {
                                const newInfo = { ...courseInfo, math: { unit, lesson, title: match.title } };
                                setCourseInfo(newInfo);
                                await saveStudentProgress(newInfo);
                              }
                            }}
                          >
                            <option value="">选择数学进度...</option>
                            {(syllabuses[`math_${getNormGrade(courseInfo.grade)}_${getNormSemester(courseInfo.semester)}_人教版`] || []).map((item: any, idx: number) => (
                              <option key={idx} value={`${item.unit}-${item.lesson || ''}`}>
                                第{item.unit}章{item.lesson ? ` 第${item.lesson}课` : ''} · {item.title}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* 英语 */}
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-50/50">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-xs text-purple-500 shadow-sm">英</div>
                        <div className="flex-1 relative">
                          <select
                            className="w-full bg-white/80 border-none outline-none rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 appearance-none cursor-pointer hover:bg-white transition-all shadow-sm"
                            value={courseInfo.english.unit}
                            onChange={async (e) => {
                              const unit = e.target.value;
                              const syllabus = syllabuses[`english_${getNormGrade(courseInfo.grade)}_${getNormSemester(courseInfo.semester)}_湘少版`] || [];
                              const match = syllabus.find((item: any) => item.unit === unit);
                              if (match) {
                                const newInfo = { ...courseInfo, english: { unit, lesson: '', title: match.title } };
                                setCourseInfo(newInfo);
                                await saveStudentProgress(newInfo);
                              }
                            }}
                          >
                            <option value="">选择英语进度...</option>
                            {(syllabuses[`english_${getNormGrade(courseInfo.grade)}_${getNormSemester(courseInfo.semester)}_湘少版`] || []).map((item: any, idx: number) => (
                              <option key={idx} value={item.unit}>
                                Unit {item.unit} · {item.title}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

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

                  {/* 2.3 基础过关清单 (带抽屉管理) */}
                  <section className="mt-6 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center px-3 py-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">今日必达 (基础)</span>

                      {/* 抽屉触发按钮 */}
                      <button
                        onClick={() => setIsBasicQCDrawerOpen(true)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all ${qcTabSubject === 'chinese' ? 'bg-orange-50 text-orange-500 hover:bg-orange-100' :
                          qcTabSubject === 'math' ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' :
                            'bg-purple-50 text-purple-500 hover:bg-purple-100'
                          }`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="space-y-0.5">
                      {(() => {
                        const student = getSelectedStudent();
                        // 🆕 获取当前科目的进度
                        const currentProgress = courseInfo[qcTabSubject as keyof typeof courseInfo] as { unit: string; lesson?: string } | undefined;
                        const currentUnit = currentProgress?.unit || '1';
                        const currentLesson = currentProgress?.lesson || '1';

                        // 🆕 必须是 "激活" (Active) 的项才显示
                        // 来源：活跃列表 (从 LocalStorage 加载) ∩ (默认项 U 自定义项)
                        // 但为了简化，我们直接遍历 activeBasicQCItems，并过滤出属于当前科目的项

                        const currentSubjectCategory = qcTabSubject === 'chinese' ? '语文基础过关' : qcTabSubject === 'math' ? '数学基础过关' : '英语基础过关';
                        const defaultItems = SUBJECT_DEFAULT_QC[qcTabSubject];

                        // 计算当前科目下所有可用的项 (默认 + 自定义)
                        const availableCustomNames = customTaskLibrary
                          .filter(t => t.category === currentSubjectCategory && t.isActive)
                          .map(t => t.name);

                        const allAvailableItems = [...defaultItems, ...availableCustomNames];

                        // 最终显示列表：属于当前科目 AND 在激活列表中的项
                        const allItems = allAvailableItems.filter(item => activeBasicQCItems.includes(item));

                        return allItems.map(itemName => {
                          // 🆕 只匹配当前进度的任务（unit/lesson 匹配）
                          const existingTask = student?.tasks.find(t =>
                            t.name === itemName &&
                            t.type === 'QC' &&
                            (t.unit === currentUnit || !t.unit) &&
                            (t.lesson === currentLesson || !t.lesson || !currentLesson)
                          );
                          const isDone = existingTask?.status === 'PASSED' || existingTask?.status === 'COMPLETED';
                          const isCustomItem = !defaultItems.includes(itemName);

                          return (
                            <div
                              key={itemName}
                              className="flex items-center px-3 py-3 rounded-xl transition-colors"
                            >
                              {/* 勾选区：只负责勾选/取消勾选 */}
                              <div
                                onClick={() => existingTask && toggleQCPass(selectedStudentId, existingTask.id)}
                                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all cursor-pointer ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>
                              {/* 文字区：仅显示名称 */}
                              <div className="flex-1">
                                <span className={`text-sm font-medium transition-colors ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                  {itemName}
                                  {isCustomItem && <span className="ml-1 text-[10px] text-purple-500 bg-purple-50 px-1 rounded">自定义</span>}
                                </span>
                              </div>
                              {/* 🆕 "补"按钮常显：只记录辅导次数，不触发过关 */}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  // 如果没有记录，先创建一个 PENDING 状态的记录
                                  if (!existingTask) {
                                    // 🆕 获取当前科目进度
                                    const categoryMap: Record<string, string> = {
                                      chinese: '语文基础过关',
                                      math: '数学基础过关',
                                      english: '英语基础过关'
                                    };
                                    const currentSubjectProgress = courseInfo[qcTabSubject as keyof typeof courseInfo] as { unit: string; lesson?: string } | undefined;
                                    const response = await apiService.post('/lms/records', {
                                      studentId: selectedStudentId,
                                      type: 'QC',
                                      title: itemName,
                                      status: 'PENDING', // 注意：这里是 PENDING，不是 COMPLETED
                                      category: categoryMap[qcTabSubject],
                                      date: new Date().toISOString().split('T')[0],
                                      courseInfo: courseInfo,
                                      // 🆕 显式传递 unit/lesson 确保后端正确存储
                                      unit: currentSubjectProgress?.unit || '1',
                                      lesson: currentSubjectProgress?.lesson || '1'
                                    });
                                    if (response.success) {
                                      const newRecord = response.data as any;
                                      // 创建后立即增加 attempts
                                      await apiService.patch(`lms/records/${newRecord.id}/attempt`, {});
                                      // 更新本地状态
                                      // 🆕 获取当前进度用于新任务
                                      const cp = courseInfo[qcTabSubject as keyof typeof courseInfo] as { unit: string; lesson?: string } | undefined;
                                      setQcStudents(prev => prev.map(s => {
                                        if (s.id !== selectedStudentId) return s;
                                        return {
                                          ...s,
                                          tasks: [...s.tasks, {
                                            id: newRecord.id,
                                            recordId: newRecord.id,
                                            name: itemName,
                                            type: 'QC',
                                            category: categoryMap[qcTabSubject],
                                            status: 'PENDING',
                                            exp: 5,
                                            attempts: 1,
                                            isAuto: false,
                                            // 🆕 保存当前进度的 unit/lesson，确保过滤能匹配
                                            unit: cp?.unit || '1',
                                            lesson: cp?.lesson || '1'
                                          }]
                                        };
                                      }));
                                    }
                                  } else {
                                    // 已有记录，直接增加 attempts
                                    recordAttempt(e, selectedStudentId, existingTask.id);
                                  }
                                }}
                                className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 active:scale-95 transition-all"
                              >
                                补
                              </button>
                              {/* Xn 显示在补按钮右边 */}
                              {existingTask && existingTask.attempts > 0 && (
                                <span className="text-[10px] text-orange-600 font-black bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100 italic ml-1">X{existingTask.attempts}</span>
                              )}
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ml-2 ${isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>+5</span>
                            </div>
                          );
                        });
                      })()}
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
                        // 🆕 核心教学法按日期更新（每天自动清理），不需要按课程进度过滤
                        const tasks = (student?.tasks || []).filter(t =>
                        (
                          (t.type === 'TASK' && t.id.startsWith('temp-methodology-')) ||
                          t.category === '核心教学法' ||
                          t.educationalDomain === '核心教学法'
                        )
                        );
                        if (tasks.length === 0) return <div className="py-6 text-center text-slate-300 text-xs">暂无发布任务</div>;
                        return tasks.map(task => {
                          const isDone = task.status === 'COMPLETED' || task.status === 'PASSED';
                          return (
                            <div key={task.id} className="flex items-center px-3 py-3 rounded-xl transition-colors">
                              {/* 勾选区：点击切换完成/未完成 */}
                              <div
                                onClick={() => toggleTaskComplete(selectedStudentId, task.id)}
                                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all cursor-pointer ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>
                              {/* 文字区：未勾选时点击退回抽屉 */}
                              <div
                                onClick={() => { if (!isDone) deleteTask(selectedStudentId, task.id); }}
                                className={`flex-1 ${!isDone ? 'cursor-pointer hover:text-red-400' : ''}`}
                              >
                                <span className={`text-sm font-medium transition-colors ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.name}</span>
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>+{task.exp}</span>
                            </div>
                          );
                        });
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
                        // 🔧 修复：显示所有相关任务，包括已完成的（用于支持多次辅导记录）
                        const tasks = (student?.tasks || []).filter(t =>
                        (
                          (t.type === 'TASK' && t.id.startsWith('temp-growth-')) ||
                          t.category === '综合成长' ||
                          t.educationalDomain === '综合成长'
                        )
                        );
                        if (tasks.length === 0) return <div className="py-6 text-center text-slate-300 text-xs">暂无成长任务</div>;
                        return tasks.map(task => {
                          const isDone = task.status === 'COMPLETED' || task.status === 'PASSED';
                          return (
                            <div key={task.id} className="flex items-center px-3 py-3 rounded-xl transition-colors">
                              {/* 勾选区：点击切换完成/未完成 */}
                              <div
                                onClick={() => toggleTaskComplete(selectedStudentId, task.id)}
                                className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all cursor-pointer ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}
                              >
                                {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>
                              {/* 文字区：未勾选时点击退回抽屉 */}
                              <div
                                onClick={() => { if (!isDone) deleteTask(selectedStudentId, task.id); }}
                                className={`flex-1 ${!isDone ? 'cursor-pointer hover:text-red-400' : ''}`}
                              >
                                <span className={`text-sm font-medium transition-colors ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.name}</span>
                              </div>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>+{task.exp}</span>
                            </div>
                          );
                        });
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
                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${task.status === 'PASSED' || task.status === 'COMPLETED' ? 'bg-amber-500 border-emerald-500' : 'border-amber-300'}`}>
                              {(task.status === 'PASSED' || task.status === 'COMPLETED') && <Check size={12} className="text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${task.status === 'PASSED' || task.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.name}</span>
                              </div>
                              <span className="block text-[10px] text-amber-600 mt-0.5">指定: {getSelectedStudent()?.name}</span>
                            </div>
                            <span className="text-xs font-bold bg-white/50 text-amber-600 px-2 py-0.5 rounded-lg">+{task.exp}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </section>

                  {/* 🆕 阅读培养区 - 在定制加餐之后 */}
                  {selectedStudentId && (
                    <ReadingSection
                      studentId={selectedStudentId}
                      studentName={getSelectedStudent()?.name || ''}
                    />
                  )}

                </main>

                {/* 3. 底部结算栏 - 调整位置避免被导航栏遮挡 */}
                <footer className="absolute bottom-16 left-0 right-0 px-5 pt-2 pb-2 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] flex justify-between items-center z-50">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-extrabold text-slate-900 tabular-nums">{calculateSelectedStudentExp().exp}</div>
                      <span className="text-sm font-semibold text-slate-400">经验</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium">共 {calculateSelectedStudentExp().count} 项任务已完成 (含语/数/外/加餐)</div>
                  </div>
                  <button
                    onClick={settleToday}
                    className="bg-slate-900 text-white px-6 h-9 rounded-full text-base font-semibold shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
                  >
                    结算
                  </button>
                </footer>

              </div>
            </>
          )
        }

        {/* === 抽屉 2: CMS 任务库 (CMS Drawer) - V1原版样式 === */}
        {
          isCMSDrawerOpen && selectedStudentId && (
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
                          <div className="text-[11px] font-bold text-amber-500 mt-0.5">+{t.exp} 经验</div>
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
                          const taskItem = customTaskLibrary.find(t => t.name === item && t.educationalSubcategory === cat.name);
                          const selectedStudent = getSelectedStudent();
                          const isAdded = selectedStudent?.tasks.some(t =>
                            t.status === 'PENDING' &&
                            t.name === item &&
                            (t.educationalDomain === 'METHODOLOGY' || t.category === '核心教学法')
                          );
                          return (
                            <div key={itemIdx} className="relative group">
                              <div
                                onClick={async () => {
                                  if (selectedStudentId) {
                                    if (isAdded) {
                                      setQcStudents(prev => prev.map(s =>
                                        s.id === selectedStudentId
                                          ? { ...s, tasks: s.tasks.filter(t => !(t.name === item && (t.id.startsWith('temp-') || t.type === 'TASK'))) }
                                          : s
                                      ));
                                    } else {
                                      try {
                                        const response = await apiService.records.create({
                                          studentId: selectedStudentId,
                                          title: item,
                                          category: '核心教学法',
                                          subcategory: cat.name,
                                          exp: 5,
                                          type: 'TASK'
                                        });

                                        if (response.success) {
                                          const serverRecord = response.data;
                                          const newTask: Task = {
                                            id: serverRecord.id,
                                            recordId: serverRecord.id,
                                            name: serverRecord.title,
                                            type: 'TASK',
                                            status: 'PENDING',
                                            exp: serverRecord.expAwarded || 5,
                                            attempts: 0,
                                            category: '核心教学法',
                                            educationalDomain: 'METHODOLOGY'
                                          };
                                          setQcStudents(prev => prev.map(s =>
                                            s.id === selectedStudentId ? { ...s, tasks: [...s.tasks, newTask] } : s
                                          ));
                                          toast.success('已添加');
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }
                                  }
                                }}
                                className={`p-4 rounded-xl border transition-all active:scale-[0.98] flex items-center justify-between ${isAdded
                                  ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200'
                                  : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                                  }`}
                              >
                                <span className="text-sm font-bold">{item}</span>
                                {isAdded ? <CheckCircle2 size={16} /> : <Plus size={16} className="text-slate-300" />}
                              </div>
                              {user?.role === 'ADMIN' && taskItem && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteLibraryItem(taskItem.id); }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-sm z-20"
                                >
                                  <span className="text-[10px]">×</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {user?.role === 'ADMIN' && (
                        <div
                          onClick={() => {
                            const val = window.prompt(`在【${cat.name}】下新增“核心教学法”项目:`);
                            if (val) addLibraryItem('METHODOLOGY', cat.name, val);
                          }}
                          className="mt-2 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <Plus size={14} /> 新增
                        </div>
                      )}
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
                          const taskItem = customTaskLibrary.find(t => t.name === item && t.educationalSubcategory === cat.name);
                          const selectedStudent = getSelectedStudent();
                          const isAdded = selectedStudent?.tasks.some(t =>
                            t.status === 'PENDING' &&
                            t.name === item &&
                            (t.educationalDomain === 'GROWTH' || t.educationalDomain === 'HABIT' || t.category === '综合成长')
                          );
                          return (
                            <div key={itemIdx} className="relative group">
                              <div
                                onClick={async () => {
                                  if (selectedStudentId) {
                                    if (isAdded) {
                                      setQcStudents(prev => prev.map(s =>
                                        s.id === selectedStudentId
                                          ? { ...s, tasks: s.tasks.filter(t => !(t.name === item && (t.id.startsWith('temp-') || t.type === 'TASK'))) }
                                          : s
                                      ));
                                    } else {
                                      try {
                                        const response = await apiService.records.create({
                                          studentId: selectedStudentId,
                                          title: item,
                                          category: '综合成长',
                                          subcategory: cat.name,
                                          exp: 5,
                                          type: 'TASK'
                                        });

                                        if (response.success) {
                                          const serverRecord = response.data;
                                          const newTask: Task = {
                                            id: serverRecord.id,
                                            recordId: serverRecord.id,
                                            name: serverRecord.title,
                                            type: 'TASK',
                                            status: 'PENDING',
                                            exp: serverRecord.expAwarded || 5,
                                            attempts: 0,
                                            category: '综合成长',
                                            educationalDomain: 'GROWTH'
                                          };
                                          setQcStudents(prev => prev.map(s =>
                                            s.id === selectedStudentId ? { ...s, tasks: [...s.tasks, newTask] } : s
                                          ));
                                          toast.success('已添加');
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }
                                  }
                                }}
                                className={`p-4 rounded-xl border transition-all active:scale-[0.98] flex items-center justify-between ${isAdded
                                  ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-100'
                                  : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                                  }`}
                              >
                                <span className="text-sm font-bold">{item}</span>
                                {isAdded ? <CheckCircle2 size={16} /> : <Plus size={16} className="text-slate-300" />}
                              </div>
                              {user?.role === 'ADMIN' && taskItem && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteLibraryItem(taskItem.id); }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-sm z-20"
                                >
                                  <span className="text-[10px]">×</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {user?.role === 'ADMIN' && (
                        <div
                          onClick={() => {
                            const val = window.prompt(`在【${cat.name}】下新增“综合成长”项目:`);
                            if (val) addLibraryItem('GROWTH', cat.name, val);
                          }}
                          className="mt-2 p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <Plus size={14} /> 新增
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )
        }


        {/* 🆕 基础过关项管理抽屉 */}
        {isBasicQCDrawerOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end pointer-events-none">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={() => setIsBasicQCDrawerOpen(false)} />
            <div className="bg-white w-full rounded-t-3xl shadow-2xl safe-pb pointer-events-auto transform transition-transform duration-300 flex flex-col max-h-[85vh]">
              {/* 抽屉把手 */}
              <div className="flex justify-center pt-3 pb-1 cursor-pointer" onClick={() => setIsBasicQCDrawerOpen(false)}>
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              {/* 抽屉头部 */}
              <div className="px-6 pb-4 flex justify-between items-center border-b border-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {qcTabSubject === 'chinese' ? '语文' : qcTabSubject === 'math' ? '数学' : '英语'}基础过关库
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">点按添加/移除今日必达项</p>
                </div>

                {/* 自定义添加输入框 */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="新自定义项..."
                    className="w-32 h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-indigo-500 transition-all"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        const val = input.value.trim();
                        if (val) {
                          const categoryMap = { chinese: '语文基础过关', math: '数学基础过关', english: '英语基础过关' };
                          const subcategory = categoryMap[qcTabSubject as keyof typeof categoryMap];
                          await addLibraryItem('PROGRESS', subcategory, val);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* 抽屉内容：列表 */}
              <div className="p-6 overflow-y-auto min-h-[40vh]">
                <div className="grid grid-cols-2 gap-3">
                  {/* 1. 系统默认项 */}
                  {SUBJECT_DEFAULT_QC[qcTabSubject].map(item => (
                    <div
                      key={item}
                      onClick={() => toggleActiveQCItem(item)}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${activeBasicQCItems.includes(item)
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-100 bg-white hover:border-slate-200'
                        }`}
                    >
                      <span className={`font-medium ${activeBasicQCItems.includes(item) ? 'text-indigo-700' : 'text-slate-600'}`}>{item}</span>
                      {activeBasicQCItems.includes(item) && <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
                    </div>
                  ))}

                  {/* 2. 自定义项 */}
                  {customTaskLibrary
                    .filter(t => t.category === (qcTabSubject === 'chinese' ? '语文基础过关' : qcTabSubject === 'math' ? '数学基础过关' : '英语基础过关') && t.isActive)
                    .map(t => (
                      <div
                        key={t.id}
                        onClick={() => toggleActiveQCItem(t.name)}
                        className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between group ${activeBasicQCItems.includes(t.name)
                          ? 'border-purple-500 bg-purple-50/50'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className={`font-medium ${activeBasicQCItems.includes(t.name) ? 'text-purple-700' : 'text-slate-600'}`}>{t.name}</span>
                          <span className="text-[10px] text-purple-400 bg-purple-50 self-start px-1 rounded mt-1">自定义</span>
                        </div>

                        {/* 删除按钮 (只在自定义项显示) */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLibraryItem(t.id); }}
                          className="absolute -top-2 -right-2 bg-slate-200 text-slate-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 轻量化 Toast 通知 */}
        {toastMsg && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
            <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-sm font-bold tracking-tight">{toastMsg}</span>
            </div>
          </div>
        )}

      </div >
    </ProtectedRoute >
  );
};

export default QCView;
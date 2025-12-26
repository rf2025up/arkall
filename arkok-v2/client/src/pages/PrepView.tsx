import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  BookOpen,
  CheckCircle2,
  Layers,
  Sparkles,
  Plus,
  X,
  Trash2,
  UserPlus,
  ListPlus,
  Check,
  AlertCircle,
  Loader,
  Send,
  ChevronDown,
  ChevronRight,
  Settings2,
  PlusSquare,
  Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import apiService from '../services/api.service';
import PersonalizedTutoringSection from '../components/PersonalizedTutoringSection';
import MessageCenter from '../components/MessageCenter';

// --- 1. 类型定义 ---

interface LessonInput {
  unit: string;
  lesson?: string; // 英语可能没有课时
  title: string;
}

interface CourseInfo {
  chinese: LessonInput;
  math: LessonInput;
  english: LessonInput;
  grade?: string;
  semester?: string;
}

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

// 学科映射配置
const SUBJECT_CATEGORY_MAP: Record<string, string> = {
  '语文过关': 'chinese',
  '数学过关': 'math',
  '英语过关': 'english'
};

interface SpecialTaskItem {
  id: number;
  students: string[];
  tasks: string[];
}

interface PublishStatus {
  isPublishing: boolean;
  error: string | null;
  success: boolean;
}

// --- 2. QC配置 ---
const QC_CONFIG: Record<string, any> = {
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

const PrepView: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { currentClass, viewMode, selectedTeacherId, managedTeacherName, isProxyMode } = useClass(); // 🆕 获取完整视图状态，包含代理模式标志

  // --- 3. 数据获取 ---
  const [taskLibrary, setTaskLibrary] = useState<TaskLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // --- 4. 状态管理 ---

  // 发布状态
  const [publishStatus, setPublishStatus] = useState<PublishStatus>({
    isPublishing: false,
    error: null,
    success: false
  });

  // 🆕 最新教学计划响应类型
  interface LatestLessonPlanResponse {
    id: string | null;
    date: string | null;
    content: any;
    courseInfo: CourseInfo;
    updatedAt: string;
  }

  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    chinese: { unit: "1", lesson: "1", title: "加载中..." },
    math: { unit: "1", lesson: "1", title: "加载中..." },
    english: { unit: "1", title: "Loading..." },
    grade: localStorage.getItem('arkok_default_grade') || "二年级",
    semester: localStorage.getItem('arkok_default_semester') || "上册"
  });

  const [syllabuses, setSyllabuses] = useState<Record<string, any[]>>({}); // 🆕 缓存各科大纲

  // 🆕 自动预加载大纲
  useEffect(() => {
    const grade = getNormGrade(courseInfo.grade);
    const sem = getNormSemester(courseInfo.semester);
    ['chinese', 'math', 'english'].forEach(sub => {
      // 根据学科自动选择教材版本：语文、数学为人教版(PEP)，英语为湘少版
      const version = sub === 'english' ? '湘少版' : '人教版';
      fetchSyllabus(sub, grade, sem, version);
    });


  }, [courseInfo.grade, courseInfo.semester]);

  // 1. 核心双基 (Basics) - 大类名称可修改
  const [basicsConfig, setBasicsConfig] = useState({
    title: '核心双基',
    subjects: {
      chinese: { label: '语文', items: ['生字词听写', '课文朗读', '古诗/日积月累', '课后习题把关'] },
      math: { label: '数学', items: ['口算计时', '竖式计算', '公式背默', '应用题逻辑'] },
      english: { label: '英语', items: ['单词听写', '课文朗读', '句型过关', '听力练习'] }
    }
  });

  // 2. 习惯把关 (Habits) - 状态与标题全动态
  const [habitsConfig, setHabitsConfig] = useState({
    title: '习惯养成',
    categories: [
      { name: '作业习惯', items: ['作业自主检查', '错题红笔订正', '书写工整', '坐姿端正'] },
      { name: '效能管理', items: ['限时挑战', '桌面整洁', '离校整理', '时间规划'] }
    ]
  });

  // 3. 能力训练 (Abilities)
  const [abilitiesConfig, setAbilitiesConfig] = useState({
    title: '能力训练',
    categories: [
      { name: '认知训练', items: ['专注力训练', '逻辑推理', '信息提取', '关键标注'] },
      { name: '综合素质', items: ['阅读表达', '古文积累', '口头背诵'] }
    ]
  });

  // 4. 定制任务与加餐
  const [specialTasks, setSpecialTasks] = useState<SpecialTaskItem[]>([]);
  const [specialHistory, setSpecialHistory] = useState<string[]>(["罚抄错题", "朗读课文", "背诵古诗", "整理错题本"]);

  // 选项状态 (多项选择)
  const [selectedBasics, setSelectedBasics] = useState<Record<string, string[]>>({ chinese: [], math: [], english: [] });
  const [selectedHabits, setSelectedHabits] = useState<Record<string, string[]>>({});
  const [selectedAbilities, setSelectedAbilities] = useState<Record<string, string[]>>({});
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // 5. UI 状态
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);
  const [activeSupervisionTab, setActiveSupervisionTab] = useState<'habits' | 'abilities'>('habits');
  const [isManageMode, setIsManageMode] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [newItemInput, setNewItemInput] = useState<{ category: string; value: string } | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // 模态框临时状态
  const [tempSpecialStudents, setTempSpecialStudents] = useState<string[]>([]);
  const [tempSpecialTags, setTempSpecialTags] = useState<string[]>([]);
  const [specialInput, setSpecialInput] = useState("");

  // 日期格式化
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 · 星期${['日', '一', '二', '三', '四', '五', '六'][today.getDay()]}`;

  // --- 5. 数据获取 useEffect ---

  // 获取最新教学计划数据
  const fetchLatestLessonPlan = async () => {
    if (!token) {
      console.error('🔍 [PREP_VIEW] 获取最新教学计划失败：未找到认证token');
      return;
    }

    console.log('🔍 [PREP_VIEW] 开始获取最新教学计划...');
    setIsLoading(true);

    try {
      const response = await apiService.get('/lms/latest-lesson-plan');

      console.log('📊 [PREP_VIEW] 最新教学计划API响应:', {
        success: response.success,
        hasData: !!response.data
      });

      if (response.success && response.data) {
        const responseData = response.data as LatestLessonPlanResponse;
        const courseInfo = responseData.courseInfo;
        const content = responseData.content;

        console.log('✅ [PREP_VIEW] 获取到最新教学计划:', responseData);

        // 1. 回填课程进度
        setCourseInfo({
          chinese: courseInfo?.chinese || { unit: "1", lesson: "1", title: "默认课程" },
          math: courseInfo?.math || { unit: "1", lesson: "1", title: "默认课程" },
          english: courseInfo?.english || { unit: "1", title: "Default Course" }
        });

        // 2. 回填选中的 QC 项
        if (content?.qcTasks && Array.isArray(content.qcTasks)) {
          const newSelectedBasics: Record<string, string[]> = {
            chinese: [],
            math: [],
            english: []
          };

          content.qcTasks.forEach((task: any) => {
            const taskName = task.taskName;
            // 根据后端存储的 category 映射回前端的学科 key
            if (task.category === '语文把关' || task.category === '核心双基-语文') newSelectedBasics.chinese.push(taskName);
            else if (task.category === '数学把关' || task.category === '核心双基-数学') newSelectedBasics.math.push(taskName);
            else if (task.category === '英语把关' || task.category === '核心双基-英语') newSelectedBasics.english.push(taskName);
          });

          console.log('🎯 [PREP_VIEW] 回填选中的基础把关项:', newSelectedBasics);
          setSelectedBasics(newSelectedBasics);
        }

        // 3. 回填普通任务
        if (content?.normalTasks && Array.isArray(content.normalTasks)) {
          const newSelectedTasks = content.normalTasks.map((t: any) => t.taskName);
          console.log('🎯 [PREP_VIEW] 回填普通任务:', newSelectedTasks);
          setSelectedTasks(newSelectedTasks);
        }

        // 4. 回填定制加餐
        if (content?.specialTasks && Array.isArray(content.specialTasks)) {
          const newSpecialTasks = content.specialTasks.map((t: any, index: number) => ({
            id: Date.now() + index,
            students: t.description?.replace('学生: ', '').split(', ') || [],
            tasks: t.taskName.split(' + ')
          }));
          console.log('🎯 [PREP_VIEW] 回填定制加餐:', newSpecialTasks);
          setSpecialTasks(newSpecialTasks);
        }

        console.log('🎯 [PREP_VIEW] 表单状态已完整回填');
      } else {
        console.log('📝 [PREP_VIEW] 未找到教学计划，使用默认课程信息');
      }
    } catch (error) {
      console.error('❌ [PREP_VIEW] 获取最新教学计划失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 从TaskLibrary生成QC项目
  const generateQCItemsFromLibrary = (tasks: TaskLibraryItem[]) => {
    const qcTasks = tasks.filter(task => task.type === 'QC');

    // 从默认值开始，确保总有基础标签
    const defaultQcItems: Record<string, string[]> = {
      chinese: ['生字听写', '课文背诵', '古诗/日积月累默写', '课文理解问答'],
      math: ['口算计时', '竖式/脱式', '概念/公式背默'],
      english: ['单词默写', '中英互译', '句型背诵', '课文背诵']
    };

    const newQcItems: Record<string, string[]> = {
      chinese: [...defaultQcItems.chinese],
      math: [...defaultQcItems.math],
      english: [...defaultQcItems.english]
    };
    // 更新 basicsConfig 中的项目，但不覆盖默认值
    const updatedSubjects = { ...basicsConfig.subjects };
    qcTasks.forEach(task => {
      const subjectKey = SUBJECT_CATEGORY_MAP[task.category] as keyof typeof updatedSubjects;
      if (subjectKey && updatedSubjects[subjectKey]) {
        if (!updatedSubjects[subjectKey].items.includes(task.name)) {
          updatedSubjects[subjectKey].items.push(task.name);
        }
      }
    });

    setBasicsConfig(prev => ({ ...prev, subjects: updatedSubjects }));

    // 默认选择每个学科的前两个项目
    const newSelectedBasics: Record<string, string[]> = { chinese: [], math: [], english: [] };
    Object.keys(updatedSubjects).forEach(subject => {
      const items = updatedSubjects[subject as keyof typeof updatedSubjects].items;
      if (items.length > 0) {
        newSelectedBasics[subject] = items.slice(0, 2);
      }
    });

    console.log('🎯 [PREP_VIEW] 基础把关项生成完成:', updatedSubjects);
    setSelectedBasics(newSelectedBasics);
  };

  // 获取任务库
  const fetchTaskLibrary = async () => {
    if (!token) {
      console.error('🔍 [PREP_VIEW] 获取任务库失败：未找到认证token');
      return;
    }

    console.log('🔍 [PREP_VIEW] 开始获取任务库...');
    setIsLoading(true);
    setError(null);

    try {
      // 直接调用正式API
      console.log('📡 [PREP_VIEW] 正在调用任务库API: /lms/task-library');
      const response = await apiService.get('/lms/task-library');

      console.log('📊 [PREP_VIEW] API响应:', { success: response.success, dataLength: Array.isArray(response.data) ? response.data.length : 0, message: response.message });

      if (response.success && response.data) {
        const tasks = response.data as TaskLibraryItem[];
        console.log('✅ [PREP_VIEW] 任务库获取成功，任务数量:', tasks.length);
        console.log('📋 [PREP_VIEW] 任务列表预览:', tasks.map(t => ({ name: t.name, category: t.category, exp: t.defaultExp })));

        // 🆕 核心教学法分类 - 基于教学白皮书的9大维度
        const methodologyCategories = [
          '基础学习方法论',
          '数学思维与解题策略',
          '语文学科能力深化',
          '英语应用与输出',
          '阅读深度与分享',
          '自主学习与规划',
          '课堂互动与深度参与',
          '家庭联结与知识迁移',
          '高阶输出与创新'
        ];

        console.log('📊 [PREP_VIEW] 实际任务分类:', [...new Set(tasks.map(t => t.category))]);

        // 核心教学法任务 - 使用educationalDomain字段（教育体系分类）
        const methodologyTasks = tasks.filter(task =>
          task.educationalDomain === '核心教学法'
        );

        // 综合成长任务 - 使用educationalDomain字段（教育体系分类）
        const growthTasks = tasks.filter(task => task.educationalDomain === '综合成长');

        // 基础作业/过关任务 - 使用educationalDomain字段（教育体系分类）
        const basicTasks = tasks.filter(task => task.educationalDomain === '基础作业');

        console.log(`🎯 [PREP_VIEW] 核心教学法任务数量: ${methodologyTasks.length}/${tasks.length}`);
        console.log(`🌱 [PREP_VIEW] 综合成长任务数量: ${growthTasks.length}/${tasks.length}`);
        console.log(`📚 [PREP_VIEW] 基础作业任务数量: ${basicTasks.length}/${tasks.length}`);

        setTaskLibrary(tasks);

        // 生成QC项目
        generateQCItemsFromLibrary(tasks);
      } else {
        console.warn('⚠️ [PREP_VIEW] 获取任务库失败，使用默认QC项目:', response.message);
        setError(response.message || '获取任务库失败');
        // 即使API失败，也生成默认QC项目
        generateQCItemsFromLibrary([]);
      }
    } catch (err) {
      console.warn('⚠️ [PREP_VIEW] 获取任务库异常，使用默认QC项目:', err);
      setError('网络错误，获取任务库失败');
      // 即使异常，也生成默认QC项目
      generateQCItemsFromLibrary([]);
    } finally {
      setIsLoading(false);
      console.log('🏁 [PREP_VIEW] 任务库获取流程结束');
    }
  };

  // 获取学生列表和班级信息
  const fetchStudents = async () => {
    if (!token) return;

    try {
      // 🔒 备课页安全锁定：始终只显示当前老师的学生，不允许全校视图
      // 因为个性化任务是针对本班学生的教学活动，不应该涉及全校学生或抢人功能
      const url = `/students?scope=MY_STUDENTS&teacherId=${user?.id || ''}`;
      console.log('🔒 [PREPVIEW_SECURITY] 备课页只显示本班学生，URL:', url);
      const response = await apiService.get(url);

      if (response.success && response.data) {
        // 🔴 修复：与 QCView/Home 保持一致的数据提取逻辑
        let studentsData: any[] = [];
        const data = response.data as any;

        if (Array.isArray(data)) {
          studentsData = data;
        } else if (data.students && Array.isArray(data.students)) {
          studentsData = data.students;
        } else if (data.data && Array.isArray(data.data)) {
          studentsData = data.data;
        }

        console.log('[PREPVIEW] 学生数据响应:', response.success ? `成功，${studentsData.length}名学生` : '失败');

        if (studentsData.length === 0) {
          console.warn('[PREPVIEW] 未获取到学生数据，可能是数据格式问题');
          return;
        }

        setStudents(studentsData);

        // 提取班级信息
        const uniqueClasses = Array.from(new Set(studentsData.map((s: any) => s.className).filter(Boolean)));
        setClasses(uniqueClasses);

        // 如果没有选中班级，默认选择第一个班级
        if (!selectedClass && uniqueClasses.length > 0) {
          const firstClass = uniqueClasses[0];
          setSelectedClass(firstClass);
          // 从localStorage中恢复之前的选择
          const savedClass = localStorage.getItem('teacherClass');
          if (savedClass && uniqueClasses.includes(savedClass)) {
            setSelectedClass(savedClass);
          }
        }

        // 根据选中的班级筛选学生
        if (selectedClass) {
          const classStudents = studentsData.filter((s: any) => s.className === selectedClass);
          setSelectedStudents(classStudents.map((s: any) => s.name));
        }
      }
    } catch (err) {
      console.error('获取学生列表失败:', err);
    }
  };

  useEffect(() => {
    fetchLatestLessonPlan(); // 🆕 加载最新教学计划数据
    fetchTaskLibrary();
    fetchStudents();
  }, [token, currentClass]); // 备课页不需要依赖视图模式，始终只显示本班学生

  // --- 6. 交互逻辑 ---

  // --- 6. 交互逻辑 ---

  // 🆕 学段转换工具 (与 QCView 保持一致)
  const GRADE_MAP: Record<string, string> = {
    '一年级': '1', '二年级': '2', '三年级': '3', '四年级': '4', '五年级': '5', '六年级': '6'
  };
  const getNormGrade = (g?: string) => GRADE_MAP[g || ''] || g || '2';
  const getNormSemester = (s?: string) => s?.includes('下') ? '下' : '上';

  // 🚀 获取大纲数据 (用于自动标题填充)
  const fetchSyllabus = async (subject: string, grade: string = "1", semester: string = "上", version: string = "人教版") => {
    const key = `${subject}_${grade}_${semester}`;
    if (syllabuses[key]) return syllabuses[key];

    try {
      const response = await apiService.get('/records/curriculum/syllabus', { subject, grade, semester, version });
      if (response.success && Array.isArray(response.data)) {
        setSyllabuses(prev => ({ ...prev, [key]: response.data as any[] }));
        return response.data;
      }
    } catch (error) {
      console.error('[PrepView] 获取大纲失败:', error);
    }
    return [];
  };

  // 🚀 智能进度变更逻辑
  const handleCourseChange = async (sub: keyof CourseInfo, field: string, val: string) => {
    // 1. 同步本地状态
    if (sub === 'grade' || sub === 'semester') {
      setCourseInfo(prev => ({ ...prev, [sub]: val }));
      return;
    }

    const currentSubInfo = courseInfo[sub] as LessonInput;
    const newInfo = { ...currentSubInfo, [field]: val };
    setCourseInfo(prev => ({ ...prev, [sub]: newInfo }));

    // 2. 如果修改的是 Unit 或 Lesson，尝试自动填充标题
    if (field === 'unit' || field === 'lesson') {
      const syllabus = await fetchSyllabus(sub, getNormGrade(courseInfo.grade), getNormSemester(courseInfo.semester));
      if (syllabus && syllabus.length > 0) {
        const match = syllabus.find((item: any) => {
          const itemUnit = item.unit?.toString();
          const itemLesson = item.lesson?.toString();
          const targetUnit = field === 'unit' ? val : newInfo.unit;
          const targetLesson = field === 'lesson' ? val : (newInfo.lesson || "1");

          if (field === 'unit') {
            return itemUnit === targetUnit && (!itemLesson || itemLesson === "1");
          } else {
            return itemUnit === targetUnit && itemLesson === targetLesson;
          }
        });

        if (match) {
          setCourseInfo(prev => ({
            ...prev,
            [sub]: { ...prev[sub], title: match.title }
          }));
        }
      }
    }
  };

  // 1. 核心双基 (Basics) 切换
  const toggleBasics = (sub: string, item: string) => {
    setSelectedBasics(prev => {
      const list = prev[sub] || [];
      return {
        ...prev,
        [sub]: list.includes(item) ? list.filter(i => i !== item) : [...list, item]
      };
    });
  };

  // 2. 习惯把关切换
  const toggleHabits = (category: string, item: string) => {
    setSelectedHabits(prev => {
      const list = prev[category] || [];
      return {
        ...prev,
        [category]: list.includes(item) ? list.filter(i => i !== item) : [...list, item]
      };
    });
  };

  // 3. 能力训练切换
  const toggleAbilities = (category: string, item: string) => {
    setSelectedAbilities(prev => {
      const list = prev[category] || [];
      return {
        ...prev,
        [category]: list.includes(item) ? list.filter(i => i !== item) : [...list, item]
      };
    });
  };

  // 4. 过程把关 (Habits & Abilities) 切换
  const toggleTask = (taskName: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskName) ? prev.filter(t => t !== taskName) : [...prev, taskName]
    );
  };

  // 5. 删除标签功能
  const deleteBasicItem = (sub: string, item: string) => {
    if (!window.confirm(`确定删除"${item}"？`)) return;
    setBasicsConfig(prev => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [sub]: {
          ...(prev.subjects as any)[sub],
          items: (prev.subjects as any)[sub].items.filter((i: string) => i !== item)
        }
      }
    }));
    // 同时从选中列表移除
    setSelectedBasics(prev => ({
      ...prev,
      [sub]: (prev[sub] || []).filter(i => i !== item)
    }));
  };

  const deleteHabitItem = (catName: string, item: string) => {
    if (!window.confirm(`确定删除"${item}"？`)) return;
    setHabitsConfig(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.name === catName
          ? { ...cat, items: cat.items.filter(i => i !== item) }
          : cat
      )
    }));
    setSelectedHabits(prev => ({
      ...prev,
      [catName]: (prev[catName] || []).filter(i => i !== item)
    }));
  };

  const deleteAbilityItem = (catName: string, item: string) => {
    if (!window.confirm(`确定删除"${item}"？`)) return;
    setAbilitiesConfig(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.name === catName
          ? { ...cat, items: cat.items.filter(i => i !== item) }
          : cat
      )
    }));
    setSelectedAbilities(prev => ({
      ...prev,
      [catName]: (prev[catName] || []).filter(i => i !== item)
    }));
  };

  // 6. 新增标签功能
  const addBasicItem = (sub: string) => {
    const name = prompt('输入新标签名称:');
    if (!name?.trim()) return;
    setBasicsConfig(prev => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [sub]: {
          ...(prev.subjects as any)[sub],
          items: [...(prev.subjects as any)[sub].items, name.trim()]
        }
      }
    }));
  };

  const addHabitItem = (catName: string) => {
    const name = prompt('输入新标签名称:');
    if (!name?.trim()) return;
    setHabitsConfig(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.name === catName
          ? { ...cat, items: [...cat.items, name.trim()] }
          : cat
      )
    }));
  };

  const addAbilityItem = (catName: string) => {
    const name = prompt('输入新标签名称:');
    if (!name?.trim()) return;
    setAbilitiesConfig(prev => ({
      ...prev,
      categories: prev.categories.map(cat =>
        cat.name === catName
          ? { ...cat, items: [...cat.items, name.trim()] }
          : cat
      )
    }));
  };

  // 打开习惯把关库
  const addHabitSupervision = () => {
    setActiveSupervisionTab('habits');
    setIsTaskModalOpen(true);
  };

  // 打开能力训练库
  const addAbilitySupervision = () => {
    setActiveSupervisionTab('abilities');
    setIsTaskModalOpen(true);
  };

  // 定制加餐逻辑
  const toggleSpecialStudent = (stu: string) => {
    setTempSpecialStudents(prev => prev.includes(stu) ? prev.filter(s => s !== stu) : [...prev, stu]);
  };

  const toggleSpecialTag = (tag: string) => {
    setTempSpecialTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const addSpecialTask = () => {
    let finalTasks = [...tempSpecialTags];
    if (specialInput.trim()) {
      finalTasks.push(specialInput.trim());
      if (!specialHistory.includes(specialInput.trim())) {
        setSpecialHistory(prev => [specialInput.trim(), ...prev].slice(0, 8));
      }
    }

    if (tempSpecialStudents.length === 0 || finalTasks.length === 0) {
      alert("请选择至少一名学生和一个任务");
      return;
    }

    setSpecialTasks(prev => [
      ...prev,
      { id: Date.now(), students: [...tempSpecialStudents], tasks: finalTasks }
    ]);
    setIsSpecialModalOpen(false);
    setTempSpecialStudents([]);
    setTempSpecialTags([]);
    setSpecialInput("");
  };

  const removeSpecialTask = (id: number) => {
    setSpecialTasks(prev => prev.filter(t => t.id !== id));
  };

  const isPublishingAllowed = () => {
    return viewMode === 'MY_STUDENTS' || viewMode === 'SPECIFIC_CLASS';
  };

  // --- 🆕 可编程分类法 (Programmable Taxonomy) 管理逻辑 ---

  const getConfigByTab = () => activeSupervisionTab === 'habits' ? habitsConfig : abilitiesConfig;
  const setConfigByTab = (val: any) => activeSupervisionTab === 'habits' ? setHabitsConfig(val) : setAbilitiesConfig(val);

  // 修改分类名称
  const handleUpdateCategoryName = (catIdx: number, newName: string) => {
    if (!newName.trim()) return;
    const config = getConfigByTab();
    const newCats = [...config.categories];
    newCats[catIdx] = { ...newCats[catIdx], name: newName.trim() };
    setConfigByTab({ ...config, categories: newCats });
    setEditingCategoryName(null);
  };

  // 添加新项
  const handleAddItem = (catIdx: number, itemText: string) => {
    if (!itemText.trim()) return;
    const config = getConfigByTab();
    const newCats = [...config.categories];
    newCats[catIdx] = { ...newCats[catIdx], items: [...newCats[catIdx].items, itemText.trim()] };
    setConfigByTab({ ...config, categories: newCats });
    setNewItemInput(null);
  };

  // 删除项
  const handleDeleteItem = (catIdx: number, itemIdx: number) => {
    const config = getConfigByTab();
    const newCats = [...config.categories];
    newCats[catIdx] = {
      ...newCats[catIdx],
      items: newCats[catIdx].items.filter((_, i) => i !== itemIdx)
    };
    setConfigByTab({ ...config, categories: newCats });
  };

  // 添加新分类
  const handleAddCategory = (name: string) => {
    if (!name.trim()) return;
    const config = getConfigByTab();
    setConfigByTab({
      ...config,
      categories: [...config.categories, { name: name.trim(), items: [] }]
    });
    setNewCategoryInput('');
  };

  // 删除分类
  const handleDeleteCategory = (catIdx: number) => {
    if (!window.confirm("确定要删除整个分类吗？")) return;
    const config = getConfigByTab();
    setConfigByTab({
      ...config,
      categories: config.categories.filter((_, i) => i !== catIdx)
    });
  };

  const handlePublish = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!isPublishingAllowed()) {
      setPublishStatus({
        isPublishing: false,
        error: '当前视图不支持发布，请切换回【我的学生】或选择代管理的教师',
        success: false
      });
      return;
    }

    if (publishStatus.isPublishing || !token) return;

    setPublishStatus({ isPublishing: true, error: null, success: false });

    try {
      const qcTasks = Object.entries(selectedBasics).flatMap(([subject, items]) =>
        items.map(item => ({
          taskId: `basic_${subject}_${item}`,
          taskName: item,
          category: `${basicsConfig.title}-${(basicsConfig.subjects as any)[subject]?.label || subject}`,
          defaultExp: 5,
          difficulty: 1
        }))
      );

      const normalTasks = selectedTasks.map(taskName => {
        let domain = habitsConfig.title;
        let subcategory = '';

        for (const cat of habitsConfig.categories) {
          if (cat.items.includes(taskName)) {
            subcategory = cat.name;
            break;
          }
        }
        if (!subcategory) {
          for (const cat of abilitiesConfig.categories) {
            if (cat.items.includes(taskName)) {
              domain = abilitiesConfig.title;
              subcategory = cat.name;
              break;
            }
          }
        }

        return {
          taskName,
          category: domain,
          subcategory: subcategory || '其他',
          defaultExp: 10
        };
      });

      const specialTasksData = specialTasks.map(item => ({
        taskName: item.tasks.join(' + '),
        category: '特殊',
        defaultExp: 30,
        description: `学生: ${item.students.join(', ')}`,
        targetStudentNames: item.students
      }));

      const planData = {
        courseInfo: {
          title: `${dateStr} 备课计划`,
          ...courseInfo,
          grade: courseInfo.grade,
          semester: courseInfo.semester,
          date: today.toISOString()
        },
        qcTasks,
        normalTasks,
        specialTasks: specialTasksData,
        teacherId: viewMode === 'SPECIFIC_CLASS' ? selectedTeacherId : user?.id,
      };

      const result = await apiService.post('/lms/publish', planData);

      if (result.success) {
        setPublishStatus({ isPublishing: false, error: null, success: true });
        setTimeout(() => {
          alert(`备课计划发布成功！`);
          setPublishStatus(prev => ({ ...prev, success: false }));
        }, 500);
      } else {
        throw new Error(result.message || '发布失败');
      }
    } catch (error) {
      setPublishStatus({
        isPublishing: false,
        error: error instanceof Error ? error.message : '发布失败，请重试',
        success: false
      });
    }
  };



  // --- 7. 渲染界面 ---

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1E293B] pb-40 font-sans">
      {/* 头部区域 - 与过关页统一 */}
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
                今日备课
              </h1>
              <span className="text-[10px] font-bold text-white/50 tracking-wider">
                {dateStr}
              </span>
            </div>

            <div className="scale-90 active:scale-100 transition-transform">
              <MessageCenter variant="header" />
            </div>
          </div>

          {/* 第二行：班级标签 + 发布按钮 */}
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

            {/* 发布按钮 */}
            <button
              onClick={handlePublish}
              disabled={publishStatus.isPublishing}
              className={`px-4 py-1.5 rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5 ${publishStatus.isPublishing
                ? 'bg-white/50 text-orange-600 cursor-not-allowed'
                : 'bg-white text-orange-600 hover:bg-orange-50'
                }`}
            >
              <Send size={14} />
              {publishStatus.isPublishing ? '发布中...' : '发布'}
            </button>
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {(publishStatus.error || error) && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              {publishStatus.error || error}
            </p>
          </div>
        </div>
      )}

      {/* 成功提示 */}
      {publishStatus.success && (
        <div className="mx-5 mt-4 bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-500" />
          <p className="text-sm font-medium text-green-800">备课计划发布成功！</p>
        </div>
      )}

      <div className="px-5 space-y-6 mt-4">

        {/* 2. 过关项 (点选色块) */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] font-extrabold text-slate-400 mb-5 tracking-widest uppercase flex items-center gap-2">
            <CheckCircle2 size={14} /> 基础过关
            <span className="text-[9px] text-slate-300 font-normal ml-auto">长按删除</span>
          </div>

          <div className="space-y-6">
            {Object.keys(basicsConfig.subjects).map(sub => (
              <div key={sub}>
                <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${QC_CONFIG[sub].dotColor}`}></span>
                  {(basicsConfig.subjects as any)[sub].label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(basicsConfig.subjects as any)[sub].items.map((item: string) => {
                    const isSelected = selectedBasics[sub]?.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleBasics(sub, item)}
                        onContextMenu={(e) => { e.preventDefault(); deleteBasicItem(sub, item); }}
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSelected
                          ? QC_CONFIG[sub].activeClass
                          : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
                          }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                  {/* 新增按钮 */}
                  <button
                    onClick={() => addBasicItem(sub)}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 text-slate-400 border border-dashed border-slate-200 hover:bg-slate-100 hover:text-slate-600 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 习惯把关 (独立面板) */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] font-extrabold text-slate-400 mb-5 tracking-widest uppercase flex items-center gap-2">
            <Stethoscope size={14} /> 习惯把关
            <span className="text-[9px] text-slate-300 font-normal ml-auto">长按删除</span>
          </div>

          <div className="space-y-6">
            {habitsConfig.categories.map(cat => (
              <div key={cat.name}>
                <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                  {cat.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((item: string) => {
                    const isSelected = selectedHabits[cat.name]?.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleHabits(cat.name, item)}
                        onContextMenu={(e) => { e.preventDefault(); deleteHabitItem(cat.name, item); }}
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSelected
                          ? 'bg-orange-50 text-orange-600 border-orange-200'
                          : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
                          }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                  {/* 新增按钮 */}
                  <button
                    onClick={() => addHabitItem(cat.name)}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 text-slate-400 border border-dashed border-slate-200 hover:bg-slate-100 hover:text-slate-600 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 能力训练 (独立面板) */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] font-extrabold text-slate-400 mb-5 tracking-widest uppercase flex items-center gap-2">
            <Sparkles size={14} /> 能力训练
            <span className="text-[9px] text-slate-300 font-normal ml-auto">长按删除</span>
          </div>

          <div className="space-y-6">
            {abilitiesConfig.categories.map(cat => (
              <div key={cat.name}>
                <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  {cat.name}
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((item: string) => {
                    const isSelected = selectedAbilities[cat.name]?.includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleAbilities(cat.name, item)}
                        onContextMenu={(e) => { e.preventDefault(); deleteAbilityItem(cat.name, item); }}
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSelected
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
                          }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                  {/* 新增按钮 */}
                  <button
                    onClick={() => addAbilityItem(cat.name)}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 text-slate-400 border border-dashed border-slate-200 hover:bg-slate-100 hover:text-slate-600 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. 定制加餐 (底部光感) */}
        <div className="relative rounded-[24px] p-6 overflow-hidden text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7ED] via-[#FFF1F2] to-[#FFF7ED]"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur text-orange-500 flex items-center justify-center shadow-sm">
                  <Sparkles size={14} fill="currentColor" />
                </div>
                <span className="font-bold text-slate-800 text-sm">定制加餐</span>
              </div>
              <span className="text-[10px] text-orange-700 bg-white/60 backdrop-blur px-2 py-1 rounded-md font-bold shadow-sm">+30 EXP</span>
            </div>

            <div className="space-y-2 mb-5">
              {specialTasks.length === 0 ? (
                <div className="text-xs text-orange-800/40 text-center py-4 italic">暂无个性化任务</div>
              ) : (
                specialTasks.map(item => (
                  <div key={item.id} className="bg-white/60 backdrop-blur border border-white/50 p-3 rounded-2xl shadow-sm flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-slate-800 mb-1">{item.students.join(', ')}</div>
                      <div className="text-xs text-orange-600 font-bold flex items-center gap-1">
                        <Plus size={10} /> {item.tasks.join(' + ')}
                      </div>
                    </div>
                    <button onClick={() => removeSpecialTask(item.id)} className="text-slate-400 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setIsSpecialModalOpen(true)}
              className="w-full py-3 bg-white/80 backdrop-blur text-orange-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-sm active:scale-95"
            >
              <UserPlus size={14} /> 添加特定学生任务
            </button>
          </div>
        </div>

      </div>

      {/* === Modal 1: 任务勾选 === */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setIsTaskModalOpen(false)}></div>
          <div className="relative bg-[#F8FAFC] w-full h-[90vh] rounded-t-[32px] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* 极简顶栏 */}
            <div className="relative flex justify-between items-center p-6 bg-white border-b border-slate-100 rounded-t-[32px]">
              <div>
                <h3 className="font-black text-xl text-slate-800 tracking-tight">
                  {getConfigByTab().title}任务库
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Programmable Taxonomy · V5.6
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsManageMode(!isManageMode)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all ${isManageMode
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                  {isManageMode ? <Check size={14} /> : <Settings2 size={14} />}
                  {isManageMode ? '完成管理' : '管理分类'}
                </button>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-6 pb-32">
              <div className="space-y-8">
                {getConfigByTab().categories.map((cat, catIdx) => (
                  <div key={catIdx} className="relative group">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-1.5 h-6 rounded-full ${activeSupervisionTab === 'habits' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                        {editingCategoryName === cat.name ? (
                          <input
                            autoFocus
                            className="bg-white border-2 border-blue-400 rounded-lg px-2 py-1 text-sm font-black text-slate-800 outline-none"
                            defaultValue={cat.name}
                            onBlur={(e) => handleUpdateCategoryName(catIdx, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategoryName(catIdx, (e.target as HTMLInputElement).value)}
                          />
                        ) : (
                          <h4
                            className={`font-black text-sm text-slate-700 tracking-tight ${isManageMode ? 'cursor-edit hover:text-blue-600' : ''}`}
                            onDoubleClick={() => isManageMode && setEditingCategoryName(cat.name)}
                          >
                            {cat.name}
                          </h4>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full">{cat.items.length}</span>
                      </div>
                      {isManageMode && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setNewItemInput({ category: cat.name, value: '' })}
                            className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            + 增加项
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(catIdx)}
                            className="text-[10px] font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            删除大类
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 增加项输入框 */}
                    {newItemInput?.category === cat.name && (
                      <div className="mb-4 bg-white p-4 rounded-2xl border-2 border-dashed border-green-200 flex gap-2 animate-in slide-in-from-top-2 duration-200">
                        <input
                          autoFocus
                          className="flex-1 bg-slate-50 rounded-xl px-4 py-2 text-sm font-bold outline-none border border-transparent focus:border-green-300 transition-all"
                          placeholder="输入新把关项名称..."
                          value={newItemInput.value}
                          onChange={(e) => setNewItemInput({ ...newItemInput, value: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem(catIdx, newItemInput.value)}
                        />
                        <button
                          onClick={() => handleAddItem(catIdx, newItemInput.value)}
                          className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-green-100"
                        >
                          确认
                        </button>
                        <button onClick={() => setNewItemInput(null)} className="px-3 text-slate-400">
                          <X size={18} />
                        </button>
                      </div>
                    )}

                    {/* 分类子项列表 */}
                    <div className="grid grid-cols-2 gap-3">
                      {cat.items.map((item, itemIdx) => {
                        const isSelected = selectedTasks.includes(item);
                        return (
                          <div
                            key={itemIdx}
                            onClick={() => !isManageMode && toggleTask(item)}
                            className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group/item cursor-pointer ${isSelected
                              ? (activeSupervisionTab === 'habits' ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200')
                              : 'bg-white border-slate-50 hover:border-slate-100 hover:shadow-sm'
                              }`}
                          >
                            <span className={`text-sm font-bold tracking-tight ${isSelected
                              ? (activeSupervisionTab === 'habits' ? 'text-orange-700' : 'text-blue-700')
                              : 'text-slate-600'
                              }`}>{item}</span>

                            {isManageMode ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteItem(catIdx, itemIdx); }}
                                className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                              >
                                <Trash2 size={12} />
                              </button>
                            ) : (
                              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected
                                ? (activeSupervisionTab === 'habits' ? 'bg-orange-500 border-orange-500' : 'bg-blue-500 border-blue-500')
                                : 'border-slate-100'
                                }`}>
                                {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* 添加大类 */}
                {isManageMode && (
                  <div className="pt-8 border-t border-slate-100">
                    {newCategoryInput !== '' ? (
                      <div className="bg-white p-6 rounded-[24px] border-2 border-blue-100 shadow-xl shadow-blue-50 flex items-center gap-3 animate-in zoom-in-95 duration-200">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                          <Plus size={24} />
                        </div>
                        <input
                          autoFocus
                          className="flex-1 text-lg font-black text-slate-800 outline-none placeholder:text-slate-200"
                          placeholder="输入新分类名称..."
                          value={newCategoryInput}
                          onChange={(e) => setNewCategoryInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(newCategoryInput)}
                        />
                        <button
                          onClick={() => handleAddCategory(newCategoryInput)}
                          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-200 active:scale-95 transition-all"
                        >
                          创建分类
                        </button>
                        <button onClick={() => setNewCategoryInput('')} className="p-2 text-slate-300">
                          <X size={24} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewCategoryInput(' ')}
                        className="w-full py-6 rounded-[24px] border-2 border-dashed border-slate-200 text-slate-400 font-black text-sm hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-3"
                      >
                        <PlusSquare size={20} />
                        点击添加全新任务大类
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 确认底栏 */}
            {!isManageMode && (
              <div className="p-6 bg-white border-t border-slate-50 flex items-center justify-between rounded-b-[32px]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已选把关项</span>
                  <span className="text-xl font-black text-slate-800">{selectedTasks.length} <span className="text-xs text-slate-400">Items</span></span>
                </div>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className={`px-10 py-4 rounded-[20px] font-black text-sm transition-all active:scale-95 shadow-xl ${activeSupervisionTab === 'habits'
                    ? 'bg-orange-500 text-white shadow-orange-200'
                    : 'bg-blue-600 text-white shadow-blue-200'
                    }`}
                >
                  确认并保存
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Modal 2: 定制加餐 === */}
      {
        isSpecialModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            {/* 点击背景关闭 */}
            <div className="absolute inset-0" onClick={() => setIsSpecialModalOpen(false)}></div>
            <div className="relative bg-white w-full rounded-t-[24px] p-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh]">
              <div className="relative flex justify-between items-center mb-6">
                <h3 className="font-extrabold text-lg text-slate-800">添加加餐</h3>
                <button onClick={() => setIsSpecialModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                {/* 1. 选学生 */}
                <div className="text-[11px] font-extrabold text-slate-400 mb-3 uppercase tracking-widest">选择学生 (多选)</div>
                <div className="grid grid-cols-4 gap-2 mb-8">
                  {students.map((stu: any) => {
                    const studentName = stu.name || stu;
                    const isSelected = tempSpecialStudents.includes(studentName);
                    return (
                      <button
                        key={stu.id || studentName}
                        onClick={() => toggleSpecialStudent(studentName)}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSelected
                          ? 'bg-slate-800 text-white border-slate-800 shadow-lg'
                          : 'bg-slate-50 text-slate-500 border-transparent'
                          }`}
                      >
                        {studentName}
                      </button>
                    )
                  })}
                </div>

                {/* 2. 选任务 */}
                <div className="text-[11px] font-extrabold text-slate-400 mb-3 uppercase tracking-widest">任务内容 (多选 + 输入)</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {specialHistory.map(tag => {
                    const isSelected = tempSpecialTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleSpecialTag(tag)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSelected
                          ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                          : 'bg-slate-50 text-slate-500 border-transparent'
                          }`}
                      >
                        {tag}
                      </button>
                    )
                  })}
                </div>
                <input
                  value={specialInput}
                  onChange={(e) => setSpecialInput(e.target.value)}
                  placeholder="输入补充任务..."
                  className="w-full p-3.5 bg-slate-50 border border-transparent focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-50/50 rounded-xl text-sm outline-none transition-all mb-4 font-medium"
                />
              </div>

              <button
                onClick={addSpecialTask}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-orange-200 active:scale-95 transition-transform pb-safe"
              >
                确认添加
              </button>
            </div>
          </div>
        )
      }

      {/* 🆕 1v1 教学工作坊入口 - 独立于全局发布系统 */}
      <div className="mt-12 mb-20 px-6">
        <div
          onClick={() => navigate('/tutoring-studio')}
          className="group relative bg-white rounded-[32px] p-8 shadow-xl shadow-purple-200/40 border border-purple-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
        >
          {/* 流光背景装饰 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 rounded-full blur-2xl -ml-24 -mb-24" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-[22px] flex items-center justify-center shadow-lg shadow-purple-200 group-hover:rotate-6 transition-transform">
                <Stethoscope size={30} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">1v1 教学工作坊</h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] font-black rounded-lg uppercase tracking-wider">Expert</span>
                </div>
                <p className="text-sm text-slate-400 font-medium">个性化诊断 · 精准辅导方案 · 核心教学法应用</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right mr-4 hidden sm:block">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">今日预约</span>
                <span className="text-2xl font-black text-purple-600">03</span>
              </div>
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PrepView;
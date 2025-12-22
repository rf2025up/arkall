import React, { useState, useEffect } from 'react';
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
  Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import apiService from '../services/api.service';
import PersonalizedTutoringSection from '../components/PersonalizedTutoringSection';

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
  const { token, user } = useAuth();
  const { currentClass, viewMode, selectedTeacherId } = useClass(); // 🆕 获取完整视图状态

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

  // 课程进度 - 🆕 将从服务器加载最新教学计划数据
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    chinese: { unit: "1", lesson: "1", title: "加载中..." },
    math: { unit: "1", lesson: "1", title: "加载中..." },
    english: { unit: "1", title: "Loading..." } // 英语没有 lesson
  });

  const [qcItems, setQcItems] = useState<Record<string, string[]>>({
    chinese: ['生字听写', '课文背诵', '古诗/日积月累默写', '课文理解问答'],
    math: ['口算计时', '竖式/脱式', '概念/公式背默'],
    english: ['单词默写', '中英互译', '句型背诵', '课文背诵']
  });
  const [selectedQC, setSelectedQC] = useState<Record<string, string[]>>({
    chinese: [],
    math: [],
    english: []
  });

  // 任务 (Tasks)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // 定制加餐 (Special)
  const [specialTasks, setSpecialTasks] = useState<SpecialTaskItem[]>([]);
  const [specialHistory, setSpecialHistory] = useState<string[]>(["罚抄错题", "朗读课文", "背诵古诗", "整理错题本"]);

  // 模态框状态
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);
  const [showOnlyMethodology, setShowOnlyMethodology] = useState(false); // 🆕 控制是否只显示特色教学法任务
  const [showOnlyGrowth, setShowOnlyGrowth] = useState(false); // 🆕 控制是否只显示综合成长任务

  // 🆕 核心教学法/综合成长动态管理状态 - 使用 localStorage 同步
  const [methodologyCategories, setMethodologyCategories] = useState<{ name: string; items: string[] }[]>(() => {
    try {
      const stored = localStorage.getItem('arkok_methodology_categories');
      return stored ? JSON.parse(stored) : [
        { name: '基础学习方法论', items: ['作业的自主检查', '错题的红笔订正', '错题的摘抄与归因', '用"三色笔法"整理作业', '自评当日作业质量'] },
        { name: '数学思维与解题策略', items: ['用"分步法"讲解数学题', '用"画图法"理解应用题', '口算限时挑战', '错题归类与规律发现'] },
        { name: '语文学科能力深化', items: ['课文朗读与背诵', '生字词听写', '阅读理解策略练习', '作文提纲与修改'] },
        { name: '英语应用与输出', items: ['单词听写与默写', '课文朗读与背诵', '口语对话练习', '听力理解训练'] },
        { name: '阅读深度与分享', items: ['阅读记录卡填写', '好词好句摘抄', '读后感分享', '阅读推荐'] },
        { name: '自主学习与规划', items: ['制定学习计划', '时间管理练习', '目标设定与回顾', '自主预习'] },
        { name: '课堂互动与深度参与', items: ['主动举手发言', '小组讨论参与', '提出有价值的问题', '帮助同学讲解'] },
        { name: '家庭联结与知识迁移', items: ['与家长分享学习内容', '生活中的知识应用', '家校沟通反馈', '家庭作业展示'] },
        { name: '高阶输出与创新', items: ['创意写作', '项目展示', '知识总结思维导图', '跨学科应用'] }
      ];
    } catch { return []; }
  });
  const [growthCategories, setGrowthCategories] = useState<{ name: string; items: string[] }[]>(() => {
    try {
      const stored = localStorage.getItem('arkok_growth_categories');
      return stored ? JSON.parse(stored) : [
        { name: '阅读广度类', items: ['年级同步阅读', '课外阅读30分钟', '填写阅读记录单', '阅读一个成语故事，并积累掌握3个成语'] },
        { name: '整理与贡献类', items: ['离校前的个人卫生清理（桌面/抽屉/地面）', '离校前的书包整理', '一项集体贡献任务（浇花/整理书架/打扫等）', '吃饭时帮助维护秩序，确认光盘，地面保持干净', '为班级图书角推荐一本书，并写一句推荐语'] },
        { name: '互助与创新类', items: ['帮助同学（讲解/拍视频/打印等）', '一项创意表达任务（画画/写日记/做手工等）', '一项健康活力任务（眼保健操/拉伸/深呼吸/跳绳等）'] },
        { name: '家庭联结类', items: ['与家人共读30分钟（可亲子读、兄弟姐妹读、给长辈读）', '帮家里完成一项力所及的家务（摆碗筷、倒垃圾/整理鞋柜等）'] }
      ];
    } catch { return []; }
  });
  // 🆕 管理模式状态
  const [isManageMode, setIsManageMode] = useState(false);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [newItemInput, setNewItemInput] = useState<{ category: string; value: string } | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // 🆕 保存到 localStorage
  useEffect(() => {
    localStorage.setItem('arkok_methodology_categories', JSON.stringify(methodologyCategories));
  }, [methodologyCategories]);
  useEffect(() => {
    localStorage.setItem('arkok_growth_categories', JSON.stringify(growthCategories));
  }, [growthCategories]);

  // 模态框临时数据
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
          const newSelectedQC: Record<string, string[]> = {
            chinese: [],
            math: [],
            english: []
          };

          content.qcTasks.forEach((task: any) => {
            const taskName = task.taskName;
            // 根据后端存储的 category 映射回前端的学科 key
            if (task.category === '语文基础过关' || task.category === '基础核心') newSelectedQC.chinese.push(taskName);
            else if (task.category === '数学基础过关' || task.category === '数学巩固') newSelectedQC.math.push(taskName);
            else if (task.category === '英语基础过关' || task.category === '英语提升') newSelectedQC.english.push(taskName);
          });

          console.log('🎯 [PREP_VIEW] 回填选中的 QC 项:', newSelectedQC);
          setSelectedQC(newSelectedQC);
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

    const newSelectedQC: Record<string, string[]> = {
      chinese: [],
      math: [],
      english: []
    };

    // 添加任务库中的QC项目，但不覆盖默认值
    qcTasks.forEach(task => {
      const subjectKey = SUBJECT_CATEGORY_MAP[task.category];
      if (subjectKey && newQcItems[subjectKey]) {
        // 避免重复添加
        if (!newQcItems[subjectKey].includes(task.name)) {
          newQcItems[subjectKey].push(task.name);
        }
      }
    });

    // 默认选择每个学科的前两个项目（混合默认值和任务库值）
    Object.keys(newQcItems).forEach(subject => {
      const items = newQcItems[subject];
      if (items.length > 0) {
        newSelectedQC[subject] = items.slice(0, 2); // 选择前2个
      }
    });

    console.log('🎯 [PREP_VIEW] QC项目生成完成 - 默认值+任务库:', newQcItems);
    console.log('🎯 [PREP_VIEW] 默认选择的QC项目:', newSelectedQC);
    setQcItems(newQcItems);
    setSelectedQC(newSelectedQC);
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

  // 课程信息修改
  const handleCourseChange = (sub: keyof CourseInfo, field: keyof LessonInput, val: string) => {
    setCourseInfo(prev => ({
      ...prev,
      [sub]: { ...prev[sub], [field]: val }
    }));
  };

  // QC 切换
  const toggleQC = (sub: string, item: string) => {
    setSelectedQC(prev => {
      const list = prev[sub];
      return {
        ...prev,
        [sub]: list.includes(item) ? list.filter(i => i !== item) : [...list, item]
      };
    });
  };

  // 添加特色教学法任务 - 打开特色教学法任务库选择
  const addCustomQC = () => {
    setShowOnlyMethodology(true); // 🆕 只显示特色教学法任务
    setIsTaskModalOpen(true);
  };

  // 添加综合成长任务 - 打开综合成长任务库选择
  const addGrowthTasks = () => {
    setShowOnlyGrowth(true); // 🆕 只显示综合成长任务
    setIsTaskModalOpen(true);
  };

  // 任务切换 - 支持QC和普通任务
  const toggleTask = (taskName: string, taskCategory: string) => {
    const isQCTask = taskCategory.includes('过关');

    if (isQCTask) {
      // QC任务切换逻辑
      const subjectKey = SUBJECT_CATEGORY_MAP[taskCategory];
      if (subjectKey) {
        setSelectedQC(prev => {
          const list = prev[subjectKey];
          const isAlreadySelected = list.includes(taskName);
          return {
            ...prev,
            [subjectKey]: isAlreadySelected
              ? list.filter(item => item !== taskName)
              : [...list, taskName]
          };
        });
      }
    } else {
      // 普通任务切换逻辑
      setSelectedTasks(prev =>
        prev.includes(taskName) ? prev.filter(t => t !== taskName) : [...prev, taskName]
      );
    }
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
      // 更新历史 (去重 + 置顶)
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
    // 重置临时状态
    setTempSpecialStudents([]);
    setTempSpecialTags([]);
    setSpecialInput("");
  };

  const removeSpecialTask = (id: number) => {
    setSpecialTasks(prev => prev.filter(t => t.id !== id));
  };

  // 🆕 UI安全锁：检查是否允许发布
  const isPublishingAllowed = () => {
    // 必须在"我的学生"视图下才能发布
    const allowed = viewMode === 'MY_STUDENTS';

    if (!allowed) {
      console.log('🔒 [LMS_SECURITY] 发布被阻止：当前视图不是"我的学生"视图');
      console.log('🔒 [LMS_SECURITY] 当前视图:', viewMode);
    }

    return allowed;
  };

  // 发布
  const publishPlan = async (e?: React.MouseEvent) => {
    // 🔥 新增：发布按钮点击调试日志
    console.log("🖱️ Publish button clicked!");

    // 🔥 新增：防止表单默认提交
    if (e) {
      e.preventDefault();
    }

    // 🆕 安全锁检查：必须在我的学生视图下才能发布
    if (!isPublishingAllowed()) {
      setPublishStatus({
        isPublishing: false,
        error: '请切换回【我的学生】视图进行发布',
        success: false
      });
      return;
    }

    if (publishStatus.isPublishing || !token) {
      console.error('🚫 [PREP_VIEW] 发布失败：正在发布中或未找到认证token');
      return;
    }

    console.log('🚀 [PREP_VIEW] 开始发布备课计划...');
    setPublishStatus({ isPublishing: true, error: null, success: false });

    try {
      // 构建发布数据，匹配后端API Schema
      const qcTasks = Object.entries(selectedQC).flatMap(([subject, items]) =>
        items.map(item => ({
          taskId: `qc_${subject}_${item}`,
          taskName: item,
          category: subject === 'chinese' ? '语文基础过关' : subject === 'math' ? '数学基础过关' : '英语基础过关',
          defaultExp: 5,
          difficulty: 1
        }))
      );

      const normalTasks = selectedTasks.map(taskName => {
        // 🆕 查找任务所属分类标题
        let domain = '核心教学法';
        let subcategory = '';

        // 在核心教学法分类中查找
        for (const cat of methodologyCategories) {
          if (cat.items.includes(taskName)) {
            domain = '核心教学法';
            subcategory = cat.name; // 如"基础学习方法论"
            break;
          }
        }
        // 如果没找到，在综合成长分类中查找
        if (!subcategory) {
          for (const cat of growthCategories) {
            if (cat.items.includes(taskName)) {
              domain = '综合成长';
              subcategory = cat.name; // 如"阅读广度类"
              break;
            }
          }
        }

        return {
          taskName,
          category: domain,       // 大类：核心教学法/综合成长
          subcategory: subcategory, // 分类标题
          defaultExp: 10
        };
      });

      const specialTasksData = specialTasks.map(item => ({
        taskName: item.tasks.join(' + '),
        category: '特殊',
        defaultExp: 30,
        description: `学生: ${item.students.join(', ')}`,
        targetStudentNames: item.students // 🆕 增加独立字段供后端精准分发
      }));

      const planData = {
        courseInfo: {
          title: `${dateStr} 备课计划`,
          ...courseInfo,
          date: today.toISOString()
        },
        qcTasks,
        normalTasks,
        specialTasks: specialTasksData,
        // 🚫 移除 className 参数 - 现在基于师生绑定自动投送到发布者名下的学生
      };

      console.log('📋 [PREP_VIEW] 发布数据详情:', {
        courseTitle: planData.courseInfo.title,
        // 🆕 基于师生绑定，不再依赖班级名
        securityScope: 'TEACHERS_STUDENTS',
        viewMode: viewMode,
        qcTasksCount: qcTasks.length,
        normalTasksCount: normalTasks.length,
        specialTasksCount: specialTasks.length,
        qcTasks: qcTasks.map(t => ({ name: t.taskName, category: t.category })),
        normalTasks: normalTasks.map(t => ({ name: t.taskName, category: t.category }))
      });

      console.log('📡 [PREP_VIEW] 正在调用发布API: /lms/publish');
      // 调用API
      const result = await apiService.post('/lms/publish', planData);

      console.log('📊 [PREP_VIEW] 发布API响应:', { success: result.success, data: result.data, message: result.message });

      if (result.success) {
        console.log('✅ [PREP_VIEW] 备课计划发布成功');
        setPublishStatus({ isPublishing: false, error: null, success: true });

        // 显示成功消息
        setTimeout(() => {
          const data = result.data as {
            lessonPlan: { id: string };
            taskStats: { tasksCreated: number; totalStudents: number };
          };
          console.log('🎉 [PREP_VIEW] 发布统计:', data);
          alert(`备课计划发布成功！\n计划ID: ${data.lessonPlan.id}\n创建记录: ${data.taskStats.tasksCreated}\n影响学生: ${data.taskStats.totalStudents}`);
          setPublishStatus(prev => ({ ...prev, success: false }));
        }, 500);
      } else {
        console.error('❌ [PREP_VIEW] 发布失败:', result.message);
        throw new Error(result.message || '发布失败');
      }
    } catch (error) {
      // 🔥 新增：catch块错误调试日志
      console.error("❌ Publish function caught error:", error);
      console.error('💥 [PREP_VIEW] 发布异常:', error);
      setPublishStatus({
        isPublishing: false,
        error: error instanceof Error ? error.message : '发布失败，请重试',
        success: false
      });
    }
  };

  // --- 7. 渲染界面 ---

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] pb-40 font-sans">

      {/* Header */}
      <div className="px-6 pt-14 pb-4 sticky top-0 z-30 bg-[#F2F4F7]/95 backdrop-blur-md border-b border-slate-200/50">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-baseline gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">今日备课</h1>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs font-semibold text-slate-400">{dateStr}</p>
                {viewMode === 'MY_STUDENTS' && (
                  <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {user?.name}的班级
                  </div>
                )}
                {viewMode === 'ALL_SCHOOL' && (
                  <div className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    全校大名单
                  </div>
                )}
                {viewMode === 'SPECIFIC_CLASS' && currentClass !== 'ALL' && (
                  <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {currentClass}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* 🆕 带安全锁的发布按钮 */}
          <button
            onClick={publishPlan}
            disabled={publishStatus.isPublishing || isLoading || !isPublishingAllowed()}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 ${publishStatus.isPublishing || isLoading || !isPublishingAllowed()
              ? 'bg-slate-400 text-gray-200 cursor-not-allowed'
              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200/50'
              }`}
            title={!isPublishingAllowed() ? '请切换回【我的学生】视图进行发布' : undefined}
          >
            {publishStatus.isPublishing ? (
              <div className="flex items-center gap-2">
                <Loader size={16} className="animate-spin" />
                发布中...
              </div>
            ) : !isPublishingAllowed() ? (
              // 🆕 安全锁状态显示
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                需切换视图
              </div>
            ) : (
              '发布'
            )}
          </button>
        </div>

        {/* 错误提示 */}
        {(publishStatus.error || error) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
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
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" />
            <p className="text-sm font-medium text-green-800">备课计划发布成功！</p>
          </div>
        )}
      </div>

      <div className="px-5 space-y-6 mt-4">

        {/* 1. 课程进度 (横向胶囊布局) */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] font-extrabold text-slate-400 mb-5 tracking-widest uppercase flex items-center gap-2">
            <BookOpen size={14} /> 课程进度
          </div>

          <div className="space-y-4">
            {/* 语文 */}
            <div className={`group flex items-center p-1.5 pr-4 rounded-2xl transition-colors ${QC_CONFIG.chinese.bgClass}`}>
              <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ml-1 ${QC_CONFIG.chinese.textClass}`}>语</div>
              <div className="flex-1 flex items-center gap-1.5 ml-3 overflow-hidden">
                <div className={`flex items-center gap-1 bg-white/60 px-2 py-1.5 rounded-lg border border-transparent transition-colors shadow-sm shrink-0 ${QC_CONFIG.chinese.focusBorder}`}>
                  <input className="bg-transparent w-5 text-center font-bold text-slate-800 text-sm p-0 outline-none"
                    value={courseInfo.chinese.unit} onChange={e => handleCourseChange('chinese', 'unit', e.target.value)} />
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">单元</span>
                </div>
                <div className={`flex items-center gap-1 bg-white/60 px-2 py-1.5 rounded-lg border border-transparent transition-colors shadow-sm shrink-0 ${QC_CONFIG.chinese.focusBorder}`}>
                  <input className="bg-transparent w-5 text-center font-bold text-slate-800 text-sm p-0 outline-none"
                    value={courseInfo.chinese.lesson} onChange={e => handleCourseChange('chinese', 'lesson', e.target.value)} />
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">课</span>
                </div>
                <input className="bg-transparent flex-1 font-bold text-slate-800 text-sm px-3 py-1.5 ml-1 placeholder:text-slate-300 outline-none rounded-md focus:bg-white/50 transition-colors"
                  value={courseInfo.chinese.title} onChange={e => handleCourseChange('chinese', 'title', e.target.value)} />
              </div>
            </div>

            {/* 数学 */}
            <div className={`group flex items-center p-1.5 pr-4 rounded-2xl transition-colors ${QC_CONFIG.math.bgClass}`}>
              <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ml-1 ${QC_CONFIG.math.textClass}`}>数</div>
              <div className="flex-1 flex items-center gap-1.5 ml-3 overflow-hidden">
                <div className={`flex items-center gap-1 bg-white/60 px-2 py-1.5 rounded-lg border border-transparent transition-colors shadow-sm shrink-0 ${QC_CONFIG.math.focusBorder}`}>
                  <input className="bg-transparent w-5 text-center font-bold text-slate-800 text-sm p-0 outline-none"
                    value={courseInfo.math.unit} onChange={e => handleCourseChange('math', 'unit', e.target.value)} />
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">章</span>
                </div>
                <div className={`flex items-center gap-1 bg-white/60 px-2 py-1.5 rounded-lg border border-transparent transition-colors shadow-sm shrink-0 ${QC_CONFIG.math.focusBorder}`}>
                  <input className="bg-transparent w-5 text-center font-bold text-slate-800 text-sm p-0 outline-none"
                    value={courseInfo.math.lesson} onChange={e => handleCourseChange('math', 'lesson', e.target.value)} />
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">节</span>
                </div>
                <input className="bg-transparent flex-1 font-bold text-slate-800 text-sm px-3 py-1.5 ml-1 placeholder:text-slate-300 outline-none rounded-md focus:bg-white/50 transition-colors"
                  value={courseInfo.math.title} onChange={e => handleCourseChange('math', 'title', e.target.value)} />
              </div>
            </div>

            {/* 英语 */}
            <div className={`group flex items-center p-1.5 pr-4 rounded-2xl transition-colors ${QC_CONFIG.english.bgClass}`}>
              <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 ml-1 ${QC_CONFIG.english.textClass}`}>英</div>
              <div className="flex-1 flex items-center gap-1.5 ml-3 overflow-hidden">
                <div className={`flex items-center gap-1 bg-white/60 px-2 py-1.5 rounded-lg border border-transparent transition-colors shadow-sm shrink-0 ${QC_CONFIG.english.focusBorder}`}>
                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">Unit</span>
                  <input className="bg-transparent w-6 text-center font-bold text-slate-800 text-sm p-0 outline-none"
                    value={courseInfo.english.unit} onChange={e => handleCourseChange('english', 'unit', e.target.value)} />
                </div>
                <input className="bg-transparent flex-1 font-bold text-slate-800 text-sm px-3 py-1.5 ml-1 placeholder:text-slate-300 outline-none rounded-md focus:bg-white/50 transition-colors"
                  value={courseInfo.english.title} onChange={e => handleCourseChange('english', 'title', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* 2. 过关项 (点选色块) */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-[11px] font-extrabold text-slate-400 mb-5 tracking-widest uppercase flex items-center gap-2">
            <CheckCircle2 size={14} /> 基础过关
          </div>

          <div className="space-y-6">
            {Object.keys(QC_CONFIG).map(sub => (
              <div key={sub}>
                <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${QC_CONFIG[sub].dotColor}`}></span>
                  {QC_CONFIG[sub].label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {qcItems[sub].map(item => {
                    const isSelected = selectedQC[sub].includes(item);
                    return (
                      <button
                        key={item}
                        onClick={() => toggleQC(sub, item)}
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${isSelected
                          ? QC_CONFIG[sub].activeClass
                          : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
                          }`}
                      >
                        {item}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addCustomQC}
            className="mt-6 w-full py-3 rounded-xl text-red-600 text-xs font-bold flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 transition-colors active:scale-95"
          >
            <Plus size={14} /> 核心教学法
          </button>
        </div>

        {/* 3. 任务 (列表) */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-center mb-5">
            <div className="text-[11px] font-extrabold text-slate-400 tracking-widest uppercase flex items-center gap-2">
              <Layers size={14} /> 过程任务
            </div>
            <div className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
              {selectedTasks.length} 项
            </div>
          </div>

          <div className="space-y-2 mb-5">
            {selectedTasks.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-4 italic">暂未选择任务</div>
            ) : (
              selectedTasks.map(task => (
                <div key={task} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <span className="text-sm font-bold text-slate-700">{task}</span>
                  <button
                    onClick={() => toggleTask(task, 'selected-tasks')}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => {
              setShowOnlyMethodology(false); // 不显示核心教学法
              setShowOnlyGrowth(true); // 默认显示综合成长
              setIsTaskModalOpen(true);
            }}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all"
          >
            <ListPlus size={16} /> 综合成长
          </button>
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
          <div className="bg-[#F8FAFC] w-full h-[90vh] rounded-t-[24px] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center p-5 bg-white border-b border-slate-100 rounded-t-[24px]">
              <h3 className="font-extrabold text-lg text-slate-800">
                {showOnlyMethodology ? '核心教学法任务' : showOnlyGrowth ? '综合成长任务' : '任务库'}
              </h3>
              <div className="flex items-center gap-3">
                {(showOnlyMethodology || showOnlyGrowth) && (
                  <button
                    onClick={() => setIsManageMode(!isManageMode)}
                    className={`text-[10px] font-bold px-2 py-1 rounded ${isManageMode ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {isManageMode ? '✓ 完成' : '⚙ 管理'}
                  </button>
                )}
                {/* 任务和QC计数标签 - 仅在普通任务库模式下显示 */}
                {!showOnlyMethodology && !showOnlyGrowth && (
                  <>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                      任务 {selectedTasks.length}
                    </span>
                    <span className="text-xs font-bold text-orange-400 bg-orange-50 px-2 py-1 rounded-md">
                      QC {Object.values(selectedQC).flat().length}
                    </span>
                  </>
                )}
                <button onClick={() => {
                  setIsTaskModalOpen(false);
                  setShowOnlyMethodology(false); // 重置筛选状态
                  setShowOnlyGrowth(false); // 重置综合成长筛选状态
                }} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-20">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader size={24} className="animate-spin text-slate-400 mb-3" />
                  <p className="text-sm text-slate-500">加载任务库中...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle size={24} className="text-red-400 mb-3" />
                  <p className="text-sm text-red-500 mb-3">加载失败</p>
                  <button
                    onClick={() => {
                      fetchTaskLibrary();
                      setShowOnlyMethodology(false); // 重置筛选状态
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                  >
                    重试
                  </button>
                </div>
              ) : (showOnlyMethodology || showOnlyGrowth) ? (
                // 🆕 使用本地配置显示核心教学法/综合成长
                <div>
                  {(showOnlyMethodology ? methodologyCategories : growthCategories).map((cat, catIdx) => (
                    <div key={catIdx} className="mb-6">
                      {/* 大标题 - 双击修改 */}
                      <div className="sticky top-0 bg-[#F8FAFC] py-2 z-10 flex items-center gap-2 mb-2">
                        <div className={`w-1 h-4 rounded-full ${showOnlyMethodology ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        {editingCategoryName === cat.name ? (
                          <input
                            type="text"
                            defaultValue={cat.name}
                            autoFocus
                            className="text-sm font-extrabold text-slate-800 bg-white px-2 py-1 border border-blue-300 rounded outline-none"
                            onBlur={(e) => {
                              const newName = e.target.value.trim();
                              if (newName && newName !== cat.name) {
                                if (showOnlyMethodology) {
                                  setMethodologyCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, name: newName } : c));
                                } else {
                                  setGrowthCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, name: newName } : c));
                                }
                              }
                              setEditingCategoryName(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              if (e.key === 'Escape') setEditingCategoryName(null);
                            }}
                          />
                        ) : (
                          <h4
                            className={`text-sm font-extrabold text-slate-800 ${isManageMode ? 'cursor-pointer hover:text-blue-600' : ''}`}
                            onDoubleClick={() => isManageMode && setEditingCategoryName(cat.name)}
                          >
                            {cat.name}
                          </h4>
                        )}
                        <span className="text-xs text-slate-400">({cat.items.length})</span>
                        {/* 管理模式下显示添加细项按钮 */}
                        {isManageMode && (
                          <button
                            onClick={() => setNewItemInput({ category: cat.name, value: '' })}
                            className="ml-auto text-[10px] bg-green-100 text-green-600 px-2 py-0.5 rounded hover:bg-green-200"
                          >
                            + 添加
                          </button>
                        )}
                      </div>
                      {/* 添加新细项输入框 */}
                      {newItemInput?.category === cat.name && (
                        <div className="flex items-center gap-2 mb-3 p-3 bg-white rounded-xl border border-slate-200">
                          <input
                            type="text"
                            value={newItemInput.value}
                            onChange={(e) => setNewItemInput({ ...newItemInput, value: e.target.value })}
                            placeholder="输入新任务名称"
                            autoFocus
                            className="flex-1 py-2 px-3 rounded-lg text-sm border border-slate-200 focus:border-blue-400 outline-none"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newItemInput.value.trim()) {
                                if (showOnlyMethodology) {
                                  setMethodologyCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, items: [...c.items, newItemInput.value.trim()] } : c));
                                } else {
                                  setGrowthCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, items: [...c.items, newItemInput.value.trim()] } : c));
                                }
                                setNewItemInput(null);
                              }
                              if (e.key === 'Escape') setNewItemInput(null);
                            }}
                          />
                          <button
                            onClick={() => {
                              if (newItemInput.value.trim()) {
                                if (showOnlyMethodology) {
                                  setMethodologyCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, items: [...c.items, newItemInput.value.trim()] } : c));
                                } else {
                                  setGrowthCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, items: [...c.items, newItemInput.value.trim()] } : c));
                                }
                                setNewItemInput(null);
                              }
                            }}
                            className="py-2 px-4 rounded-lg text-sm font-bold bg-green-500 text-white hover:bg-green-600"
                          >
                            确认
                          </button>
                          <button onClick={() => setNewItemInput(null)} className="py-2 px-3 rounded-lg text-sm text-slate-500 hover:bg-slate-100">
                            取消
                          </button>
                        </div>
                      )}
                      {/* 细项列表 */}
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                        {cat.items.map((item, itemIdx) => {
                          const isSelected = selectedTasks.includes(item);
                          return (
                            <div
                              key={itemIdx}
                              className={`px-4 py-3 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'} cursor-pointer`}
                              onClick={() => {
                                if (!isManageMode) {
                                  setSelectedTasks(prev => prev.includes(item) ? prev.filter(t => t !== item) : [...prev, item]);
                                }
                              }}
                            >
                              <span className={`text-sm ${isSelected ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>{item}</span>
                              {isManageMode ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (showOnlyMethodology) {
                                      setMethodologyCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, items: c.items.filter((_, ii) => ii !== itemIdx) } : c));
                                    } else {
                                      setGrowthCategories(prev => prev.map((c, i) => i === catIdx ? { ...c, items: c.items.filter((_, ii) => ii !== itemIdx) } : c));
                                    }
                                  }}
                                  className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                                >
                                  <Trash2 size={12} />
                                </button>
                              ) : (
                                <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'} flex items-center justify-center`}>
                                  {isSelected && <Check size={12} className="text-white" />}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {/* 添加新大类按钮 */}
                  {isManageMode && (
                    <div className="mt-4">
                      {newCategoryInput !== '' ? (
                        <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
                          <input
                            type="text"
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            placeholder="输入新分类名称"
                            autoFocus
                            className="flex-1 py-2 px-3 rounded-lg text-sm border border-slate-200 focus:border-blue-400 outline-none"
                          />
                          <button
                            onClick={() => {
                              if (newCategoryInput.trim()) {
                                if (showOnlyMethodology) {
                                  setMethodologyCategories(prev => [...prev, { name: newCategoryInput.trim(), items: [] }]);
                                } else {
                                  setGrowthCategories(prev => [...prev, { name: newCategoryInput.trim(), items: [] }]);
                                }
                                setNewCategoryInput('');
                              }
                            }}
                            className="py-2 px-4 rounded-lg text-sm font-bold bg-blue-500 text-white hover:bg-blue-600"
                          >
                            确认
                          </button>
                          <button onClick={() => setNewCategoryInput('')} className="py-2 px-3 rounded-lg text-sm text-slate-500 hover:bg-slate-100">
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setNewCategoryInput(' ')}
                          className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:border-blue-400 hover:text-blue-500"
                        >
                          + 添加新分类
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // 🆕 根据showOnlyMethodology或showOnlyGrowth筛选任务并按category分组
                Object.entries(
                  (taskLibrary || [])
                    .filter(task => {
                      // 如果只显示核心教学法，则筛选educationalDomain为"核心教学法"的任务
                      if (showOnlyMethodology) {
                        return task.educationalDomain === "核心教学法";
                      }
                      // 如果只显示综合成长，则筛选educationalDomain为"综合成长"的任务
                      if (showOnlyGrowth) {
                        return task.educationalDomain === "综合成长";
                      }
                      // 否则显示所有任务
                      return true;
                    })
                    .reduce((acc, task) => {
                      // 🆕 综合成长任务按4大类重新分组
                      if (showOnlyGrowth && task.educationalDomain === "综合成长") {
                        // 根据任务名称映射到4个大类
                        const readingTasks = ["年级同步阅读", "课外阅读30分钟", "填写阅读记录单", "阅读一个成语故事，并积累掌握3个成语"];
                        const responsibilityTasks = ["离校前的个人卫生清理（桌面/抽屉/地面）", "离校前的书包整理", "一项集体贡献任务（浇花/整理书架/打扫等）", "吃饭时帮助维护秩序，确认光盘，地面保持干净", "为班级图书角推荐一本书，并写一句推荐语"];
                        const creativityTasks = ["帮助同学（讲解/拍视频/打印等）", "一项创意表达任务（画画/写日记/做手工等）", "一项健康活力任务（眼保健操/拉伸/深呼吸/跳绳等）"];
                        const familyTasks = ["与家人共读30分钟（可亲子读、兄弟姐妹读、给长辈读）", "帮家里完成一项力所及的家务（摆碗筷、倒垃圾/整理鞋柜等）"];

                        if (readingTasks.includes(task.name)) {
                          if (!acc["阅读广度类"]) acc["阅读广度类"] = [];
                          acc["阅读广度类"].push(task);
                        } else if (responsibilityTasks.includes(task.name)) {
                          if (!acc["整理与贡献类"]) acc["整理与贡献类"] = [];
                          acc["整理与贡献类"].push(task);
                        } else if (creativityTasks.includes(task.name)) {
                          if (!acc["互助与创新类"]) acc["互助与创新类"] = [];
                          acc["互助与创新类"].push(task);
                        } else if (familyTasks.includes(task.name)) {
                          if (!acc["家庭联结类"]) acc["家庭联结类"] = [];
                          acc["家庭联结类"].push(task);
                        } else {
                          // 兜底分类
                          if (!acc["其他成长类"]) acc["其他成长类"] = [];
                          acc["其他成长类"].push(task);
                        }
                      } else if (showOnlyMethodology) {
                        // 核心教学法任务按9大教学法维度智能分组
                        const taskName = task.name;

                        // 基础学习方法论
                        if (['作业的自主检查', '错题的红笔订正', '错题的摘抄与归因', '用"三色笔法"整理作业', '自评当日作业质量'].includes(taskName)) {
                          if (!acc['基础学习方法论']) acc['基础学习方法论'] = [];
                          acc['基础学习方法论'].push(task);
                        }
                        // 数学思维与解题策略
                        else if (['5道旧错题的重做练习', '一项老师定制的数学拓展任务', '一道"说题"练习', '找一道生活中的数学问题', '高阶：母题归纳', '高阶：错题主动重做', '高阶：应用解题模型表'].includes(taskName)) {
                          if (!acc['数学思维与解题策略']) acc['数学思维与解题策略'] = [];
                          acc['数学思维与解题策略'].push(task);
                        }
                        // 语文学科能力深化
                        else if (['仿写课文中的一个好句', '为当天生字编顺口溜或故事', '运用阅读理解解题模板', '查字典（查一查·读一读）', '分类组词与辨析（组一组·辨一辨）', '联想记忆法（想一想·记一记）'].includes(taskName)) {
                          if (!acc['语文学科能力深化']) acc['语文学科能力深化'] = [];
                          acc['语文学科能力深化'].push(task);
                        }
                        // 英语应用与输出
                        else if (['用今日单词编小对话', '制作单词卡'].includes(taskName)) {
                          if (!acc['英语应用与输出']) acc['英语应用与输出'] = [];
                          acc['英语应用与输出'].push(task);
                        }
                        // 阅读深度与分享
                        else if (['好词金句赏析', '画人物关系图/预测情节', '录制阅读小分享'].includes(taskName)) {
                          if (!acc['阅读深度与分享']) acc['阅读深度与分享'] = [];
                          acc['阅读深度与分享'].push(task);
                        }
                        // 自主学习与规划
                        else if (['自主规划"复习"任务', '自主规划"预习"任务', '制定学习小计划', '设定并完成改进目标'].includes(taskName)) {
                          if (!acc['自主学习与规划']) acc['自主学习与规划'] = [];
                          acc['自主学习与规划'].push(task);
                        }
                        // 课堂互动与深度参与
                        else if (['主动举手回答问题', '每节课准备一个问题', '主动申请课堂角色', '记录老师金句并写理解', '帮助同桌理解知识点'].includes(taskName)) {
                          if (!acc['课堂互动与深度参与']) acc['课堂互动与深度参与'] = [];
                          acc['课堂互动与深度参与'].push(task);
                        }
                        // 家庭联结与知识迁移
                        else if (['向家长讲解学习方法', '教家人一个新知识', '主动展示复习成果', '分享"改进目标"完成情况', '用数学解决家庭问题'].includes(taskName)) {
                          if (!acc['家庭联结与知识迁移']) acc['家庭联结与知识迁移'] = [];
                          acc['家庭联结与知识迁移'].push(task);
                        }
                        // 高阶输出与创新
                        else if (['录制"小老师"视频'].includes(taskName)) {
                          if (!acc['高阶输出与创新']) acc['高阶输出与创新'] = [];
                          acc['高阶输出与创新'].push(task);
                        }
                        // 兜底分类
                        else {
                          if (!acc['其他教学法']) acc['其他教学法'] = [];
                          acc['其他教学法'].push(task);
                        }
                      } else {
                        // 保持原有分类结构，按原category分组
                        const category = task.category;
                        if (!acc[category]) {
                          acc[category] = [];
                        }
                        acc[category].push(task);
                      }
                      return acc;
                    }, {} as Record<string, TaskLibraryItem[]>)
                ).sort(([a], [b]) => {
                  // 如果只显示核心教学法，则按9大教学法维度顺序排序
                  if (showOnlyMethodology) {
                    const methodologyOrder = [
                      "基础学习方法论",
                      "数学思维与解题策略",
                      "语文学科能力深化",
                      "英语应用与输出",
                      "阅读深度与分享",
                      "自主学习与规划",
                      "课堂互动与深度参与",
                      "家庭联结与知识迁移",
                      "高阶输出与创新",
                      "其他教学法" // 兜底分类放在最后
                    ];
                    const aIndex = methodologyOrder.indexOf(a);
                    const bIndex = methodologyOrder.indexOf(b);
                    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b); // 都不在列表中，按字母排序
                    if (aIndex === -1) return 1; // a不在列表中，排后面
                    if (bIndex === -1) return -1; // b不在列表中，排后面
                    return aIndex - bIndex;
                  }
                  // 如果只显示综合成长，按4大类排序
                  if (showOnlyGrowth) {
                    const growthOrder = ["阅读广度类", "整理与贡献类", "互助与创新类", "家庭联结类"];
                    const aIndex = growthOrder.indexOf(a);
                    const bIndex = growthOrder.indexOf(b);
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return a.localeCompare(b);
                  }
                  // 否则按字母顺序排序
                  return a.localeCompare(b);
                }).map(([category, tasks], idx) => (
                  <div key={idx} className="mb-8">
                    <div className="sticky top-0 bg-[#F8FAFC] py-2 z-10 flex items-center gap-2 mb-2">
                      <div className="w-1 h-4 bg-slate-800 rounded-full"></div>
                      <h4 className="text-sm font-extrabold text-slate-800">{category}</h4>
                      <span className="text-xs text-slate-400">({tasks.length})</span>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
                      {tasks.map(task => {
                        const isQCTask = task.type === 'QC';
                        let isSelected = false;

                        if (isQCTask) {
                          // 检查QC任务是否被选中
                          const subjectKey = SUBJECT_CATEGORY_MAP[task.category];
                          isSelected = subjectKey ? selectedQC[subjectKey]?.includes(task.name) : false;
                        } else {
                          // 检查普通任务是否被选中
                          isSelected = selectedTasks.includes(task.name);
                        }

                        return (
                          <div
                            key={`${task.category}-${task.name}`}
                            onClick={() => toggleTask(task.name, task.category)}
                            className="flex items-center justify-between p-4 active:bg-slate-50 transition-colors cursor-pointer"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                                  {task.name}
                                </span>
                                {isQCTask && (
                                  <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 rounded">
                                    QC
                                  </span>
                                )}
                              </div>
                              {!showOnlyMethodology && !showOnlyGrowth && <span className="text-xs text-slate-400 ml-2">+{task.defaultExp} EXP</span>}
                            </div>
                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-300 bg-white'}`}>
                              {isSelected && <Check size={14} strokeWidth={3} />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 bg-white border-t border-slate-100 absolute bottom-0 w-full rounded-t-[24px]">
              <button
                onClick={() => {
                  setIsTaskModalOpen(false);
                  setShowOnlyMethodology(false); // 重置筛选状态
                  setShowOnlyGrowth(false); // 重置综合成长筛选状态
                }}
                className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal 2: 定制加餐 === */}
      {isSpecialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-[24px] p-6 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh]">

            <div className="flex justify-between items-center mb-6">
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
      )}

      {/* 🆕 1v1讲解功能区 - 独立于顶部进度发布系统 */}
      <PersonalizedTutoringSection />

    </div>
  );
};

export default PrepView;
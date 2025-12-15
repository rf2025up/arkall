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
  category: string;
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
  const { token } = useAuth();
  const { currentClass, viewMode } = useClass(); // 🆕 获取viewMode用于UI安全锁

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

  // 课程进度
  const [courseInfo, setCourseInfo] = useState<CourseInfo>({
    chinese: { unit: "3", lesson: "2", title: "古诗二首" },
    math: { unit: "4", lesson: "1", title: "除法" },
    english: { unit: "2", title: "Hello World" } // 英语没有 lesson
  });

  // 过关项 (QC) - 动态从TaskLibrary获取，提供默认值
  const [qcItems, setQcItems] = useState<Record<string, string[]>>({
    chinese: ['古诗背诵', '生字听写', '词语解释'],
    math: ['口算练习', '应用题', '几何图形'],
    english: ['单词背诵', '句型练习', '听力理解']
  });
  const [selectedQC, setSelectedQC] = useState<Record<string, string[]>>({
    chinese: [],
    math: [],
    english: []
  });

  // 任务 (Tasks)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // 个性化加餐 (Special)
  const [specialTasks, setSpecialTasks] = useState<SpecialTaskItem[]>([]);
  const [specialHistory, setSpecialHistory] = useState<string[]>(["罚抄错题", "朗读课文", "背诵古诗", "整理错题本"]);

  // 模态框状态
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);

  // 模态框临时数据
  const [tempSpecialStudents, setTempSpecialStudents] = useState<string[]>([]);
  const [tempSpecialTags, setTempSpecialTags] = useState<string[]>([]);
  const [specialInput, setSpecialInput] = useState("");

  // 日期格式化
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 · 星期${['日','一','二','三','四','五','六'][today.getDay()]}`;

  // --- 5. 数据获取 useEffect ---

  // 从TaskLibrary生成QC项目
  const generateQCItemsFromLibrary = (tasks: TaskLibraryItem[]) => {
    const qcTasks = tasks.filter(task => task.type === 'QC');

    // 从默认值开始，确保总有基础标签
    const defaultQcItems: Record<string, string[]> = {
      chinese: ['古诗背诵', '生字听写', '词语解释'],
      math: ['口算练习', '应用题', '几何图形'],
      english: ['单词背诵', '句型练习', '听力理解']
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
      console.log('📡 [PREP_VIEW] 正在调用API: /lms/task-library');
      const response = await apiService.get('/lms/task-library');

      console.log('📊 [PREP_VIEW] API响应:', { success: response.success, dataLength: Array.isArray(response.data) ? response.data.length : 0, message: response.message });

      if (response.success && response.data) {
        const tasks = response.data as TaskLibraryItem[];
        console.log('✅ [PREP_VIEW] 任务库获取成功，任务数量:', tasks.length);
        console.log('📋 [PREP_VIEW] 任务列表预览:', tasks.map(t => ({ name: t.name, category: t.category, exp: t.defaultExp })));
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
      // 集成ClassContext，实现班级隔离 - 与QCView保持一致
      const url = currentClass === 'ALL' ? '/students' : `/students?classRoom=${encodeURIComponent(currentClass)}`;
      const response = await apiService.get(url);

      if (response.success && response.data) {
        const studentsData = (response.data as { students: any[] }).students;
        setStudents(studentsData);

        // 提取班级信息
        const uniqueClasses = Array.from(new Set(studentsData.map(s => s.classRoom).filter(Boolean)));
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
          const classStudents = studentsData.filter(s => s.classRoom === selectedClass);
          setSelectedStudents(classStudents.map(s => s.name));
        }
      }
    } catch (err) {
      console.error('获取学生列表失败:', err);
    }
  };

  useEffect(() => {
    fetchTaskLibrary();
    fetchStudents();
  }, [token, currentClass]); // 添加currentClass依赖，确保班级切换时重新获取数据

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

  // 添加更多QC项目 - 打开任务库选择
  const addCustomQC = () => {
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

  // 个性化加餐逻辑
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
          category: subject === 'chinese' ? '基础核心' : subject === 'math' ? '数学巩固' : '英语提升',
          defaultExp: 5,
          difficulty: 1
        }))
      );

      const normalTasks = selectedTasks.map(taskName => {
        const task = taskLibrary.find(t => t.name === taskName);
        return {
          taskId: task?.id || '',
          taskName,
          category: task?.category || '基础核心',
          defaultExp: task?.defaultExp || 10
        };
      });

      const specialTasksData = specialTasks.map(item => ({
        taskName: item.tasks.join(' + '),
        category: '特殊',
        defaultExp: 30,
        description: `学生: ${item.students.join(', ')}`
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
            </div>
          </div>
          {/* 🆕 带安全锁的发布按钮 */}
          <button
            onClick={publishPlan}
            disabled={publishStatus.isPublishing || isLoading || !isPublishingAllowed()}
            className={`px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
              publishStatus.isPublishing || isLoading || !isPublishingAllowed()
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
                        className={`py-2 px-3.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                          isSelected
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
            className="mt-6 w-full py-3 rounded-xl text-slate-400 text-xs font-bold flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 transition-colors active:scale-95"
          >
            <Plus size={14} /> 自定义拓展
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
            onClick={() => setIsTaskModalOpen(true)}
            className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all"
          >
            <ListPlus size={16} /> 打开任务库
          </button>
        </div>

        {/* 4. 个性化加餐 (底部光感) */}
        <div className="relative rounded-[24px] p-6 overflow-hidden text-slate-800 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFF7ED] via-[#FFF1F2] to-[#FFF7ED]"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur text-orange-500 flex items-center justify-center shadow-sm">
                  <Sparkles size={14} fill="currentColor" />
                </div>
                <span className="font-bold text-slate-800 text-sm">个性化加餐</span>
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
              <h3 className="font-extrabold text-lg text-slate-800">任务库</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                  任务 {selectedTasks.length}
                </span>
                <span className="text-xs font-bold text-orange-400 bg-orange-50 px-2 py-1 rounded-md">
                  QC {Object.values(selectedQC).flat().length}
                </span>
                <button onClick={() => setIsTaskModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100">
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
                    onClick={fetchTaskLibrary}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
                  >
                    重试
                  </button>
                </div>
              ) : (
                // 将taskLibrary按category分组
                Object.entries(
                  (taskLibrary || []).reduce((acc, task) => {
                    if (!acc[task.category]) {
                      acc[task.category] = [];
                    }
                    acc[task.category].push(task);
                    return acc;
                  }, {} as Record<string, TaskLibraryItem[]>)
                ).map(([category, tasks], idx) => (
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
                              <span className="text-xs text-slate-400 ml-2">+{task.defaultExp} EXP</span>
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
                onClick={() => setIsTaskModalOpen(false)}
                className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
              >
                确认选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Modal 2: 个性化加餐 === */}
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
                      className={`py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        isSelected
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
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                        isSelected
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

    </div>
  );
};

export default PrepView;
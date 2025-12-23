import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api.service';

// 🆕 师生绑定相关类型定义
export interface ViewMode {
  type: 'MY_STUDENTS' | 'ALL_SCHOOL' | 'SPECIFIC_CLASS';  // 我的学生 vs 全校大名单 vs 特定班级
}

export interface ClassInfo {
  name: string;
  studentCount: number;
  isPrimaryClass?: boolean;
  teacherId?: string;
  teacherName?: string;
}

export interface ClassContextType {
  // 🆕 核心变更：从班级切换改为视图模式切换
  viewMode: ViewMode['type'];     // 当前视图模式
  currentClass: string;           // 保留兼容性，当前选中的班级，'ALL' 表示全校
  selectedTeacherId: string | null; // 目前选中的老师ID（针对 SPECIFIC_CLASS 模式）
  managedTeacherName: string | null; // 🆕 当前代管理老师姓名
  isProxyMode: boolean;           // 🆕 是否处于代理模式 (Profile页切入激活，Header页切入为临时查看)
  availableClasses: ClassInfo[];  // 可选班级列表
  switchViewMode: (mode: ViewMode['type'], teacherId?: string, teacherName?: string, isProxy?: boolean) => void;  // 切换视图模式
  switchClass: (className: string) => void;                           // 保留兼容性

  isLoading: boolean;
  refreshClasses: () => Promise<void>; // 刷新班级列表
}

// 创建班级上下文
const ClassContext = createContext<ClassContextType | undefined>(undefined);

// 班级提供者组件
interface ClassProviderProps {
  children: ReactNode;
}

export const ClassProvider: React.FC<ClassProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // 🆕 核心状态：视图模式 + 兼容性状态
  const [viewMode, setViewMode] = useState<ViewMode['type']>('MY_STUDENTS');  // 默认查看我的学生
  const [currentClass, setCurrentClass] = useState<string>('ALL');  // 保留兼容性
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [managedTeacherName, setManagedTeacherName] = useState<string | null>(null);
  const [isProxyMode, setIsProxyMode] = useState<boolean>(false);
  // 🆕 代管理的老师姓名
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🆕 智能路由逻辑：初始视图设置
  useEffect(() => {
    if (user && !localStorage.getItem('view_mode')) {
      if (user.role === 'TEACHER') {
        setViewMode('MY_STUDENTS');
      } else if (user.role === 'ADMIN') {
        setViewMode('ALL_SCHOOL');
      }
    }
  }, [user]);

  // 获取班级列表
  const fetchClasses = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await apiService.get('/students/classes');

      if (response.success && response.data) {
        const classes: ClassInfo[] = (response.data as any[]).map((cls: any) => ({
          name: cls.className,
          studentCount: parseInt(cls.studentCount),
          isPrimaryClass: cls.className === user.primaryClassName,
          teacherId: cls.teacherId,
          teacherName: cls.teacherName || '未知老师'
        }));

        // 🆕 新的排序逻辑：当前老师的班级排第一，其他老师按学生数量排序
        classes.sort((a, b) => {
          // 当前老师的班级排最前面
          if (a.teacherId === user.id) return -1;
          if (b.teacherId === user.id) return 1;
          // 其他按学生数量排序
          return b.studentCount - a.studentCount;
        });

        setAvailableClasses(classes);
      } else {
        console.error('Failed to fetch classes:', response.message);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 切换视图模式 - 核心新功能
  const switchViewMode = (mode: ViewMode['type'], teacherId?: string, teacherName?: string, isProxy: boolean = false) => {
    setViewMode(mode);
    setIsProxyMode(isProxy);
    localStorage.setItem('is_proxy_mode', isProxy ? 'true' : 'false');

    if (teacherId) {
      setSelectedTeacherId(teacherId);
      setManagedTeacherName(teacherName || '未知老师');
      localStorage.setItem('selected_teacher_id', teacherId);
      if (teacherName) {
        localStorage.setItem('managed_teacher_name', teacherName);
      }
    } else {
      setSelectedTeacherId(null);
      setManagedTeacherName(null);
      localStorage.removeItem('selected_teacher_id');
      localStorage.removeItem('managed_teacher_name');
    }
    // 保存到 localStorage
    localStorage.setItem('view_mode', mode);
    console.log(`[TEACHER BINDING] Switched to view mode: ${mode}, teacherId: ${teacherId}, isProxy: ${isProxy}`);
  };

  // 保留兼容性：切换班级
  const switchClass = (className: string) => {
    console.log('🔧 [CLASS_CONTEXT] switchClass被调用，设置className为:', className);
    setCurrentClass(className);
    localStorage.setItem('current_class', className);
    console.log('🔧 [CLASS_CONTEXT] switchClass完成，currentClass已更新并保存到localStorage');
  };

  // 刷新班级列表
  const refreshClasses = async () => {
    await fetchClasses();
  };

  // 组件挂载时获取班级列表和恢复状态
  useEffect(() => {
    if (user) {
      fetchClasses();

      // 🆕 暴露刷新方法给全局，方便其他页面（如 Profile）强制刷新
      (window as any).refreshGlobalClasses = fetchClasses;

      // 🆕 从 localStorage 恢复上次的视图模式
      const savedViewMode = localStorage.getItem('view_mode') as ViewMode['type'];
      if (savedViewMode && ['MY_STUDENTS', 'ALL_SCHOOL', 'SPECIFIC_CLASS'].includes(savedViewMode)) {
        setViewMode(savedViewMode);
        // 恢复代理模式状态
        const savedIsProxy = localStorage.getItem('is_proxy_mode') === 'true';
        setIsProxyMode(savedIsProxy);

        // 恢复选中的老师ID
        const savedTeacherId = localStorage.getItem('selected_teacher_id');
        if (savedTeacherId) {
          setSelectedTeacherId(savedTeacherId);
          const savedName = localStorage.getItem('managed_teacher_name');
          if (savedName) {
            setManagedTeacherName(savedName);
          }
        }
      }

      // 从 localStorage 恢复上次选择的班级（兼容性）
      const savedClass = localStorage.getItem('current_class');
      if (savedClass && (savedClass === 'ALL' || availableClasses.some(c => c.name === savedClass))) {
        // 🆕 只有当savedClass在availableClasses中存在时才恢复，避免使用不匹配的班级名
        console.log('🔧 [CLASS_CONTEXT] 从localStorage恢复currentClass:', savedClass, 'availableClasses长度:', availableClasses.length);
        setCurrentClass(savedClass);
      } else if (savedClass && availableClasses.length === 0) {
        // 🆕 当API失败时，为避免className不匹配，清空currentClass
        console.log('🔧 [CLASS_CONTEXT] API失败且localStorage中的班级不存在，清空currentClass避免过滤问题');
        setCurrentClass('ALL');
      }
    }
  }, [user]);

  // 创建 context 值
  const contextValue: ClassContextType = {
    // 🆕 新的核心状态
    viewMode,
    selectedTeacherId,
    managedTeacherName,
    isProxyMode,
    availableClasses,
    switchViewMode,

    // 保留兼容性的状态
    currentClass,
    switchClass,

    isLoading,
    refreshClasses,
  };

  return (
    <ClassContext.Provider value={contextValue}>
      {children}
    </ClassContext.Provider>
  );
};

// 使用班级上下文的 Hook
export const useClass = (): ClassContextType => {
  const context = useContext(ClassContext);

  if (context === undefined) {
    throw new Error('useClass must be used within a ClassProvider');
  }

  return context;
};

export default ClassContext;
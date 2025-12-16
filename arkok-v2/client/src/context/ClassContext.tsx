import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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
  selectedTeacherId: string | null; // 当前选择的老师ID（用于SPECIFIC_CLASS模式）
  availableClasses: ClassInfo[];  // 可用的班级列表

  // 🆕 新的方法
  switchViewMode: (mode: ViewMode['type'], teacherId?: string) => void;  // 切换视图模式
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
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);  // 当前选择的老师ID
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🆕 智能路由逻辑：基于师生绑定的默认视图
  useEffect(() => {
    if (user) {
      if (user.role === 'TEACHER') {
        // 老师默认查看"我的学生"
        setViewMode('MY_STUDENTS');
        setCurrentClass('ALL');  // 不再依赖班级名
      } else if (user.role === 'ADMIN') {
        // 管理员默认查看全校
        setViewMode('ALL_SCHOOL');
        setCurrentClass('ALL');
      }
    }
  }, [user]);

  // 获取班级列表
  const fetchClasses = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/students/classes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const classes: ClassInfo[] = data.data.map((cls: any) => ({
            name: cls.className,
            studentCount: parseInt(cls.studentCount),
            isPrimaryClass: cls.className === user.primaryClassName,
            teacherId: cls.teacherId,
            teacherName: cls.teacherName || '未知老师'
          }));

          // 🆕 新的排序逻辑：当前老师的班级排第一，其他老师按学生数量排序
          classes.sort((a, b) => {
            // 当前老师的班级排最前面
            if (a.teacherId === user.userId) return -1;
            if (b.teacherId === user.userId) return 1;
            // 其他按学生数量排序
            return b.studentCount - a.studentCount;
          });

          setAvailableClasses(classes);
        }
      } else {
        console.error('Failed to fetch classes:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 切换视图模式 - 核心新功能
  const switchViewMode = (mode: ViewMode['type'], teacherId?: string) => {
    setViewMode(mode);
    if (teacherId) {
      setSelectedTeacherId(teacherId);
      localStorage.setItem('selected_teacher_id', teacherId);
    } else {
      setSelectedTeacherId(null);
      localStorage.removeItem('selected_teacher_id');
    }
    // 保存到 localStorage
    localStorage.setItem('view_mode', mode);
    console.log(`[TEACHER BINDING] Switched to view mode: ${mode}, teacherId: ${teacherId}`);
  };

  // 保留兼容性：切换班级
  const switchClass = (className: string) => {
    setCurrentClass(className);
    localStorage.setItem('current_class', className);
  };

  // 刷新班级列表
  const refreshClasses = async () => {
    await fetchClasses();
  };

  // 组件挂载时获取班级列表和恢复状态
  useEffect(() => {
    if (user) {
      fetchClasses();

      // 🆕 从 localStorage 恢复上次的视图模式
      const savedViewMode = localStorage.getItem('view_mode') as ViewMode['type'];
      if (savedViewMode && ['MY_STUDENTS', 'ALL_SCHOOL', 'SPECIFIC_CLASS'].includes(savedViewMode)) {
        setViewMode(savedViewMode);
        // 恢复选中的老师ID
        const savedTeacherId = localStorage.getItem('selected_teacher_id');
        if (savedTeacherId) {
          setSelectedTeacherId(savedTeacherId);
        }
      }

      // 从 localStorage 恢复上次选择的班级（兼容性）
      const savedClass = localStorage.getItem('current_class');
      if (savedClass && (savedClass === 'ALL' || availableClasses.some(c => c.name === savedClass))) {
        setCurrentClass(savedClass);
      }
    }
  }, [user]);

  // 创建 context 值
  const contextValue: ClassContextType = {
    // 🆕 新的核心状态
    viewMode,
    selectedTeacherId,
    switchViewMode,

    // 保留兼容性的状态
    currentClass,
    availableClasses,
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
/**
 * API 响应类型定义 - 遵循架构文档 4.1 节的强制规范
 * 禁止使用 as any，所有 API 响应必须类型安全
 */

// 标准API响应接口 - 全局统一
export interface ApiResponse<T = any> {
  success: boolean;           // 请求是否成功
  message?: string;           // 可选的错误或成功消息
  data: T;                    // 实际数据载荷，类型安全
  token?: string;             // 认证响应中的JWT令牌
  user?: any;                 // 认证响应中的用户信息
  timestamp?: string;         // 响应时间戳
}

// 分页响应接口
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any[];
  };
}

// 学生相关响应类型
export interface StudentsResponse {
  students: Student[];
  total: number;
}

export interface StudentResponse {
  student: Student;
}

// 习惯相关响应类型
export interface HabitsResponse {
  habits: Habit[];
  total: number;
}

export interface HabitStatsResponse {
  totalHabits: number;
  activeHabits: number;
  totalCheckIns: number;
  streakRates: Array<{
    habitId: string;
    habitName: string;
    avgStreakDays: number;
    totalCheckIns: number;
  }>;
  topParticipants: Array<{
    studentId: string;
    studentName: string;
    totalCheckIns: number;
    totalExp: number;
  }>;
}

// 任务相关响应类型
export interface TaskRecordsResponse {
  records: TaskRecord[];
  total: number;
}

// PK对决相关响应类型
export interface PKResponse {
  pkRecord: PKRecord;
  participants: Student[];
}

// 勋章相关响应类型
export interface BadgesResponse {
  badges: Badge[];
  userBadges: UserBadge[];
}

// 备课相关响应类型
export interface LessonPlanResponse {
  lessonPlan: LessonPlan;
  taskStats: {
    tasksCreated: number;
    totalStudents: number;
  };
}

// Dashboard统计响应类型
export interface DashboardStatsResponse {
  schoolStats: {
    totalStudents: number;
    totalPoints: number;
    totalExp: number;
    avgPoints: number;
    avgExp: number;
  };
  topStudents: Student[];
  ongoingPKs: PKRecord[];
  recentChallenges: Challenge[];
  classRanking: Array<{
    className: string;
    totalPoints: number;
    studentCount: number;
  }>;
}

// 类型守卫函数 - 安全的数据提取
export function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true } {
  return response.success === true;
}

export function isErrorResponse(response: any): response is ErrorResponse {
  return response && response.success === false && response.error;
}

export function extractData<T>(response: ApiResponse<T>): T | null {
  if (isSuccessResponse(response)) {
    return response.data;
  }
  return null;
}

export function extractErrorMessage(response: any): string {
  if (isErrorResponse(response)) {
    return response.error.message;
  }
  if (response?.message) {
    return response.message;
  }
  return '未知错误';
}

// 导入必要的类型定义（避免循环依赖）
import { Student } from './student';

// 类型定义占位符 - 实际项目中应该从对应的类型文件导入
export interface Habit {
  id: string;
  name: string;
  icon: string;
  description?: string;
  expReward: number;
  pointsReward?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskRecord {
  id: string;
  studentId: string;
  type: string;
  title: string;
  content?: any;
  status: string;
  expAwarded?: number;
  createdAt: string;
}

export interface PKRecord {
  id: string;
  participant1Id: string;
  participant2Id: string;
  status: string;
  winnerId?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: any;
  isActive: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
}

export interface LessonPlan {
  id: string;
  title: string;
  courseInfo: any;
  qcTasks: any[];
  normalTasks: any[];
  specialTasks: any[];
  createdAt: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  participants: string[];
  createdAt: string;
}
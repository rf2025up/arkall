// 学生相关类型定义

export interface Student {
  id: string;
  name: string;
  className: string;
  points: number;
  exp: number;
  level: number;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PointPreset {
  id?: string;
  label: string;
  value: number;
  category: string;
}

export interface AddScoreRequest {
  studentIds: string[];
  points: number;
  exp: number;
  reason: string;
}

export interface StudentListResponse {
  success?: boolean;
  data?: {
    students: Student[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  // 保持向后兼容性
  students?: Student[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ScoreUpdateEvent {
  type: 'SCORE_UPDATE';
  data: {
    studentIds: string[];
    points: number;
    exp: number;
    reason: string;
    timestamp: string;
    updatedBy: string;
    metadata?: Record<string, any>;
  };
}
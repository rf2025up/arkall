// 认证相关类型定义

export interface User {
  id: string;
  username: string;
  name: string;
  displayName?: string;
  email?: string;
  role: string;
  schoolId: string;
  schoolName?: string;
  primaryClassName?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  expiresIn?: number;
  data?: {
    user: User;
    token: string;
    expiresIn: number;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
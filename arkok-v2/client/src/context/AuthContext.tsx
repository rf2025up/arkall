import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthContextType, LoginResponse } from '../types/auth';

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 计算认证状态
  const isAuthenticated = Boolean(user && token);

  // 检查认证状态（应用启动时自动登录）
  const checkAuth = async () => {
    setIsLoading(true);

    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        // 验证 token 是否仍然有效
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${storedToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setToken(storedToken);
            setUser(data.user);
          } else {
            // token 无效，清除本地存储
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        } else {
          // token 验证失败，清除本地存储
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // 发生错误时也清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } finally {
      setIsLoading(false);
    }
  };

  // 登录方法
  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);

        // 存储到 localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));

        return { success: true };
      } else {
        return {
          success: false,
          message: data.message || '登录失败'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '网络错误，请稍后重试'
      };
    }
  };

  // 登出方法
  const logout = () => {
    setUser(null);
    setToken(null);

    // 清除本地存储
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  // 组件挂载时检查认证状态
  useEffect(() => {
    checkAuth();
  }, []);

  // 创建 context 值
  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的 Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
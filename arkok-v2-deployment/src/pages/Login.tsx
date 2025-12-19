import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoginRequest } from '../types/auth';
import { API } from '../services/api.service';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误信息
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim() || !formData.password.trim()) {
      setError('请输入用户名和密码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log("[AUTH FIX] Attempting login with:", { username: formData.username });

      // --- [AUTH FIX] 使用新的API服务 ---
      const response = await API.auth.login(formData);

      console.log("[AUTH FIX] Login API response:", response);
      console.log("[FINAL FIX] Response structure analysis:", {
        success: response.success,
        hasToken: !!response.token,
        hasUser: !!response.user,
        hasData: !!response.data,
        dataHasToken: !!response.data?.token,
        dataHasUser: !!response.data?.user
      });

      // --- [FINAL FIX] 修复数据结构不匹配问题 ---
      // API 返回的结构是 { success: true, token: "...", user: {...}, data: {...} }
      // 而不是 { success: true, data: { token: "...", user: {...} } }
      if (response.success && (response.token || response.data?.token)) {
        const token = response.token || response.data?.token;
        const user = response.user || response.data?.user;

        console.log("[FINAL FIX] Extracted token and user:", {
          hasToken: !!token,
          hasUser: !!user,
          tokenPreview: token?.substring(0, 20) + "..."
        });
        // --- [AUTH FIX] 强制重写：使用统一的键名存储Token ---
        console.log("[AUTH FIX] Login successful. Received token:", token?.substring(0, 20) + "...");
        console.log("[AUTH FIX] User data:", user);

        // --- 这是最关键的一步：将Token存入localStorage，使用统一键名 ---
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // 也保存旧的键名以保持兼容性（可选）
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));

        console.log("[AUTH FIX] Token stored to localStorage. Keys: 'token', 'auth_token'");

        // --- [FINAL FIX] 这是最关键的修复：执行跳转！ ---
        console.log("[FINAL FIX] Login successful! Preparing to navigate to home page.");
        console.log("[FINAL FIX] Current path:", window.location.pathname);

        try {
          // 强制跳转到首页
          navigate('/');
          console.log("[FINAL FIX] Navigation command executed");

          // 备用跳转方式（如果navigate不工作）
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              console.log("[FINAL FIX] Navigate didn't work, using window.location.href");
              window.location.href = '/';
            }
          }, 1000);

        } catch (navError) {
          console.error("[FINAL FIX] Navigation error:", navError);
          // 如果navigate出错，使用window.location
          window.location.href = '/';
        }
      } else {
        console.error("[FINAL FIX] Login failed. Response:", response);
        setError(response.message || '登录失败：用户名或密码错误');
      }
    } catch (err) {
      console.error('[AUTH FIX] Login error:', err);
      const errorMessage = err instanceof Error ? err.message : '网络错误，请稍后重试';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 默认管理员账号提示
  const handleQuickLogin = () => {
    setFormData({
      username: 'admin',
      password: '123456'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 头部 */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              欢迎回来
            </h1>
            <p className="text-gray-600">
              ArkOK V2 教育管理系统
            </p>
          </div>

          {/* 快速登录提示 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <p className="text-sm text-blue-800 mb-2">
              <strong>快速登录：</strong>点击下方按钮自动填入管理员账号
            </p>
            <button
              type="button"
              onClick={handleQuickLogin}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              使用管理员账号
            </button>
          </motion.div>

          {/* 错误提示 */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span className="text-red-800 text-sm">{error}</span>
            </motion.div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="pt-2"
            >
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '登录'
                )}
              </button>
            </motion.div>
          </form>

          {/* 底部信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-6 text-center text-xs text-gray-500"
          >
            <p>© 2024 ArkOK V2. All rights reserved.</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
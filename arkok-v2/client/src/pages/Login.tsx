import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, AlertCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
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


  return (
    <div className="min-h-screen bg-[#FFF5F0] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* 背景流光氛围 - 模拟星云 */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(at_10%_10%,rgba(255,153,102,0.3)_0,transparent_50%),radial-gradient(at_90%_90%,rgba(255,94,98,0.3)_0,transparent_50%),radial-gradient(at_50%_50%,rgba(255,255,255,0.8)_0,transparent_100%)]" />

      {/* 漂浮的星球装饰 */}
      <motion.div
        animate={{ translateY: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[10%] w-[100px] h-[100px] rounded-full bg-gradient-to-br from-[#FFD194] to-[#FF9966] blur-lg opacity-60 z-0"
      />
      <motion.div
        animate={{ translateY: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[15%] right-[15%] w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#a18cd1] to-[#fbc2eb] blur-lg opacity-60 z-0"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[400px] bg-white/90 backdrop-blur-[20px] rounded-[24px] p-10 shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-white/60 text-center relative z-10"
      >
        {/* Logo */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF9966] to-[#FF5E62] flex items-center justify-center mx-auto mb-6 text-white shadow-[0_10px_20px_rgba(255,94,98,0.4)]">
          <User className="w-8 h-8" />
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-[#1D1D1F] mb-2 tracking-tight">欢迎回来</h1>
        <p className="text-sm text-[#86868B] mb-8 tracking-wider">星途与伴游戏化激励学习系统</p>

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-left"
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="text-red-800 text-xs font-medium">{error}</span>
          </motion.div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-[#1D1D1F] pl-1">用户名</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#FF5E62] transition-colors" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                required
                disabled={isLoading}
                className="w-full bg-[#F5F5F7] hover:bg-[#EFEFF2] focus:bg-white border border-transparent focus:border-[#FF9966] rounded-xl py-3.5 pl-12 pr-4 text-sm text-[#1D1D1F] outline-none transition-all focus:ring-4 focus:ring-[#FF9966]/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[13px] font-semibold text-[#1D1D1F] pl-1">密码</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF] group-focus-within:text-[#FF5E62] transition-colors" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="请输入密码"
                required
                disabled={isLoading}
                className="w-full bg-[#F5F5F7] hover:bg-[#EFEFF2] focus:bg-white border border-transparent focus:border-[#FF9966] rounded-xl py-3.5 pl-12 pr-4 text-sm text-[#1D1D1F] outline-none transition-all focus:ring-4 focus:ring-[#FF9966]/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-br from-[#FF9966] to-[#FF5E62] text-white font-semibold rounded-2xl shadow-[0_8px_20px_rgba(255,94,98,0.4)] hover:shadow-[0_12px_24px_rgba(255,94,98,0.4)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              '登 录'
            )}
          </button>
        </form>

        {/* 体验入口 */}
        <div className="mt-8 pt-8 border-t border-slate-50">
          <button
            onClick={() => navigate('/experience')}
            className="w-full py-3 border-2 border-orange-100 text-orange-500 font-black rounded-2xl hover:bg-orange-50 hover:border-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles size={18} className="animate-pulse" />
            免注册一键体验演练场
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="mt-3 text-[10px] text-slate-400 font-bold">
            包含校长看板、老师备课、家长动态全流程演示
          </p>
        </div>

        <div className="mt-8 text-[12px] text-[#C7C7CC]">
          © 2025 星途与伴 V1.0. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
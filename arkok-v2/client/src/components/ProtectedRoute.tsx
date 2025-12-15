import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              正在验证身份...
            </h2>
            <p className="text-gray-600 text-sm">
              请稍候，我们正在确认您的登录状态
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 未登录时显示访问被拒绝页面，然后自动跳转
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
        >
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-4"
            >
              <ShieldX className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              访问被拒绝
            </h1>

            <p className="text-gray-600 mb-6">
              您需要登录才能访问此页面
            </p>

            <div className="space-y-3 w-full">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>原因：</strong>未检测到有效的登录凭证
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>解决方案：</strong>请登录后重试
                </p>
                <p className="text-xs text-blue-600">
                  如需帮助，请联系系统管理员
                </p>
              </div>
            </div>

            <div className="pt-4 w-full">
              <p className="text-xs text-gray-500 mb-2">
                正在自动跳转到登录页面...
              </p>

              {/* 自动跳转组件 */}
              <Navigate
                to={redirectTo}
                state={{ from: location.pathname }}
                replace
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 已登录，渲染子组件
  return children || <Outlet />;
};

export default ProtectedRoute;
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const PlatformProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/platform-login" state={{ from: window.location.pathname }} replace />;
    }

    if (user?.role !== 'PLATFORM_ADMIN') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl shadow-gray-200/50 border border-gray-100 text-center relative overflow-hidden"
                >
                    {/* 背景装饰 */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500" />

                    <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
                        <ShieldAlert size={48} strokeWidth={1.5} />
                    </div>

                    <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">越权访问</h1>

                    <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                        抱歉，您当前登录的账号（{user?.username}）不具备超级管理员权限。该控制台仅供 ArkOK 平台方进行跨校区运营管理使用。
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="w-full h-14 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-200 hover:bg-black transition-all active:scale-95"
                        >
                            返回教学系统
                        </button>
                        <p className="text-xs text-gray-400">错误代码: ERR_PLATFORM_ADMIN_REQUIRED</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return children ? <>{children}</> : <Outlet />;
};

export default PlatformProtectedRoute;

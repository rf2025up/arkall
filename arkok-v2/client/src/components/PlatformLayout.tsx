import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    School,
    Library,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    User as UserIcon,
    Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PlatformLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { name: '全局概览', path: '/platform', icon: LayoutDashboard },
        { name: '校区管理', path: '/platform/campuses', icon: School },
        { name: '教学资源库', path: '/platform/library', icon: Library },
        { name: '平台设置', path: '/platform/settings', icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#F0F2F5] overflow-hidden font-sans">
            {/* 侧边导航栏 */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? '80px' : '260px' }}
                className="relative h-full bg-white border-r border-gray-200 shadow-xl z-50 flex flex-col transition-all duration-300 ease-in-out"
            >
                {/* Logo 区域 */}
                <div className="h-20 flex items-center px-6 overflow-hidden">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: 'linear-gradient(135deg, #FF8C00 0%, #FF5500 100%)' }}
                    >
                        <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="ml-4 font-bold text-xl text-gray-800 whitespace-nowrap"
                            >
                                ArkOK <span className="text-[#FF5500]">SaaS</span>
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                {/* 菜单列表 */}
                <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || (item.path !== '/platform' && location.pathname.startsWith(item.path));
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                  flex items-center h-12 rounded-xl transition-all duration-200 px-3
                  ${isActive
                                        ? 'bg-[#FFF5EB] text-[#FF5500] shadow-sm'
                                        : 'text-gray-500 hover:bg-gray-100'
                                    }
                `}
                            >
                                <Icon className={`w-6 h-6 shrink-0 ${isActive ? 'text-[#FF5500]' : 'text-gray-400'}`} />
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="ml-4 font-medium whitespace-nowrap overflow-hidden"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        );
                    })}
                </nav>

                {/* 底部用户信息 */}
                <div className="p-4 border-t border-gray-100">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-2'}`}>
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm">
                            <UserIcon className="text-gray-400 w-6 h-6" />
                        </div>
                        {!isCollapsed && (
                            <div className="ml-3 overflow-hidden">
                                <p className="text-sm font-bold text-gray-800 truncate">{user?.name || '管理员'}</p>
                                <p className="text-xs text-gray-400 truncate">超级管理员</p>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`w-full mt-4 flex items-center h-10 rounded-xl text-red-500 hover:bg-red-50 transition-all ${isCollapsed ? 'justify-center' : 'px-3'}`}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span className="ml-3 text-sm font-medium">安全退出</span>}
                    </button>
                </div>

                {/* 折叠按钮 */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-24 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-50 text-gray-400"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </motion.aside>

            {/* 主内容区域 */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-100/30 to-transparent rounded-full -mr-48 -mt-48 pointer-events-none" />

                {/* 顶部状态栏 */}
                <header className="h-20 bg-white/70 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {menuItems.find(i => location.pathname === i.path || (i.path !== '/platform' && location.pathname.startsWith(i.path)))?.name || '管理面板'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-1">欢迎回来，ArkOK SaaS 平台的守护者</p>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>
                        <div className="h-8 w-px bg-gray-200 mx-2" />
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-700">系统状态</p>
                            <p className="text-xs text-green-500 flex items-center justify-end">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                                运行平稳
                            </p>
                        </div>
                    </div>
                </header>

                {/* 内容滚动区域 */}
                <main className="flex-1 overflow-y-auto p-8 relative z-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default PlatformLayout;

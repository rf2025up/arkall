import React from 'react';
import {
  Users,
  BookOpen,
  Shield,
  User,
  Camera
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: '班级', icon: Users },
    { path: '/prep', label: '备课', icon: BookOpen },
    { path: '/qc', label: '过关', icon: Shield },
    { path: '/profile', label: '我的', icon: User },
  ];

  return (
    <>
      {/* 底部导航栏 - 真正固定在视口底部 + 底部安全区适配 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] pt-2 px-3 flex justify-around items-center z-[9999] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16">
        {/* 4个Tab + 中间相机按钮 */}
        {navItems.slice(0, 2).map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-1 transition-colors flex-1 ${
                isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* 中间相机按钮 - 占据一个tab的位置 */}
        <div className="flex flex-col items-center justify-center p-1 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-200 text-white">
            <Camera size={20} strokeWidth={2} />
          </div>
        </div>

        {navItems.slice(2).map((item) => {
          const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-1 transition-colors flex-1 ${
                isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default BottomNav;
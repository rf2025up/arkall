import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, School } from 'lucide-react';
import BottomNav from './BottomNav';
import MessageCenter from './MessageCenter';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // 判断是否需要显示顶部导航（某些页面可能自带顶部）
  const showTopNav = !['/', '/student/'].some(path =>
    location.pathname === path || location.pathname.startsWith('/student/')
  );

  return (
    <div className="min-h-screen w-full bg-background">
      {/* 顶部导航栏 - 包含消息中心 */}
      {showTopNav && (
        <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-40 px-4 py-3 flex justify-between items-center">
          <div className="text-lg font-bold text-gray-800">
            {getPageTitle(location.pathname)}
          </div>
          <MessageCenter />
        </div>
      )}

      {/* 可滚动的主要内容区域 */}
      <main className={`min-h-screen ${showTopNav ? 'pt-14' : ''}`}>
        <Outlet />
      </main>

      {/* 固定底部导航栏 */}
      <BottomNav />
    </div>
  );
}

// 获取页面标题
function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/prep')) return '备课教学';
  if (pathname.startsWith('/qc')) return '基础过关';
  if (pathname.startsWith('/profile')) return '我的';
  if (pathname.startsWith('/habits')) return '习惯打卡';
  if (pathname.startsWith('/challenges')) return '挑战记录';
  if (pathname.startsWith('/pk')) return 'PK 对决';
  if (pathname.startsWith('/badges')) return '勋章墙';
  return 'ArkOK';
}

export default Layout;
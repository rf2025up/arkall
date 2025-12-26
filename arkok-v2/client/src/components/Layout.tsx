import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, School } from 'lucide-react';
import BottomNav from './BottomNav';
import MessageCenter from './MessageCenter';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // 判断是否需要显示顶部导航（某些页面自带顶部）
  const showTopNav = !['/', '/student/', '/prep', '/qc', '/profile', '/habits', '/badges', '/pk', '/challenges', '/teachers', '/students-manage'].some(path =>
    location.pathname === path ||
    location.pathname.startsWith('/student/') ||
    location.pathname.startsWith('/prep') ||
    location.pathname.startsWith('/qc') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/habits') ||
    location.pathname.startsWith('/badges') ||
    location.pathname.startsWith('/pk') ||
    location.pathname.startsWith('/challenges') ||
    location.pathname.startsWith('/teachers') ||
    location.pathname.startsWith('/students-manage')
  );

  return (
    <div className="min-h-screen w-full bg-[#F5F7FA]">
      {/* 🆕 顶部导航栏 - 橙色渐变风格 */}
      {showTopNav && (
        <div
          className="fixed top-0 left-0 right-0 z-40 px-5 pt-12 pb-4"
          style={{ background: 'linear-gradient(160deg, #FF8C00 0%, #FF5500 100%)' }}
        >
          {/* 背景纹理装饰 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -left-1/5 w-[200%] h-[200%]"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)' }}
            />
          </div>

          <div className="relative z-10 flex justify-between items-center">
            <h1 className="text-xl font-bold text-white tracking-wide">
              {getPageTitle(location.pathname)}
            </h1>
          </div>
        </div>
      )}

      {/* 可滚动的主要内容区域 */}
      <main className={`min-h-screen ${showTopNav ? 'pt-24' : ''}`}>
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
  return '';
}

export default Layout;
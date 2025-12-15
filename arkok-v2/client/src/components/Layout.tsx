import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, School } from 'lucide-react';
import BottomNav from './BottomNav';

export function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* 可滚动的主要内容区域 */}
      <main className="min-h-screen">
        <Outlet />
      </main>

      {/* 固定底部导航栏 */}
      <BottomNav />
    </div>
  );
}

export default Layout;
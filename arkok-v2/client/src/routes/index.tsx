import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import Login from '../pages/Login';
import Home from '../pages/Home';
import PrepView from '../pages/PrepView';
import QCView from '../pages/QCView';
import StudentGrid from '../pages/StudentGrid';
import StudentDetail from '../pages/StudentDetail';
import Dashboard from '../pages/Dashboard';
import BigScreen from '../pages/BigScreen';
import HabitPage from '../pages/HabitPage';
import ChallengePage from '../pages/ChallengePage';
import PKPage from '../pages/PKPage';
import BadgePage from '../pages/BadgePage';
import Profile from '../pages/Profile';
import TeacherManagement from '../pages/TeacherManagement';
import { ParentLogin, ParentLayout, TodayTimeline, GrowthProfile, SchoolConnect } from '../pages/parent';

// 创建路由配置
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
    errorElement: <div className="flex items-center justify-center min-h-screen">登录页面加载错误</div>,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    errorElement: <div className="flex items-center justify-center min-h-screen">页面加载错误</div>,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'prep',
        element: <PrepView />,
      },
      {
        path: 'qc',
        element: <QCView />,
      },
      {
        path: 'students',
        element: <StudentGrid />,
      },
      {
        path: 'student/:studentId',
        element: <StudentDetail />,
      },
      {
        path: 'habits',
        element: <HabitPage />,
      },
      {
        path: 'challenges',
        element: <ChallengePage />,
      },
      {
        path: 'pk',
        element: <PKPage />,
      },
      {
        path: 'badges',
        element: <BadgePage />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'teachers',
        element: <TeacherManagement />,
      },
    ],
  },
  // ==================== 家长端路由 ====================
  {
    path: '/parent/login',
    element: <ParentLogin schoolId="625e503b-aa7e-44fe-9982-237d828af717" />,
    errorElement: <div className="flex items-center justify-center min-h-screen">家长登录页加载错误</div>,
  },
  {
    path: '/parent',
    element: <ParentLayout />,
    errorElement: <div className="flex items-center justify-center min-h-screen">家长端加载错误</div>,
    children: [
      {
        path: 'timeline/:studentId',
        element: <TodayTimeline />,
      },
      {
        path: 'growth/:studentId',
        element: <GrowthProfile />,
      },
      {
        path: 'connect/:studentId',
        element: <SchoolConnect />,
      },
    ],
  },
  // ==================== 大屏路由 ====================
  {
    path: '/bigscreen',
    element: (
      <ProtectedRoute>
        <BigScreen />
      </ProtectedRoute>
    ),
    errorElement: <div className="flex items-center justify-center min-h-screen bg-black text-white">大屏加载错误</div>,
  },
  {
    path: '/screen',
    element: (
      <ProtectedRoute>
        <BigScreen />
      </ProtectedRoute>
    ),
    errorElement: <div className="flex items-center justify-center min-h-screen bg-black text-white">大屏加载错误</div>,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
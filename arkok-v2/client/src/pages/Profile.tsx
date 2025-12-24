import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Bell, Info, LogOut, Sparkles, Users, GraduationCap, ChevronDown, UserPlus, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClass } from '../context/ClassContext';
import apiService from '../services/api.service';


interface ProfileProps { }

interface ClassInfo {
  name: string;
  studentCount: number;
}

const Profile: React.FC<ProfileProps> = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate(); // 需要添加导航功能

  // 基础菜单项
  const baseMenuItems = [
    { icon: Users, label: '切换班级', color: 'text-orange-500' },
    { icon: Shield, label: '隐私与安全', color: 'text-orange-500' },
    { icon: Bell, label: '通知设置', color: 'text-orange-500' },
  ];

  // 动态菜单项 - 管理员和教师显示不同管理选项
  const menuItems = user?.role === 'ADMIN'
    ? [
      { icon: Users, label: '教师管理', color: 'text-orange-500', onClick: () => navigate('/teachers') },
      ...baseMenuItems
    ]
    : baseMenuItems;

  const bottomItems = [
    { icon: Info, label: '关于我们', color: 'text-gray-500' },
    { icon: Info, label: '帮助与反馈', color: 'text-gray-500' },
  ]

  const [permOpen, setPermOpen] = useState(false);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [isTeachersLoading, setIsTeachersLoading] = useState(false);

  const { viewMode, selectedTeacherId, managedTeacherName, switchViewMode, isProxyMode } = useClass();

  // 班级数据
  const [classes, setClasses] = useState<string[]>(['三年级一班', '三年级二班', '三年级三班']);
  const [teacherClass, setTeacherClass] = useState<string>('三年级一班');
  const [classInfos, setClassInfos] = useState<ClassInfo[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // 🆕 新增老师弹窗状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    name: '',
    primaryClassName: ''
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const availableClasses = [
    '一年级1班', '一年级2班', '二年级1班', '二年级2班',
    '三年级1班', '三年级2班', '四年级1班', '四年级2班',
    '五年级1班', '五年级2班', '六年级1班', '六年级2班'
  ];
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classStudents, setClassStudents] = useState<any[]>([]);

  // 加载班级学生信息
  const fetchClassStudents = async (className: string) => {
    if (!token) return;

    try {
      console.log(`🔍 [PROFILE] 获取班级学生: ${className}`);
      const response = await apiService.get('/students');

      if (response.success && response.data) {
        const studentsData = (response.data as { students: any[] }).students;
        // 过滤指定班级的学生
        const classStudentList = studentsData.filter(student =>
          student.className === className && student.isActive !== false
        );

        console.log(`✅ [PROFILE] ${className} 学生数量: ${classStudentList.length}`);
        setClassStudents(classStudentList);

        // 更新班级信息
        setClassInfos(prev => prev.map(cls =>
          cls.name === className
            ? { ...cls, studentCount: classStudentList.length }
            : cls
        ));
      }
    } catch (error) {
      console.error(`❌ [PROFILE] 获取班级学生失败:`, error);
      setClassStudents([]);
    }
  };

  // 初始化班级信息
  useEffect(() => {
    const initialClassInfos = classes.map(className => ({
      name: className,
      studentCount: 0
    }));
    setClassInfos(initialClassInfos);

    // 加载当前选中班级的学生
    fetchClassStudents(teacherClass);
  }, [token, classes, teacherClass]); // Added dependencies

  const renderItem = (item: any, idx: number) => (
    <div
      key={idx}
      onClick={() => {
        if (item.onClick) {
          item.onClick();
        } else if (item.label === '切换班级') {
          handleOpenClassSwitch();
        }
      }}
      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full bg-orange-50 ${item.color}`}>
          <item.icon size={20} />
        </div>
        <span className="text-gray-700 font-medium">{item.label}</span>
      </div>
      <div className="flex items-center gap-2">
        {item.label === '教师管理' && (
          <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-[10px] font-bold text-orange-600">管理校区</span>
        )}
        <ChevronRight size={20} className="text-gray-300" />
      </div>
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const toggleStudentSelection = (studentName: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentName)
        ? prev.filter(s => s !== studentName)
        : [...prev, studentName]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudents(classStudents.map(s => s.name));
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  const handleOpenClassSwitch = async () => {
    setPermOpen(true);
    setIsTeachersLoading(true);
    try {
      const response = await apiService.get('/users');
      if (response.success) {
        setAllTeachers(response.data as any[]);
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setIsTeachersLoading(false);
    }
  };

  // 🆕 创建教师
  const handleCreateTeacher = async () => {
    if (!createForm.username || !createForm.name) {
      setCreateError('用户名和姓名为必填项');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await apiService.users.create({
        ...createForm
      });

      if (response.success) {
        setIsCreateModalOpen(false);
        setCreateForm({ username: '', name: '', primaryClassName: '' });
        await handleOpenClassSwitch(); // 刷新名录

        // 🆕 强制刷新 ClassContext 中的班级列表，确保首页抽屉也能看到新老师
        try {
          await (window as any).refreshGlobalClasses?.();
        } catch (e) {
          console.error('Failed to call global refresh:', e);
        }
      } else {
        setCreateError(response.message || '创建失败');
      }
    } catch (err: any) {
      setCreateError(err.message || '网络错误');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] pb-24">

      {/* 🆕 “精致沉浸·极简版” Header (我的页) */}
      <div
        className="pt-8 pb-5 px-6 rounded-b-[30px] shadow-lg shadow-orange-200/20 overflow-hidden mb-6 relative"
        style={{ background: isProxyMode ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-white/10 blur-[80px] rounded-full" />
        </div>

        <div className="relative z-10">
          {/* 用户基础信息卡片 (融入 Header 风格，集成铃铛) */}
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3.5 rounded-[24px] border border-white/10">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=256&h=256&auto=format&fit=crop"
                alt="教师"
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/20 bg-gray-100"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1">
              <h2 className="font-black text-white text-base tracking-tight leading-tight">
                {viewMode === 'SPECIFIC_CLASS' ? `代管理：${managedTeacherName || '未知'}班级` : user?.name || '龙老师'}
              </h2>
              <p className="text-white/60 text-[9px] font-bold tracking-widest uppercase mt-0.5">
                {viewMode === 'SPECIFIC_CLASS' ? 'COLLABORATIVE PROXY MODE' : `ID: ${user?.id?.slice(-8) || '12345678'}`}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPermOpen(true)}
                className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white active:scale-95 transition-all border border-white/5"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-3 mb-6">
        <h3 className="text-xs font-bold text-gray-400 ml-2">账户与数据管理</h3>
        {menuItems.map(renderItem)}
      </div>

      <div className="px-5 space-y-3">
        <h3 className="text-xs font-bold text-gray-400 ml-2">应用通用设置</h3>
        {bottomItems.map(renderItem)}
      </div>

      <button onClick={handleLogout} className="mt-8 mx-5 w-[calc(100%-40px)] bg-white text-red-500 font-bold py-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all">
        退出登录
      </button>

      {/* 视角切换弹窗 */}
      {permOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-gray-800 text-lg tracking-tight">切换管理视角</h3>
              <div onClick={() => setPermOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl">
                <X size={20} />
              </div>
            </div>

            {/* 协同代理：视角选择列表 */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {/* 我的班级选项 */}
              <div
                onClick={() => {
                  switchViewMode('MY_STUDENTS');
                  setPermOpen(false);
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${viewMode === 'MY_STUDENTS'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${viewMode === 'MY_STUDENTS' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-400 border border-gray-100'}`}>
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">我的学生/班级</p>
                    <p className="text-[10px] text-gray-500">回到您的主要管理页面</p>
                  </div>
                </div>
                {viewMode === 'MY_STUDENTS' && (
                  <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </div>

              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">代理其他老师</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              {isTeachersLoading ? (
                <div className="py-12 text-center text-gray-400">
                  <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                  <p className="text-xs font-medium">同步校内名录...</p>
                </div>
              ) : (
                <>
                  {/* 🆕 校长特权：新增老师入口 */}
                  {user?.role === 'ADMIN' && (
                    <div
                      onClick={() => {
                        setPermOpen(false);
                        setIsCreateModalOpen(true);
                      }}
                      className="p-4 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 transition-all cursor-pointer flex items-center justify-between hover:border-orange-400 group mb-3 shadow-inner"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white text-orange-500 border border-orange-100 group-hover:scale-110 transition-transform">
                          <UserPlus size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-orange-600 text-sm">新增校内老师</p>
                          <p className="text-[10px] text-orange-400">快速扩充本校教职员工名录</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-orange-300" />
                    </div>
                  )}

                  {allTeachers.filter(t => {
                    // 1. 始终排除自己
                    if (t.id === user?.id) return false;
                    // 2. 如果当前用户是普通老师，则只能看到角色为 TEACHER 的同事（禁止穿透到系统管理员/校长账号）
                    if (user?.role === 'TEACHER' && t.role === 'ADMIN') return false;
                    // 3. 校长 (ADMIN) 可以看到当前校区的所有老师 (findMany 已经按 schoolId 过滤了)
                    return true;
                  }).map((teacher) => (
                    <div
                      key={teacher.id}
                      onClick={() => {
                        switchViewMode('SPECIFIC_CLASS', teacher.id, teacher.name, true);
                        setPermOpen(false);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedTeacherId === teacher.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-50 bg-gray-50 hover:border-gray-200'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${selectedTeacherId === teacher.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-400 border border-gray-100'}`}>
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{teacher.name} 的班级</p>
                          <p className="text-[10px] text-gray-500">{teacher.primaryClassName || '校区主班级'}</p>
                        </div>
                      </div>
                      {selectedTeacherId === teacher.id && (
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-md shadow-orange-200">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setPermOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-gray-50 text-gray-500 text-sm font-bold active:scale-95 transition-all text-center border border-gray-100"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 新增老师弹窗 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden relative">
            {/* 背景装饰 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 opacity-50" />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-gray-800 text-xl tracking-tight">新增教师</h3>
                  <p className="text-xs text-gray-500 mt-1">初始密码默认为 <span className="text-orange-600 font-bold">0000</span></p>
                </div>
                <div onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors">
                  <X size={20} />
                </div>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-500 text-xs rounded-xl flex items-center gap-2">
                  <Info size={14} />
                  {createError}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">真实姓名</label>
                  <input
                    type="text"
                    value={createForm.name}
                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="例如：龙老师"
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">登录账号</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="用于登录系统的唯一ID"
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">主理班级</label>
                  <select
                    value={createForm.primaryClassName}
                    onChange={e => setCreateForm({ ...createForm, primaryClassName: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-orange-500/20 transition-all font-medium appearance-none"
                  >
                    <option value="">暂不分配班级</option>
                    {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  disabled={isCreating}
                  onClick={handleCreateTeacher}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={18} />
                      即刻创建
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
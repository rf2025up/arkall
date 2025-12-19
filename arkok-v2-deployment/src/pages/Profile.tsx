import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield, Bell, Info, LogOut, Sparkles, Users, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api.service';

interface ProfileProps {}

interface ClassInfo {
  name: string;
  studentCount: number;
}

const Profile: React.FC<ProfileProps> = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate(); // 需要添加导航功能

  // 基础菜单项
  const baseMenuItems = [
    { icon: Sparkles, label: '校区权限', color: 'text-orange-500' },
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
  const [principalPassword, setPrincipalPassword] = useState('');
  const [principalVerified, setPrincipalVerified] = useState(false);
  const PRINCIPAL_PASSWORD = '0000';
  const [newClassName, setNewClassName] = useState('');
  const [renameIndex, setRenameIndex] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [roleSelection, setRoleSelection] = useState<'teacher'|'principal'>('teacher');

  // 班级数据
  const [classes, setClasses] = useState<string[]>(['三年级一班', '三年级二班', '三年级三班']);
  const [teacherClass, setTeacherClass] = useState<string>('三年级一班');
  const [classInfos, setClassInfos] = useState<ClassInfo[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
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
  }, [token]);

  const renderItem = (item: any, idx: number) => (
    <div
      key={idx}
      onClick={() => {
        if (item.onClick) {
          item.onClick();
        } else if (item.label === '校区权限') {
          setPermOpen(true);
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
      <ChevronRight size={20} className="text-gray-300" />
    </div>
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
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

  return (
    <div className="min-h-screen bg-[#F2F4F7] text-[#1E293B] p-4 pb-24">
       <h1 className="text-xl font-bold text-gray-800 mb-6">我的</h1>

       {/* User Profile Snippet */}
       <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex items-center space-x-4">
          <img src="https://picsum.photos/80/80" alt="教师" className="w-16 h-16 rounded-full" />
          <div className="flex-1">
              <h2 className="font-bold text-lg">淘气的豆豆</h2>
              <div className="flex items-center gap-2">
                <p className="text-gray-400 text-xs">编号：12345678</p>
                {roleSelection === 'principal' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500 text-white">校长权限</span>
                )}
              </div>
          </div>
          <ChevronRight className="text-gray-300" />
       </div>

       <div className="space-y-3 mb-6">
           <h3 className="text-xs font-bold text-gray-400 ml-2">账户与数据管理</h3>
           {menuItems.map(renderItem)}
       </div>

       <div className="space-y-3">
           <h3 className="text-xs font-bold text-gray-400 ml-2">应用通用设置</h3>
           {bottomItems.map(renderItem)}
       </div>

      <button onClick={handleLogout} className="mt-8 w-full bg-white text-red-500 font-bold py-3 rounded-xl shadow-sm">
          退出登录
      </button>

      {permOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="bg-white w-full max-w-md rounded-2xl p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">校区权限</h3>

            {/* 权限切换 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={()=>{
                  setRoleSelection('teacher');
                  setPrincipalVerified(false);
                  setPrincipalPassword('');
                }}
                className={`p-2 rounded-xl ${roleSelection==='teacher'?'bg-orange-500 text-white':'bg-gray-100 text-gray-700'}`}
              >
                老师
              </button>
              <button
                onClick={()=>{
                  setRoleSelection('principal');
                  setPrincipalVerified(false);
                }}
                className={`p-2 rounded-xl ${roleSelection==='principal'?'bg-orange-500 text-white':'bg-gray-100 text-gray-700'}`}
              >
                校长
              </button>
            </div>

            {/* 老师权限：班级选择 */}
            {roleSelection === 'teacher' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">选择班级</label>
                <select
                  value={teacherClass}
                  onChange={e => {
                    const newClass = e.target.value;
                    setTeacherClass(newClass);
                    localStorage.setItem('teacherClass', newClass);
                    setSelectedClass(newClass);
                    fetchClassStudents(newClass);
                  }}
                  className="w-full p-2 rounded-xl bg-gray-50 text-sm outline-none border border-gray-200"
                >
                  {classInfos.map(c => (
                    <option key={c.name} value={c.name}>
                      {c.name} ({c.studentCount}人)
                    </option>
                  ))}
                </select>

                {/* 显示选中班级的学生列表 */}
                {classStudents.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-bold text-gray-800">
                        选择学生 ({selectedStudents.length}/{classStudents.length})
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllStudents}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                        >
                          全选
                        </button>
                        <button
                          onClick={clearSelection}
                          className="text-xs px-2 py-1 bg-gray-500 text-white rounded"
                        >
                          清空
                        </button>
                      </div>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {classStudents.map(student => (
                        <label key={student.id} className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.name)}
                            onChange={() => toggleStudentSelection(student.name)}
                            className="mr-2"
                          />
                          {student.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 校长权限：密码验证 */}
            {roleSelection === 'principal' && !principalVerified && (
              <div className="mb-3">
                <input
                  value={principalPassword}
                  onChange={e=>setPrincipalPassword(e.target.value)}
                  placeholder="输入校长密码"
                  type="password"
                  className="w-full p-2 rounded-xl bg-gray-50 text-sm outline-none border"
                />
                <button
                  onClick={()=>{
                    if(principalPassword === PRINCIPAL_PASSWORD){
                      setPrincipalVerified(true);
                      setPrincipalPassword('');
                    } else {
                      alert('密码错误');
                    }
                  }}
                  className="w-full mt-2 p-2 rounded-xl bg-orange-500 text-white text-sm font-bold"
                >
                  验证
                </button>
              </div>
            )}

            {/* 校长权限：班级管理 */}
            {roleSelection === 'principal' && principalVerified && (
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-2">班级名称管理</h4>

                {/* 班级信息显示 */}
                <div className="mb-3">
                  {classInfos.map((classInfo, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg mb-1">
                      <span className="text-sm">{classInfo.name}</span>
                      <span className="text-xs text-gray-500">{classInfo.studentCount}人</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={newClassName}
                    onChange={e=>setNewClassName(e.target.value)}
                    placeholder="新增班级名称"
                    className="flex-1 p-2 rounded-xl bg-white text-sm outline-none border"
                  />
                  <button
                    onClick={()=>{
                      if(newClassName.trim()){
                        setClasses([...classes, newClassName.trim()]);
                        setClassInfos([...classInfos, { name: newClassName.trim(), studentCount: 0 }]);
                        setNewClassName('');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold"
                  >
                    新增
                  </button>
                </div>
                <div className="space-y-2">
                  {classes.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        value={renameIndex===idx?renameValue:c}
                        onChange={e=>{
                          setRenameIndex(idx);
                          setRenameValue(e.target.value);
                        }}
                        className="flex-1 p-2 rounded-xl bg-white text-sm outline-none border"
                      />
                      <button
                        onClick={()=>{
                          if(renameIndex === idx && renameValue.trim()) {
                            const next = [...classes];
                            next[idx] = renameValue;
                            setClasses(next);
                            setClassInfos(prev => prev.map(cls =>
                              cls.name === c ? { ...cls, name: renameValue } : cls
                            ));
                            setRenameIndex(null);
                            setRenameValue('');
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-orange-500 text-white text-sm"
                      >
                        保存
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  // 保存设置到localStorage
                  localStorage.setItem('identity', roleSelection);
                  setPermOpen(false);
                }}
                className="flex-1 p-2 rounded-xl bg-orange-500 text-white text-sm"
              >
                保存设置
              </button>
              <button
                onClick={() => setPermOpen(false)}
                className="flex-1 p-2 rounded-xl bg-gray-100 text-gray-700 text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
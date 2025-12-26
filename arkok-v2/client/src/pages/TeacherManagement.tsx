import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Edit, Users, School, Calendar, Mail, Key, Shield, X, Check } from 'lucide-react';
import MessageCenter from '../components/MessageCenter';

interface Teacher {
  id: string;
  username: string;
  name: string;
  displayName?: string;
  email?: string;
  role: string;
  primaryClassName?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateTeacherData {
  username: string;
  name: string;
  primaryClassName?: string;
}

const TeacherManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 新增教师表单状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTeacherData>({
    username: '',
    name: '',
    primaryClassName: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  // 编辑教师表单状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState<CreateTeacherData>({
    username: '',
    name: '',
    primaryClassName: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // 可用的班级列表（简化版，实际应从API获取）
  const availableClasses = [
    '一年级1班',
    '一年级2班',
    '二年级1班',
    '二年级2班',
    '三年级1班',
    '三年级2班',
    '四年级1班',
    '四年级2班',
    '五年级1班',
    '五年级2班',
    '六年级1班',
    '六年级2班'
  ];

  // 获取教师列表
  const fetchTeachers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setTeachers(data.data);
      } else {
        setError(data.message || '获取教师列表失败');
      }
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
      setError('网络错误，获取教师列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 创建教师
  const handleCreateTeacher = async () => {
    if (!createForm.username || !createForm.name) {
      setError('用户名和姓名为必填项');
      return;
    }

    setIsCreating(true);
    setError(null);

    // 构造提交数据，设置默认密码和自动映射显示名称
    const submitData = {
      username: createForm.username,
      password: '0000', // 默认密码
      name: createForm.name,
      displayName: createForm.name, // 自动映射显示名称
      primaryClassName: createForm.primaryClassName
    };

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (data.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          username: '',
          name: '',
          primaryClassName: ''
        });
        await fetchTeachers();
      } else {
        setError(data.message || '创建教师失败');
      }
    } catch (err) {
      console.error('Failed to create teacher:', err);
      setError('网络错误，创建教师失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 编辑教师
  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setEditForm({
      username: teacher.username,
      name: teacher.name,
      primaryClassName: teacher.primaryClassName || ''
    });
    setIsEditModalOpen(true);
  };

  // 更新教师
  const handleUpdateTeacher = async () => {
    if (!editingTeacher || !editForm.name) {
      setError('姓名为必填项');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${editingTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          displayName: editForm.name,
          primaryClassName: editForm.primaryClassName
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsEditModalOpen(false);
        setEditingTeacher(null);
        setEditForm({
          username: '',
          name: '',
          primaryClassName: ''
        });
        await fetchTeachers();
      } else {
        setError(data.message || '更新教师失败');
      }
    } catch (err) {
      console.error('Failed to update teacher:', err);
      setError('网络错误，更新教师失败');
    } finally {
      setIsUpdating(false);
    }
  };

  // 重置密码
  const handleResetPassword = async (teacherId: string, teacherName: string) => {
    if (!confirm(`确定要重置教师"${teacherName}"的密码吗？\n重置后的密码为：0000`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${teacherId}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('密码重置成功！新密码为：0000');
      } else {
        setError(data.message || '重置密码失败');
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
      setError('网络错误，重置密码失败');
    }
  };

  // 删除教师
  const handleDeleteTeacher = async (teacherId: string, teacherName: string) => {
    if (!confirm(`确定要删除教师"${teacherName}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/users/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        await fetchTeachers();
      } else {
        setError(data.message || '删除教师失败');
      }
    } catch (err) {
      console.error('Failed to delete teacher:', err);
      setError('网络错误，删除教师失败');
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // 权限检查 - 只有管理员能访问
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">权限不足</h2>
          <p className="text-gray-500">只有管理员才能访问教师管理功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* 🆕 “精致沉浸·精准排版” Header (对齐过关页风格) */}
      <div
        className="pt-10 pb-6 px-6 rounded-b-[30px] shadow-lg shadow-orange-200/20 overflow-hidden mb-6 relative"
        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
      >
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-white/10 blur-[80px] rounded-full" />
        </div>

        <div className="relative z-10">
          {/* Header Row: Title on left, Add Button on right */}
          <div className="flex justify-between items-center">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm flex items-center gap-2">
                <Users className="w-6 h-6" />
                教师管理
              </h1>
              <span className="text-[10px] font-bold text-white/50 tracking-[0.2em] uppercase">
                Management
              </span>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white text-orange-600 px-5 py-2.5 rounded-full flex items-center gap-2 hover:bg-orange-50 active:scale-95 transition-all text-xs font-black shadow-md shadow-orange-900/10"
            >
              <UserPlus size={16} strokeWidth={3} />
              添加教师
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Teachers List */}
      <div className="max-w-7xl mx-auto px-5 pt-2 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">同步校内名录...</p>
          </div>
        ) : teachers.length === 0 ? (
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-12 text-center">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">暂无教师</h3>
            <p className="text-gray-500 mb-6">开始添加第一位教师吧</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-orange-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-orange-600 transition-colors mx-auto font-bold shadow-lg shadow-orange-100"
            >
              <UserPlus size={20} />
              添加教师
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-full -mr-12 -mt-12 group-hover:bg-orange-50 transition-colors pointer-events-none" />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-orange-600 font-black text-xl shadow-inner">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-gray-900 text-base">{teacher.displayName || teacher.name}</h3>
                        {teacher.role === 'ADMIN' && (
                          <div className="p-1 rounded-md bg-orange-500 text-white" title="校区管理员">
                            <Shield size={12} fill="currentColor" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-medium">@{teacher.username}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-[11px] font-bold uppercase tracking-wider relative z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-400">主理班级</span>
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <School size={14} className="text-orange-500" />
                      {teacher.primaryClassName || <span className="text-gray-300">未分配</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-400">入职时间</span>
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Calendar size={14} className="text-blue-500" />
                      {new Date(teacher.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                    <Mail size={12} />
                    {teacher.email || '暂无邮箱'}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditTeacher(teacher)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-blue-500 hover:bg-blue-50 transition-colors"
                      title="编辑"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleResetPassword(teacher.id, teacher.displayName || teacher.name)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-orange-500 hover:bg-orange-50 transition-colors"
                      title="重置密码"
                    >
                      <Key size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTeacher(teacher.id, teacher.displayName || teacher.name)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-red-500 hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Teacher Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">添加教师</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登录账号 *
                </label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="教师登录账号"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  真实姓名 *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="教师真实姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  绑定班级
                </label>
                <select
                  value={createForm.primaryClassName}
                  onChange={(e) => setCreateForm({ ...createForm, primaryClassName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择班级</option>
                  {availableClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">教师登录后将默认进入此班级</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>默认设置：</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• 默认密码：0000</li>
                  <li>• 显示名称：自动使用真实姓名</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTeacher}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    创建中...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    创建教师
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">编辑教师</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  登录账号
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  placeholder="教师登录账号（不可修改）"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  真实姓名 *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="教师真实姓名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  绑定班级
                </label>
                <select
                  value={editForm.primaryClassName}
                  onChange={(e) => setEditForm({ ...editForm, primaryClassName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择班级</option>
                  {availableClasses.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">教师登录后将默认进入此班级</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleUpdateTeacher}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    更新中...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    更新教师
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
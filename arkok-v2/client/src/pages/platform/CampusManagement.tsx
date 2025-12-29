import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api.service';
import {
    Search,
    Calendar,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Edit2,
    AlertTriangle,
    Plus,
    X,
    Check,
    Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Campus {
    id: string;
    name: string;
    isActive: boolean;
    planType: string;
    expiredAt: string | null;
    teacherCount: number;
    studentCount: number;
    createdAt: string;
}

export function CampusManagement() {
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // 新建校区弹窗状态
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '',
        adminUsername: '',
        adminName: '',
        planType: 'FREE'
    });

    useEffect(() => {
        fetchCampuses();
    }, []);

    const fetchCampuses = async () => {
        try {
            setLoading(true);
            const response = await apiService.platform.listCampuses();
            if (response.success) {
                setCampuses(response.data);
            }
        } catch (err: any) {
            toast.error('获取校区列表失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (schoolId: string, currentStatus: boolean) => {
        try {
            const response = await apiService.platform.updateStatus(schoolId, !currentStatus);
            if (response.success) {
                toast.success(`校区状态已更新为：${!currentStatus ? '激活' : '停用'}`);
                setCampuses(prev => prev.map(c => c.id === schoolId ? { ...c, isActive: !currentStatus } : c));
            }
        } catch (err: any) {
            toast.error('操作失败: ' + err.message);
        }
    };

    const handleCreateCampus = async () => {
        if (!createForm.name.trim() || !createForm.adminUsername.trim() || !createForm.adminName.trim()) {
            toast.error('请填写完整信息');
            return;
        }

        setIsCreating(true);
        try {
            const response = await apiService.platform.createCampus({
                name: createForm.name,
                adminUsername: createForm.adminUsername,
                adminName: createForm.adminName,
                planType: createForm.planType
            });
            if (response.success) {
                toast.success(`校区「${createForm.name}」创建成功！`);
                setIsCreateModalOpen(false);
                setCreateForm({ name: '', adminUsername: '', adminName: '', planType: 'FREE' });
                fetchCampuses();
            } else {
                toast.error(response.message || '创建失败');
            }
        } catch (err: any) {
            toast.error('创建失败: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    // 编辑校区弹窗状态
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        planType: 'FREE',
        expiredAt: ''
    });

    // 🆕 删除校区弹窗状态
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingCampus, setDeletingCampus] = useState<Campus | null>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');

    const openDeleteModal = (campus: Campus) => {
        setDeletingCampus(campus);
        setDeleteConfirmName('');
        setIsDeleteModalOpen(true);
    };

    const handleDeleteCampus = async () => {
        if (!deletingCampus || deleteConfirmName !== deletingCampus.name) {
            toast.error('请输入正确的校区名称');
            return;
        }

        setIsDeleting(true);
        try {
            const response = await apiService.delete(`/platform/campuses/${deletingCampus.id}`);
            if (response.success) {
                toast.success(`校区「${deletingCampus.name}」已删除`);
                setIsDeleteModalOpen(false);
                setCampuses(prev => prev.filter(c => c.id !== deletingCampus.id));
            } else {
                toast.error(response.message || '删除失败');
            }
        } catch (err: any) {
            toast.error('删除失败: ' + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const openEditModal = (campus: Campus) => {
        setEditingCampus(campus);
        setEditForm({
            name: campus.name,
            planType: campus.planType,
            expiredAt: campus.expiredAt ? campus.expiredAt.split('T')[0] : ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditCampus = async () => {
        if (!editingCampus || !editForm.name.trim()) {
            toast.error('校区名称不能为空');
            return;
        }

        setIsEditing(true);
        try {
            const response = await apiService.platform.updateCampus(editingCampus.id, {
                name: editForm.name,
                planType: editForm.planType,
                expiredAt: editForm.expiredAt || undefined
            });
            if (response.success) {
                toast.success(`校区「${editForm.name}」更新成功！`);
                setIsEditModalOpen(false);
                setCampuses(prev => prev.map(c =>
                    c.id === editingCampus.id
                        ? { ...c, name: editForm.name, planType: editForm.planType, expiredAt: editForm.expiredAt || null }
                        : c
                ));
            } else {
                toast.error(response.message || '更新失败');
            }
        } catch (err: any) {
            toast.error('更新失败: ' + err.message);
        } finally {
            setIsEditing(false);
        }
    };

    const filteredCampuses = campuses.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">校区总览</h1>
                    <p className="text-gray-500 mt-1">管理全平台租户的生命周期与状态</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="搜索校区名称..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 hover:scale-105 transition-all"
                    >
                        <Plus size={18} />
                        新建校区
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredCampuses.map((campus, index) => (
                        <motion.div
                            layout
                            key={campus.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white rounded-[32px] p-6 shadow-sm border ${campus.isActive ? 'border-gray-50' : 'border-red-100 bg-red-50/10'} flex items-center justify-between group transition-all hover:shadow-md`}
                        >
                            <div className="flex items-center space-x-6 shrink-0">
                                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black ${campus.isActive ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {campus.name.substring(0, 1)}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-3 text-gray-400">
                                        <h3 className="text-xl font-bold text-gray-900">{campus.name}</h3>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${campus.planType === 'ENTERPRISE' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                            {campus.planType}
                                        </span>
                                        {!campus.isActive && (
                                            <span className="flex items-center text-[10px] font-black text-red-500 bg-red-100 px-2 py-1 rounded-full">
                                                <AlertTriangle size={12} className="mr-1" /> 已停用
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center mt-2 space-x-6 text-sm text-gray-500 font-medium">
                                        <span className="flex items-center"><Calendar size={16} className="mr-1.5 opacity-50" /> {new Date(campus.createdAt).toLocaleDateString()} 创建</span>
                                        <span className="flex items-center font-bold text-orange-500">{campus.studentCount} 位学生</span>
                                        <span className="flex items-center">{campus.teacherCount} 位教师</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="text-right mr-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">服务到期时间</p>
                                    <p className="text-sm font-black text-gray-700">{campus.expiredAt ? new Date(campus.expiredAt).toLocaleDateString() : '永久'}</p>
                                </div>

                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleToggleStatus(campus.id, campus.isActive)}
                                        className={`h-12 px-6 rounded-2xl text-sm font-bold transition-all ${campus.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-600 text-white shadow-lg shadow-green-100 hover:scale-105'}`}
                                    >
                                        {campus.isActive ? '一键禁停' : '恢复激活'}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(campus)}
                                        className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(campus)}
                                        className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                        title="删除校区"
                                    >
                                        <AlertTriangle size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredCampuses.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-gray-200">
                        <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium tracking-wide">未找到匹配的校区</p>
                    </div>
                )}
            </div>

            {/* 新建校区弹窗 */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
                                    <Building2 className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-xl">新建校区</h3>
                                    <p className="text-xs text-gray-500">管理员初始密码: <span className="text-orange-600 font-bold">0000</span></p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">校区名称</label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                                    placeholder="例如：阳光校区"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/30 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">管理员用户名</label>
                                <input
                                    type="text"
                                    value={createForm.adminUsername}
                                    onChange={e => setCreateForm({ ...createForm, adminUsername: e.target.value })}
                                    placeholder="用于登录的唯一账号"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/30 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">管理员姓名</label>
                                <input
                                    type="text"
                                    value={createForm.adminName}
                                    onChange={e => setCreateForm({ ...createForm, adminName: e.target.value })}
                                    placeholder="校区负责人真实姓名"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/30 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">套餐类型</label>
                                <select
                                    value={createForm.planType}
                                    onChange={e => setCreateForm({ ...createForm, planType: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/30 outline-none appearance-none"
                                >
                                    <option value="FREE">免费版 (FREE)</option>
                                    <option value="PRO">专业版 (PRO)</option>
                                    <option value="ENTERPRISE">企业版 (ENTERPRISE)</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreateCampus}
                                disabled={isCreating}
                                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-200 hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={18} />
                                        创建校区
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* 编辑校区弹窗 */}
            {isEditModalOpen && editingCampus && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                                    <Edit2 className="text-white" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-xl">编辑校区</h3>
                                    <p className="text-xs text-gray-500">修改校区信息</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">校区名称</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">套餐类型</label>
                                <select
                                    value={editForm.planType}
                                    onChange={e => setEditForm({ ...editForm, planType: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 outline-none appearance-none"
                                >
                                    <option value="FREE">免费版 (FREE)</option>
                                    <option value="PRO">专业版 (PRO)</option>
                                    <option value="ENTERPRISE">企业版 (ENTERPRISE)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">服务到期时间</label>
                                <input
                                    type="date"
                                    value={editForm.expiredAt}
                                    onChange={e => setEditForm({ ...editForm, expiredAt: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/30 outline-none"
                                />
                                <p className="text-xs text-gray-400">留空表示永久有效</p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-3.5 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleEditCampus}
                                disabled={isEditing}
                                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-200 hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isEditing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={18} />
                                        保存更改
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* 🆕 删除校区确认弹窗 */}
            {isDeleteModalOpen && deletingCampus && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        <div className="px-8 py-6">
                            <div className="flex items-center mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mr-4">
                                    <AlertTriangle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-xl">删除校区</h3>
                                    <p className="text-xs text-gray-500">此操作不可撤销，请谨慎操作</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
                                <p className="text-sm text-red-700">
                                    <strong>⚠️ 警告：</strong>删除校区将标记为删除状态，30 天内可联系管理员恢复。30 天后数据将被永久清除。
                                </p>
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                                请输入校区名称 <strong className="text-red-600">{deletingCampus.name}</strong> 以确认删除：
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmName}
                                onChange={(e) => setDeleteConfirmName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-gray-900"
                                placeholder="输入校区名称..."
                            />
                        </div>

                        <div className="flex border-t border-gray-100">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 py-4 text-center font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleDeleteCampus}
                                disabled={isDeleting || deleteConfirmName !== deletingCampus.name}
                                className={`flex-1 py-4 text-center font-bold transition-all flex items-center justify-center gap-2 ${deleteConfirmName === deletingCampus.name
                                    ? 'text-white bg-red-600 hover:bg-red-700'
                                    : 'text-gray-300 bg-gray-100 cursor-not-allowed'
                                    }`}
                            >
                                {isDeleting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <AlertTriangle size={18} />
                                        确认删除
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

export default CampusManagement;

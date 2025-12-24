import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api.service';
import {
    Users,
    School,
    GraduationCap,
    Activity,
    CheckCircle2,
    TrendingUp,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface GlobalStats {
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
    activeSchools: number;
    totalTaskRecords: number;
}

export function PlatformDashboard() {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await apiService.platform.getOverview();
            if (response.success) {
                setStats(response.data);
            } else {
                setError(response.message || '获取统计数据失败');
            }
        } catch (err: any) {
            setError(err.message || '网络错误');
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: '总校区数',
            value: stats?.totalSchools || 0,
            icon: School,
            color: 'bg-blue-500',
            desc: '全平台覆盖校区总量'
        },
        {
            label: '活跃校区',
            value: stats?.activeSchools || 0,
            icon: Activity,
            color: 'bg-green-500',
            desc: '当前服务期内的校区'
        },
        {
            label: '学生总量',
            value: stats?.totalStudents || 0,
            icon: Users,
            color: 'bg-orange-500',
            desc: '全平台注册学生总数'
        },
        {
            label: '教师总量',
            value: stats?.totalTeachers || 0,
            icon: GraduationCap,
            color: 'bg-purple-500',
            desc: '注册在案的教师账号'
        },
        {
            label: '教学活动流水',
            value: stats?.totalTaskRecords.toLocaleString() || 0,
            icon: CheckCircle2,
            color: 'bg-indigo-500',
            desc: '全平台产生的任务记录总数'
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-50 border border-red-100 rounded-3xl flex items-center text-red-600">
                <AlertCircle className="w-6 h-6 mr-3" />
                <div>
                    <p className="font-bold">数据加载失败</p>
                    <p className="text-sm opacity-80">{error}</p>
                    <button
                        onClick={fetchStats}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200"
                    >
                        重试一次
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* 欢迎栏 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">全平台运营概览</h1>
                    <p className="text-gray-500 mt-2 font-medium">实时监控 ArkOK SaaS 生态系统的活跃度数据</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">最后更新时间</p>
                        <p className="text-sm font-bold text-gray-800">{new Date().toLocaleTimeString()}</p>
                    </div>
                    <button
                        onClick={fetchStats}
                        className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        <TrendingUp size={20} />
                    </button>
                </div>
            </div>

            {/* 统计卡片网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {statCards.map((card, index) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className={`w-12 h-12 ${card.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                            <card.icon size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-400 mb-1">{card.label}</p>
                        <h3 className="text-3xl font-black text-gray-900 mb-2">{card.value}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed italic">{card.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* 特色区块 (占位) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 h-[400px] flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp className="text-orange-500 w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">用户趋势图表 (开发中)</h3>
                    <p className="text-gray-400 mt-2 max-w-sm">后续将集成 ECharts 提供全平台的月活 (MAU) 与周活 (WAU) 趋势分析</p>
                </div>

                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 h-[400px] flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                        <Activity className="text-blue-500 w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">系统实时负载 (开发中)</h3>
                    <p className="text-gray-400 mt-2 max-w-sm">实时监控分片数据库 (Sharding) 的 IO 压力与 Socket 服务并发连接数</p>
                </div>
            </div>
        </div>
    );
}

export default PlatformDashboard;

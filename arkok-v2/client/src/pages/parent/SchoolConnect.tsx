import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Bell, Award, Users, Calendar, ChevronRight,
    MessageCircle, Heart, Settings, HelpCircle, LogOut
} from 'lucide-react';

const API_BASE = '/api/parent';

interface Notification {
    id: string;
    type: 'comment' | 'like' | 'system';
    title: string;
    content: string;
    time: string;
    read: boolean;
}

interface Student {
    id: string;
    name: string;
    className?: string;
}

/**
 * 家校互联页
 * 功能：消息通知、勋章墙、绑定孩子、在线请假等
 * UI 参考: /parent/家长端3tab源码参考.html
 */
const SchoolConnect: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [badgeCount, setBadgeCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [parentInfo, setParentInfo] = useState<any>(null);

    useEffect(() => {
        // 加载本地存储的信息
        const storedStudents = localStorage.getItem('parent_students');
        const storedParent = localStorage.getItem('parent_info');

        if (storedStudents) {
            setStudents(JSON.parse(storedStudents));
        }
        if (storedParent) {
            setParentInfo(JSON.parse(storedParent));
        }

        // 模拟加载通知数据（实际应从API获取）
        loadNotifications();
        loadBadgeCount();
    }, [studentId]);

    const loadNotifications = async () => {
        // TODO: 实际从后端获取通知
        setNotifications([
            {
                id: '1',
                type: 'comment',
                title: '老师评语',
                content: '今天表现很棒，继续加油！',
                time: '2小时前',
                read: false
            },
            {
                id: '2',
                type: 'system',
                title: '续费提醒',
                content: '您的课程将于下周到期，请及时续费',
                time: '1天前',
                read: true
            }
        ]);
        setUnreadCount(1);
    };

    const loadBadgeCount = async () => {
        // 从成长档案API获取勋章数
        const token = localStorage.getItem('parent_token');
        if (!token || !studentId) return;

        try {
            const res = await fetch(`${API_BASE}/growth/${studentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setBadgeCount(data.summary?.totalBadges || 0);
            }
        } catch (err) {
            console.error('获取勋章数失败', err);
        }
    };

    // 退出登录
    const handleLogout = () => {
        if (window.confirm('确定要退出登录吗？')) {
            localStorage.removeItem('parent_token');
            localStorage.removeItem('parent_info');
            localStorage.removeItem('parent_students');
            navigate('/parent/login');
        }
    };

    // 菜单项
    const menuItems = [
        {
            icon: Bell,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-500',
            title: '消息通知',
            subtitle: '查看老师评语、续费提醒',
            badge: unreadCount > 0 ? unreadCount : undefined,
            onClick: () => {/* TODO: 跳转消息列表 */ }
        },
        {
            icon: Award,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-500',
            title: '我的勋章墙',
            subtitle: `已获得 ${badgeCount} 枚勋章`,
            arrow: true,
            onClick: () => {/* TODO: 跳转勋章墙 */ }
        },
        {
            icon: Users,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-500',
            title: '绑定孩子',
            subtitle: `已绑定 ${students.length} 个孩子`,
            arrow: true,
            onClick: () => {/* TODO: 跳转绑定管理 */ }
        },
        {
            icon: Calendar,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-500',
            title: '在线请假',
            subtitle: '向老师提交请假申请',
            arrow: true,
            onClick: () => {/* TODO: 跳转请假页面 */ }
        }
    ];

    // 设置项
    const settingsItems = [
        {
            icon: Settings,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-500',
            title: '账号设置',
            subtitle: '修改密码、手机号',
            arrow: true
        },
        {
            icon: HelpCircle,
            iconBg: 'bg-gray-100',
            iconColor: 'text-gray-500',
            title: '帮助与反馈',
            subtitle: '使用指南、问题反馈',
            arrow: true
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* 顶部标题 */}
            <div className="px-5 py-4 pt-14 bg-white shadow-sm">
                <h1 className="font-bold text-lg text-gray-800">家校互联</h1>
            </div>

            {/* 用户信息卡 */}
            <div className="mx-4 mt-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-4 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl">
                        👤
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-lg">
                            {parentInfo?.name || '家长用户'}
                        </div>
                        <div className="text-xs text-white/70">
                            {parentInfo?.phone ? parentInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '未设置手机号'}
                        </div>
                    </div>
                </div>

                {/* 绑定的孩子列表 */}
                {students.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                        {students.map(s => (
                            <div
                                key={s.id}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${s.id === studentId
                                        ? 'bg-white text-orange-500'
                                        : 'bg-white/20 text-white'
                                    }`}
                            >
                                {s.name}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 功能菜单 */}
            <div className="p-4 space-y-3">
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        onClick={item.onClick}
                        className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 active:bg-gray-50 transition-colors text-left"
                    >
                        <div className={`w-10 h-10 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center`}>
                            <item.icon size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800">{item.title}</p>
                            <p className="text-xs text-gray-400">{item.subtitle}</p>
                        </div>
                        {item.badge && (
                            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {item.badge}
                            </span>
                        )}
                        {item.arrow && (
                            <ChevronRight size={18} className="text-gray-300" />
                        )}
                    </button>
                ))}
            </div>

            {/* 最近消息预览 */}
            {notifications.length > 0 && (
                <div className="px-4 mb-4">
                    <h3 className="text-sm font-bold text-gray-600 mb-2 px-1">最近消息</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {notifications.slice(0, 2).map((notif, i) => (
                            <div
                                key={notif.id}
                                className={`p-4 flex items-start gap-3 ${i < notifications.slice(0, 2).length - 1 ? 'border-b border-gray-50' : ''
                                    } ${!notif.read ? 'bg-orange-50/50' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notif.type === 'comment' ? 'bg-blue-100 text-blue-500' :
                                        notif.type === 'like' ? 'bg-red-100 text-red-500' :
                                            'bg-gray-100 text-gray-500'
                                    }`}>
                                    {notif.type === 'comment' ? <MessageCircle size={14} /> :
                                        notif.type === 'like' ? <Heart size={14} /> :
                                            <Bell size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm text-gray-800">{notif.title}</span>
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">{notif.time}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.content}</p>
                                </div>
                                {!notif.read && (
                                    <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 设置菜单 */}
            <div className="px-4">
                <h3 className="text-sm font-bold text-gray-600 mb-2 px-1">设置</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {settingsItems.map((item, i) => (
                        <button
                            key={i}
                            className={`w-full p-4 flex items-center gap-4 active:bg-gray-50 transition-colors text-left ${i < settingsItems.length - 1 ? 'border-b border-gray-50' : ''
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center`}>
                                <item.icon size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-800">{item.title}</p>
                                <p className="text-xs text-gray-400">{item.subtitle}</p>
                            </div>
                            {item.arrow && (
                                <ChevronRight size={18} className="text-gray-300" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 退出登录 */}
            <div className="px-4 mt-6">
                <button
                    onClick={handleLogout}
                    className="w-full bg-white text-red-500 font-medium py-3.5 rounded-xl border border-gray-100 flex items-center justify-center gap-2 active:bg-red-50 transition-colors"
                >
                    <LogOut size={18} />
                    退出登录
                </button>
            </div>

            {/* 版本信息 */}
            <div className="text-center text-[10px] text-gray-300 mt-8 mb-4">
                ArkOK Family v2.0
            </div>
        </div>
    );
};

export default SchoolConnect;

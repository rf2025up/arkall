import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

interface Student {
    id: string;
    name: string;
    className?: string;
    avatarUrl?: string;
}

/**
 * 家长端布局组件
 * 包含底部 Tab 导航和学生切换
 */
const ParentLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [students, setStudents] = useState<Student[]>([]);
    const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
    const [showStudentPicker, setShowStudentPicker] = useState(false);

    // 加载学生列表
    useEffect(() => {
        const storedStudents = localStorage.getItem('parent_students');
        if (storedStudents) {
            const list = JSON.parse(storedStudents);
            setStudents(list);
            if (list.length > 0 && !currentStudent) {
                setCurrentStudent(list[0]);
            }
        }
    }, []);

    // 当切换学生时更新路由
    useEffect(() => {
        if (currentStudent && location.pathname.includes('/parent/')) {
            const basePath = location.pathname.split('/').slice(0, 3).join('/');
            if (!location.pathname.includes(currentStudent.id)) {
                navigate(`${basePath}/${currentStudent.id}`);
            }
        }
    }, [currentStudent]);

    // 获取当前激活的 Tab
    const getActiveTab = () => {
        if (location.pathname.includes('/timeline')) return 'today';
        if (location.pathname.includes('/growth')) return 'growth';
        if (location.pathname.includes('/connect')) return 'connect';
        return 'today';
    };

    const activeTab = getActiveTab();

    // 切换 Tab
    const switchTab = (tab: string) => {
        if (!currentStudent) return;
        switch (tab) {
            case 'today':
                navigate(`/parent/timeline/${currentStudent.id}`);
                break;
            case 'growth':
                navigate(`/parent/growth/${currentStudent.id}`);
                break;
            case 'connect':
                navigate(`/parent/connect/${currentStudent.id}`);
                break;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col relative">
            {/* 顶部学生选择器（多孩子时显示） */}
            {students.length > 1 && (
                <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-30 px-4 py-2 flex items-center justify-center border-b border-gray-100">
                    <button
                        onClick={() => setShowStudentPicker(!showStudentPicker)}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 text-orange-600 text-sm font-medium"
                    >
                        <span>{currentStudent?.name || '选择孩子'}</span>
                        <span className="text-xs">▼</span>
                    </button>

                    {showStudentPicker && (
                        <div className="absolute top-full mt-1 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden min-w-[120px]">
                            {students.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        setCurrentStudent(s);
                                        setShowStudentPicker(false);
                                    }}
                                    className={`w-full px-4 py-2.5 text-sm text-left hover:bg-orange-50 transition-colors ${currentStudent?.id === s.id ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700'
                                        }`}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 主内容区 */}
            <div className={`flex-1 ${students.length > 1 ? 'pt-10' : ''}`}>
                <Outlet context={{ student: currentStudent }} />
            </div>

            {/* 底部 Tab 导航 - 基于教师端 UI 设计语言 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] pt-2 px-3 flex justify-around items-center z-[9999] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] h-16">
                {/* 今日动态 */}
                <button
                    onClick={() => switchTab('today')}
                    className={`flex flex-col items-center justify-center p-1 transition-colors flex-1 ${activeTab === 'today' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'today' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span className="text-[9px] mt-0.5 font-medium">今日动态</span>
                </button>

                {/* 成长档案 */}
                <button
                    onClick={() => switchTab('growth')}
                    className={`flex flex-col items-center justify-center p-1 transition-colors flex-1 ${activeTab === 'growth' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'growth' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    <span className="text-[9px] mt-0.5 font-medium">成长档案</span>
                </button>

                {/* 家校互联 */}
                <button
                    onClick={() => switchTab('connect')}
                    className={`flex flex-col items-center justify-center p-1 transition-colors flex-1 ${activeTab === 'connect' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={activeTab === 'connect' ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span className="text-[9px] mt-0.5 font-medium">家校互联</span>
                </button>
            </div>
        </div>
    );
};

export default ParentLayout;

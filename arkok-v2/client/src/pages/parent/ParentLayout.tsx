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

            {/* 底部 Tab 导航 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)] z-20">
                <div className="flex">
                    {/* 今日动态 */}
                    <button
                        onClick={() => switchTab('today')}
                        className={`flex-1 py-3 flex flex-col items-center justify-center transition-colors ${activeTab === 'today' ? 'text-orange-500' : 'text-gray-400'
                            }`}
                    >
                        <span className="text-xl mb-0.5">{activeTab === 'today' ? '📅' : '📆'}</span>
                        <span className="text-[10px] font-bold">今日动态</span>
                    </button>

                    {/* 成长档案 */}
                    <button
                        onClick={() => switchTab('growth')}
                        className={`flex-1 py-3 flex flex-col items-center justify-center transition-colors ${activeTab === 'growth' ? 'text-orange-500' : 'text-gray-400'
                            }`}
                    >
                        <span className="text-xl mb-0.5">{activeTab === 'growth' ? '📊' : '📈'}</span>
                        <span className="text-[10px] font-bold">成长档案</span>
                    </button>

                    {/* 家校互联 */}
                    <button
                        onClick={() => switchTab('connect')}
                        className={`flex-1 py-3 flex flex-col items-center justify-center transition-colors ${activeTab === 'connect' ? 'text-orange-500' : 'text-gray-400'
                            }`}
                    >
                        <span className="text-xl mb-0.5">{activeTab === 'connect' ? '🏠' : '🏡'}</span>
                        <span className="text-[10px] font-bold">家校互联</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParentLayout;

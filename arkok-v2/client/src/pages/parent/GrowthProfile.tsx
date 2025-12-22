import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Share2, Trophy, CheckCircle, Swords, Flame, Award } from 'lucide-react';

const API_BASE = '/api/parent';

interface RadarDimension {
    name: string;
    value: number;
    icon: string;
}

interface HeatmapDay {
    date: string;
    level: number;
    count: number;
}

interface TrendPoint {
    date: string;
    exp: number;
    cumulative: number;
}

interface GrowthData {
    student: {
        id: string;
        name: string;
        className?: string;
        level: number;
        exp: number;
        points: number;
    };
    radarData: {
        dimensions: RadarDimension[];
        overallScore: number;
    };
    heatmapData: {
        month: string;
        days: HeatmapDay[];
        totalActiveDays: number;
    };
    trendData: {
        period: string;
        data: TrendPoint[];
        totalExp: number;
    };
    summary: {
        joinDate: string;
        daysSinceJoin: number;
        totalTasks: number;
        totalQC: number;
        totalPK: number;
        totalHabits: number;
        totalBadges: number;
    };
}

/**
 * 成长档案页
 * UI 参考: /parent/家长端3tab源码参考.html
 */
const GrowthProfile: React.FC = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const [data, setData] = useState<GrowthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('parent_token');
            if (!token || !studentId) return;

            try {
                const res = await fetch(`${API_BASE}/growth/${studentId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();

                if (!res.ok) throw new Error(result.error);
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId]);

    // 热力图颜色
    const getHeatmapColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-gray-100';
            case 1: return 'bg-orange-200';
            case 2: return 'bg-orange-400';
            case 3: return 'bg-orange-600';
            default: return 'bg-gray-100';
        }
    };

    // 雷达图 SVG 渲染
    const renderRadarChart = () => {
        if (!data?.radarData?.dimensions) return null;

        const dims = data.radarData.dimensions;
        const size = 160;
        const center = size / 2;
        const maxRadius = 60;
        const angleStep = (2 * Math.PI) / dims.length;

        // 计算各点坐标
        const points = dims.map((d, i) => {
            const angle = angleStep * i - Math.PI / 2; // 从顶部开始
            const radius = (d.value / 100) * maxRadius;
            return {
                x: center + radius * Math.cos(angle),
                y: center + radius * Math.sin(angle),
                labelX: center + (maxRadius + 25) * Math.cos(angle),
                labelY: center + (maxRadius + 25) * Math.sin(angle),
                ...d
            };
        });

        const pathData = points.map((p, i) =>
            (i === 0 ? 'M' : 'L') + `${p.x},${p.y}`
        ).join(' ') + ' Z';

        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* 背景网格 */}
                {[0.33, 0.66, 1].map((ratio, i) => (
                    <polygon
                        key={i}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray={i < 2 ? "3,3" : "0"}
                        points={dims.map((_, j) => {
                            const angle = angleStep * j - Math.PI / 2;
                            const r = maxRadius * ratio;
                            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                        }).join(' ')}
                    />
                ))}

                {/* 轴线 */}
                {dims.map((_, i) => {
                    const angle = angleStep * i - Math.PI / 2;
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={center + maxRadius * Math.cos(angle)}
                            y2={center + maxRadius * Math.sin(angle)}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* 数据区域 */}
                <path
                    d={pathData}
                    fill="rgba(249, 115, 22, 0.2)"
                    stroke="#f97316"
                    strokeWidth="2"
                />

                {/* 数据点 */}
                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#f97316"
                    />
                ))}
            </svg>
        );
    };

    // 积分曲线渲染（简化版）
    const renderTrendChart = () => {
        if (!data?.trendData?.data) return null;

        const points = data.trendData.data;
        const maxExp = Math.max(...points.map(p => p.cumulative), 1);
        const width = 300;
        const height = 100;
        const padding = 10;

        const pathData = points.map((p, i) => {
            const x = padding + (i / (points.length - 1)) * (width - 2 * padding);
            const y = height - padding - (p.cumulative / maxExp) * (height - 2 * padding);
            return (i === 0 ? 'M' : 'L') + `${x},${y}`;
        }).join(' ');

        return (
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                {/* 渐变定义 */}
                <defs>
                    <linearGradient id="expGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(249, 115, 22, 0.3)" />
                        <stop offset="100%" stopColor="rgba(249, 115, 22, 0)" />
                    </linearGradient>
                </defs>

                {/* 填充区域 */}
                <path
                    d={`${pathData} L${width - padding},${height - padding} L${padding},${height - padding} Z`}
                    fill="url(#expGradient)"
                />

                {/* 曲线 */}
                <path
                    d={pathData}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                />
            </svg>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
                <div className="text-gray-400 animate-pulse">加载中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pb-20">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* 顶部头像区 */}
            <div className="relative pt-12 pb-6 px-5 bg-gradient-to-br from-orange-400 to-red-500 text-white rounded-b-3xl">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-4 border-white/50 shadow-lg bg-white flex items-center justify-center text-2xl font-bold text-orange-500">
                        {data?.student?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">{data?.student?.name}</h1>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {data?.student?.className || '未知班级'}
                        </span>
                    </div>
                </div>
                <button className="absolute top-12 right-5 bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-sm active:bg-white/30 transition-colors">
                    <Share2 size={14} />
                    生成海报
                </button>

                {/* 数据概览 */}
                <div className="flex justify-around mt-6 text-center">
                    <div>
                        <div className="text-2xl font-bold">{data?.summary?.daysSinceJoin || 0}</div>
                        <div className="text-[10px] text-white/70">成长天数</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{data?.student?.points || 0}</div>
                        <div className="text-[10px] text-white/70">总积分</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">Lv.{data?.student?.level || 1}</div>
                        <div className="text-[10px] text-white/70">当前等级</div>
                    </div>
                </div>
            </div>

            {/* 内容区 */}
            <div className="p-4 space-y-4 -mt-4">
                {/* 五维雷达图 */}
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 text-base">五维能力雷达</h3>
                        <div className="text-orange-500 font-bold text-sm">
                            综合 {data?.radarData?.overallScore || 0}分
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        {renderRadarChart()}
                    </div>

                    {/* 维度标签 */}
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                        {data?.radarData?.dimensions.map((d, i) => (
                            <div key={i} className="flex items-center gap-1 text-xs text-gray-600">
                                <span>{d.icon}</span>
                                <span>{d.name}</span>
                                <span className="text-orange-500 font-bold">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 毅力热力图 */}
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800 text-base">毅力热力图</h3>
                        <span className="text-xs text-gray-400">
                            {data?.heatmapData?.month} · {data?.heatmapData?.totalActiveDays}天活跃
                        </span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mt-2">
                        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                            <div key={d} className="text-center text-[10px] text-gray-400 mb-1">{d}</div>
                        ))}
                        {data?.heatmapData?.days.map((day, i) => (
                            <div
                                key={i}
                                className={`aspect-square rounded-sm ${getHeatmapColor(day.level)}`}
                                title={`${day.date}: ${day.count}次活动`}
                            />
                        ))}
                    </div>

                    {/* 图例 */}
                    <div className="flex items-center justify-end gap-1 mt-3 text-[10px] text-gray-400">
                        <span>活跃度:</span>
                        <div className="w-3 h-3 bg-gray-100 rounded-sm" />
                        <div className="w-3 h-3 bg-orange-200 rounded-sm" />
                        <div className="w-3 h-3 bg-orange-400 rounded-sm" />
                        <div className="w-3 h-3 bg-orange-600 rounded-sm" />
                    </div>
                </div>

                {/* 进击曲线 */}
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-800 text-base">进击曲线</h3>
                        <span className="text-xs text-orange-500 font-bold">
                            +{data?.trendData?.totalExp || 0} XP
                        </span>
                    </div>

                    <div className="h-24">
                        {renderTrendChart()}
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>30天前</span>
                        <span>今天</span>
                    </div>
                </div>

                {/* 成长概要 */}
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
                    <h3 className="font-bold text-gray-800 text-base mb-3">成长概要</h3>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                            <div className="text-lg font-bold text-gray-800">{data?.summary?.totalTasks || 0}</div>
                            <div className="text-[10px] text-gray-500">任务完成</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                            <Trophy className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                            <div className="text-lg font-bold text-gray-800">{data?.summary?.totalQC || 0}</div>
                            <div className="text-[10px] text-gray-500">过关项目</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-xl">
                            <Swords className="w-6 h-6 text-red-500 mx-auto mb-1" />
                            <div className="text-lg font-bold text-gray-800">{data?.summary?.totalPK || 0}</div>
                            <div className="text-[10px] text-gray-500">PK对战</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-xl">
                            <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                            <div className="text-lg font-bold text-gray-800">{data?.summary?.totalHabits || 0}</div>
                            <div className="text-[10px] text-gray-500">习惯打卡</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-xl col-span-2">
                            <Award className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
                            <div className="text-lg font-bold text-gray-800">{data?.summary?.totalBadges || 0}</div>
                            <div className="text-[10px] text-gray-500">荣誉勋章</div>
                        </div>
                    </div>
                </div>

                <div className="text-center text-[10px] text-gray-300 mt-6 tracking-widest">
                    — 用数据见证成长 —
                </div>
            </div>
        </div>
    );
};

export default GrowthProfile;

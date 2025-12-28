import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Save, RotateCcw, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api.service';

interface RewardConfig {
  id: string;
  schoolId: string;
  module: string;
  category?: string;
  action: string;
  expReward: number;
  pointsReward: number;
  description?: string;
  isActive: boolean;
}

const RewardManagement: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<RewardConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 获取奖励配置
  const fetchConfigs = async () => {
    if (!user?.schoolId || !token) return;

    setLoading(true);
    try {
      const response = await apiService.get(`/reward/configs/${user.schoolId}`);
      if (response.success && response.data) {
        const configs = response.data as RewardConfig[];
        // 如果没有配置，初始化默认配置
        if (configs.length === 0) {
          await initializeConfigs();
        } else {
          setConfigs(configs);
        }
      }
    } catch (error) {
      console.error('获取配置失败:', error);
      setMessage('获取配置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化默认配置
  const initializeConfigs = async () => {
    if (!user?.schoolId || !token) return;

    try {
      const response = await apiService.post(`/reward/initialize/${user.schoolId}`);
      if (response.success && response.data) {
        const configs = response.data as RewardConfig[];
        setConfigs(configs);
        setMessage('默认配置初始化成功');
      }
    } catch (error) {
      console.error('初始化配置失败:', error);
    }
  };

  // 更新配置
  const handleUpdateConfig = (id: string, field: 'expReward' | 'pointsReward' | 'isActive', value: number | boolean) => {
    setConfigs(prev =>
      prev.map(config =>
        config.id === id ? { ...config, [field]: value } : config
      )
    );
  };

  // 保存所有修改
  const handleSave = async () => {
    if (!token) return;

    setSaving(true);
    setMessage('');

    try {
      const updates = configs.map(config => ({
        id: config.id,
        expReward: config.expReward,
        pointsReward: config.pointsReward,
        isActive: config.isActive
      }));

      const response = await apiService.patch(`/reward/configs/${user?.schoolId}/batch`, { updates });

      if (response.success) {
        setMessage('保存成功！');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('保存失败，请重试');
      }
    } catch (error) {
      console.error('保存失败:', error);
      setMessage('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 重置为默认值
  const handleReset = async () => {
    if (!confirm('确定要重置为默认配置吗？这将覆盖所有自定义设置。')) return;

    await initializeConfigs();
    setMessage('已重置为默认配置');
    setTimeout(() => setMessage(''), 2000);
  };

  useEffect(() => {
    fetchConfigs();
  }, [user, token]);

  // 按模块分组
  const groupedConfigs = configs.reduce((acc, config) => {
    const module = config.module;
    if (!acc[module]) acc[module] = [];
    acc[module].push(config);
    return acc;
  }, {} as Record<string, RewardConfig[]>);

  // 模块名称映射
  const moduleNames: Record<string, string> = {
    LMS: 'LMS 进度系统',
    BADGE: '勋章系统',
    PK: 'PK 对决',
    CHALLENGE: '挑战赛',
    HABIT: '习惯打卡',
    TUTORING: '个性化辅导',
    METHODOLOGY: '核心教学法',
    GROWTH: '综合成长类',
    MANUAL: '手动任务',
    OTHER: '其他操作'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24">
      {/* 🆕 简洁Header - 与备课页风格统一 */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="px-4 pt-safe">
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-slate-500 active:scale-95 transition-transform"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">返回</span>
            </button>
            <h1 className="text-base font-bold text-slate-800">积分经验管理</h1>
            <div className="w-16" /> {/* 占位平衡 */}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pt-4 space-y-4">
        {/* 🆕 操作按钮区 */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={handleReset}
            className="px-5 h-12 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold flex items-center gap-2 active:scale-95 transition-transform"
          >
            <RotateCcw size={16} />
            重置
          </button>
        </div>

        {/* 消息提示 */}
        {message && (
          <div className={`p-3 rounded-xl text-center text-sm font-bold ${message.includes('成功') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {message}
          </div>
        )}

        {/* 🆕 配置列表 - 现代化卡片风格 */}
        <div className="space-y-4">
          {Object.entries(groupedConfigs).map(([module, moduleConfigs]) => (
            <div key={module} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* 模块标题 - 带装饰条 */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-50">
                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                <h3 className="text-sm font-bold text-slate-800">{moduleNames[module] || module}</h3>
                <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {moduleConfigs.length} 项
                </span>
              </div>

              {/* 配置项列表 */}
              <div className="divide-y divide-slate-50">
                {moduleConfigs.map(config => (
                  <div key={config.id} className="p-4">
                    {/* 配置项头部 */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-800 mb-1">
                          {config.description || config.action}
                        </h4>
                        {config.category && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            {config.category}
                          </span>
                        )}
                      </div>
                      {/* 启用开关 */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.isActive}
                          onChange={(e) => handleUpdateConfig(config.id, 'isActive', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>

                    {/* 奖励输入框 */}
                    {config.isActive && (
                      <div className="flex gap-3">
                        <div className="flex-1 bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">EXP</span>
                          <input
                            type="number"
                            value={config.expReward}
                            onChange={(e) => handleUpdateConfig(config.id, 'expReward', parseInt(e.target.value) || 0)}
                            className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 text-right focus:outline-none"
                          />
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl p-3 flex items-center gap-2">
                          <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded">积分</span>
                          <input
                            type="number"
                            value={config.pointsReward}
                            onChange={(e) => handleUpdateConfig(config.id, 'pointsReward', parseInt(e.target.value) || 0)}
                            className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 text-right focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {configs.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center border border-slate-100">
            <Settings size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-400 text-sm font-bold mb-4">暂无配置</p>
            <button
              onClick={initializeConfigs}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-orange-200 active:scale-95 transition-transform"
            >
              初始化默认配置
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardManagement;

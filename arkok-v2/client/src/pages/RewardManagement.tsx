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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-400 to-orange-500 pt-8 pb-16 rounded-b-[30px]">
        <div className="px-4">
          <button
            onClick={() => navigate(-1)}
            className="text-white mb-4 flex items-center gap-2"
          >
            <ChevronLeft size={24} />
            返回
          </button>
          <h1 className="text-2xl font-bold text-white mb-2">积分经验管理</h1>
          <p className="text-white/80 text-sm">
            管理系统中的所有积分和经验奖励配置
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-8">
        {/* Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-orange-500 text-white py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={handleReset}
            className="px-4 bg-gray-100 text-gray-700 py-3 rounded-lg flex items-center gap-2"
          >
            <RotateCcw size={20} />
            重置
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center ${message.includes('成功') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Config List */}
        <div className="space-y-4">
          {Object.entries(groupedConfigs).map(([module, moduleConfigs]) => (
            <div key={module} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
                <h3 className="font-semibold text-orange-700">{moduleNames[module] || module}</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {moduleConfigs.map(config => (
                  <div key={config.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {config.description || config.action}
                        </h4>
                        {config.category && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {config.category}
                          </span>
                        )}
                      </div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={config.isActive}
                          onChange={(e) => handleUpdateConfig(config.id, 'isActive', e.target.checked)}
                          className="w-5 h-5 text-orange-500 rounded"
                        />
                        <span className="text-sm text-gray-600">启用</span>
                      </label>
                    </div>

                    {config.isActive && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">经验值 (EXP)</label>
                          <input
                            type="number"
                            value={config.expReward}
                            onChange={(e) => handleUpdateConfig(config.id, 'expReward', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">积分 (Points)</label>
                          <input
                            type="number"
                            value={config.pointsReward}
                            onChange={(e) => handleUpdateConfig(config.id, 'pointsReward', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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

        {configs.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Settings size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 mb-4">暂无配置</p>
            <button
              onClick={initializeConfigs}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg"
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

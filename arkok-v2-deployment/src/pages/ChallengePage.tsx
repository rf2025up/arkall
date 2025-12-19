import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Users, Trophy, Calendar, Target, Clock, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// 类型定义
interface Challenge {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  startDate: string;
  endDate?: string;
  rewardPoints: number;
  rewardExp: number;
  maxParticipants: number;
  participantCount: number;
  creator: {
    id: string;
    name: string;
    username: string;
  };
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  className: string;
  avatarUrl?: string;
}

interface ChallengeForm {
  title: string;
  description: string;
  type: 'PERSONAL' | 'GROUP' | 'CLASS';
  startDate: string;
  endDate: string;
  rewardPoints: string;
  rewardExp: string;
  maxParticipants: string;
  selectedStudents: string[];
}

const CHALLENGE_TYPES: Array<{
  value: 'PERSONAL' | 'GROUP' | 'CLASS';
  label: string;
  icon: string;
}> = [
  { value: 'PERSONAL', label: '个人挑战', icon: '🎯' },
  { value: 'GROUP', label: '团队挑战', icon: '👥' },
  { value: 'CLASS', label: '班级挑战', icon: '🏫' }
];

const ChallengePage: React.FC = () => {
  const navigate = useNavigate();

  // 状态管理
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState<ChallengeForm>({
    title: '',
    description: '',
    type: 'PERSONAL',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    rewardPoints: '',
    rewardExp: '',
    maxParticipants: '',
    selectedStudents: []
  });

  // 从localStorage获取用户信息
  const getUserInfo = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  };

  const userInfo = getUserInfo();

  // 加载挑战列表
  const loadChallenges = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/challenges?schoolId=${userInfo?.schoolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setChallenges(data.data);
      }
    } catch (error) {
      console.error('加载挑战列表失败:', error);
      toast.error('加载挑战列表失败');
    }
  };

  // 加载学生列表
  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/students?schoolId=${userInfo?.schoolId}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setStudents(data.data);
      }
    } catch (error) {
      console.error('加载学生列表失败:', error);
      toast.error('加载学生列表失败');
    }
  };

  // 页面加载时获取数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([loadChallenges(), loadStudents()]);
      setLoading(false);
    };

    initData();
  }, []);

  const handleCreateChallenge = async () => {
    if (!newChallenge.title.trim()) {
      toast.error('请输入挑战标题');
      return;
    }

    setCreateLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newChallenge.title.trim(),
          description: newChallenge.description.trim(),
          type: newChallenge.type,
          schoolId: userInfo?.schoolId,
          creatorId: userInfo?.userId,
          startDate: newChallenge.startDate ? new Date(newChallenge.startDate).toISOString() : undefined,
          endDate: newChallenge.endDate ? new Date(newChallenge.endDate).toISOString() : undefined,
          rewardPoints: parseInt(newChallenge.rewardPoints) || 0,
          rewardExp: parseInt(newChallenge.rewardExp) || 0,
          maxParticipants: parseInt(newChallenge.maxParticipants) || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadChallenges(); // 重新加载挑战列表
        setIsCreateOpen(false);
        setNewChallenge({
          title: '',
          description: '',
          type: 'PERSONAL',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          rewardPoints: '',
          rewardExp: '',
          maxParticipants: '',
          selectedStudents: []
        });
        toast.success('挑战创建成功');
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (error) {
      console.error('创建挑战失败:', error);
      toast.error('创建失败，请重试');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const token = localStorage.getItem('token');
      // 这里需要先选择要参加挑战的学生，为简化演示，我们使用第一个学生
      const studentId = students[0]?.id;
      if (!studentId) {
        toast.error('没有可选的学生');
        return;
      }

      const response = await fetch('/api/challenges/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          challengeId,
          studentId,
          schoolId: userInfo?.schoolId
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadChallenges();
        toast.success('参加挑战成功');
      } else {
        toast.error(data.message || '参加失败');
      }
    } catch (error) {
      console.error('参加挑战失败:', error);
      toast.error('参加失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
      ACTIVE: { label: '进行中', color: 'bg-green-100 text-green-600' },
      COMPLETED: { label: '已完成', color: 'bg-blue-100 text-blue-600' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = CHALLENGE_TYPES.find(t => t.value === type);
    return typeConfig?.icon || '🎯';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-primary px-6 py-8 pb-6 rounded-b-[2.5rem] shadow-lg">
        <div className="flex justify-center mb-6">
          <h1 className="text-white text-xl font-bold">挑战任务</h1>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-white text-primary px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-orange-50 transition-colors"
          >
            <Plus size={20} />
            <span>发布新挑战</span>
          </button>
        </div>
      </header>

      <div className="px-4 -mt-4 relative z-10">
        {/* 进行中的挑战 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Clock className="mr-2 text-orange-500" size={20} />
              进行中的挑战
            </h2>
            <span className="text-sm text-gray-500">
              {challenges.filter(c => c.status === 'ACTIVE').length} 个
            </span>
          </div>

          <div className="space-y-3">
            {challenges.filter(c => c.status === 'ACTIVE').map(challenge => (
              <div key={challenge.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getTypeIcon(challenge.type)}</span>
                      <h3 className="font-bold text-gray-800">{challenge.title}</h3>
                    </div>
                    {challenge.description && (
                      <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users size={14} />
                        <span>{challenge.participantCount}/{challenge.maxParticipants}人</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy size={14} />
                        <span>{challenge.rewardPoints}分 {challenge.rewardExp}EXP</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(challenge.status)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {challenge.creator.name} 发布
                  </div>
                  <button
                    onClick={() => handleJoinChallenge(challenge.id)}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    参加挑战
                  </button>
                </div>
              </div>
            ))}

            {challenges.filter(c => c.status === 'ACTIVE').length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <Target className="mx-auto text-gray-300 mb-2" size={40} />
                <p className="text-gray-500">暂无进行中的挑战</p>
              </div>
            )}
          </div>
        </div>

        {/* 已完成的挑战 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <Check className="mr-2 text-green-500" size={20} />
              已完成的挑战
            </h2>
            <span className="text-sm text-gray-500">
              {challenges.filter(c => c.status === 'COMPLETED').length} 个
            </span>
          </div>

          <div className="space-y-3">
            {challenges.filter(c => c.status === 'COMPLETED').map(challenge => (
              <div key={challenge.id} className="bg-white rounded-2xl shadow-sm p-4 opacity-75">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">{getTypeIcon(challenge.type)}</span>
                      <h3 className="font-bold text-gray-800">{challenge.title}</h3>
                    </div>
                    {challenge.description && (
                      <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users size={14} />
                        <span>{challenge.participantCount}人参与</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Trophy size={14} />
                        <span>{challenge.rewardPoints}分 {challenge.rewardExp}EXP</span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(challenge.status)}
                </div>

                <div className="text-xs text-gray-500">
                  由 {challenge.creator.name} 发布
                </div>
              </div>
            ))}

            {challenges.filter(c => c.status === 'COMPLETED').length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                <Check className="mx-auto text-gray-300 mb-2" size={40} />
                <p className="text-gray-500">暂无已完成的挑战</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Challenge Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">发布新挑战</h3>
              <button onClick={() => setIsCreateOpen(false)}><X size={20} className="text-gray-400"/></button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">挑战标题 *</label>
                <input
                  type="text"
                  placeholder="输入挑战标题"
                  value={newChallenge.title}
                  onChange={e => setNewChallenge({...newChallenge, title: e.target.value})}
                  className="w-full p-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">挑战描述</label>
                <textarea
                  placeholder="描述挑战内容和规则"
                  value={newChallenge.description}
                  onChange={e => setNewChallenge({...newChallenge, description: e.target.value})}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">挑战类型</label>
                <div className="grid grid-cols-3 gap-2">
                  {CHALLENGE_TYPES.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setNewChallenge({...newChallenge, type: type.value})}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        newChallenge.type === type.value
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-lg mb-1">{type.icon}</div>
                      <div className="text-xs">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                  <input
                    type="date"
                    value={newChallenge.startDate}
                    onChange={e => setNewChallenge({...newChallenge, startDate: e.target.value})}
                    className="w-full p-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                  <input
                    type="date"
                    value={newChallenge.endDate}
                    onChange={e => setNewChallenge({...newChallenge, endDate: e.target.value})}
                    className="w-full p-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">积分奖励</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newChallenge.rewardPoints}
                    onChange={e => setNewChallenge({...newChallenge, rewardPoints: e.target.value})}
                    className="w-full p-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">经验奖励</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={newChallenge.rewardExp}
                    onChange={e => setNewChallenge({...newChallenge, rewardExp: e.target.value})}
                    className="w-full p-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大人数</label>
                  <input
                    type="number"
                    placeholder="不限"
                    value={newChallenge.maxParticipants}
                    onChange={e => setNewChallenge({...newChallenge, maxParticipants: e.target.value})}
                    className="w-full p-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateChallenge}
                  disabled={createLoading}
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? (
                    <>
                      <Loader2 size={16} className="inline animate-spin mr-2" />
                      创建中...
                    </>
                  ) : (
                    '发布挑战'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengePage;
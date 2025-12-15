import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, Plus, Award, Trophy, Star, Crown, Sparkles, Users, Target, Zap, Gift } from 'lucide-react'

// 模拟数据
const mockBadges = [
  {
    id: '1',
    name: '学术之星',
    description: '学习成绩优异，表现突出',
    icon: '⭐',
    category: 'ACADEMIC',
    isActive: true,
    awardedCount: 12
  },
  {
    id: '2',
    name: '学习先锋',
    description: '勤奋好学，积极参与课堂',
    icon: '🏆',
    category: 'BEHAVIOR',
    isActive: true,
    awardedCount: 8
  },
  {
    id: '3',
    name: '数学达人',
    description: '数学能力突出',
    icon: '🔥',
    category: 'SKILL',
    isActive: true,
    awardedCount: 6
  },
  {
    id: '4',
    name: '阅读小达人',
    description: '热爱阅读，知识渊博',
    icon: '📚',
    category: 'ACADEMIC',
    isActive: true,
    awardedCount: 15
  },
  {
    id: '5',
    name: '团队领袖',
    description: '组织能力强，善于合作',
    icon: '👑',
    category: 'LEADERSHIP',
    isActive: true,
    awardedCount: 4
  },
  {
    id: '6',
    name: '运动健将',
    description: '体育表现优秀',
    icon: '💪',
    category: 'SKILL',
    isActive: true,
    awardedCount: 10
  }
]

const mockStudents = [
  { id: '1', name: '张小明', className: '三年级一班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=张小明&backgroundColor=ffffff' },
  { id: '2', name: '李小红', className: '三年级二班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=李小红&backgroundColor=ffffff' },
  { id: '3', name: '王小强', className: '三年级一班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=王小强&backgroundColor=ffffff' },
  { id: '4', name: '陈小美', className: '三年级二班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=陈小美&backgroundColor=ffffff' },
  { id: '5', name: '刘小军', className: '三年级三班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=刘小军&backgroundColor=ffffff' },
  { id: '6', name: '赵小丽', className: '三年级三班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=赵小丽&backgroundColor=ffffff' },
]

const mockStudentBadges = [
  {
    id: '1',
    studentId: '1',
    badgeId: '1',
    awardedAt: new Date(Date.now() - 86400000).toISOString(),
    reason: '期中考试成绩优秀',
    student: { id: '1', name: '张小明', className: '三年级一班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=张小明&backgroundColor=ffffff' },
    badge: { id: '1', name: '学术之星', icon: '⭐', category: 'ACADEMIC' }
  },
  {
    id: '2',
    studentId: '2',
    badgeId: '4',
    awardedAt: new Date(Date.now() - 172800000).toISOString(),
    reason: '本月阅读量最高',
    student: { id: '2', name: '李小红', className: '三年级二班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=李小红&backgroundColor=ffffff' },
    badge: { id: '4', name: '阅读小达人', icon: '📚', category: 'ACADEMIC' }
  },
  {
    id: '3',
    studentId: '3',
    badgeId: '2',
    awardedAt: new Date(Date.now() - 259200000).toISOString(),
    reason: '课堂表现积极',
    student: { id: '3', name: '王小强', className: '三年级一班', avatarUrl: 'https://api.dicebear.com/7.x/notionists/svg?seed=王小强&backgroundColor=ffffff' },
    badge: { id: '2', name: '学习先锋', icon: '🏆', category: 'BEHAVIOR' }
  }
]

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  isActive: boolean
  awardedCount: number
}

interface Student {
  id: string
  name: string
  className: string
  avatarUrl: string
}

interface StudentBadge {
  id: string
  studentId: string
  badgeId: string
  awardedAt: string
  reason?: string
  student: {
    id: string
    name: string
    className: string
    avatarUrl: string
  }
  badge: {
    id: string
    name: string
    icon: string
    category: string
  }
}

const BadgePage: React.FC = () => {
  const navigate = useNavigate()

  // 状态管理
  const [badges, setBadges] = useState<Badge[]>(mockBadges)
  const [students, setStudents] = useState<Student[]>(mockStudents)
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>(mockStudentBadges)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'badges' | 'award'>('badges')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAwardModal, setShowAwardModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [awardLoading, setAwardLoading] = useState(false)

  // 表单状态
  const [newBadge, setNewBadge] = useState({
    name: '',
    description: '',
    icon: '⭐',
    category: 'ACADEMIC'
  })

  const [awardForm, setAwardForm] = useState({
    badgeId: '',
    studentIds: [] as string[],
    reason: ''
  })

  // 勋章类别
  const badgeCategories = {
    ACADEMIC: { label: '学术成就', color: 'blue', icon: '📚' },
    BEHAVIOR: { label: '行为表现', color: 'green', icon: '🌟' },
    SKILL: { label: '技能特长', color: 'purple', icon: '🎯' },
    LEADERSHIP: { label: '领导力', color: 'orange', icon: '👑' },
    TEAMWORK: { label: '团队协作', color: 'pink', icon: '🤝' },
    CREATIVITY: { label: '创造力', color: 'yellow', icon: '🎨' }
  }

  const availableIcons = ['⭐', '🏆', '🥇', '🥈', '🥉', '💎', '🔥', '💪', '🏅', '🎖️', '🎯', '🌟', '✨', '💫', '👑']

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

  // 获取真实数据
  const fetchBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/badges?schoolId=${userInfo?.schoolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setBadges(data.data);
      }
    } catch (error) {
      console.error('获取勋章数据失败:', error);
      // 保持使用模拟数据
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/students?schoolId=${userInfo?.schoolId}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        const formattedStudents = data.data.map((student: any) => ({
          id: student.id,
          name: student.name,
          className: student.className,
          avatarUrl: student.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(student.name)}&backgroundColor=ffffff`
        }));
        setStudents(formattedStudents);
      }
    } catch (error) {
      console.error('获取学生数据失败:', error);
      // 保持使用模拟数据
    }
  };

  const fetchStudentBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/badges/stats?schoolId=${userInfo?.schoolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.data && data.data.recentAwards) {
        setStudentBadges(data.data.recentAwards);
      }
    } catch (error) {
      console.error('获取学生勋章记录失败:', error);
      // 保持使用模拟数据
    }
  };

  useEffect(() => {
    fetchBadges();
    fetchStudents();
    fetchStudentBadges();
  }, []);

  // 创建勋章
  const handleCreateBadge = async () => {
    if (!newBadge.name.trim()) {
      toast.error('请输入勋章名称')
      return
    }

    setCreateLoading(true)
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newBadge.name.trim(),
          description: newBadge.description.trim(),
          icon: newBadge.icon,
          category: newBadge.category,
          schoolId: userInfo?.schoolId
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchBadges();
        setShowCreateModal(false);
        setNewBadge({ name: '', description: '', icon: '⭐', category: 'ACADEMIC' });
        toast.success('勋章创建成功');
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (error) {
      console.error('创建勋章失败:', error);
      toast.error('创建失败，请重试');
    } finally {
      setCreateLoading(false);
    }
  }

  // 授予勋章
  const handleAwardBadge = async () => {
    if (!awardForm.badgeId || awardForm.studentIds.length === 0) {
      toast.error('请选择勋章和学生')
      return
    }

    setAwardLoading(true)
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const awardPromises = awardForm.studentIds.map(studentId =>
        fetch('/api/badges/award', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            badgeId: awardForm.badgeId,
            studentId,
            schoolId: userInfo?.schoolId,
            reason: awardForm.reason,
            awardedBy: userInfo?.userId
          })
        })
      );

      const results = await Promise.allSettled(awardPromises);
      const successCount = results.filter(result =>
        result.status === 'fulfilled' && result.value.ok
      ).length;

      if (successCount > 0) {
        await Promise.all([fetchBadges(), fetchStudentBadges()]);
        setShowAwardModal(false);
        setAwardForm({ badgeId: '', studentIds: [], reason: '' });
        toast.success(`成功为 ${successCount} 位学生授予勋章`);
      } else {
        toast.error('授予勋章失败，请重试');
      }
    } catch (error) {
      console.error('授予勋章失败:', error);
      toast.error('授予失败，请重试');
    } finally {
      setAwardLoading(false);
    }
  }

  // 切换学生选择
  const toggleStudentSelection = (studentId: string) => {
    setAwardForm(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
    }))
  }

  // 全选/取消全选
  const selectAllStudents = () => {
    if (awardForm.studentIds.length === students.length) {
      setAwardForm(prev => ({ ...prev, studentIds: [] }))
    } else {
      setAwardForm(prev => ({ ...prev, studentIds: students.map(s => s.id) }))
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  // 勋章卡片组件
  const BadgeCard = ({ badge, index }: { badge: Badge; index: number }) => {
    const categoryInfo = badgeCategories[badge.category as keyof typeof badgeCategories] || badgeCategories.ACADEMIC

    return (
      <div
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-rotate-1"
        style={{
          animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
        }}
      >
        <div className="text-center mb-4">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${categoryInfo.color === 'blue' ? 'from-blue-400 to-blue-600' : categoryInfo.color === 'green' ? 'from-green-400 to-green-600' : categoryInfo.color === 'purple' ? 'from-purple-400 to-purple-600' : categoryInfo.color === 'orange' ? 'from-orange-400 to-orange-600' : categoryInfo.color === 'pink' ? 'from-pink-400 to-pink-600' : 'from-yellow-400 to-yellow-600'} text-white shadow-lg mb-3`}>
            <span className="text-3xl">{badge.icon}</span>
          </div>
          <h3 className="font-bold text-gray-800 text-lg mb-2">{badge.name}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{badge.description}</p>
          <div className="flex items-center justify-center space-x-2 mb-3">
            <span className="text-xs text-gray-500">{categoryInfo.icon}</span>
            <span className="text-xs text-gray-500">{categoryInfo.label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-600">已授予</span>
          </div>
          <span className="text-lg font-bold text-gray-800">{badge.awardedCount}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">荣誉勋章</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-4">
        <div className="bg-white rounded-xl p-1 shadow-sm">
          <div className="flex">
            <button
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'badges'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>勋章库</span>
              </div>
            </button>
            <button
              onClick={() => setShowAwardModal(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                activeTab === 'award'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Gift className="w-4 h-4" />
                <span>授予勋章</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-6">
        {activeTab === 'badges' && (
          <div className="space-y-6">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{badges.length}</div>
                <div className="text-xs text-gray-600">勋章总数</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{studentBadges.length}</div>
                <div className="text-xs text-gray-600">总授予数</div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-800">{students.length}</div>
                <div className="text-xs text-gray-600">学生总数</div>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {badges.map((badge, index) => (
                <BadgeCard key={badge.id} badge={badge} index={index} />
              ))}
            </div>

            {badges.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">暂无勋章</p>
                <p className="text-gray-400 text-sm mt-2">点击右上角创建第一个勋章</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Awards */}
        {studentBadges.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-4">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-gray-900">最近授予</h2>
              <span className="bg-yellow-100 text-yellow-600 text-xs font-bold px-2 py-1 rounded-full">
                {studentBadges.length}
              </span>
            </div>

            <div className="space-y-3">
              {studentBadges.map((studentBadge) => (
                <div
                  key={studentBadge.id}
                  className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow flex items-center justify-between"
                  style={{
                    animation: `slideInLeft 0.5s ease-out ${Math.random() * 0.5}s both`
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{studentBadge.badge.icon}</div>
                    <div>
                      <div className="font-bold text-gray-800">{studentBadge.student.name}</div>
                      <div className="text-sm text-gray-600">
                        {studentBadge.student.className} • {studentBadge.badge.name}
                      </div>
                      {studentBadge.reason && (
                        <div className="text-xs text-gray-500 mt-1">{studentBadge.reason}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{formatDate(studentBadge.awardedAt)}</div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Sparkles className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-yellow-600">新授予</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Badge Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">创建新勋章</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">勋章名称</label>
                <input
                  type="text"
                  placeholder="输入勋章名称"
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({ ...newBadge, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">勋章描述</label>
                <textarea
                  placeholder="描述勋章的获得条件或意义"
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">勋章类别</label>
                  <select
                    value={newBadge.category}
                    onChange={(e) => setNewBadge({ ...newBadge, category: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {Object.entries(badgeCategories).map(([value, info]) => (
                      <option key={value} value={value}>
                        {info.icon} {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">勋章图标</label>
                  <select
                    value={newBadge.icon}
                    onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  >
                    {availableIcons.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateBadge}
                disabled={createLoading}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? '创建中...' : '创建勋章'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Award Badge Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">授予勋章</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">选择勋章</label>
                <select
                  value={awardForm.badgeId}
                  onChange={(e) => setAwardForm({ ...awardForm, badgeId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">选择勋章</option>
                  {badges.filter(b => b.isActive).map(badge => (
                    <option key={badge.id} value={badge.id}>
                      {badge.icon} {badge.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">选择学生</label>
                  <button
                    onClick={selectAllStudents}
                    className="text-xs text-purple-600 font-medium"
                  >
                    {awardForm.studentIds.length === students.length ? '取消全选' : '全选'}
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                  {students.map(student => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        awardForm.studentIds.includes(student.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="w-8 h-8 rounded-full mx-auto mb-2 object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><rect x="16" y="40" width="32" height="16" rx="8" fill="%23cbd5e1"/></svg>`
                        }}
                      />
                      <div className="text-xs font-medium text-gray-800 truncate">{student.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">授予原因（可选）</label>
                <textarea
                  placeholder="请输入授予原因"
                  value={awardForm.reason}
                  onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAwardModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAwardBadge}
                disabled={awardLoading || !awardForm.badgeId || awardForm.studentIds.length === 0}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {awardLoading ? '授予中...' : `授予勋章 (${awardForm.studentIds.length}人)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 动画样式 */}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

export default BadgePage
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Plus, Trophy, Target, Users, Zap, Crown, Star, Sparkles } from 'lucide-react'

// 模拟数据
const mockStudents = [
  { id: '1', name: '张小明', className: '三年级一班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=张小明&backgroundColor=ffffff' },
  { id: '2', name: '李小红', className: '三年级二班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=李小红&backgroundColor=ffffff' },
  { id: '3', name: '王小强', className: '三年级一班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=王小强&backgroundColor=ffffff' },
  { id: '4', name: '陈小美', className: '三年级二班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=陈小美&backgroundColor=ffffff' },
  { id: '5', name: '刘小军', className: '三年级三班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=刘小军&backgroundColor=ffffff' },
  { id: '6', name: '赵小丽', className: '三年级三班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=赵小丽&backgroundColor=ffffff' },
]

const mockPKMatches = [
  {
    id: '1',
    studentA: { id: '1', name: '张小明', className: '三年级一班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=张小明&backgroundColor=ffffff' },
    studentB: { id: '2', name: '李小红', className: '三年级二班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=李小红&backgroundColor=ffffff' },
    topic: '数学速算竞赛',
    status: 'ONGOING',
    createdAt: new Date().toISOString(),
    winnerId: null
  },
  {
    id: '2',
    studentA: { id: '3', name: '王小强', className: '三年级一班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=王小强&backgroundColor=ffffff' },
    studentB: { id: '4', name: '陈小美', className: '三年级二班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=陈小美&backgroundColor=ffffff' },
    topic: '古诗词背诵',
    status: 'ONGOING',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    winnerId: null
  },
  {
    id: '3',
    studentA: { id: '5', name: '刘小军', className: '三年级三班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=刘小军&backgroundColor=ffffff' },
    studentB: { id: '6', name: '赵小丽', className: '三年级三班', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=赵小丽&backgroundColor=ffffff' },
    topic: '英语单词PK',
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    winnerId: '5'
  }
]

interface Student {
  id: string
  name: string
  className: string
  avatar_url: string
}

interface PKMatch {
  id: string
  studentA: Student
  studentB: Student
  topic: string
  status: string
  createdAt: string
  winnerId?: string
}

const PKPage: React.FC = () => {
  const navigate = useNavigate()

  // 状态管理
  const [pkMatches, setPKMatches] = useState<PKMatch[]>(mockPKMatches)
  const [students, setStudents] = useState<Student[]>(mockStudents)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [selectedPK, setSelectedPK] = useState<PKMatch | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [newPK, setNewPK] = useState({
    studentA: '',
    studentB: '',
    topic: ''
  })

  // 每页显示3个PK
  const ITEMS_PER_PAGE = 3
  const ongoingMatches = pkMatches.filter(pk => pk.status === 'ONGOING')
  const completedMatches = pkMatches.filter(pk => pk.status === 'COMPLETED')
  const totalPages = Math.ceil(ongoingMatches.length / ITEMS_PER_PAGE)

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
  const fetchPKMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/pkmatches?schoolId=${userInfo?.schoolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && data.data) {
        setPKMatches(data.data);
      }
    } catch (error) {
      console.error('获取PK数据失败:', error);
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
          avatar_url: student.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(student.name)}&backgroundColor=ffffff`
        }));
        setStudents(formattedStudents);
      }
    } catch (error) {
      console.error('获取学生数据失败:', error);
      // 保持使用模拟数据
    }
  };

  useEffect(() => {
    fetchPKMatches();
    fetchStudents();
  }, []);

  // 自动翻页
  useEffect(() => {
    if (totalPages <= 1) return;

    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages)
    }, 5000) // 每5秒翻页

    return () => clearInterval(timer)
  }, [totalPages])

  // 分页控制
  const currentMatches = ongoingMatches.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  )

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  // 创建PK
  const handleCreatePK = async () => {
    if (!newPK.studentA || !newPK.studentB || !newPK.topic.trim()) {
      toast.error('请填写完整的PK对战信息')
      return
    }

    if (newPK.studentA === newPK.studentB) {
      toast.error('不能选择相同的学生进行PK')
      return
    }

    setCreateLoading(true)
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch('/api/pkmatches', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentA: newPK.studentA,
          studentB: newPK.studentB,
          topic: newPK.topic.trim(),
          schoolId: userInfo?.schoolId
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchPKMatches();
        setShowCreateModal(false);
        setNewPK({ studentA: '', studentB: '', topic: '' });
        toast.success('PK对战创建成功');
      } else {
        toast.error(data.message || '创建失败');
      }
    } catch (error) {
      console.error('创建PK失败:', error);
      toast.error('创建失败，请重试');
    } finally {
      setCreateLoading(false);
    }
  }

  // 宣布结果
  const handleDeclareResult = async (pkId: string, winnerId?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch(`/api/pkmatches/${pkId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schoolId: userInfo?.schoolId,
          status: 'COMPLETED',
          winnerId
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchPKMatches();
        setShowResultModal(false);
        setSelectedPK(null);
        toast.success(winnerId ? 'PK结果已更新' : 'PK平局');
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新PK结果失败:', error);
      toast.error('更新失败，请重试');
    }
  }

  const openResultModal = (pk: PKMatch) => {
    setSelectedPK(pk);
    setShowResultModal(true);
  }

  // PK卡片组件
  const PKCard = ({ pk, index }: { pk: PKMatch; index: number }) => (
    <div
      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      style={{
        animation: `slideInUp 0.5s ease-out ${index * 0.1}s both`
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-blue-600">进行中</span>
        </div>
        <button
          onClick={() => openResultModal(pk)}
          className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
        >
          宣布结果
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 text-center">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <img
              src={pk.studentA.avatar_url}
              alt={pk.studentA.name}
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><rect x="16" y="40" width="32" height="16" rx="8" fill="%23cbd5e1"/></svg>`
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-xs font-bold text-yellow-800">A</span>
            </div>
          </div>
          <div className="font-bold text-gray-800 text-sm">{pk.studentA.name}</div>
          <div className="text-xs text-gray-500">{pk.studentA.className}</div>
        </div>

        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-2">VS</div>
          <div className="bg-white rounded-xl p-3 shadow-inner">
            <div className="text-sm font-bold text-gray-800">{pk.topic}</div>
            <div className="text-xs text-gray-500 mt-1">PK主题</div>
          </div>
        </div>

        <div className="flex-1 text-center">
          <div className="relative w-16 h-16 mx-auto mb-2">
            <img
              src={pk.studentB.avatar_url}
              alt={pk.studentB.name}
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><rect x="16" y="40" width="32" height="16" rx="8" fill="%23cbd5e1"/></svg>`
              }}
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-400 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-xs font-bold text-red-800">B</span>
            </div>
          </div>
          <div className="font-bold text-gray-800 text-sm">{pk.studentB.name}</div>
          <div className="text-xs text-gray-500">{pk.studentB.className}</div>
        </div>
      </div>

      <div className="flex justify-center space-x-2">
        <div className="flex items-center space-x-1">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          <span className="text-xs text-gray-600">竞技时刻</span>
        </div>
        <div className="text-xs text-gray-400">
          {new Date(pk.createdAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )

  // 历史PK卡片
  const HistoryPKCard = ({ pk }: { pk: PKMatch }) => {
    const isDraw = !pk.winnerId;
    const winner = pk.winnerId === pk.studentA.id ? pk.studentA : pk.studentB;

    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDraw ? 'bg-gray-100' : 'bg-yellow-100'}`}>
                {isDraw ? (
                  <Users className="w-4 h-4 text-gray-600" />
                ) : (
                  <Crown className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {isDraw ? '平局' : `${winner.name} 胜利`}
              </span>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {new Date(pk.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">{pk.topic}</div>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <img
                src={pk.studentA.avatar_url}
                alt={pk.studentA.name}
                className="w-6 h-6 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><rect x="16" y="40" width="32" height="16" rx="8" fill="%23cbd5e1"/></svg>`
                }}
              />
              <span className="text-xs font-medium text-gray-700">{pk.studentA.name}</span>
            </div>
            <span className="text-xs text-gray-400">VS</span>
            <div className="flex items-center space-x-2">
              <img
                src={pk.studentB.avatar_url}
                alt={pk.studentB.name}
                className="w-6 h-6 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><rect x="16" y="40" width="32" height="16" rx="8" fill="%23cbd5e1"/></svg>`
                }}
              />
              <span className="text-xs font-medium text-gray-700">{pk.studentB.name}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
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
            <h1 className="text-xl font-bold text-gray-900">PK 对决</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Active PK Matches */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">进行中的PK</h2>
            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded-full">
              {ongoingMatches.length}
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={prevPage}
                className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentPage ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextPage}
                className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {ongoingMatches.length > 0 ? (
          <div className="space-y-4">
            {currentMatches.map((pk, index) => (
              <PKCard key={pk.id} pk={pk} index={index} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">暂无进行中的PK对战</p>
            <p className="text-gray-400 text-sm mt-2">创建新的PK对战开始竞技吧！</p>
          </div>
        )}
      </div>

      {/* PK History */}
      {completedMatches.length > 0 && (
        <div className="px-4 pb-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">PK历史</h2>
            <span className="bg-yellow-100 text-yellow-600 text-xs font-bold px-2 py-1 rounded-full">
              {completedMatches.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedMatches.map((pk) => (
              <HistoryPKCard key={pk.id} pk={pk} />
            ))}
          </div>
        </div>
      )}

      {/* Create PK Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">创建PK对战</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学生A</label>
                  <select
                    value={newPK.studentA}
                    onChange={(e) => setNewPK({ ...newPK, studentA: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">选择学生A</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">学生B</label>
                  <select
                    value={newPK.studentB}
                    onChange={(e) => setNewPK({ ...newPK, studentB: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">选择学生B</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PK主题</label>
                <input
                  type="text"
                  placeholder="输入PK对战主题"
                  value={newPK.topic}
                  onChange={(e) => setNewPK({ ...newPK, topic: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                onClick={handleCreatePK}
                disabled={createLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading ? '创建中...' : '创建PK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declare Result Modal */}
      {showResultModal && selectedPK && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">宣布PK结果</h3>

            <div className="text-center mb-6">
              <div className="text-sm text-gray-600 mb-2">对战主题</div>
              <div className="text-xl font-bold text-gray-800">{selectedPK.topic}</div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleDeclareResult(selectedPK.id, selectedPK.studentA.id)}
                className="p-4 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-colors text-center"
              >
                <img
                  src={selectedPK.studentA.avatar_url}
                  alt={selectedPK.studentA.name}
                  className="w-12 h-12 rounded-full object-cover mx-auto mb-2"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><rect x="16" y="40" width="32" height="16" rx="8" fill="%23cbd5e1"/></svg>`
                  }}
                />
                <div className="font-bold text-gray-800 text-sm">{selectedPK.studentA.name}</div>
                <div className="text-xs text-blue-600 font-medium">选手A胜</div>
              </button>

              <button
                onClick={() => handleDeclareResult(selectedPK.id)}
                className="p-4 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-colors text-center"
              >
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <div className="font-bold text-gray-800 text-sm">平局</div>
                <div className="text-xs text-gray-600 font-medium">无人获胜</div>
              </button>

              <button
                onClick={() => handleDeclareResult(selectedPK.id, selectedPK.studentB.id)}
                className="p-4 border-2 border-gray-200 hover:border-red-300 rounded-xl transition-colors text-center"
              >
                <img
                  src={selectedPK.studentB.avatar_url}
                  alt={selectedPK.studentB.name}
                  className="w-12 h-12 rounded-full object-cover mx-auto mb-2"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23e5e7eb"/><circle cx="32" cy="24" r="12" fill="%23cbd5e1"/><rect x="16" y="40" width="32" height="16" rx="8" fill="%23cbd5e1"/></svg>`
                  }}
                />
                <div className="font-bold text-gray-800 text-sm">{selectedPK.studentB.name}</div>
                <div className="text-xs text-red-600 font-medium">选手B胜</div>
              </button>
            </div>

            <button
              onClick={() => setShowResultModal(false)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              取消
            </button>
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
      `}</style>
    </div>
  )
}

export default PKPage
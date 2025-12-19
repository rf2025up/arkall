import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Calendar,
  Clock,
  User,
  Target,
  BookOpen,
  Award,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Download,
  X
} from 'lucide-react';
import apiService from '../services/api.service';

// ✅ 宪法合规：严格的TypeScript类型定义
interface PersonalizedTutoringPlan {
  id: string;
  title: string;
  subject: string;
  difficulty: number;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  studentName: string;
  studentClass: string;
  knowledgePoints: string[];
  mainProblem: string;
  tutoringMethods: Record<string, boolean>;
  expReward: number;
  pointsReward: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  totalSessions: number;
  completedSessions: number;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    name: string;
    className: string;
    exp: number;
    points: number;
    level: number;
  };
}

const PersonalizedTutoringSection: React.FC = () => {
  const [plans, setPlans] = useState<PersonalizedTutoringPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // 获取1v1教学计划列表
  const fetchTutoringPlans = async () => {
    try {
      const response = await apiService.get<PersonalizedTutoringPlan[]>('/personalized-tutoring');
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('获取1v1教学计划失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutoringPlans();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      case 'NO_SHOW': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '已安排';
      case 'IN_PROGRESS': return '进行中';
      case 'COMPLETED': return '已完成';
      case 'CANCELLED': return '已取消';
      case 'NO_SHOW': return '缺席';
      default: return status;
    }
  };

  const formatSubject = (subject: string) => {
    const subjectMap: Record<string, string> = {
      chinese: '语文',
      math: '数学',
      english: '英语',
      general: '综合',
      science: '科学',
      art: '艺术'
    };
    return subjectMap[subject] || subject;
  };

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-purple-100 mt-8 pt-6">
      {/* 标题区域 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <GraduationCap size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">1v1讲解</h3>
            <p className="text-gray-500 text-xs">个性化教学计划 - 独立于进度发布系统</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
        >
          <Plus size={16} />
          新建1v1计划
        </button>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{plans.length}</div>
          <div className="text-xs text-blue-700">总计划数</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-yellow-600">
            {plans.filter(p => p.status === 'IN_PROGRESS').length}
          </div>
          <div className="text-xs text-yellow-700">进行中</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">
            {plans.filter(p => p.status === 'COMPLETED').length}
          </div>
          <div className="text-xs text-green-700">已完成</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">
            {plans.reduce((sum, p) => sum + p.expReward, 0)}
          </div>
          <div className="text-xs text-purple-700">总EXP奖励</div>
        </div>
      </div>

      {/* 计划列表 */}
      <div className="space-y-4">
        {plans.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={24} className="text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-700 mb-2">暂无1v1教学计划</h4>
            <p className="text-gray-500 text-sm mb-6">为学生创建个性化的1v1教学计划</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              创建第一个计划
            </button>
          </div>
        ) : (
          plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-800">{plan.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {getStatusText(plan.status)}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {formatSubject(plan.subject)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {plan.studentName} ({plan.studentClass})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {plan.scheduledDate} {plan.scheduledTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {plan.duration}分钟
                    </span>
                    <span className="flex items-center gap-1">
                      <Target size={14} />
                      难度{getDifficultyStars(plan.difficulty)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium">辅导方法:</span>
                    {Object.entries(plan.tutoringMethods)
                      .filter(([_, enabled]) => enabled)
                      .map(([key, _]) => {
                        const methodMap: Record<string, string> = {
                          conceptExplaining: '概念梳理',
                          exampleTeaching: '例题讲解',
                          mistakeReflection: '错题反思',
                          practiceExercise: '练习巩固',
                          interactiveDiscussion: '互动讨论',
                          summaryReview: '总结回顾'
                        };
                        return methodMap[key] || key;
                      })
                      .join(' · ')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-purple-600 font-semibold">+{plan.expReward} EXP</div>
                    <div className="text-gray-500 text-xs">+{plan.pointsReward} 分</div>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FileText size={14} className="text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">主要问题：</span>
                      {plan.mainProblem}
                    </p>
                    {plan.knowledgePoints.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">知识点：</span>
                        {plan.knowledgePoints.join('、')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 下载功能区域 */}
      <TutoringDownloadSection />

      {/* 创建表单弹窗 - 简化版本 */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">新建1v1教学计划</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="text-center py-8">
              <GraduationCap size={48} className="text-purple-600 mx-auto mb-4" />
              <h4 className="font-semibold text-gray-800 mb-2">1v1教学计划</h4>
              <p className="text-gray-500 text-sm mb-6">
                为学生创建个性化教学计划，包括时间安排、知识点、辅导方法等
              </p>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium"
              >
                功能开发中...
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 下载功能组件
const TutoringDownloadSection: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const downloadUrl = `/personalized-tutoring/download-record?${queryParams.toString()}`;

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('下载失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const today = new Date().toISOString().split('T')[0];
      link.download = `1v1教学记录表_${today}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ 1v1教学记录表下载完成');
    } catch (error) {
      console.error('❌ 下载失败:', error);
      alert('下载失败，请稍后重试');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 mt-6 pt-4">
      {/* 下载区域标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Download size={16} className="text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 text-sm">下载我的教学记录</h4>
            <p className="text-gray-500 text-xs">导出您个人的1v1教学记录统计表</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showFilters && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="开始日期"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                className="px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="结束日期"
              />
            </div>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="筛选日期范围"
          >
            <Calendar size={16} />
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                下载中...
              </>
            ) : (
              <>
                <Download size={16} />
                下载记录表
              </>
            )}
          </button>
        </div>
      </div>

      {/* 说明文字 */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <FileText size={14} className="text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">您的个人教学记录表包含：</p>
            <ul className="space-y-0.5 ml-4">
              <li>• 📊 总览统计：您的计划总数、完成情况、学生覆盖、奖励发放等</li>
              <li>• 📝 详细记录：每个1v1教学计划的完整信息，包括时间、内容、方法、效果等</li>
              <li>• 📈 数据分析：支持按日期范围筛选，方便您进行教学效果分析</li>
              <li>• 💾 便于保存：Excel格式，方便您存档和后续查看</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedTutoringSection;
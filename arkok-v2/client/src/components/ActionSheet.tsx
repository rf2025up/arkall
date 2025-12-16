import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Student, PointPreset } from '../types/student';
import { useClass } from '../context/ClassContext';

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Student[];
  onConfirm: (points: number, reason: string, exp?: number) => void;
  onTransfer?: (studentIds: string[], targetTeacherId?: string) => void;  // 🆕 修改参数类型
  scorePresets: PointPreset[];
  categoryNames: Record<string, string>;
}

const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  onConfirm,
  onTransfer,
  scorePresets,
  categoryNames
}) => {
  const { viewMode } = useClass();  // 🆕 使用 viewMode 而不是 currentClass
  const [activeTab, setActiveTab] = useState<string>('');
  const [customPoints, setCustomPoints] = useState<string>('');
  const [customExp, setCustomExp] = useState<string>('');

  console.log('[DEBUG] ActionSheet component state:', {
    isOpen,
    viewMode,
    hasOnTransfer: !!onTransfer,
    selectedStudentsCount: selectedStudents.length,
    shouldShowTransferButton: !!(onTransfer && (viewMode === 'ALL_SCHOOL' || viewMode === 'SPECIFIC_CLASS'))
  });

  useEffect(() => {
    if (isOpen) {
      const keys = Object.keys(categoryNames);
      if (keys.length > 0 && !activeTab) {
          setActiveTab(keys[0]);
      }
      setCustomPoints('');
      setCustomExp('');
    }
  }, [isOpen, categoryNames]);

  if (!isOpen) return null;

  const handlePresetClick = (value: number, label: string) => {
    onConfirm(value, label);
  };

  const handleCustomConfirm = () => {
    const pts = parseInt(customPoints);
    const exp = parseInt(customExp);

    if (!isNaN(pts) || !isNaN(exp)) {
      const finalPts = isNaN(pts) ? 0 : pts;
      const finalExp = isNaN(exp) ? 0 : exp;
      const reason = finalPts > 0 ? '手动加分' : (finalPts < 0 ? '手动扣分' : '经验调整');

      onConfirm(finalPts, reason, finalExp);
    }
  };

  // 🆕 处理师生关系转移 - "抢人"功能
  const handleTransferToMyClass = () => {
    console.log('[DEBUG] ActionSheet handleTransferToMyClass called', {
      hasOnTransfer: !!onTransfer,
      selectedStudentsCount: selectedStudents.length,
      viewMode: viewMode,
      studentNames: selectedStudents.map(s => s.name)
    });

    if (onTransfer && selectedStudents.length > 0) {
      const studentIds = selectedStudents.map(s => s.id);
      console.log('[DEBUG] Calling onTransfer with studentIds:', studentIds);
      // 传递当前用户ID作为目标教师ID
      onTransfer(studentIds, 'current'); // 使用'current'标识当前老师
      onClose();
    } else {
      console.log('[DEBUG] Transfer not executed:', {
        hasOnTransfer: !!onTransfer,
        selectedStudentsCount: selectedStudents.length
      });
    }
  };

  return (
    // 1. Z-Index 60 确保盖住 BottomNav (Z-50)
    // 2. items-end 确保靠底
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in">

      {/* 点击背景关闭 */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* 内容区域：贴底抽屉 */}
      <div className="relative bg-white w-full max-w-none rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">

        {/* 顶部把手 */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            {selectedStudents.length === 1 ? (
              <>
                <img src={selectedStudents[0]?.avatarUrl || '/1024.jpg'} alt="avatar" className="w-12 h-12 rounded-full border-2 border-orange-100 shadow-sm" />
                <div>
                  <p className="font-bold text-lg text-gray-800">{selectedStudents[0].name}</p>
                  <div className="flex items-center space-x-2 text-xs font-medium">
                    <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">积分: {selectedStudents[0].points}</span>
                    <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">经验: {selectedStudents[0].exp}</span>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <p className="font-bold text-lg text-gray-800">批量操作</p>
                <p className="text-xs text-gray-500 mt-0.5">已选中 <span className="text-primary font-bold">{selectedStudents.length}</span> 位学生</p>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* 🆕 抢人功能 - 在全校视图和特定班级视图时显示 */}
        {(() => {
          const shouldShow = !!(onTransfer && (viewMode === 'ALL_SCHOOL' || viewMode === 'SPECIFIC_CLASS'));
          console.log('[DEBUG] ActionSheet transfer button render check:', {
            hasOnTransfer: !!onTransfer,
            viewMode: viewMode,
            shouldShow,
            selectedStudentsCount: selectedStudents.length
          });
          return shouldShow;
        })() && (
          <div className="px-4 pb-2">
            <button
              onClick={handleTransferToMyClass}
              className="w-full bg-blue-600 text-white font-bold rounded-xl py-3.5 hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <UserPlus size={20} />
              移入我的班级 ({selectedStudents.length}人)
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              将选中的学生划归到您名下
            </p>
          </div>
        )}

        {/* 🆕 积分调整功能 - 仅在我的学生视图下显示 */}
        {viewMode === 'MY_STUDENTS' && (
          <>
            {/* 预制加分项目提示 */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl mx-4">
              <div className="text-center">
                <p className="text-sm font-medium text-orange-600 mb-1">🚧 预制加分项目暂时关闭</p>
                <p className="text-xs text-orange-500">请使用下方手动填写功能进行调整</p>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-white pb-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
              <div className="flex gap-3 items-center mb-3">
                <div className="flex-1 relative">
                   <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400">积分</label>
                   <input
                      type="number"
                      placeholder="0"
                      value={customPoints}
                      onChange={(e) => setCustomPoints(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center font-bold text-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-gray-50"
                   />
                </div>
                <div className="flex-1 relative">
                   <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400">经验值</label>
                   <input
                      type="number"
                      placeholder="0"
                      value={customExp}
                      onChange={(e) => setCustomExp(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none bg-gray-50"
                   />
                </div>
              </div>
              <button
                onClick={handleCustomConfirm}
                className="w-full bg-gray-900 text-white font-bold rounded-xl py-3.5 hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg"
              >
                 确认调整
               </button>
            </div>
          </>
        )}

        {/* 🆕 非我的学生视图的提示 */}
        {viewMode !== 'MY_STUDENTS' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mx-4 mb-4">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-600 mb-1">🔒 积分调整功能锁定</p>
              <p className="text-xs text-blue-500">请切换到"我的学生"视图以调整积分</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ActionSheet;

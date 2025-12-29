import React, { useState, useEffect } from 'react';
import { X, UserPlus, CalendarCheck, History } from 'lucide-react';
import { Student } from '../types/student';
import { useClass } from '../context/ClassContext';

// 🆕 上次积分操作记录类型
interface LastScoreRecord {
  points: number;
  exp: number;
  reason?: string;
  operatorName?: string;
  operatedAt: string;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStudents: Student[];
  onConfirm: (points: number, reason: string, exp?: number) => void;
  onTransfer?: (studentIds: string[], targetTeacherId?: string) => void;
  onCheckin?: (studentIds: string[]) => void;
  lastScoreRecord?: LastScoreRecord;  // 🆕 上次积分操作记录
}

const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  selectedStudents,
  onConfirm,
  onTransfer,
  onCheckin,
  lastScoreRecord  // 🆕
}) => {
  const { viewMode, isProxyMode } = useClass();
  const [customPoints, setCustomPoints] = useState<string>('');
  const [customExp, setCustomExp] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');  // 🆕 原因字段

  useEffect(() => {
    if (isOpen) {
      setCustomPoints('');
      setCustomExp('');
      setCustomReason('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCustomConfirm = () => {
    const pts = parseInt(customPoints);
    const exp = parseInt(customExp);

    if (!isNaN(pts) || !isNaN(exp)) {
      const finalPts = isNaN(pts) ? 0 : pts;
      const finalExp = isNaN(exp) ? 0 : exp;
      const reason = customReason.trim() || (finalPts > 0 ? '手动加分' : (finalPts < 0 ? '手动扣分' : '经验调整'));

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
      onTransfer(studentIds, 'current');
      onClose();
    } else {
      console.log('[DEBUG] Transfer not executed:', {
        hasOnTransfer: !!onTransfer,
        selectedStudentsCount: selectedStudents.length
      });
    }
  };

  // 🆕 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-[2px] transition-opacity animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative bg-white w-full max-w-none rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
        </div>

        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            {selectedStudents.length === 1 ? (
              <>
                <img src={selectedStudents[0]?.avatarUrl || '/avatar.jpg'} alt="avatar" className="w-12 h-12 rounded-full border-2 border-orange-100 shadow-sm" />
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

        {/* 🆕 抢人功能 */}
        {(() => {
          const shouldShow = !!(onTransfer && (viewMode === 'ALL_SCHOOL' || viewMode === 'SPECIFIC_CLASS'));
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

        {/* 🆕 积分调整功能 */}
        {(viewMode === 'MY_STUDENTS' || isProxyMode) && (
          <div className="p-5 border-t border-gray-100 bg-white pb-14 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">

            {/* 🆕 上次操作记录 */}
            {lastScoreRecord && (
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <History size={14} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">上次操作</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {lastScoreRecord.points !== 0 && (
                      <span className={`text-sm font-bold ${lastScoreRecord.points > 0 ? 'text-orange-600' : 'text-red-500'}`}>
                        {lastScoreRecord.points > 0 ? '+' : ''}{lastScoreRecord.points} 积分
                      </span>
                    )}
                    {lastScoreRecord.exp !== 0 && (
                      <span className="text-sm font-bold text-blue-600">
                        {lastScoreRecord.exp > 0 ? '+' : ''}{lastScoreRecord.exp} 经验
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {lastScoreRecord.operatorName && `${lastScoreRecord.operatorName} · `}
                    {formatDate(lastScoreRecord.operatedAt)}
                  </span>
                </div>
              </div>
            )}

            {/* 积分/经验输入 */}
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

            {/* 🆕 原因输入（可选） */}
            <div className="mb-3 relative">
              <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400 z-10">原因（可选）</label>
              <input
                type="text"
                placeholder="课堂表现优秀..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:ring-2 focus:ring-gray-300 focus:border-transparent outline-none bg-gray-50"
              />
            </div>

            <button
              onClick={handleCustomConfirm}
              className="w-full bg-gray-900 text-white font-bold rounded-xl py-3.5 hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg"
            >
              确认加分
            </button>
          </div>
        )}

        {/* 🆕 非我的学生且非代理视图的提示 */}
        {viewMode !== 'MY_STUDENTS' && !isProxyMode && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mx-4 mb-4">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-600 mb-1">🔒 积分调整功能锁定</p>
              <p className="text-xs text-blue-500">
                {viewMode === 'SPECIFIC_CLASS' ? '当前为临时查看模式，如需代管理请至"我的"页发起。' : '请切换到"我的学生"视图以调整积分'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionSheet;


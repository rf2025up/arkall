import React, { useState, useEffect, useMemo } from 'react'
import { Team } from './types'
import { PKMatch } from './types'

// --- 类型定义 ---
interface Student {
  id: string;
  name: string;
  avatar_url?: string;
  team_id?: string;
  total_points?: number;
}

interface PKBoardCardProps {
  pks: PKMatch[]
  teamsMap: Map<string, Team>
  students?: Student[]
}

const PKBoardCard: React.FC<PKBoardCardProps> = ({ pks, teamsMap, students = [] }) => {
  // --- 1. 配置参数 ---
  const ITEMS_PER_PAGE = 3;    // 每页3条
  const STAY_DURATION = 4000;  // 停留时间 4秒
  const ANIMATION_TIME = 500;  // 切换动画耗时 0.5秒

  // --- 2. 数据处理：分页 & 首尾相接 ---
  const displayPages = useMemo(() => {
    if (!pks || pks.length === 0) return [];

    // 第一步：根据每页3条切分数据
    const chunks: PKMatch[][] = [];
    for (let i = 0; i < pks.length; i += ITEMS_PER_PAGE) {
      chunks.push(pks.slice(i, i + ITEMS_PER_PAGE));
    }

    // 第二步：如果超过1页，在末尾"克隆"第一页
    // 变成：[页1, 页2, ... 页N, 页1(克隆)]
    if (chunks.length > 1) {
      return [...chunks, chunks[0]];
    }
    return chunks;
  }, [pks]);

  // --- 3. 状态管理 ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true); // 控制是否有过渡动画

  // --- 4. 定时器：控制自动轮播 ---
  useEffect(() => {
    // 只有1页时，不需要轮播
    if (displayPages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        // 每次启动移动时，务必开启滑动的过渡动画
        setIsAnimating(true);
        return nextIndex;
      });
    }, STAY_DURATION);

    return () => clearInterval(timer);
  }, [displayPages.length]);

  // --- 5. 核心逻辑：动画结束后的"瞬间回弹" ---
  useEffect(() => {
    // 判断条件：如果我们已经滑动到了"克隆页"（即数组的最后一项）
    if (currentIndex === displayPages.length - 1 && displayPages.length > 1) {

      // 等待 500ms（即 CSS transition 完成的时间）
      const timeout = setTimeout(() => {
        // A. 关闭过渡动画（为了瞬间移动不被看见）
        setIsAnimating(false);
        // B. 瞬间将索引重置为 0（真正的第一页）
        setCurrentIndex(0);
      }, ANIMATION_TIME);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, displayPages.length]);

  // --- 辅助函数：获取学生和队伍 ---
  const getStudent = (id: string) => students.find((s: any) => String(s.id) === String(id));
  const getTeam = (studentId: string) => {
    const s = getStudent(studentId);
    return s && s.team_id ? teamsMap.get(`t${s.team_id}`) : null;
  };

  if (!pks || pks.length === 0) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-lg h-full flex flex-col overflow-hidden">
      {/* 标题栏 */}
      <div className="flex justify-center items-center p-3 border-b border-slate-700/50 flex-shrink-0 z-10 relative">
        <h2 className="text-xl font-bold text-slate-100">PK榜</h2>

        {/* 指示点 (Dots) */}
        <div className="flex gap-1 absolute right-3">
          {/* 这里我们切掉最后一个克隆页，只渲染真实页数的点 */}
          {(displayPages.length > 1 ? displayPages.slice(0, displayPages.length - 1) : displayPages).map((_, idx) => (
            <div
              key={idx}
              className={`w-1 h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-cyan-400 w-6' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 轮播内容区 */}
      <div className="flex-grow overflow-hidden relative">
        <div
          className={`flex h-full transition-transform ${isAnimating ? 'duration-500' : 'duration-0'}`}
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {displayPages.map((page, pageIndex) => (
            <div key={pageIndex} className="w-full flex-shrink-0 h-full">
              <ul className="space-y-2 p-2">
                {page.map((pk) => {
                  const studentA = getStudent(pk.student_a);
                  const studentB = getStudent(pk.student_b);
                  const winner = pk.winner_id ? getStudent(pk.winner_id) : null;
                  const teamA = studentA ? getTeam(studentA.id) : null;
                  const teamB = studentB ? getTeam(studentB.id) : null;

                  return (
                    <li
                      key={pk.id}
                      className="relative flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition-colors duration-200"
                    >
                      {/* A 学生 */}
                      <div className="flex items-center gap-2 flex-1">
                        <img
                          src={studentA?.avatar_url || '/avatar.jpg'}
                          alt={studentA?.name || '未知'}
                          className="w-10 h-10 rounded-full border-2 border-slate-500 object-cover"
                          onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
                        />
                        <div className="flex-grow">
                          <div className="font-medium text-white truncate">{studentA?.name || '未知'}</div>
                          <div className={`text-xs ${teamA?.textColor || 'text-gray-400'}`}>
                            {teamA?.name || '无队伍'}
                          </div>
                        </div>
                        {winner?.id === studentA?.id && (
                          <div className="px-2 py-1 bg-green-600 rounded-full text-xs font-bold">胜</div>
                        )}
                      </div>

                      {/* 对战信息 */}
                      <div className="text-center flex-shrink-0">
                        <div className="text-xs text-gray-400 mb-1">VS</div>
                        <div className="text-sm font-medium text-cyan-400 truncate px-2">
                          {pk.topic}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {pk.status === 'finished' ? '已结束' : '进行中'}
                        </div>
                      </div>

                      {/* B 学生 */}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        {winner?.id === studentB?.id && (
                          <div className="px-2 py-1 bg-green-600 rounded-full text-xs font-bold">胜</div>
                        )}
                        <div className="text-right flex-grow">
                          <div className={`text-xs ${teamB?.textColor || 'text-gray-400'}`}>
                            {teamB?.name || '无队伍'}
                          </div>
                          <div className="font-medium text-white truncate">{studentB?.name || '未知'}</div>
                        </div>
                        <img
                          src={studentB?.avatar_url || '/avatar.jpg'}
                          alt={studentB?.name || '未知'}
                          className="w-10 h-10 rounded-full border-2 border-slate-500 object-cover"
                          onError={(e) => { e.currentTarget.src = '/avatar.jpg'; }}
                        />
                      </div>

                      {/* 对战状态线 */}
                      <div className="absolute left-0 right-0 -bottom-1 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                      {pk.status === 'finished' && (
                        <div className="absolute left-0 right-0 top-0 bottom-0 border-2 border-green-500/50 rounded-lg" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PKBoardCard;
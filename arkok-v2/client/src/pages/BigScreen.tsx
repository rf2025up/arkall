import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LegacyMonitorView from '../components/BigScreen/LegacyMonitorView';
import StarshipBattleView, { BattleData } from '../components/BigScreen/StarshipBattleView';

// 获取用户信息
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

const BigScreen: React.FC = () => {
  const [mode, setMode] = useState<'MONITOR' | 'BATTLE'>('MONITOR');
  const [battleData, setBattleData] = useState<BattleData | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [socket, setSocket] = useState<any>(null);

  // WebSocket事件监听
  useEffect(() => {
    if (!socket) return;

    // 监听PK开始事件
    const handlePKStart = (data: any) => {
      console.log('🎮 PK Start Event:', data);
      const newBattleData: BattleData = {
        type: 'pk',
        studentA: data.playerA ? {
          id: data.playerA.id,
          name: data.playerA.name,
          avatar_url: data.playerA.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(data.playerA.name)}&backgroundColor=ffffff`,
          team_name: data.playerA.className,
          energy: 100,
          score: data.playerA.exp || 0
        } : undefined,
        studentB: data.playerB ? {
          id: data.playerB.id,
          name: data.playerB.name,
          avatar_url: data.playerB.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(data.playerB.name)}&backgroundColor=ffffff`,
          team_name: data.playerB.className,
          energy: 100,
          score: data.playerB.exp || 0
        } : undefined,
        topic: data.topic,
        status: 'starting',
        startTime: Date.now()
      };

      setBattleData(newBattleData);
      setMode('BATTLE');

      // 3秒后激活战斗
      setTimeout(() => {
        setBattleData(prev => prev ? { ...prev, status: 'active' } : null);
      }, 3000);
    };

    // 监听PK结束事件
    const handlePKEnd = (data: any) => {
      console.log('🏁 PK End Event:', data);
      setBattleData(prev => prev ? {
        ...prev,
        status: 'ended',
        winner_id: data.winnerId
      } : null);

      // 5秒后返回监控模式
      setTimeout(() => {
        setMode('MONITOR');
        setBattleData(null);
      }, 5000);
    };

    // 监听挑战事件
    const handleChallengeStart = (data: any) => {
      console.log('⚡ Challenge Start Event:', data);
      const newBattleData: BattleData = {
        type: 'challenge',
        studentA: data.student ? {
          id: data.student.id,
          name: data.student.name,
          avatar_url: data.student.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(data.student.name)}&backgroundColor=ffffff`,
          team_name: data.student.className,
          energy: 100,
          score: data.student.exp || 0
        } : undefined,
        topic: data.title,
        status: 'active',
        startTime: Date.now()
      };

      setBattleData(newBattleData);
      setMode('BATTLE');
    };

    // 注册事件监听器
    socket.on('PK_START', handlePKStart);
    socket.on('PK_END', handlePKEnd);
    socket.on('CHALLENGE_START', handleChallengeStart);

    // 清理事件监听器
    return () => {
      socket.off('PK_START', handlePKStart);
      socket.off('PK_END', handlePKEnd);
      socket.off('CHALLENGE_START', handleChallengeStart);
    };
  }, [socket]);

  // 模拟战斗数据（用于演示）
  const simulateBattle = () => {
    const mockBattleData: BattleData = {
      type: 'pk',
      studentA: {
        id: '1',
        name: '张小明',
        avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=张小明&backgroundColor=ffffff',
        team_name: '三年级一班',
        energy: 100,
        score: 2500
      },
      studentB: {
        id: '2',
        name: '李小红',
        avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=李小红&backgroundColor=ffffff',
        team_name: '三年级二班',
        energy: 100,
        score: 2300
      },
      topic: '数学速算挑战',
      status: 'starting',
      startTime: Date.now()
    };

    setBattleData(mockBattleData);
    setMode('BATTLE');

    // 模拟战斗进程
    setTimeout(() => {
      setBattleData(prev => prev ? { ...prev, status: 'active' } : null);
    }, 2000);

    setTimeout(() => {
      setBattleData(prev => prev ? {
        ...prev,
        status: 'ended',
        winner_id: '1'
      } : null);
    }, 8000);

    setTimeout(() => {
      setMode('MONITOR');
      setBattleData(null);
    }, 13000);
  };

  // 页面切换动画配置
  const pageVariants = {
    initial: { opacity: 0, scale: 0.95, rotateX: 10 },
    animate: { opacity: 1, scale: 1, rotateX: 0 },
    exit: { opacity: 0, scale: 1.05, rotateX: -10 }
  };

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.8
  };

  return (
    <div className="w-screen h-screen bg-black text-white overflow-hidden relative">

      {/* 调试面板 */}
      {showDebugPanel && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 left-4 z-50 bg-slate-900/90 backdrop-blur-xl rounded-xl p-4 border border-cyan-400/30"
        >
          <div className="text-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${mode === 'MONITOR' ? 'bg-blue-400' : 'bg-red-400'} animate-pulse`} />
              <span className="font-bold text-cyan-300">当前模式: {mode === 'MONITOR' ? '监控模式' : '战斗模式'}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMode('MONITOR')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  mode === 'MONITOR'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                监控模式
              </button>
              <button
                onClick={() => setMode('BATTLE')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                  mode === 'BATTLE'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                战斗模式
              </button>
            </div>

            <button
              onClick={simulateBattle}
              className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-magenta-600 text-white rounded text-xs font-bold hover:from-cyan-500 hover:to-magenta-500 transition-colors"
            >
              🎮 模拟战斗
            </button>

            <button
              onClick={() => setShowDebugPanel(false)}
              className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs font-bold hover:bg-slate-600 transition-colors"
            >
              隐藏面板
            </button>
          </div>
        </motion.div>
      )}

      {/* 显示隐藏面板的按钮 */}
      {!showDebugPanel && (
        <button
          onClick={() => setShowDebugPanel(true)}
          className="absolute top-4 left-4 z-50 px-3 py-1 bg-slate-900/90 backdrop-blur-xl text-cyan-300 rounded text-xs font-bold border border-cyan-400/30 hover:bg-slate-800 transition-colors"
        >
          显示调试
        </button>
      )}

      {/* 连接状态指示器 */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2 px-3 py-1 bg-slate-900/90 backdrop-blur-xl rounded-full border border-cyan-400/30">
        <div className={`w-2 h-2 rounded-full ${socket ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
        <span className="text-xs text-slate-300">
          {socket ? '实时连接' : '离线模式'}
        </span>
      </div>

      {/* 主要内容区域 */}
      <AnimatePresence mode="wait">
        {mode === 'MONITOR' ? (
          <motion.div
            key="monitor"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="absolute inset-0"
          >
            <LegacyMonitorView schoolId={userInfo?.schoolId || 'demo'} />
          </motion.div>
        ) : (
          <motion.div
            key="battle"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="absolute inset-0"
          >
            <StarshipBattleView
              battleData={battleData || undefined}
              isActive={mode === 'BATTLE'}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BigScreen;
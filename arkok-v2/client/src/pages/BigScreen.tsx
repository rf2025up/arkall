import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Rocket, Trophy, Clock, Award, Layout, TrendingUp, Star } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import DataDashboard from '../components/BigScreen/DataDashboard';
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
  const [activeBattles, setActiveBattles] = useState<BattleData[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 🔌 初始化 Socket.IO 连接
  useEffect(() => {
    const token = localStorage.getItem('token');
    const schoolId = userInfo?.schoolId;

    if (!schoolId) {
      console.warn('[BigScreen] No schoolId found, running in demo mode');
      return;
    }

    console.log('[BigScreen] Initializing Socket.IO connection...');

    const newSocket = io(window.location.origin, {
      auth: { token },
      query: { schoolId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    newSocket.on('connect', () => {
      console.log('[BigScreen] ✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      // 加入学校房间
      newSocket.emit('JOIN_SCHOOL_ROOM', { schoolId });
    });

    newSocket.on('disconnect', () => {
      console.log('[BigScreen] ❌ Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[BigScreen] Socket connection error:', err.message);
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      console.log('[BigScreen] Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, []);

  // WebSocket事件监听
  useEffect(() => {
    if (!socket) return;

    // 监听PK开始事件
    const handlePKStart = (data: any) => {
      console.log('🎮 PK Start Event:', data);
      const newBattle: BattleData = {
        id: data.matchId || `pk-${Date.now()}`,
        type: 'pk',
        studentA: data.playerA ? {
          id: data.playerA.id,
          name: data.playerA.name,
          avatar_url: data.playerA.avatarUrl || '/avatar.jpg',
          team_name: data.playerA.className,
          energy: 100,
          score: data.playerA.exp || 0
        } : undefined,
        studentB: data.playerB ? {
          id: data.playerB.id,
          name: data.playerB.name,
          avatar_url: data.playerB.avatarUrl || '/avatar.jpg',
          team_name: data.playerB.className,
          energy: 100,
          score: data.playerB.exp || 0
        } : undefined,
        topic: data.topic,
        status: 'starting',
        startTime: Date.now(),
        rewardPoints: data.rewardPoints || 100,
        rewardExp: data.rewardExp || 50
      };

      setActiveBattles(prev => {
        const exists = prev.find(b => b.id === newBattle.id);
        if (exists) return prev;
        return [...prev, newBattle];
      });

      // 3秒后激活战斗
      setTimeout(() => {
        setActiveBattles(prev => prev.map(b => b.id === newBattle.id ? { ...b, status: 'active' } : b));
      }, 3000);
    };

    // 监听PK结束事件
    const handlePKEnd = (data: any) => {
      console.log('🏁 PK End Event:', data);
      setActiveBattles(prev => prev.map(b =>
        (b.id === data.matchId || (b.type === 'pk' && b.status !== 'ended'))
          ? { ...b, status: 'ended', winner_id: data.winnerId }
          : b
      ));

      // 8秒后从列表中移除该场对战
      setTimeout(() => {
        setActiveBattles(prev => prev.filter(b => b.id !== data.matchId && b.status !== 'ended'));
      }, 8000);
    };

    // 监听挑战事件
    const handleChallengeStart = (data: any) => {
      console.log('⚡ Challenge Start Event:', data);
      const newBattle: BattleData = {
        id: `challenge-${Date.now()}`,
        type: 'challenge',
        studentA: data.student ? {
          id: data.student.id,
          name: data.student.name,
          avatar_url: data.student.avatarUrl || '/avatar.jpg',
          team_name: data.student.className,
          energy: 100,
          score: data.student.exp || 0
        } : undefined,
        topic: data.title,
        status: 'active',
        startTime: Date.now()
      };

      setActiveBattles(prev => [...prev, newBattle]);

      // 10秒后自动移除挑战（挑战通常是瞬时的展示）
      setTimeout(() => {
        setActiveBattles(prev => prev.filter(b => b.id !== newBattle.id));
      }, 10000);
    };

    // 🔧 监听统一的 DATA_UPDATE 事件（后端使用此事件名）
    const handleDataUpdate = (payload: any) => {
      console.log('📡 DATA_UPDATE received:', payload.type, payload.data);

      switch (payload.type) {
        case 'PKMATCH_CREATED':
          // PK 对战创建
          const match = payload.data?.match;
          if (match) {
            handlePKStart({
              matchId: match.id,
              playerA: match.playerA,
              playerB: match.playerB,
              topic: match.topic
            });
          }
          break;

        case 'PKMATCH_COMPLETED':
        case 'PKMATCH_UPDATED':
          // PK 对战结束
          const matchData = payload.data?.match;
          if (matchData && matchData.status === 'COMPLETED') {
            handlePKEnd({
              matchId: matchData.id,
              winnerId: matchData.winnerId
            });
          }
          break;

        case 'CHALLENGE_COMPLETED':
          // 挑战完成
          if (payload.data?.student) {
            handleChallengeStart({
              student: payload.data.student,
              title: payload.data.title || '挑战任务'
            });
          }
          break;
      }
    };

    // 注册事件监听器
    socket.on('DATA_UPDATE', handleDataUpdate);
    // 保留直接事件监听（如果后端也发送这些事件）
    socket.on('PK_START', handlePKStart);
    socket.on('PK_END', handlePKEnd);
    socket.on('CHALLENGE_START', handleChallengeStart);

    // 清理事件监听器
    return () => {
      socket.off('DATA_UPDATE', handleDataUpdate);
      socket.off('PK_START', handlePKStart);
      socket.off('PK_END', handlePKEnd);
      socket.off('CHALLENGE_START', handleChallengeStart);
    };
  }, [socket]);

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

      {/* 主要内容区域 */}
      <AnimatePresence mode="wait">
        {activeBattles.length === 0 ? (
          <motion.div
            key="monitor"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
            className="absolute inset-0"
          >
            <DataDashboard />
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
              activeBattles={activeBattles}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BigScreen;
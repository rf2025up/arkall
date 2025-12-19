import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LegacyMonitorView from './LegacyMonitorView'
import StarshipBattleView, { type BattleData } from './StarshipBattleView'

// 模拟API响应类型
interface DashboardData {
  students: any[]
  teams: any[]
  pk_matches: any[]
  challenges: any[]
}

type ScreenMode = 'legacy' | 'battle'

const BigScreen: React.FC = () => {
  const [screenMode, setScreenMode] = useState<ScreenMode>('legacy')
  const [battleData, setBattleData] = useState<BattleData>()
  const [dashboardData, setDashboardData] = useState<DashboardData>()
  const [battleTimeout, setBattleTimeout] = useState<NodeJS.Timeout>()

  // 数据轮询和战斗事件监听
  useEffect(() => {
    let pollInterval: NodeJS.Timeout

    const loadData = async () => {
      try {
        const response = await fetch('/api/dashboard')
        const data = await response.json()

        if (data.success) {
          setDashboardData(data.data)

          // 检测是否有活跃的PK事件 - 修复API数据结构匹配
          const activePKs = (data.data.ongoingPKs || data.data.pk_matches || [])
            .filter((pk: any) => pk.status === 'active' || pk.status === 'pending')

          const recentChallenges = (data.data.challenges || [])
            .filter((c: any) =>
              c.status === 'completed' && new Date(c.updated_at) > new Date(Date.now() - 10000) // 10秒内完成
            )

          // 优先处理活跃PK
          if (activePKs && activePKs.length > 0) {
            const pk = activePKs[0]
            // 兼容不同的数据结构
            const studentAId = pk.playerA?.id || pk.student_a
            const studentBId = pk.playerB?.id || pk.student_b
            const studentA = (data.data.topStudents || data.data.students || [])?.find((s: any) => String(s.id) === String(studentAId))
            const studentB = (data.data.topStudents || data.data.students || [])?.find((s: any) => String(s.id) === String(studentBId))

            if (studentA && studentB) {
              setBattleData({
                type: 'pk',
                studentA: {
                  id: String(studentA.id),
                  name: studentA.name,
                  avatar_url: studentA.avatarUrl || studentA.avatar_url || '/avatar.jpg',
                  team_name: studentA.className || data.data.teams?.find((t: any) => String(t.id) === `t${studentA.team_id}`)?.name,
                  score: studentA.points || studentA.total_points,
                  energy: Math.min(100, (studentA.exp || studentA.total_exp || 0) % 100 + 50)
                },
                studentB: {
                  id: String(studentB.id),
                  name: studentB.name,
                  avatar_url: studentB.avatarUrl || studentB.avatar_url || '/avatar.jpg',
                  team_name: studentB.className || data.data.teams?.find((t: any) => String(t.id) === `t${studentB.team_id}`)?.name,
                  score: studentB.points || studentB.total_points,
                  energy: Math.min(100, (studentB.exp || studentB.total_exp || 0) % 100 + 30)
                },
                topic: pk.topic,
                winner_id: pk.winner_id ? String(pk.winner_id) : undefined,
                status: pk.status === 'active' ? 'active' : 'starting',
                startTime: Date.now()
              })
              setScreenMode('battle')
            }
          }
          // 处理刚完成的挑战
          else if (recentChallenges && recentChallenges.length > 0) {
            const challenge = recentChallenges[0]
            setBattleData({
              type: challenge.result === 'success' ? 'victory' : 'challenge',
              topic: challenge.title,
              status: 'ended'
            })
            setScreenMode('battle')
          }
          // 默认显示legacy模式
          else if (screenMode === 'battle') {
            // 如果当前是战斗模式，但没有活跃事件，延迟切换回legacy
            if (battleTimeout) clearTimeout(battleTimeout)
            const timeout = setTimeout(() => {
              setScreenMode('legacy')
              setBattleData(undefined)
            }, 5000) // 5秒延迟
            setBattleTimeout(timeout)
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    }

    // 初始加载
    loadData()

    // 每2秒轮询一次，快速检测战斗事件
    pollInterval = setInterval(loadData, 2000)

    return () => {
      if (pollInterval) clearInterval(pollInterval)
      if (battleTimeout) clearTimeout(battleTimeout)
    }
  }, [screenMode])

  // 手动切换战斗模式的调试函数
  const triggerTestBattle = () => {
    setBattleData({
      type: 'pk',
      studentA: {
        id: '1',
        name: '星际指挥官Alpha',
        avatar_url: '/avatar.jpg',
        team_name: '银河战队',
        score: 12500,
        energy: 85
      },
      studentB: {
        id: '2',
        name: '量子战士Beta',
        avatar_url: '/avatar.jpg',
        team_name: '星云小队',
        score: 9800,
        energy: 72
      },
      topic: '量子计算竞赛',
      winner_id: undefined,
      status: 'active',
      startTime: Date.now()
    })
    setScreenMode('battle')
  }

  const triggerTestVictory = () => {
    setBattleData({
      type: 'victory',
      topic: '星际探索挑战',
      status: 'ended'
    })
    setScreenMode('battle')
  }

  // 键盘快捷键调试
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '1') triggerTestBattle()
      if (e.key === '2') triggerTestVictory()
      if (e.key === '0') setScreenMode('legacy')
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* 调试控制面板 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 z-50 bg-slate-900/80 backdrop-blur-lg rounded-lg p-4 border border-slate-700">
          <h3 className="text-white font-bold mb-3">调试控制</h3>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setScreenMode('legacy')}
              className={`px-3 py-1 rounded text-sm ${
                screenMode === 'legacy'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              日常模式
            </button>
            <button
              onClick={triggerTestBattle}
              className={`px-3 py-1 rounded text-sm ${
                screenMode === 'battle'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              测试战斗
            </button>
            <button
              onClick={triggerTestVictory}
              className="px-3 py-1 rounded text-sm bg-slate-700 text-slate-300 hover:bg-slate-600"
            >
              测试胜利
            </button>
          </div>
          <div className="text-xs text-slate-400">
            快捷键: 1-日常模式 2-战斗模式 3-胜利画面 0-返回
          </div>
        </div>
      )}

      {/* 当前模式显示 */}
      <AnimatePresence mode="wait">
        {screenMode === 'legacy' ? (
          <motion.div
            key="legacy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full h-full"
          >
            <LegacyMonitorView schoolId="demo" />
          </motion.div>
        ) : (
          <motion.div
            key="battle"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full"
          >
            <StarshipBattleView
              battleData={battleData}
              isActive={screenMode === 'battle'}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 模式切换指示器 */}
      <div className="absolute bottom-4 right-4 z-40">
        <motion.div
          className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-lg ${
            screenMode === 'legacy'
              ? 'bg-slate-800/80 text-cyan-400 border border-cyan-400/30'
              : 'bg-slate-800/80 text-magenta-400 border border-magenta-400/30'
          }`}
          whileHover={{ scale: 1.05 }}
        >
          {screenMode === 'legacy' ? '📊 日常监控模式' : '⚔️ 战斗模式'}
        </motion.div>
      </div>
    </div>
  )
}

export default BigScreen
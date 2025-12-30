import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'

// 类型定义
interface BattleStudent {
  id: string
  name: string
  avatar_url: string
  team_name?: string
  team_color?: string
  score?: number
  energy?: number
}

export interface BattleData {
  id: string
  type: 'pk' | 'challenge' | 'victory'
  studentA?: BattleStudent
  studentB?: BattleStudent
  topic?: string
  winner_id?: string
  status?: 'starting' | 'active' | 'ended'
  startTime?: number
  rewardPoints?: number
  rewardExp?: number
}

interface StarshipBattleViewProps {
  activeBattles: BattleData[]
}

// 粒子背景组件
const StarfieldBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 星星粒子
    class Star {
      x: number
      y: number
      size: number
      speed: number
      opacity: number

      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speed = Math.random() * 0.5 + 0.1
        this.opacity = Math.random() * 0.8 + 0.2
      }

      update() {
        this.y += this.speed
        if (this.y > canvas.height) {
          this.y = 0
          this.x = Math.random() * canvas.width
        }
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx.fill()
      }
    }

    const stars: Star[] = []
    for (let i = 0; i < 150; i++) {
      stars.push(new Star())
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      stars.forEach(star => {
        star.update()
        star.draw()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'linear-gradient(to bottom, #0F172A, #1E293B)' }}
    />
  )
}

// PK对决卡片组件
const BattleCard: React.FC<{
  student: BattleStudent
  position: 'left' | 'right'
  isWinner?: boolean
  isActive?: boolean
}> = ({ student, position, isWinner, isActive }) => {
  const tiltAngle = position === 'left' ? -6 : 6
  const glowColor = isWinner ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)'

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: position === 'left' ? -400 : 400,
        rotateZ: tiltAngle,
        scale: 0.8
      }}
      animate={{
        opacity: 1,
        x: position === 'left' ? -60 : 60,
        rotateZ: isActive ? [tiltAngle, tiltAngle - 1, tiltAngle] : tiltAngle,
        scale: isWinner ? 1.15 : 1
      }}
      transition={{
        duration: 1,
        delay: position === 'left' ? 0.4 : 0.6,
        rotateZ: { repeat: Infinity, duration: 3, ease: "easeInOut" }
      }}
      className={`relative w-80 h-96 rounded-2xl overflow-hidden
        bg-gradient-to-br from-slate-900/90 to-slate-800/90
        backdrop-blur-xl border-2 transition-all duration-500
        ${isWinner
          ? 'border-green-400 shadow-2xl shadow-green-400/50'
          : 'border-cyan-400 shadow-2xl shadow-cyan-400/30'
        }
      `}
      style={{
        filter: `drop-shadow(0 0 30px ${glowColor})`,
        transform: `perspective(1000px) rotateY(${position === 'left' ? 15 : -15}deg)`
      }}
    >
      {/* 背景网格 */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(cyan 1px, transparent 1px),
            linear-gradient(90deg, cyan 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>

      {/* 能量呼吸灯效果 */}
      {isActive && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent"
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* 头像区域 */}
      <div className="relative pt-8 pb-6 px-8">
        <motion.div
          animate={{
            scale: isWinner ? [1, 1.1, 1] : 1,
            rotate: isWinner ? [0, 5, -5, 0] : 0
          }}
          transition={{
            duration: 2,
            repeat: isWinner ? Infinity : 0,
            ease: "easeInOut"
          }}
          className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-cyan-400"
        >
          <img
            src={student.avatar_url}
            alt={student.name}
            className="w-full h-full object-cover"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </motion.div>

        {/* 胜利王冠 */}
        {isWinner && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: "spring" }}
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-6xl"
          >
            👑
          </motion.div>
        )}
      </div>

      {/* 学生信息 */}
      <div className="px-8 text-center">
        <h2 className={`text-3xl font-bold mb-2 ${isWinner ? 'text-green-400' : 'text-cyan-400'}`}>
          {student.name}
        </h2>


        {/* 能量条 */}
        <div className="relative h-6 bg-slate-700/50 rounded-full overflow-hidden border border-cyan-400/30">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(student.energy || 100)}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {student.energy || 100}%
          </div>
        </div>

        {/* 分数显示 */}
        {student.score !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-4xl font-black text-white"
          >
            {student.score.toLocaleString()}
            <span className="text-sm font-normal text-slate-400 ml-2">分</span>
          </motion.div>
        )}
      </div>

      {/* 装饰光效 */}
      <motion.div
        className="absolute top-0 right-0 w-20 h-20 bg-cyan-400 rounded-full blur-3xl opacity-30"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  )
}

// VS标志组件
const VSIndicator: React.FC<{ isAnimating?: boolean }> = ({ isAnimating }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: isAnimating ? [1, 1.3, 1] : 1,
        opacity: 1
      }}
      transition={{
        scale: { duration: 0.5, delay: 0.6 },
        opacity: { duration: 0.3, delay: 0.6 }
      }}
      className="relative z-10"
    >
      <div className="relative">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-magenta-500 rounded-3xl blur-xl"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.3, 0.8]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <div className="relative w-32 h-32 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border-4 border-cyan-400 shadow-2xl flex items-center justify-center">
          <motion.span
            className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-magenta-500 bg-clip-text text-transparent"
            animate={{
              textShadow: isAnimating ? ["0 0 20px rgba(6, 182, 212, 0.8)", "0 0 40px rgba(217, 70, 239, 0.8)"] : "none"
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            VS
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}

// 主题显示组件
const BattleTopic: React.FC<{ topic?: string; rewardPoints?: number; rewardExp?: number }> = ({ topic, rewardPoints, rewardExp }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
      className="text-center mb-8"
    >
      <h2 className="text-5xl font-black text-white mb-6 tracking-tighter italic">
        <span className="bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent opacity-50 uppercase text-lg block mb-1">Battle Topic</span>
        {topic || '未知挑战'}
      </h2>

      {/* PK 奖励展示区域 */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.2, type: "spring" }}
        className="inline-flex items-center gap-6 px-10 py-3 bg-blue-600/20 backdrop-blur-xl rounded-full border border-blue-500/40 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-xl">⭐</span>
          <span className="text-2xl font-black text-yellow-400 font-mono">{rewardPoints || 100} 积分</span>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xl">⚡</span>
          <span className="text-2xl font-black text-blue-400 font-mono">+{rewardExp || 50} EXP</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

const StarshipBattleView: React.FC<StarshipBattleViewProps> = ({
  activeBattles
}) => {
  if (!activeBattles || activeBattles.length === 0) {
    return (
      <div className="w-full h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
        <StarfieldBackground />
        <div className="relative z-10 flex items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold text-white mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-magenta-500 bg-clip-text text-transparent">
                星际指挥中心
              </span>
            </h1>
            <p className="text-xl text-slate-300">等待战斗指令...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen relative overflow-hidden bg-slate-900">
      <StarfieldBackground />

      <div className="relative z-10 h-full flex flex-col p-8 overflow-y-auto">
        {/* 单场 PK 特效模式 */}
        {activeBattles.length === 1 && activeBattles[0].type === 'pk' ? (
          <div className="h-full flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <h1 className="text-5xl font-bold text-white mb-2">
                <span className="bg-gradient-to-r from-cyan-400 via-magenta-500 to-cyan-400 bg-clip-text text-transparent">
                  星际战斗模式
                </span>
              </h1>
              <motion.div
                className="w-64 h-1 bg-gradient-to-r from-cyan-400 to-magenta-500 mx-auto rounded-full"
                animate={{ scaleX: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {activeBattles[0].topic && <BattleTopic
              topic={activeBattles[0].topic}
              rewardPoints={activeBattles[0].rewardPoints}
              rewardExp={activeBattles[0].rewardExp}
            />}

            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center justify-center gap-8 w-full max-w-7xl">
                <BattleCard
                  student={activeBattles[0].studentA!}
                  position="left"
                  isWinner={activeBattles[0].winner_id === activeBattles[0].studentA?.id}
                  isActive={activeBattles[0].status === 'active'}
                />
                <VSIndicator isAnimating={activeBattles[0].status === 'active'} />
                <BattleCard
                  student={activeBattles[0].studentB!}
                  position="right"
                  isWinner={activeBattles[0].winner_id === activeBattles[0].studentB?.id}
                  isActive={activeBattles[0].status === 'active'}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 多场 PK 平铺模式 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeBattles.map(battle => (
              <motion.div
                key={battle.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-3xl p-6 border-2 border-cyan-400/30 flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="text-center">
                  <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold uppercase tracking-tighter">
                    {battle.type === 'pk' ? 'PK 实时对战' : '挑战动态'}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-2 truncate">{battle.topic}</h3>
                </div>

                <div className="flex items-center justify-between gap-2">
                  {/* A */}
                  <div className="flex-1 flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full border-2 p-1 ${battle.winner_id === battle.studentA?.id ? 'border-green-400 shadow-lg shadow-green-500/50' : 'border-slate-500'}`}>
                      <img src={battle.studentA?.avatar_url || '/avatar.jpg'} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <span className="text-sm font-bold mt-2 truncate max-w-full">{battle.studentA?.name}</span>
                    <div className="text-xs text-yellow-400 font-mono mt-1">{battle.studentA?.score?.toLocaleString()}</div>
                  </div>

                  <div className="text-2xl font-black italic bg-gradient-to-r from-cyan-400 to-magenta-500 bg-clip-text text-transparent">VS</div>

                  {/* B */}
                  {battle.studentB ? (
                    <div className="flex-1 flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full border-2 p-1 ${battle.winner_id === battle.studentB?.id ? 'border-green-400 shadow-lg shadow-green-500/50' : 'border-slate-500'}`}>
                        <img src={battle.studentB?.avatar_url || '/avatar.jpg'} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <span className="text-sm font-bold mt-2 truncate max-w-full">{battle.studentB?.name}</span>
                      <div className="text-xs text-yellow-400 font-mono mt-1">{battle.studentB?.score?.toLocaleString()}</div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <span className="text-xs text-slate-500 mt-2">单人挑战</span>
                    </div>
                  )}
                </div>

                {/* 状态 */}
                <div className="text-center mt-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${battle.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      {battle.status === 'active' ? '进行中' : battle.status === 'starting' ? '准备中' : '已结束'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StarshipBattleView
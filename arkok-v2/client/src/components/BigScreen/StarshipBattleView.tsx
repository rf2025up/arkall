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
  type: 'pk' | 'challenge' | 'victory'
  studentA?: BattleStudent
  studentB?: BattleStudent
  topic?: string
  winner_id?: string
  status?: 'starting' | 'active' | 'ended'
  startTime?: number
}

interface StarshipBattleViewProps {
  battleData?: BattleData
  isActive?: boolean
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
        x: position === 'left' ? -200 : 200,
        rotateZ: tiltAngle
      }}
      animate={{
        opacity: 1,
        x: 0,
        rotateZ: isActive ? [tiltAngle, tiltAngle - 2, tiltAngle] : tiltAngle,
        scale: isWinner ? 1.1 : 1
      }}
      transition={{
        duration: 0.8,
        delay: position === 'left' ? 0.2 : 0.4,
        rotateZ: { repeat: Infinity, duration: 2, ease: "easeInOut" }
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
        {student.team_name && (
          <p className="text-sm text-slate-300 mb-4">
            {student.team_name}
          </p>
        )}

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
const BattleTopic: React.FC<{ topic?: string }> = ({ topic }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.8 }}
      className="text-center mb-12"
    >
      <h2 className="text-4xl font-bold text-white mb-2">对战主题</h2>
      <motion.div
        className="inline-block px-8 py-4 bg-slate-800/80 backdrop-blur-xl rounded-2xl border-2 border-cyan-400/50"
        whileHover={{ scale: 1.05, borderColor: "rgba(6, 182, 212, 0.8)" }}
      >
        <p className="text-2xl font-semibold text-cyan-300">{topic || '未知挑战'}</p>
      </motion.div>
    </motion.div>
  )
}

const StarshipBattleView: React.FC<StarshipBattleViewProps> = ({
  battleData,
  isActive = false
}) => {
  const [showBattle, setShowBattle] = useState(false)

  useEffect(() => {
    if (isActive && battleData) {
      setShowBattle(true)
    } else {
      setShowBattle(false)
    }
  }, [isActive, battleData])

  if (!showBattle || !battleData) {
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

  const isPKMode = battleData.type === 'pk' && battleData.studentA && battleData.studentB
  const isWinnerA = battleData.winner_id === battleData.studentA?.id
  const isWinnerB = battleData.winner_id === battleData.studentB?.id

  return (
    <div className="w-full h-screen relative overflow-hidden">
      <StarfieldBackground />

      <div className="relative z-10 h-full flex flex-col">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center py-8"
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

        {/* 对战主题 */}
        {battleData.topic && <BattleTopic topic={battleData.topic} />}

        {/* 主要战斗区域 */}
        {isPKMode && (
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="flex items-center justify-center gap-8 w-full max-w-7xl">
              {/* 左侧选手 */}
              <BattleCard
                student={battleData.studentA!}
                position="left"
                isWinner={isWinnerA}
                isActive={battleData.status === 'active'}
              />

              {/* VS 标志 */}
              <VSIndicator isAnimating={battleData.status === 'active'} />

              {/* 右侧选手 */}
              <BattleCard
                student={battleData.studentB!}
                position="right"
                isWinner={isWinnerB}
                isActive={battleData.status === 'active'}
              />
            </div>
          </div>
        )}

        {/* 挑战模式或胜利画面 */}
        {!isPKMode && (
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, type: "spring" }}
              className="text-center"
            >
              {battleData.type === 'victory' ? (
                <div>
                  <motion.div
                    className="text-8xl mb-8"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    🏆
                  </motion.div>
                  <h2 className="text-6xl font-bold text-green-400 mb-4">VICTORY!</h2>
                  <p className="text-2xl text-slate-300">挑战完成</p>
                </div>
              ) : (
                <div>
                  <motion.div
                    className="text-8xl mb-8"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ⚡
                  </motion.div>
                  <h2 className="text-6xl font-bold text-cyan-400 mb-4">CHALLENGE</h2>
                  <p className="text-2xl text-slate-300">挑战开始</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* 战斗状态指示器 */}
      {battleData.status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-8 right-8 px-6 py-3 bg-slate-800/80 backdrop-blur-xl rounded-full border-2 border-cyan-400"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="w-3 h-3 bg-green-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-white font-semibold">
              {battleData.status === 'active' ? '战斗进行中' :
                battleData.status === 'starting' ? '准备开始' : '战斗结束'}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default StarshipBattleView
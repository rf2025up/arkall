import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface StarParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface StarParticleEffectProps {
  data: any;
  onComplete: () => void;
}

export function StarParticleEffect({ data, onComplete }: StarParticleEffectProps) {
  const [particles, setParticles] = useState<StarParticle[]>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // 生成星空粒子
    const newParticles: StarParticle[] = [];
    for (let i = 0; i < 100; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 4 + 1,
        duration: Math.random() * 2 + 1,
        delay: Math.random() * 0.5
      });
    }
    setParticles(newParticles);

    // 延迟显示内容
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    // 完成回调
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const getScoreText = () => {
    if (!data) return '';

    if (data.totalUpdates) {
      // 批量更新
      return `${data.totalUpdates}名学生获得积分！`;
    } else {
      // 单个更新
      return `${data.studentName || '学生'}获得 ${data.pointsAdded || 0} 积分，${data.expAdded || 0} 经验！`;
    }
  };

  const getScoreValue = () => {
    if (!data) return 0;

    if (data.totalUpdates) {
      return data.updates?.reduce((sum: number, update: any) => sum + (update.pointsAdded || 0), 0) || 0;
    } else {
      return data.pointsAdded || 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* 星空粒子背景 */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute bg-white rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              left: particle.x,
              top: particle.y,
            }}
            initial={{
              scale: 0,
              opacity: 0,
              rotate: 0
            }}
            animate={{
              scale: [0, 1, 2, 0],
              opacity: [0, 1, 1, 0],
              rotate: [0, 180, 360],
              y: [0, -100, -200]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      {/* 中心光晕效果 */}
      <motion.div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0,255,255,0.3) 0%, rgba(147,51,234,0.2) 40%, transparent 70%)'
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 2],
          opacity: [0, 0.8, 0]
        }}
        transition={{
          duration: 2,
          ease: "easeOut"
        }}
      />

      {/* 主要内容 */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            className="text-center z-10"
            initial={{ scale: 0, opacity: 0, rotateY: -180 }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateY: 0
            }}
            exit={{
              scale: 0,
              opacity: 0,
              rotateY: 180
            }}
            transition={{
              duration: 0.8,
              ease: "easeOut",
              type: "spring",
              stiffness: 100
            }}
          >
            {/* 星星图标 */}
            <motion.div
              className="text-8xl mb-6"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              ⭐
            </motion.div>

            {/* 分数文字 */}
            <motion.div
              className="mb-4"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                积分获得！
              </h2>
              <p className="text-2xl text-cyan-300">
                {getScoreText()}
              </p>
            </motion.div>

            {/* 数值显示 */}
            <motion.div
              className="text-6xl font-bold"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.6,
                duration: 0.5,
                type: "spring",
                stiffness: 200
              }}
            >
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                +{getScoreValue()}
              </span>
            </motion.div>

            {/* 装饰线条 */}
            <motion.div
              className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-64 h-1"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <div className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 环形装饰 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <motion.circle
          cx="50%"
          cy="50%"
          r="300"
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="2"
          strokeDasharray="10 5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{
            pathLength: 1,
            opacity: [0, 0.6, 0],
            rotate: 360
          }}
          transition={{
            duration: 3,
            ease: "easeOut"
          }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#9333ea" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00ffff" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default StarParticleEffect;
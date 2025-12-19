import { motion } from 'framer-motion';

interface LeaderboardProps {
  data: {
    schoolStats: any;
    topStudents: Array<{
      id: string;
      name: string;
      className: string;
      level: number;
      points: number;
      exp: number;
      avatarUrl?: string;
    }>;
    activePKs: Array<any>;
    recentChallenges: Array<any>;
    classRanking: Array<{
      className: string;
      studentCount: number;
      totalPoints: number;
      totalExp: number;
      avgPoints: number;
      avgExp: number;
    }>;
  };
}

export function Leaderboard({ data }: LeaderboardProps) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-400 to-red-500';
      default: return 'from-cyan-400 to-blue-500';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '⭐';
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* 左侧排行榜 */}
      <div className="col-span-8">
        <motion.div
          className="bg-black bg-opacity-60 backdrop-blur-md rounded-2xl border border-cyan-500 border-opacity-30 p-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              🏆 积分排行榜
            </h2>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-cyan-300">实时更新</span>
            </div>
          </div>

          <div className="space-y-4">
            {data.topStudents.slice(0, 10).map((student, index) => (
              <motion.div
                key={student.id}
                className="relative group"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 10 }}
              >
                {/* 排名徽章 */}
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 z-10">
                  <motion.div
                    className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(index + 1)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    {getRankIcon(index + 1)}
                  </motion.div>
                </div>

                {/* 学生卡片 */}
                <div className="ml-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 border border-gray-700 hover:border-cyan-500 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* 头像 */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 p-1">
                          <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-2xl font-bold text-white">
                            {student.name.charAt(0)}
                          </div>
                        </div>
                        {/* 等级徽章 */}
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
                          Lv.{student.level}
                        </div>
                      </div>

                      {/* 学生信息 */}
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-400">{student.className}</p>
                      </div>
                    </div>

                    {/* 积分信息 */}
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        {student.points}
                      </div>
                      <div className="text-sm text-gray-400">
                        {student.exp} exp
                      </div>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((student.points / Math.max(...data.topStudents.map(s => s.points))) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    />
                  </div>
                </div>

                {/* 发光效果 */}
                {index < 3 && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(0, 255, 255, 0.3)",
                        "0 0 40px rgba(147, 51, 234, 0.3)",
                        "0 0 20px rgba(0, 255, 255, 0.3)"
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 右侧信息面板 */}
      <div className="col-span-4 space-y-6">
        {/* 实时活动 */}
        <motion.div
          className="bg-black bg-opacity-60 backdrop-blur-md rounded-2xl border border-purple-500 border-opacity-30 p-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-4">
            🔥 实时活动
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.recentChallenges.slice(0, 5).map((challenge, index) => (
              <motion.div
                key={challenge.id}
                className="bg-gradient-to-r from-purple-900 to-pink-900 bg-opacity-30 rounded-lg p-3 border border-purple-700 border-opacity-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{challenge.title}</p>
                    <p className="text-xs text-gray-400">{challenge.student.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">+{challenge.expAwarded}</div>
                    <div className="text-xs text-gray-500">exp</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 班级排名 */}
        <motion.div
          className="bg-black bg-opacity-60 backdrop-blur-md rounded-2xl border border-green-500 border-opacity-30 p-6"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent mb-4">
            📊 班级排名
          </h3>
          <div className="space-y-3">
            {data.classRanking.slice(0, 5).map((cls, index) => (
              <motion.div
                key={cls.className}
                className="flex items-center justify-between bg-gradient-to-r from-green-900 to-cyan-900 bg-opacity-30 rounded-lg p-3 border border-green-700 border-opacity-50"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{cls.className}</p>
                    <p className="text-xs text-gray-400">{cls.studentCount}名学生</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{cls.avgPoints}</div>
                  <div className="text-xs text-gray-500">平均分</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* PK对战状态 */}
        {data.activePKs && data.activePKs.length > 0 && (
          <motion.div
            className="bg-black bg-opacity-60 backdrop-blur-md rounded-2xl border border-red-500 border-opacity-30 p-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <h3 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-4">
              ⚔️ 激战进行中
            </h3>
            <div className="space-y-3">
              {data.activePKs.slice(0, 2).map((pk, index) => (
                <div key={pk.id} className="bg-gradient-to-r from-red-900 to-orange-900 bg-opacity-30 rounded-lg p-3 border border-red-700 border-opacity-50">
                  <div className="flex items-center justify-between text-center">
                    <div className="flex-1">
                      <p className="text-cyan-400 font-medium">{pk.playerA.name}</p>
                      <p className="text-xs text-gray-400">{pk.playerA.className}</p>
                    </div>
                    <div className="px-4">
                      <p className="text-red-400 font-bold text-xl">VS</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-orange-400 font-medium">{pk.playerB.name}</p>
                      <p className="text-xs text-gray-400">{pk.playerB.className}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
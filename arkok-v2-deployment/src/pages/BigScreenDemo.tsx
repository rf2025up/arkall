import React from 'react'
import { useNavigate } from 'react-router-dom'
import BigScreen from '../components/BigScreen/BigScreen'

const BigScreenDemo: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 顶部导航栏（仅开发环境显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">ArkOK V2 大屏系统</h1>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                实时演示
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                返回主页
              </button>

              <div className="text-sm text-slate-400">
                <span className="mr-4">按 1 切换日常模式</span>
                <span className="mr-4">按 2 触发战斗演示</span>
                <span>按 3 触发胜利画面</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 大屏内容 */}
      <div className="pt-0">
        <BigScreen />
      </div>
    </div>
  )
}

export default BigScreenDemo
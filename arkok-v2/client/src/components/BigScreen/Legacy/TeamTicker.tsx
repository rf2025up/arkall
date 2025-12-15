import React, { useEffect, useMemo, useState } from 'react'
import { Student, Team } from './types'

interface TeamTickerProps {
  students: Student[]
  teams: Team[]
  sortBy: 'total_exp' | 'total_points'
  unit: '经验' | '积分'
}

const TeamTicker: React.FC<TeamTickerProps> = ({ students, teams, sortBy, unit }) => {
  const ranked = useMemo(() => {
    const score = new Map<string, number>()
    teams.forEach(t => score.set(String(t.id), 0))
    students.forEach(s => score.set(String(s.team_id), (score.get(String(s.team_id)) || 0) + (sortBy === 'total_exp' ? s.total_exp : s.total_points)))
    return Array.from(score.entries())
      .map(([id, total]) => ({ team: teams.find(t => String(t.id) === id)!, total }))
      .filter(x => !!x.team)
      .sort((a, b) => b.total - a.total)
  }, [students, teams, sortBy])

  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (ranked.length <= 1) return
    const t = setInterval(() => setIndex(i => (i + 1) % ranked.length), 4000)
    return () => clearInterval(t)
  }, [ranked.length])

  const item = ranked[index]
  if (!item) return null

  const percent = ranked[0].total > 0 ? Math.max(5, Math.round(item.total / ranked[0].total * 100)) : 100

  return (
    <div className="h-6 overflow-hidden max-w-[33vw] sm:max-w-[260px]">
      <div className="transition-transform duration-500">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-700 text-xs text-slate-300 flex items-center justify-center">{index + 1}</span>
          <span className={`text-sm font-semibold ${item.team.textColor}`}>{item.team.name}</span>
          <div className="flex-grow h-2 bg-slate-700 rounded-full">
            <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${percent}%` }}></div>
          </div>
          <span className="text-[11px] text-slate-400">{item.total.toLocaleString()} {unit}</span>
        </div>
      </div>
    </div>
  )
}

export default TeamTicker
import Avatar from './Avatar'
import Link from 'next/link'

interface LeaderboardRowProps {
  rank: number
  entry: { id: string; name: string; count: number }
}

const medalColors: Record<number, string> = {
  1: 'text-yellow-500',
  2: 'text-slate-400',
  3: 'text-amber-600',
}

export default function LeaderboardRow({ rank, entry }: LeaderboardRowProps) {
  return (
    <Link
      href={`/profile/${entry.id}`}
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all hover:scale-[1.01] ${
        rank <= 3
          ? 'bg-sea text-white shadow-md'
          : 'bg-surface border border-sea-light text-app-text'
      }`}
    >
      {/* Rank */}
      <span
        className={`font-display font-bold text-lg w-7 text-center flex-shrink-0 ${
          rank <= 3 ? medalColors[rank] : 'text-muted'
        }`}
      >
        {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : `#${rank}`}
      </span>

      {/* Avatar */}
      <Avatar name={entry.name} size="sm" />

      {/* Name */}
      <span className={`font-display font-semibold flex-1 truncate ${rank <= 3 ? 'text-white' : 'text-app-text'}`}>
        {entry.name}
      </span>

      {/* Count */}
      <span
        className={`font-display font-bold text-lg flex-shrink-0 ${
          rank <= 3 ? 'text-cyan-dim' : 'text-sea'
        }`}
      >
        {entry.count}
        <span className={`text-xs font-normal ml-1 ${rank <= 3 ? 'text-white/60' : 'text-muted'}`}>
          {entry.count === 1 ? 'session' : 'sessions'}
        </span>
      </span>
    </Link>
  )
}

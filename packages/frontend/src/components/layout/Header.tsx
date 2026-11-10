import { motion } from 'framer-motion'
import { useUserStore } from '../../stores/userStore'

export function Header() {
  const { user } = useUserStore()

  if (!user) return null

  const rankColors: Record<string, string> = {
    bronze: 'text-amber-600',
    silver: 'text-slate-400',
    gold: 'text-yellow-400',
    platinum: 'text-cyan-400',
  }

  const rankEmojis: Record<string, string> = {
    bronze: '🥉', silver: '🥈', gold: '🥇', platinum: '💎'
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-bg-primary/90 border-b border-white/5"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎁</span>
          <div>
            <div className="text-sm font-bold text-text-primary leading-none">
              {user.firstName} {user.lastName || ''}
            </div>
            <div className={`text-xs ${rankColors[user.rank] || 'text-text-muted'}`}>
              {rankEmojis[user.rank] || '🎖️'} {user.rank.charAt(0).toUpperCase() + user.rank.slice(1)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center gap-1.5 bg-bg-card px-3 py-1.5 rounded-full border border-yellow-500/20"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm">🪙</span>
            <span className="text-sm font-bold text-yellow-400">
              {user.coins.toLocaleString('ru-RU')}
            </span>
          </motion.div>
          <motion.div
            className="flex items-center gap-1.5 bg-bg-card px-3 py-1.5 rounded-full border border-pink-500/20"
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm">🎟️</span>
            <span className="text-sm font-bold text-pink-400">{user.tickets}</span>
          </motion.div>
        </div>
      </div>
    </header>
  )
}

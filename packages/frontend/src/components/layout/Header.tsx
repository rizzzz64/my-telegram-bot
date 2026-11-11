import { motion } from 'framer-motion'
import { useUserStore } from '../../stores/userStore'
import { useAppStore } from '../../stores/appStore'

const ONLINE_COUNT = 42 // mock, replace with real websocket later

export function Header() {
  const { user } = useUserStore()
  const { setActiveTab } = useAppStore()

  if (!user) return null

  const avatarEmoji = user.rank === 'platinum' ? '💎' : user.rank === 'gold' ? '👑' : user.rank === 'silver' ? '🌟' : '⭐'

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30"
      style={{
        background: 'rgba(10,10,20,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div className="flex items-center justify-between px-3 h-14">
        {/* Left: Logo + Name + Online */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl font-bold"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}
            >
              🎁
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-wide">GIFTFORGE</span>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">{ONLINE_COUNT}</span>
            </div>
          </div>
        </div>

        {/* Right: Balance + Add + Avatar */}
        <div className="flex items-center gap-2">
          {/* Stars/coins balance */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setActiveTab('bonuses')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            <span className="text-sm">★</span>
            <span className="text-sm font-bold text-yellow-400">
              {user.coins >= 1000
                ? (user.coins / 1000).toFixed(user.coins >= 10000 ? 0 : 1) + 'K'
                : user.coins.toLocaleString('ru-RU')}
            </span>
          </motion.button>

          {/* Add coins button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('earnings')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #2563EB)' }}
          >
            +
          </motion.button>

          {/* Avatar */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('bonuses')}
            className="w-8 h-8 rounded-full flex items-center justify-center text-base"
            style={{ background: 'rgba(139,92,246,0.2)', border: '2px solid rgba(139,92,246,0.4)' }}
          >
            {avatarEmoji}
          </motion.button>
        </div>
      </div>
    </header>
  )
}

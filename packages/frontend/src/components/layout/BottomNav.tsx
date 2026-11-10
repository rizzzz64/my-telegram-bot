import { motion } from 'framer-motion'
import { Tab, useAppStore } from '../../stores/appStore'

const tabs: Array<{ id: Tab; emoji: string; label: string }> = [
  { id: 'contests', emoji: '🏆', label: 'Конкурсы' },
  { id: 'upgrade',  emoji: '⚡', label: 'Апгрейд'  },
  { id: 'cases',    emoji: '🎁', label: 'Кейсы'    },
  { id: 'friends',  emoji: '👥', label: 'Друзья'   },
  { id: 'profile',  emoji: '👤', label: 'Профиль'  },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 nav-glass"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around px-1 h-[62px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0 flex-1 relative"
            >
              {isActive && (
                <motion.div
                  layoutId="active-tab-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.14)' }}
                  transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                />
              )}

              {/* Active dot */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-dot"
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-purple"
                  transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                />
              )}

              <motion.span
                className="text-xl relative z-10"
                animate={{ scale: isActive ? 1.18 : 1, y: isActive ? -1 : 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 320, duration: 0.2 }}
              >
                {tab.emoji}
              </motion.span>

              <span
                className={`text-[9px] font-semibold relative z-10 truncate w-full text-center transition-colors duration-200 ${
                  isActive ? 'text-accent-purple' : 'text-text-muted'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

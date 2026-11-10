import { motion } from 'framer-motion'
import { Tab, useAppStore } from '../../stores/appStore'

const tabs: Array<{ id: Tab; emoji: string; label: string }> = [
  { id: 'contests', emoji: '🏆', label: 'Конкурсы' },
  { id: 'upgrade', emoji: '🚀', label: 'Апгрейд' },
  { id: 'cases', emoji: '🎁', label: 'Кейсы' },
  { id: 'friends', emoji: '👥', label: 'Друзья' },
  { id: 'profile', emoji: '👤', label: 'Профиль' },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-bg-secondary border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around px-2 h-[62px]">
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
                  layoutId="active-tab"
                  className="absolute inset-0 bg-accent-purple/15 rounded-xl"
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                />
              )}
              <motion.span
                className="text-xl relative z-10"
                animate={{ scale: isActive ? 1.2 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {tab.emoji}
              </motion.span>
              <span className={`text-[10px] font-medium relative z-10 truncate w-full text-center ${
                isActive ? 'text-accent-purple' : 'text-text-muted'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

import { motion } from 'framer-motion'
import { Tab, useAppStore } from '../../stores/appStore'

const tabs: Array<{ id: Tab; icon: string; label: string; badge?: string }> = [
  { id: 'games',    icon: '🎮', label: 'Игры'     },
  { id: 'cases',    icon: '📦', label: 'Кейсы',  badge: 'FREE' },
  { id: 'earnings', icon: '💰', label: 'Заработок' },
  { id: 'bonuses',  icon: '🎁', label: 'Бонусы'   },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{
        background: 'rgba(10,10,20,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
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
                  layoutId="nav-active-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(124,58,237,0.16)' }}
                  transition={{ type: 'spring', damping: 24, stiffness: 350 }}
                />
              )}

              <div className="relative">
                <motion.span
                  className="text-xl block relative z-10"
                  animate={{ scale: isActive ? 1.2 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 320 }}
                >
                  {tab.icon}
                </motion.span>

                {tab.badge && !isActive && (
                  <span
                    className="absolute -top-1.5 -right-3 text-[8px] font-black px-1 py-0 rounded-full leading-4"
                    style={{ background: '#F59E0B', color: '#000' }}
                  >
                    {tab.badge}
                  </span>
                )}

                {isActive && (
                  <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: '#8B5CF6' }}
                    transition={{ type: 'spring', damping: 24, stiffness: 350 }}
                  />
                )}
              </div>

              <span
                className="text-[9px] font-semibold relative z-10 truncate w-full text-center transition-colors duration-150"
                style={{ color: isActive ? '#8B5CF6' : '#64748B' }}
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

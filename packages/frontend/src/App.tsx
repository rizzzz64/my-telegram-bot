import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUserStore } from './stores/userStore'
import { useAppStore, Tab } from './stores/appStore'
import { PageLoader } from './components/ui/LoadingSpinner'
import { Notification } from './components/ui/Notification'
import { Header } from './components/layout/Header'
import { BottomNav } from './components/layout/BottomNav'
import { CasesPage } from './pages/CasesPage'
import { GamesPage } from './pages/GamesPage'
import { FriendsPage } from './pages/FriendsPage'
import { ProfilePage } from './pages/ProfilePage'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'

export default function App() {
  const { user, loading, error, fetchUser } = useUserStore()
  const { activeTab } = useAppStore()
  const TAB_ORDER: Tab[] = ['games', 'cases', 'earnings', 'bonuses']
  const prevTabRef = useRef<Tab>('games')
  const dir = TAB_ORDER.indexOf(activeTab) >= TAB_ORDER.indexOf(prevTabRef.current) ? 1 : -1
  useEffect(() => { prevTabRef.current = activeTab }, [activeTab])

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.enableClosingConfirmation()
    }
    fetchUser()
  }, [])

  if (loading) return <PageLoader />

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Ошибка подключения</h2>
        <p className="text-text-muted text-sm mb-6 max-w-xs">{error}</p>
        <button onClick={() => fetchUser()} className="bg-accent-purple text-white px-6 py-3 rounded-xl font-medium">
          Повторить
        </button>
        {DEMO_MODE && (
          <p className="text-text-muted text-xs mt-4">
            Backend не запущен? Запусти: <code className="text-accent-purple">npm run dev</code>
          </p>
        )}
      </div>
    )
  }

  if (!user) return <PageLoader />

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Notification />

      {DEMO_MODE && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-center"
          style={{ marginTop: 'env(safe-area-inset-top, 0px)' }}>
          <p className="text-amber-400 text-xs">🔧 Демо · Промокод: WELCOME500</p>
        </div>
      )}

      <Header />

      <main className="flex-1 overflow-y-auto" style={{ marginTop: '56px' }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={activeTab}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeTab === 'cases'    && <CasesPage />}
            {activeTab === 'games'    && <GamesPage />}
            {activeTab === 'earnings' && <FriendsPage />}
            {activeTab === 'bonuses'  && <ProfilePage />}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  )
}

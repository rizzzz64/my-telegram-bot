import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../utils/api'
import { useUserStore } from '../stores/userStore'
import { useAppStore } from '../stores/appStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { RarityBadge } from '../components/game/RarityBadge'
import { CaseOpeningRoulette } from '../components/game/CaseOpeningRoulette'

interface DropItem {
  item: { id: number; name: string; emoji: string; rarity: string; color: string; gameValue: number }
  chance: number
}

interface Case {
  id: number
  name: string
  description: string
  imageEmoji: string
  color: string
  category: string
  price: number
  currency: string
  drops: DropItem[]
}

const categoryLabels: Record<string, string> = {
  free: '🆓 Бесплатные',
  daily: '📅 Ежедневные',
  referral: '👥 Рефералы',
  regular: '📦 Обычные',
  rare: '💫 Редкие',
  premium: '💎 Премиум',
  legendary: '⭐ Легендарные',
  vip: '👑 VIP',
  allin: '🎰 All-In',
}

export function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [opening, setOpening] = useState(false)
  const [openingResult, setOpeningResult] = useState<any>(null)
  const [showRoulette, setShowRoulette] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const { user, fetchUser } = useUserStore()
  const { showNotification } = useAppStore()

  useEffect(() => {
    api.get<Case[]>('/cases').then(setCases).finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(cases.map(c => c.category))]

  const handleOpenCase = async () => {
    if (!selectedCase || opening) return
    setOpening(true)
    setShowRoulette(true)
    try {
      const result = await api.post<any>(`/cases/${selectedCase.id}/open`)
      setOpeningResult(result)
    } catch (err: any) {
      setShowRoulette(false)
      setOpening(false)
      showNotification(err.message || 'Ошибка открытия кейса', 'error')
    }
  }

  const handleRouletteComplete = () => {
    setShowRoulette(false)
    setShowResult(true)
    fetchUser()
  }

  const handleCloseResult = () => {
    setShowResult(false)
    setOpeningResult(null)
    setOpening(false)
    setSelectedCase(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <div className="pb-nav">
      {/* Header */}
      <div className="px-4 pt-3 pb-3">
        <h1 className="text-2xl font-bold text-text-primary">🎁 Кейсы</h1>
        <p className="text-text-muted text-sm">Открой кейс и получи призы!</p>
      </div>

      {categories.map(cat => {
        const catCases = cases.filter(c => c.category === cat)
        return (
          <div key={cat} className="mb-6">
            <h2 className="text-sm font-semibold text-text-secondary px-4 mb-3">
              {categoryLabels[cat] || cat}
            </h2>
            <div className="flex gap-3 px-4 overflow-x-auto pb-2 scrollbar-hide">
              {catCases.map((caseItem) => (
                <CaseCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  onSelect={() => setSelectedCase(caseItem)}
                  userCoins={user?.coins || 0}
                  userTickets={user?.tickets || 0}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Case Detail Modal */}
      <Modal isOpen={!!selectedCase && !opening} onClose={() => setSelectedCase(null)} title={selectedCase?.name}>
        {selectedCase && (
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl relative overflow-hidden"
                style={{ background: `${selectedCase.color}20`, border: `1px solid ${selectedCase.color}40` }}
              >
                {selectedCase.imageEmoji}
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-2">{selectedCase.description}</p>
                <div className="flex items-center gap-2">
                  {selectedCase.price === 0 ? (
                    <span className="text-green-400 font-bold text-lg">Бесплатно!</span>
                  ) : (
                    <>
                      <span className="text-2xl">{selectedCase.currency === 'coins' ? '🪙' : '🎟️'}</span>
                      <span className="text-xl font-bold text-text-primary">
                        {selectedCase.price.toLocaleString('ru-RU')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-semibold text-text-secondary mb-3">Возможные призы:</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedCase.drops.map((drop) => (
                  <div key={drop.item.id}
                    className="flex items-center gap-3 bg-bg-secondary rounded-xl p-3">
                    <span className="text-2xl">{drop.item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{drop.item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RarityBadge rarity={drop.item.rarity} />
                        <span className="text-xs text-text-muted">🪙 {drop.item.gameValue}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-accent-purple">{drop.chance}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Balance check */}
            {selectedCase.price > 0 && (
              <div className="bg-bg-secondary rounded-xl p-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Ваш баланс:</span>
                  <span className="font-bold text-text-primary">
                    {selectedCase.currency === 'coins'
                      ? `🪙 ${user?.coins?.toLocaleString('ru-RU')}`
                      : `🎟️ ${user?.tickets}`}
                  </span>
                </div>
                {((selectedCase.currency === 'coins' && (user?.coins || 0) < selectedCase.price) ||
                  (selectedCase.currency === 'tickets' && (user?.tickets || 0) < selectedCase.price)) && (
                  <p className="text-red-400 text-xs mt-1">⚠️ Недостаточно средств</p>
                )}
              </div>
            )}

            <motion.button
              onClick={handleOpenCase}
              whileTap={{ scale: 0.97 }}
              disabled={
                (selectedCase.currency === 'coins' && (user?.coins || 0) < selectedCase.price) ||
                (selectedCase.currency === 'tickets' && (user?.tickets || 0) < selectedCase.price)
              }
              className="w-full py-4 rounded-2xl font-bold text-white text-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${selectedCase.color}, ${selectedCase.color}99)` }}
            >
              {selectedCase.price === 0 ? '🎁 Открыть бесплатно!' : `🎁 Открыть кейс`}
            </motion.button>
          </div>
        )}
      </Modal>

      {/* Roulette Modal */}
      <AnimatePresence>
        {showRoulette && selectedCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold text-text-primary mb-1">Открываем кейс</h2>
              <p className="text-text-muted">{selectedCase.name}</p>
            </motion.div>

            {openingResult ? (
              <CaseOpeningRoulette
                drops={selectedCase.drops}
                winnerItemId={openingResult.item.id}
                onComplete={handleRouletteComplete}
              />
            ) : (
              <div className="flex items-center gap-3">
                <LoadingSpinner size="lg" />
                <span className="text-text-secondary">Генерируем приз...</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Result Modal */}
      <AnimatePresence>
        {showResult && openingResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 modal-backdrop"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-bg-card rounded-3xl p-8 max-w-sm w-full text-center border border-white/10"
              style={{ boxShadow: `0 0 60px ${openingResult.item.color}40` }}
            >
              <motion.div
                className="text-8xl mb-4"
                animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {openingResult.item.emoji}
              </motion.div>

              <div className="mb-2">
                <span className="text-xs text-accent-purple uppercase tracking-widest font-bold">
                  🎊 Вы выиграли!
                </span>
              </div>

              <h3 className="text-2xl font-bold text-text-primary mb-2">
                {openingResult.item.name}
              </h3>

              <div className="flex justify-center mb-3">
                <RarityBadge rarity={openingResult.item.rarity} />
              </div>

              <div className="bg-bg-secondary rounded-xl p-3 mb-6 flex justify-around">
                <div>
                  <p className="text-xs text-text-muted">Ценность</p>
                  <p className="font-bold text-yellow-400">🪙 {openingResult.item.gameValue}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Опыт</p>
                  <p className="font-bold text-purple-400">+{openingResult.expGained} XP</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Баланс</p>
                  <p className="font-bold text-green-400">🪙 {openingResult.newBalance.coins.toLocaleString('ru-RU')}</p>
                </div>
              </div>

              <motion.button
                onClick={handleCloseResult}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-accent-purple to-accent-blue"
              >
                🚀 Отлично!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CaseCard({ caseItem, onSelect, userCoins, userTickets }: {
  caseItem: Case
  onSelect: () => void
  userCoins: number
  userTickets: number
}) {
  const canAfford = caseItem.price === 0 ||
    (caseItem.currency === 'coins' && userCoins >= caseItem.price) ||
    (caseItem.currency === 'tickets' && userTickets >= caseItem.price)

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.04, y: -3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
      className="flex-shrink-0 w-40 rounded-3xl overflow-hidden text-left premium-card"
      style={{ border: `1px solid ${caseItem.color}30` }}
    >
      {/* Image area */}
      <div
        className="h-32 flex items-center justify-center text-5xl relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${caseItem.color}28, ${caseItem.color}10)` }}
      >
        {/* Glow behind emoji */}
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(circle at 50% 60%, ${caseItem.color}60, transparent 70%)` }}
        />
        <motion.span
          className="relative z-10"
          style={{ display: 'inline-block' }}
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {caseItem.imageEmoji}
        </motion.span>
        {!canAfford && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="text-[10px] text-text-muted font-medium">Мало средств</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-bold text-text-primary truncate">{caseItem.name}</p>
        <div className="flex items-center justify-between mt-1.5">
          {caseItem.price === 0 ? (
            <span className="text-xs font-bold text-emerald-400">Бесплатно!</span>
          ) : (
            <span className="text-xs font-bold text-yellow-400">
              {caseItem.currency === 'coins' ? '🪙' : '🎟️'} {caseItem.price.toLocaleString('ru-RU')}
            </span>
          )}
          <span className="text-[10px] text-text-muted">{caseItem.drops.length} призов</span>
        </div>
      </div>
    </motion.button>
  )
}

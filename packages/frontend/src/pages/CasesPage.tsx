import { useEffect, useState, useMemo } from 'react'
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
  isNew?: boolean
  isLimited?: boolean
}

// Category display config
const CATEGORIES: Record<string, { label: string; filterLabel: string; order: number }> = {
  free:      { label: 'Бесплатные',  filterLabel: 'Бесплатные', order: 0 },
  daily:     { label: '⭐ До 200',    filterLabel: '⭐ До 200',   order: 1 },
  referral:  { label: '⭐ До 200',    filterLabel: '⭐ До 200',   order: 1 },
  regular:   { label: '⭐ Средние',   filterLabel: '⭐ Средние',  order: 2 },
  rare:      { label: '⭐ Дорогие',   filterLabel: '⭐ Дорогие',  order: 3 },
  premium:   { label: '⭐ Премиум',   filterLabel: '⭐ Премиум',  order: 4 },
  legendary: { label: '⭐ Легенда',   filterLabel: '⭐ Легенда',  order: 5 },
  vip:       { label: 'Эксклюзив',   filterLabel: 'Эксклюзив',  order: 6 },
  allin:     { label: 'All-In',      filterLabel: 'All-In',     order: 7 },
}

const FILTER_ALL = 'Все'

function formatPrice(price: number, currency: string) {
  if (price === 0) return 'Бесплатно'
  if (currency === 'stars') {
    if (price >= 1000) return `⭐ ${(price / 1000).toFixed(price >= 10000 ? 0 : 1)}K`
    return `⭐ ${price.toLocaleString('ru-RU')}`
  }
  const icon = currency === 'coins' ? '★' : '🎟️'
  if (price >= 1000) return `${icon} ${(price / 1000).toFixed(price >= 10000 ? 0 : 1)}K`
  return `${icon} ${price.toLocaleString('ru-RU')}`
}

export function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL)
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

  // Unique filter chips derived from actual data
  const filterChips = useMemo(() => {
    const seen = new Set<string>()
    const chips: string[] = [FILTER_ALL]
    cases
      .map(c => CATEGORIES[c.category]?.filterLabel || c.category)
      .forEach(label => { if (!seen.has(label)) { seen.add(label); chips.push(label) } })
    return chips
  }, [cases])

  // Cases grouped by display category, filtered
  const grouped = useMemo(() => {
    const filtered = activeFilter === FILTER_ALL
      ? cases
      : cases.filter(c => (CATEGORIES[c.category]?.filterLabel || c.category) === activeFilter)

    const groups: Record<string, { label: string; order: number; cases: Case[] }> = {}
    filtered.forEach(c => {
      const cfg = CATEGORIES[c.category] || { label: c.category, order: 99 }
      if (!groups[cfg.label]) groups[cfg.label] = { label: cfg.label, order: cfg.order, cases: [] }
      groups[cfg.label].cases.push(c)
    })
    return Object.values(groups).sort((a, b) => a.order - b.order)
  }, [cases, activeFilter])

  const handleOpenCase = async () => {
    if (!selectedCase || opening) return

    // Stars payment flow
    if (selectedCase.currency === 'stars') {
      const tg = (window as any).Telegram?.WebApp
      if (!tg) {
        showNotification('Откройте приложение через Telegram', 'error')
        return
      }
      setOpening(true)
      try {
        const { url } = await api.post<{ url: string }>(`/cases/${selectedCase.id}/invoice`)
        tg.openInvoice(url, (status: string) => {
          setOpening(false)
          if (status === 'paid') {
            showNotification('⭐ Оплата прошла! Приз придёт в бот.', 'success')
            setSelectedCase(null)
          } else if (status === 'failed' || status === 'cancelled') {
            showNotification('Оплата отменена', 'info')
          }
        })
      } catch (err: any) {
        setOpening(false)
        showNotification(err.message || 'Ошибка создания платежа', 'error')
      }
      return
    }

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

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="pb-nav">
      {/* Filter bar */}
      <div className="sticky top-14 z-20 px-3 py-2.5" style={{ background: 'rgba(10,10,20,0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {/* Search icon */}
          <button className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-text-muted"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            🔍
          </button>

          {filterChips.map(chip => (
            <motion.button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              whileTap={{ scale: 0.93 }}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-150"
              style={activeFilter === chip
                ? { background: '#7C3AED', color: '#fff', border: '1px solid #7C3AED' }
                : { background: 'rgba(255,255,255,0.06)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.08)' }
              }
            >
              {chip}
            </motion.button>
          ))}

          {/* Sort icon */}
          <button className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-text-muted ml-auto"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            ↕
          </button>
        </div>
      </div>

      {/* Cases grouped sections */}
      <div className="px-3 pt-1 pb-4">
        {grouped.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-text-muted">Нет кейсов в этой категории</p>
          </div>
        ) : (
          grouped.map(group => (
            <div key={group.label} className="mb-5">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-2xl font-black text-white">{group.label}</h2>
                <span className="text-sm text-text-muted">{group.cases.length} кейс{group.cases.length === 1 ? '' : group.cases.length < 5 ? 'а' : 'ов'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {group.cases.map((c, idx) => (
                  <CaseCard key={c.id} caseItem={c} index={idx} onSelect={() => setSelectedCase(c)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Case Detail Modal */}
      <Modal isOpen={!!selectedCase && !opening} onClose={() => setSelectedCase(null)} title={selectedCase?.name}>
        {selectedCase && (
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl relative overflow-hidden flex-shrink-0"
                style={{ background: `${selectedCase.color}20`, border: `1px solid ${selectedCase.color}40` }}
              >
                <div className="absolute inset-0 opacity-30" style={{ background: `radial-gradient(circle, ${selectedCase.color}60, transparent 70%)` }} />
                <span className="relative z-10">{selectedCase.imageEmoji}</span>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-2">{selectedCase.description}</p>
                <div className="flex items-center gap-2">
                  {selectedCase.price === 0 ? (
                    <span className="text-green-400 font-bold text-lg">Бесплатно!</span>
                  ) : (
                    <span className="text-xl font-bold text-yellow-400">{formatPrice(selectedCase.price, selectedCase.currency)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-sm font-semibold text-text-secondary mb-3">Возможные призы:</h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {selectedCase.drops.map(drop => (
                  <div key={drop.item.id} className="flex items-center gap-3 bg-bg-secondary rounded-xl p-3">
                    <span className="text-2xl">{drop.item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{drop.item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RarityBadge rarity={drop.item.rarity} />
                        <span className="text-xs text-text-muted">🪙 {drop.item.gameValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedCase.price > 0 && (
              <div className="bg-bg-secondary rounded-xl p-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Твой баланс:</span>
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

            {selectedCase.currency === 'stars' ? (
              <motion.button
                onClick={handleOpenCase}
                disabled={opening}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-black text-white text-lg disabled:opacity-60"
                style={{ background: opening ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#F59E0B,#EF4444)' }}
              >
                {opening ? '⏳ Открываем...' : `⭐ Оплатить ${selectedCase.price} Stars`}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleOpenCase}
                whileTap={{ scale: 0.97 }}
                disabled={
                  (selectedCase.currency === 'coins' && (user?.coins || 0) < selectedCase.price) ||
                  (selectedCase.currency === 'tickets' && (user?.tickets || 0) < selectedCase.price)
                }
                className="w-full py-4 rounded-2xl font-bold text-white text-lg btn-neon disabled:opacity-50"
                style={{ background: selectedCase.price === 0 ? 'linear-gradient(135deg, #059669, #10B981)' : `linear-gradient(135deg, ${selectedCase.color}, ${selectedCase.color}99)` }}
              >
                {selectedCase.price === 0 ? '🎁 Открыть бесплатно!' : '🎁 Открыть кейс'}
              </motion.button>
            )}
          </div>
        )}
      </Modal>

      {/* Roulette */}
      <AnimatePresence>
        {showRoulette && selectedCase && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg-primary flex flex-col items-center justify-center"
          >
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-1">Открываем кейс</h2>
              <p className="text-text-muted">{selectedCase.name}</p>
            </motion.div>
            {openingResult ? (
              <CaseOpeningRoulette drops={selectedCase.drops} winnerItemId={openingResult.item.id} onComplete={handleRouletteComplete} />
            ) : (
              <div className="flex items-center gap-3">
                <LoadingSpinner size="lg" />
                <span className="text-text-secondary">Генерируем приз...</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win result */}
      <AnimatePresence>
        {showResult && openingResult && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', damping: 15 }}
              className="bg-bg-card rounded-3xl p-8 max-w-sm w-full text-center border border-white/10"
              style={{ boxShadow: `0 0 60px ${openingResult.item.color}40` }}
            >
              <motion.div className="text-8xl mb-4"
                animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {openingResult.item.emoji}
              </motion.div>
              <div className="mb-2">
                <span className="text-xs text-accent-purple uppercase tracking-widest font-bold">🎊 Поздравляем!</span>
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">{openingResult.item.name}</h3>
              <div className="flex justify-center mb-4"><RarityBadge rarity={openingResult.item.rarity} /></div>
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
                onClick={handleCloseResult} whileTap={{ scale: 0.97 }}
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

function CaseCard({ caseItem, index, onSelect }: { caseItem: Case; index: number; onSelect: () => void }) {
  const isNew = caseItem.isNew ?? (caseItem.id % 3 === 0)
  const isLimited = caseItem.isLimited ?? false
  const [shimmer, setShimmer] = useState(false)

  const handleTap = () => {
    setShimmer(true)
    setTimeout(() => setShimmer(false), 600)
    onSelect()
  }

  return (
    <motion.button
      onClick={handleTap}
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.055, duration: 0.3, type: 'spring', damping: 18 }}
      whileTap={{ scale: 0.93 }}
      className="rounded-2xl overflow-hidden text-left w-full relative"
      style={{
        background: `linear-gradient(160deg, ${caseItem.color}18 0%, #0d0d1a 60%)`,
        border: `1px solid ${caseItem.color}50`,
        boxShadow: `0 4px 24px ${caseItem.color}20, 0 0 0 1px ${caseItem.color}18 inset`,
      }}
    >
      {/* Image area */}
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: '148px' }}
      >
        {/* Deep background gradient */}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${caseItem.color}30 0%, ${caseItem.color}08 50%, #05050f 100%)` }} />

        {/* Strong bottom radial glow */}
        <div className="absolute bottom-0 left-0 right-0"
          style={{ height: '80%', background: `radial-gradient(ellipse at 50% 100%, ${caseItem.color}60 0%, transparent 70%)` }} />

        {/* Shimmer sweep on tap */}
        <AnimatePresence>
          {shimmer && (
            <motion.div
              className="absolute inset-0 z-20 pointer-events-none"
              initial={{ x: '-100%', skewX: -15, opacity: 0.6 }}
              animate={{ x: '200%', opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', width: '60%' }}
            />
          )}
        </AnimatePresence>

        {/* New / Limited badge */}
        {isLimited && (
          <motion.div
            className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black z-10 flex items-center gap-1"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{ background: 'linear-gradient(135deg, #DC2626, #EF4444)', color: '#fff',
              boxShadow: '0 2px 8px rgba(239,68,68,0.5)' }}>
            🔥 ЛИМИТ
          </motion.div>
        )}
        {isNew && !isLimited && (
          <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black z-10 flex items-center gap-0.5"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)', color: '#fff',
              boxShadow: '0 2px 8px rgba(16,185,129,0.5)' }}>
            ✦ НОВОЕ
          </div>
        )}

        {/* Emoji with float + subtle rotation */}
        <motion.span
          className="relative z-10 select-none"
          style={{ fontSize: '82px', lineHeight: 1,
            filter: `drop-shadow(0 8px 20px ${caseItem.color}80) drop-shadow(0 0 12px ${caseItem.color}60)` }}
          animate={{ y: [-5, 5, -5], rotate: [-2, 2, -2] }}
          transition={{ duration: 2.6 + (index % 4) * 0.35, repeat: Infinity, ease: 'easeInOut' }}
        >
          {caseItem.imageEmoji}
        </motion.span>

        {/* Sparkle stars */}
        {[...Array(3)].map((_, i) => (
          <motion.div key={i}
            className="absolute z-10 text-xs pointer-events-none select-none"
            style={{ left: `${25 + i * 25}%`, top: `${15 + i * 10}%`, opacity: 0.7 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.2, 0.5], y: [0, -6, 0] }}
            transition={{ duration: 1.8 + i * 0.6, repeat: Infinity, delay: i * 0.7 }}>
            ✦
          </motion.div>
        ))}
      </div>

      {/* Info footer */}
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-sm font-bold text-white truncate mb-2.5 leading-tight">{caseItem.name}</p>
        {caseItem.price === 0 ? (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black"
            style={{ background: 'linear-gradient(135deg, #065F46, #059669)',
              boxShadow: '0 2px 10px rgba(5,150,105,0.4)', color: '#6EE7B7' }}>
            🎁 Бесплатно
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black"
            style={{ background: `linear-gradient(135deg, ${caseItem.color}cc, ${caseItem.color}88)`,
              boxShadow: `0 2px 10px ${caseItem.color}40`, color: '#fff' }}>
            ⭐ {formatPrice(caseItem.price, caseItem.currency)}
          </div>
        )}
      </div>
    </motion.button>
  )
}

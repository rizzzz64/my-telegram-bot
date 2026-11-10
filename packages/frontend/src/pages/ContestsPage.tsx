import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../utils/api'
import { useAppStore } from '../stores/appStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'

interface Contest {
  id: number
  name: string
  description: string
  prizeEmoji: string
  prizeCoins: number
  maxEntries: number
  endsAt: string
  isActive: boolean
  _count: { entries: number }
  isEntered?: boolean
}

function useCountdown(endsAt: string) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Завершён'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h}ч ${m}м ${s}с`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [endsAt])

  return timeLeft
}

function ContestCard({ contest, onSelect }: { contest: Contest; onSelect: () => void }) {
  const timeLeft = useCountdown(contest.endsAt)
  const fillPercent = Math.round((contest._count.entries / contest.maxEntries) * 100)

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -2 }}
      onClick={onSelect}
      className="premium-card rounded-2xl p-4 cursor-pointer card-hover overflow-hidden relative"
    >
      {/* Subtle left accent line */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b from-accent-purple to-accent-blue opacity-70" />
      <div className="flex items-start gap-4 pl-3">
        <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
          {contest.prizeEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-text-primary">{contest.name}</h3>
            {contest.isEntered && (
              <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                ✓ Участвую
              </span>
            )}
          </div>
          <p className="text-text-muted text-sm mt-0.5 line-clamp-2">{contest.description}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-sm font-bold text-yellow-400">🏆 {contest.prizeCoins.toLocaleString('ru-RU')} монет</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pl-3">
        <div className="flex justify-between text-xs text-text-muted mb-1.5">
          <span className="text-cyan-400/90">⏰ {timeLeft}</span>
          <span>{contest._count.entries} / {contest.maxEntries}</span>
        </div>
        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7C3AED, #2563EB)' }}
            initial={{ width: 0 }}
            animate={{ width: `${fillPercent}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export function ContestsPage() {
  const [contests, setContests] = useState<Contest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Contest & { entries?: any[] } | null>(null)
  const [entering, setEntering] = useState(false)
  const { showNotification } = useAppStore()

  useEffect(() => {
    api.get<Contest[]>('/contests').then(setContests).finally(() => setLoading(false))
  }, [])

  const openContest = async (id: number) => {
    setSelectedId(id)
    const data = await api.get<any>(`/contests/${id}`)
    setDetail(data)
  }

  const handleEnter = async () => {
    if (!detail || entering) return
    setEntering(true)
    try {
      await api.post(`/contests/${detail.id}/enter`)
      showNotification('🎉 Вы участвуете в розыгрыше!', 'success')
      setDetail(prev => prev ? { ...prev, isEntered: true, _count: { entries: prev._count.entries + 1 } } : prev)
      setContests(prev => prev.map(c => c.id === detail.id
        ? { ...c, isEntered: true, _count: { entries: c._count.entries + 1 } } : c))
    } catch (err: any) {
      showNotification(err.message, 'error')
    } finally {
      setEntering(false)
    }
  }

  const timeLeft = detail ? useCountdown(detail.endsAt) : ''

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  return (
    <div className="pb-nav">
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">🏆 Конкурсы</h1>
        <p className="text-text-muted text-sm">Участвуй в розыгрышах бесплатно!</p>
      </div>

      <div className="px-4 space-y-3">
        {contests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-text-muted">Активных конкурсов нет</p>
            <p className="text-text-muted text-sm">Загляни позже!</p>
          </div>
        ) : (
          contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} onSelect={() => openContest(contest.id)} />
          ))
        )}
      </div>

      <Modal isOpen={!!selectedId} onClose={() => { setSelectedId(null); setDetail(null) }} title="Розыгрыш">
        {!detail ? (
          <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <div className="p-5">
            <div className="text-center mb-6">
              <div className="text-7xl mb-3">{detail.prizeEmoji}</div>
              <h3 className="text-xl font-bold text-text-primary">{detail.name}</h3>
              <p className="text-text-muted text-sm mt-1">{detail.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: 'Приз', value: `🪙 ${detail.prizeCoins.toLocaleString('ru-RU')}`, color: 'text-yellow-400' },
                { label: 'Участников', value: `${detail._count.entries} / ${detail.maxEntries}`, color: 'text-text-primary' },
                { label: 'До конца', value: timeLeft, color: 'text-cyan-400' },
                { label: 'Участие', value: '🆓 Бесплатно', color: 'text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="glass-card rounded-xl p-3 text-center">
                  <p className="text-xs text-text-muted">{label}</p>
                  <p className={`font-bold text-sm mt-0.5 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {detail.isEntered ? (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                <p className="text-green-400 font-bold">✅ Вы уже участвуете!</p>
                <p className="text-text-muted text-sm mt-1">Ждите объявления победителя</p>
              </div>
            ) : (
              <motion.button
                onClick={handleEnter}
                disabled={entering}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-accent-purple to-accent-blue btn-neon"
              >
                {entering ? <LoadingSpinner size="sm" /> : '🎯 Участвовать бесплатно!'}
              </motion.button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

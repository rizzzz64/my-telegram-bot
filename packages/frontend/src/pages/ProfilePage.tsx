import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../utils/api'
import { useUserStore } from '../stores/userStore'
import { useAppStore } from '../stores/appStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { RarityBadge } from '../components/game/RarityBadge'
import { ItemCard } from '../components/game/ItemCard'
import { Modal } from '../components/ui/Modal'

interface UserItem {
  id: number
  itemId: number
  status: string
  obtainedFrom: string
  createdAt: string
  item: {
    id: number; name: string; emoji: string; rarity: string
    category: string; gameValue: number; color: string
  }
}

const rankConfig: Record<string, { label: string; color: string; next: string; nextXp: number }> = {
  bronze:   { label: '🥉 Bronze',   color: '#CD7F32', next: 'Silver',   nextXp: 1000 },
  silver:   { label: '🥈 Silver',   color: '#C0C0C0', next: 'Gold',     nextXp: 5000 },
  gold:     { label: '🥇 Gold',     color: '#FFD700', next: 'Platinum', nextXp: 20000 },
  platinum: { label: '💎 Platinum', color: '#00CED1', next: 'MAX',      nextXp: 100000 },
}

export function ProfilePage() {
  const { user, fetchUser } = useUserStore()
  const { showNotification } = useAppStore()
  const [inventory, setInventory] = useState<UserItem[]>([])
  const [loadingInv, setLoadingInv] = useState(true)
  const [promoCode, setPromoCode] = useState('')
  const [activatingPromo, setActivatingPromo] = useState(false)
  const [claimingBonus, setClaimingBonus] = useState(false)
  const [selectedItem, setSelectedItem] = useState<UserItem | null>(null)
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'history'>('stats')

  useEffect(() => {
    api.get<UserItem[]>('/inventory').then(setInventory).finally(() => setLoadingInv(false))
  }, [])

  const handleDailyBonus = async () => {
    setClaimingBonus(true)
    try {
      const result = await api.get<any>('/users/daily-bonus')
      if (result.available && result.claimed) {
        showNotification(`🎉 +${result.coinsEarned} монет! Серия: ${result.streak}`, 'success')
        fetchUser()
      } else {
        showNotification(`⏰ Следующий бонус через ${result.hoursLeft}ч`, 'info')
      }
    } catch (err: any) {
      showNotification(err.message, 'error')
    } finally {
      setClaimingBonus(false)
    }
  }

  const handleActivatePromo = async () => {
    if (!promoCode.trim()) return
    setActivatingPromo(true)
    try {
      const result = await api.post<any>('/promo/activate', { code: promoCode.trim().toUpperCase() })
      showNotification(
        `✅ Промокод активирован! +${result.rewardAmount} ${result.rewardType === 'coins' ? '🪙 монет' : '🎟️ билетов'}`,
        'success'
      )
      setPromoCode('')
      fetchUser()
    } catch (err: any) {
      showNotification(err.message, 'error')
    } finally {
      setActivatingPromo(false)
    }
  }

  if (!user) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  const rank = rankConfig[user.rank] || rankConfig.bronze
  const xpProgress = Math.min((user.experience / rank.nextXp) * 100, 100)

  return (
    <div className="pb-nav">
      {/* Profile Header */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(145deg, rgba(109,40,217,0.22) 0%, rgba(37,99,235,0.18) 100%)' }}
        />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at top left, rgba(139,92,246,0.15) 0%, transparent 60%)' }} />
        <div className="relative p-5">
          <div className="flex items-start gap-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl glass-card flex-shrink-0"
              style={{ boxShadow: `0 0 24px ${rank.color}40` }}
            >
              {user.rank === 'platinum' ? '💎' : user.rank === 'gold' ? '👑' : user.rank === 'silver' ? '🌟' : '⭐'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-text-primary truncate">
                {user.firstName} {user.lastName || ''}
              </h2>
              {user.username && <p className="text-text-muted text-sm">@{user.username}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ color: rank.color, background: `${rank.color}18`, border: `1px solid ${rank.color}35` }}>
                  {rank.label}
                </span>
                <span className="text-xs text-text-muted">Ур. {user.level}</span>
              </div>
            </div>
          </div>

          {/* XP Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>{user.experience.toLocaleString('ru-RU')} XP</span>
              <span>До {rank.next}: {rank.nextXp.toLocaleString('ru-RU')}</span>
            </div>
            <div className="h-2.5 bg-black/30 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${rank.color}, ${rank.color}cc)`, boxShadow: `0 0 10px ${rank.color}80` }}
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1.1, delay: 0.25, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="flex gap-3 px-4 mt-4">
        <div className="flex-1 premium-card rounded-2xl p-4 border-yellow-500/15" style={{ border: '1px solid rgba(245,158,11,0.18)' }}>
          <p className="text-xs text-text-muted mb-1">Монеты</p>
          <p className="text-2xl font-bold text-yellow-400">🪙 {user.coins.toLocaleString('ru-RU')}</p>
        </div>
        <div className="flex-1 premium-card rounded-2xl p-4" style={{ border: '1px solid rgba(236,72,153,0.18)' }}>
          <p className="text-xs text-text-muted mb-1">Билеты</p>
          <p className="text-2xl font-bold text-pink-400">🎟️ {user.tickets}</p>
        </div>
      </div>

      {/* Daily Bonus */}
      <div className="px-4 mt-4">
        <motion.button
          onClick={handleDailyBonus}
          disabled={claimingBonus}
          whileTap={{ scale: 0.97 }}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 btn-neon"
        >
          {claimingBonus ? <LoadingSpinner size="sm" /> : (
            <>
              <span>📅</span>
              <span>Ежедневный бонус</span>
              {user.dailyStreak > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  🔥 {user.dailyStreak}
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>

      {/* Promo Code */}
      <div className="px-4 mt-4">
        <div className="premium-card rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">🎟️ Промокод</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Введи промокод..."
              className="flex-1 bg-bg-secondary border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-purple/50"
            />
            <motion.button
              onClick={handleActivatePromo}
              disabled={activatingPromo || !promoCode.trim()}
              whileTap={{ scale: 0.97 }}
              className="bg-accent-purple hover:bg-accent-purple/80 px-4 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
            >
              {activatingPromo ? <LoadingSpinner size="sm" /> : 'Активировать'}
            </motion.button>
          </div>
          <p className="text-xs text-text-muted mt-2">Попробуй: WELCOME500, FREECASE, GIFT2025</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-4 mt-5 p-1 premium-card rounded-2xl">
        {(['stats', 'inventory', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-accent-purple text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {tab === 'stats' ? '📊 Статы' : tab === 'inventory' ? '🎒 Инвентарь' : '📜 История'}
          </button>
        ))}
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="px-4 mt-4 space-y-3">
          {[
            { label: '🎁 Открыто кейсов', value: user._count.caseOpenings },
            { label: '🎒 Предметов', value: user._count.inventory },
            { label: '👥 Рефералов', value: user._count.referrals },
            { label: '🔥 Серия входов', value: user.dailyStreak },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between premium-card rounded-xl p-4">
              <span className="text-text-secondary text-sm">{label}</span>
              <span className="font-bold text-text-primary">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="px-4 mt-4">
          {loadingInv ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : inventory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-text-muted">Инвентарь пуст</p>
              <p className="text-text-muted text-sm">Открой кейс, чтобы получить предметы!</p>
            </div>
          ) : (
            <>
              <p className="text-text-muted text-xs mb-3">Всего предметов: {inventory.length}</p>
              <div className="flex flex-wrap gap-3">
                {inventory.map((userItem) => (
                  <ItemCard
                    key={userItem.id}
                    item={userItem.item}
                    onClick={() => setSelectedItem(userItem)}
                    size="md"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Предмет">
        {selectedItem && (
          <div className="p-5">
            <div className="flex flex-col items-center mb-6">
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center text-6xl mb-4"
                style={{ background: `${selectedItem.item.color}20`, border: `2px solid ${selectedItem.item.color}50` }}
              >
                {selectedItem.item.emoji}
              </div>
              <h3 className="text-xl font-bold text-text-primary text-center">{selectedItem.item.name}</h3>
              <div className="mt-2"><RarityBadge rarity={selectedItem.item.rarity} /></div>
            </div>
            <div className="space-y-3">
              {[
                { label: '🏷️ Категория', value: selectedItem.item.category },
                { label: '🪙 Ценность', value: selectedItem.item.gameValue.toLocaleString('ru-RU') },
                { label: '📥 Получен', value: selectedItem.obtainedFrom },
                { label: '📅 Дата', value: new Date(selectedItem.createdAt).toLocaleDateString('ru-RU') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between bg-bg-secondary rounded-xl px-4 py-3">
                  <span className="text-text-secondary text-sm">{label}</span>
                  <span className="text-text-primary text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

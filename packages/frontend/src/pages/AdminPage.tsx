import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../stores/userStore'
import { useAppStore } from '../stores/appStore'
import { api } from '../utils/api'

interface Stats {
  totalUsers: number
  totalOpenings: number
  totalCoinsInCirculation: number
  newUsersToday: number
}

interface AdminUser {
  id: number
  telegramId: string
  username?: string
  firstName: string
  coins: number
  tickets: number
  level: number
  isBanned: boolean
  isAdmin: boolean
  createdAt: string
}

interface AdminCase {
  id: number
  name: string
  currency: string
  price: number
  isActive: boolean
  category: string
  imageEmoji: string
  color: string
  _count?: { openings: number }
}

type Tab = 'stats' | 'users' | 'cases'

export function AdminPage() {
  const { user } = useUserStore()
  const { showNotification } = useAppStore()
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [cases, setCases] = useState<AdminCase[]>([])
  const [loading, setLoading] = useState(false)
  const [searchUser, setSearchUser] = useState('')
  const [giftCoinsUserId, setGiftCoinsUserId] = useState<number | null>(null)
  const [giftCoinsAmount, setGiftCoinsAmount] = useState(500)

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-5xl">🚫</div>
        <div className="text-text-muted text-center">Доступ запрещён</div>
      </div>
    )
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await api.get<{ stats: Stats }>('/admin/stats')
      setStats(data.stats)
    } catch (e: any) {
      showNotification(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await api.get<{ users: AdminUser[] }>('/admin/users')
      setUsers(data.users)
    } catch (e: any) {
      showNotification(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadCases = async () => {
    setLoading(true)
    try {
      const data = await api.get<AdminCase[]>('/cases')
      setCases(data)
    } catch (e: any) {
      showNotification(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'stats') loadStats()
    else if (tab === 'users') loadUsers()
    else if (tab === 'cases') loadCases()
  }, [tab])

  const banUser = async (userId: number, isBanned: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/ban`, { isBanned: !isBanned })
      setUsers(u => u.map(x => x.id === userId ? { ...x, isBanned: !isBanned } : x))
      showNotification(isBanned ? 'Пользователь разбанен' : 'Пользователь забанен', 'success')
    } catch (e: any) { showNotification(e.message, 'error') }
  }

  const toggleCase = async (caseId: number, isActive: boolean) => {
    try {
      await api.patch(`/admin/cases/${caseId}/toggle`, { isActive: !isActive })
      setCases(c => c.map(x => x.id === caseId ? { ...x, isActive: !isActive } : x))
      showNotification(isActive ? 'Кейс скрыт' : 'Кейс активирован', 'success')
    } catch (e: any) { showNotification(e.message, 'error') }
  }

  const giftCoins = async (userId: number) => {
    try {
      await api.post(`/admin/users/${userId}/gift`, { coins: giftCoinsAmount })
      showNotification(`+${giftCoinsAmount} монет выдано`, 'success')
      setGiftCoinsUserId(null)
    } catch (e: any) { showNotification(e.message, 'error') }
  }

  const filteredUsers = searchUser
    ? users.filter(u =>
        u.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.firstName.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.telegramId.includes(searchUser)
      )
    : users

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'stats', label: 'Статистика', emoji: '📊' },
    { id: 'users', label: 'Пользователи', emoji: '👥' },
    { id: 'cases', label: 'Кейсы', emoji: '📦' },
  ]

  return (
    <div className="px-4 pb-6">
      <div className="text-center pt-3 pb-4">
        <h2 className="text-2xl font-black text-white">🛡️ Админ-панель</h2>
        <p className="text-text-muted text-sm mt-0.5">Только для администраторов</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={{ background: 'rgba(22,22,40,0.8)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={tab === t.id
              ? { background: 'linear-gradient(135deg,#7C3AED,#2563EB)', color: '#fff' }
              : { background: 'transparent', color: '#64748B' }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8 text-text-muted">Загрузка...</div>
      )}

      {/* Stats */}
      {tab === 'stats' && !loading && stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Пользователей', value: stats.totalUsers, emoji: '👥', color: '#8B5CF6' },
            { label: 'Открытий кейсов', value: stats.totalOpenings, emoji: '📦', color: '#F59E0B' },
            { label: 'Монет в обороте', value: stats.totalCoinsInCirculation?.toLocaleString() ?? '—', emoji: '🪙', color: '#10B981' },
            { label: 'Новых сегодня', value: stats.newUsersToday, emoji: '🆕', color: '#3B82F6' },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl"
              style={{ background: 'rgba(22,22,40,0.8)', border: `1px solid ${s.color}30` }}>
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-text-muted mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && !loading && (
        <>
          <input
            value={searchUser}
            onChange={e => setSearchUser(e.target.value)}
            placeholder="🔍 Поиск по имени / ID..."
            className="w-full px-4 py-3 rounded-xl mb-4 text-white text-sm outline-none"
            style={{ background: 'rgba(22,22,40,0.9)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <div className="flex flex-col gap-2">
            {filteredUsers.slice(0, 50).map(u => (
              <motion.div key={u.id} layout
                className="p-3 rounded-2xl"
                style={{ background: 'rgba(22,22,40,0.8)', border: `1px solid ${u.isBanned ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black"
                    style={{ background: 'rgba(124,58,237,0.2)' }}>
                    {u.firstName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">
                      {u.firstName} {u.username ? `@${u.username}` : ''}
                      {u.isAdmin && <span className="ml-1 text-yellow-400 text-xs">👑</span>}
                      {u.isBanned && <span className="ml-1 text-red-400 text-xs">🚫</span>}
                    </div>
                    <div className="text-xs text-text-muted">ID: {u.telegramId} · {u.coins} 🪙 · Lvl {u.level}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => banUser(u.id, u.isBanned)}
                      className="px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: u.isBanned ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        color: u.isBanned ? '#10B981' : '#F87171' }}>
                      {u.isBanned ? 'Разбан' : 'Бан'}
                    </button>
                    <button onClick={() => setGiftCoinsUserId(giftCoinsUserId === u.id ? null : u.id)}
                      className="px-2 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                      +🪙
                    </button>
                  </div>
                </div>
                {giftCoinsUserId === u.id && (
                  <div className="flex gap-2 mt-2">
                    {[100, 500, 1000, 5000].map(v => (
                      <button key={v} onClick={() => setGiftCoinsAmount(v)}
                        className="flex-1 py-1 rounded-lg text-xs font-bold"
                        style={giftCoinsAmount === v
                          ? { background: '#7C3AED', color: '#fff' }
                          : { background: 'rgba(255,255,255,0.07)', color: '#94A3B8' }}>
                        {v}
                      </button>
                    ))}
                    <button onClick={() => giftCoins(u.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold"
                      style={{ background: 'rgba(16,185,129,0.3)', color: '#10B981' }}>
                      Выдать
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-text-muted">Пользователи не найдены</div>
            )}
          </div>
        </>
      )}

      {/* Cases */}
      {tab === 'cases' && !loading && (
        <div className="flex flex-col gap-2">
          {cases.map(c => (
            <motion.div key={c.id} layout
              className="p-3 rounded-2xl flex items-center gap-3"
              style={{ background: 'rgba(22,22,40,0.8)', border: `1px solid ${c.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${c.color}20` }}>
                {c.imageEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">{c.name}</div>
                <div className="text-xs text-text-muted">
                  {c.currency === 'stars' ? `⭐ ${c.price}` : `🪙 ${c.price}`} · {c.category}
                </div>
              </div>
              <button onClick={() => toggleCase(c.id, c.isActive)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={c.isActive
                  ? { background: 'rgba(16,185,129,0.2)', color: '#10B981' }
                  : { background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
                {c.isActive ? '✓ Вкл' : '✗ Выкл'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

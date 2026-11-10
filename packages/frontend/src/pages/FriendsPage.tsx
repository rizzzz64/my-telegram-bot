import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../utils/api'
import { useAppStore } from '../stores/appStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

interface ReferralData {
  referralCode: string
  referralLink: string
  referrals: Array<{
    id: number; username?: string; firstName: string; createdAt: string
    _count: { caseOpenings: number }
  }>
  totalReferrals: number
}

export function FriendsPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { showNotification } = useAppStore()

  useEffect(() => {
    api.get<ReferralData>('/referrals').then(setData).finally(() => setLoading(false))
  }, [])

  const handleCopy = async () => {
    if (!data) return
    try {
      await navigator.clipboard.writeText(data.referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showNotification('✅ Ссылка скопирована!', 'success')
    } catch {
      showNotification('Не удалось скопировать', 'error')
    }
  }

  const handleShare = () => {
    if (!data) return
    const tg = (window as any).Telegram?.WebApp
    if (tg) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent('🎁 Играй в GiftForge! Открывай кейсы и выигрывай призы!')}`)
    } else {
      handleCopy()
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>
  if (!data) return null

  return (
    <div className="pb-nav">
      <div className="px-4 pt-2 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">👥 Друзья</h1>
        <p className="text-text-muted text-sm">Приглашай друзей и получай награды!</p>
      </div>

      {/* Referral Stats */}
      <div className="flex gap-3 px-4 mb-6">
        <div className="flex-1 bg-bg-card rounded-2xl p-4 border border-purple-500/20 text-center">
          <div className="text-3xl font-bold text-accent-purple">{data.totalReferrals}</div>
          <p className="text-xs text-text-muted mt-1">Приглашено</p>
        </div>
        <div className="flex-1 bg-bg-card rounded-2xl p-4 border border-pink-500/20 text-center">
          <div className="text-3xl font-bold text-pink-400">+100 🪙</div>
          <p className="text-xs text-text-muted mt-1">За каждого</p>
        </div>
      </div>

      {/* Invite Card */}
      <div className="mx-4 mb-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-2xl p-5 border border-accent-purple/20">
        <h3 className="font-bold text-text-primary mb-1">🔗 Твоя реферальная ссылка</h3>
        <p className="text-text-muted text-sm mb-4">
          За каждого нового игрока ты получаешь <span className="text-yellow-400 font-bold">100 монет</span> и <span className="text-pink-400 font-bold">1 билет</span>!
        </p>

        <div className="bg-bg-primary rounded-xl p-3 mb-4 flex items-center gap-2">
          <code className="text-xs text-accent-purple flex-1 truncate">{data.referralLink}</code>
        </div>

        <div className="flex gap-3">
          <motion.button
            onClick={handleShare}
            whileTap={{ scale: 0.97 }}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-accent-purple to-accent-blue btn-neon text-sm"
          >
            📤 Пригласить друга
          </motion.button>
          <motion.button
            onClick={handleCopy}
            whileTap={{ scale: 0.97 }}
            className={`px-4 py-3.5 rounded-2xl font-bold text-sm border transition-all ${
              copied ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'border-white/20 text-text-secondary'
            }`}
          >
            {copied ? '✓' : '📋'}
          </motion.button>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-4 mb-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-3">Как это работает:</h3>
        <div className="space-y-2">
          {[
            { step: '1', text: 'Поделись своей ссылкой с другом' },
            { step: '2', text: 'Друг регистрируется по твоей ссылке' },
            { step: '3', text: 'Ты получаешь 100 монет + 1 билет' },
            { step: '4', text: 'Друг получает 50 монет приветственный бонус' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-center gap-3 bg-bg-card rounded-xl p-3 border border-white/5">
              <div className="w-7 h-7 rounded-full bg-accent-purple/20 border border-accent-purple/40 flex items-center justify-center text-xs font-bold text-accent-purple flex-shrink-0">
                {step}
              </div>
              <p className="text-text-secondary text-sm">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral List */}
      <div className="px-4">
        <h3 className="text-sm font-semibold text-text-secondary mb-3">
          Приглашённые игроки ({data.totalReferrals}):
        </h3>
        {data.referrals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-text-muted">Пока нет приглашённых</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.referrals.map((ref) => (
              <div key={ref.id} className="flex items-center gap-3 bg-bg-card rounded-xl p-3 border border-white/5">
                <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center text-xl">
                  👤
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary text-sm">
                    {ref.firstName} {ref.username ? `@${ref.username}` : ''}
                  </p>
                  <p className="text-xs text-text-muted">
                    🎁 {ref._count.caseOpenings} кейсов · {new Date(ref.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <span className="text-xs text-green-400 font-bold">+100 🪙</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

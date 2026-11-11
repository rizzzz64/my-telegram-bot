import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '../stores/appStore'
import { UpgradePage } from './UpgradePage'
import { ContestsPage } from './ContestsPage'

type GameView = 'hub' | 'upgrade' | 'contests'

const GAMES = [
  {
    id: 'upgrade',
    name: 'Апгрейд',
    desc: 'Прокачай предмет до редкого',
    emoji: '⚡',
    players: 12,
    color: '#7C3AED',
    gradient: 'linear-gradient(145deg, #3D1E8A, #1E0F45)',
    badge: 'ХИТ',
    badgeColor: '#F59E0B',
  },
  {
    id: 'contests',
    name: 'Розыгрыши',
    desc: 'Участвуй бесплатно — выиграй монеты',
    emoji: '🏆',
    players: 8,
    color: '#F59E0B',
    gradient: 'linear-gradient(145deg, #4A2E06, #2A1A03)',
    badge: 'FREE',
    badgeColor: '#10B981',
  },
  {
    id: 'slots',
    name: 'Слоты',
    desc: '3 одинаковых — x8.1',
    emoji: '🎰',
    players: 31,
    color: '#EC4899',
    gradient: 'linear-gradient(145deg, #4A0E2E, #2A0618)',
    badge: 'СКОРО',
    badgeColor: '#6B7280',
    locked: true,
  },
  {
    id: 'roulette',
    name: 'Рулетка',
    desc: 'Шанс = доля в банке',
    emoji: '🎡',
    players: 19,
    color: '#06B6D4',
    gradient: 'linear-gradient(145deg, #032A30, #011518)',
    badge: 'СКОРО',
    badgeColor: '#6B7280',
    locked: true,
  },
  {
    id: 'crash',
    name: 'Краш',
    desc: 'Успей забрать до краша',
    emoji: '🚀',
    players: 44,
    color: '#10B981',
    gradient: 'linear-gradient(145deg, #022A1A, #011408)',
    badge: 'СКОРО',
    badgeColor: '#6B7280',
    locked: true,
  },
  {
    id: 'mine',
    name: 'Майнинг',
    desc: 'Копай руду и зарабатывай',
    emoji: '⛏️',
    players: 7,
    color: '#8B5CF6',
    gradient: 'linear-gradient(145deg, #1E0A45, #100520)',
    badge: 'СКОРО',
    badgeColor: '#6B7280',
    locked: true,
  },
]

export function GamesPage() {
  const [view, setView] = useState<GameView>('hub')
  const { showNotification } = useAppStore()

  if (view === 'upgrade') {
    return (
      <div>
        <BackBar onBack={() => setView('hub')} title="Апгрейд" />
        <UpgradePage />
      </div>
    )
  }

  if (view === 'contests') {
    return (
      <div>
        <BackBar onBack={() => setView('hub')} title="Розыгрыши" />
        <ContestsPage />
      </div>
    )
  }

  return (
    <div className="pb-nav">
      {/* Header */}
      <div className="px-4 pt-3 pb-4">
        <h1 className="text-2xl font-black text-white">🎮 Игры</h1>
        <p className="text-text-muted text-sm mt-0.5">Играй и выигрывай монеты</p>
      </div>

      {/* Games grid */}
      <div className="px-3 grid grid-cols-2 gap-3">
        {GAMES.map((game, idx) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (game.locked) {
                showNotification('🚧 Скоро будет доступно!', 'info')
                return
              }
              setView(game.id as GameView)
            }}
            className="rounded-2xl overflow-hidden text-left relative"
            style={{ background: game.gradient, border: `1px solid ${game.color}30` }}
          >
            {/* Online badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{ background: 'rgba(0,0,0,0.5)', color: '#94A3B8' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {game.players} играет
            </div>

            {/* Top badge */}
            {game.badge && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black"
                style={{ background: game.badgeColor, color: '#fff' }}>
                {game.badge}
              </div>
            )}

            {/* Emoji */}
            <div className="flex items-center justify-center pt-10 pb-3" style={{ minHeight: 100 }}>
              <motion.span
                className="select-none"
                style={{ fontSize: '56px' }}
                animate={!game.locked ? { y: [-3, 3, -3] } : {}}
                transition={{ duration: 2.6 + idx * 0.3, repeat: Infinity, ease: 'easeInOut' }}
              >
                {game.emoji}
              </motion.span>
            </div>

            {/* Name */}
            <div className="px-3 pb-3">
              <p className="text-sm font-black text-white">{game.name}</p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-tight">{game.desc}</p>
            </div>

            {/* Locked overlay */}
            {game.locked && (
              <div className="absolute inset-0 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.45)' }}>
                <div className="text-center">
                  <div className="text-2xl mb-1">🔒</div>
                  <p className="text-xs text-text-muted font-bold">Скоро</p>
                </div>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Promo banner */}
      <div
        className="mx-3 mt-5 rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(37,99,235,0.2))', border: '1px solid rgba(124,58,237,0.25)' }}
      >
        <div className="text-4xl">🎲</div>
        <div>
          <p className="font-bold text-white text-sm">Новые игры каждый месяц</p>
          <p className="text-text-muted text-xs mt-0.5">Следи за обновлениями!</p>
        </div>
      </div>
    </div>
  )
}

function BackBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
      <motion.button
        onClick={onBack}
        whileTap={{ scale: 0.9 }}
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        ←
      </motion.button>
      <span className="font-bold text-white">{title}</span>
    </div>
  )
}

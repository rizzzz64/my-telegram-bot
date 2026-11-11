import { useState } from 'react'
import { motion } from 'framer-motion'
import { UpgradePage } from './UpgradePage'
import { ContestsPage } from './ContestsPage'
import { SlotsGame } from './games/SlotsGame'
import { CrashGame } from './games/CrashGame'
import { RouletteGame } from './games/RouletteGame'
import { MineGame } from './games/MineGame'
import { ChickenGame } from './games/ChickenGame'

type GameView = 'hub' | 'upgrade' | 'contests' | 'slots' | 'crash' | 'roulette' | 'mine' | 'chicken'

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
    badge: 'НОВОЕ',
    badgeColor: '#10B981',
  },
  {
    id: 'roulette',
    name: 'Рулетка',
    desc: 'Красное, чёрное или 0',
    emoji: '🎡',
    players: 19,
    color: '#06B6D4',
    gradient: 'linear-gradient(145deg, #032A30, #011518)',
    badge: 'НОВОЕ',
    badgeColor: '#10B981',
  },
  {
    id: 'crash',
    name: 'Краш',
    desc: 'Успей забрать до краша',
    emoji: '🚀',
    players: 44,
    color: '#10B981',
    gradient: 'linear-gradient(145deg, #022A1A, #011408)',
    badge: 'НОВОЕ',
    badgeColor: '#10B981',
  },
  {
    id: 'mine',
    name: 'Майнинг',
    desc: 'Копай руду и зарабатывай',
    emoji: '⛏️',
    players: 7,
    color: '#8B5CF6',
    gradient: 'linear-gradient(145deg, #1E0A45, #100520)',
    badge: 'НОВОЕ',
    badgeColor: '#10B981',
  },
  {
    id: 'chicken',
    name: 'Переход',
    desc: 'Перейди дорогу · множитель растёт',
    emoji: '🐥',
    players: 23,
    color: '#F59E0B',
    gradient: 'linear-gradient(145deg, #3A2000, #1E1000)',
    badge: 'НОВОЕ',
    badgeColor: '#10B981',
  },
]

export function GamesPage() {
  const [view, setView] = useState<GameView>('hub')

  if (view === 'upgrade') return (
    <div><BackBar onBack={() => setView('hub')} title="Апгрейд" /><UpgradePage /></div>
  )
  if (view === 'contests') return (
    <div><BackBar onBack={() => setView('hub')} title="Розыгрыши" /><ContestsPage /></div>
  )
  if (view === 'slots') return (
    <div><BackBar onBack={() => setView('hub')} title="Слоты" /><SlotsGame /></div>
  )
  if (view === 'crash') return (
    <div><BackBar onBack={() => setView('hub')} title="Краш" /><CrashGame /></div>
  )
  if (view === 'roulette') return (
    <div><BackBar onBack={() => setView('hub')} title="Рулетка" /><RouletteGame /></div>
  )
  if (view === 'mine') return (
    <div><BackBar onBack={() => setView('hub')} title="Майнинг" /><MineGame /></div>
  )
  if (view === 'chicken') return (
    <div><BackBar onBack={() => setView('hub')} title="Переход" /><ChickenGame /></div>
  )

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
            onClick={() => setView(game.id as GameView)}
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
                animate={{ y: [-3, 3, -3] }}
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

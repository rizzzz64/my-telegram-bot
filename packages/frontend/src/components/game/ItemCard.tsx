import { motion } from 'framer-motion'
import { RarityBadge, getRarityBg, getRarityGlow } from './RarityBadge'

export interface ItemData {
  id: number
  name: string
  emoji: string
  rarity: string
  gameValue: number
  color: string
}

interface ItemCardProps {
  item: ItemData
  onClick?: () => void
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ItemCard({ item, onClick, selected, size = 'md' }: ItemCardProps) {
  const sizes = {
    sm: { container: 'w-20 h-24',  emoji: 'text-3xl', name: 'text-[9px]'  },
    md: { container: 'w-[100px] h-[116px]', emoji: 'text-4xl', name: 'text-[10px]' },
    lg: { container: 'w-36 h-40',  emoji: 'text-5xl', name: 'text-sm'      },
  }
  const s = sizes[size]

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
      className={`${s.container} rounded-2xl flex flex-col items-center justify-center gap-1.5 p-2 cursor-pointer relative overflow-hidden ${getRarityBg(item.rarity)} ${getRarityGlow(item.rarity)} ${
        selected ? 'ring-2 ring-accent-purple ring-offset-1 ring-offset-bg-primary' : ''
      }`}
      style={{ border: `1px solid ${item.color}30` }}
    >
      {/* Inner shine */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, transparent 60%)' }}
      />

      {selected && (
        <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-accent-purple rounded-full flex items-center justify-center z-10">
          <span className="text-[8px] text-white font-bold">✓</span>
        </div>
      )}

      <span className={`${s.emoji} relative z-10`}>{item.emoji}</span>

      <div className="text-center relative z-10 w-full px-1">
        <p className={`${s.name} font-semibold text-text-primary leading-tight line-clamp-2`}>
          {item.name}
        </p>
        <p className="text-[8px] text-text-muted mt-0.5">🪙 {item.gameValue.toLocaleString('ru-RU')}</p>
      </div>
    </motion.button>
  )
}

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
    sm: { container: 'w-20 h-24', emoji: 'text-3xl', name: 'text-[10px]' },
    md: { container: 'w-28 h-32', emoji: 'text-4xl', name: 'text-xs' },
    lg: { container: 'w-36 h-40', emoji: 'text-5xl', name: 'text-sm' },
  }
  const s = sizes[size]

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${s.container} rounded-xl flex flex-col items-center justify-center gap-2 p-2 cursor-pointer relative overflow-hidden ${getRarityBg(item.rarity)} ${getRarityGlow(item.rarity)} ${
        selected ? 'ring-2 ring-accent-purple' : ''
      }`}
    >
      {selected && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-accent-purple rounded-full flex items-center justify-center">
          <span className="text-[8px] text-white">✓</span>
        </div>
      )}
      <span className={s.emoji}>{item.emoji}</span>
      <div className="text-center">
        <p className={`${s.name} font-medium text-text-primary leading-tight line-clamp-2`}>{item.name}</p>
        <p className="text-[9px] text-text-muted mt-0.5">🪙 {item.gameValue}</p>
      </div>
    </motion.button>
  )
}

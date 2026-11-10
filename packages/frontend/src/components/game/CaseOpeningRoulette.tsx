import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { getRarityBg } from './RarityBadge'

interface DropItem {
  item: {
    id: number
    name: string
    emoji: string
    rarity: string
    color: string
    gameValue: number
  }
  chance: number
}

interface RouletteProps {
  drops: DropItem[]
  winnerItemId: number
  onComplete: () => void
}

function generateRouletteItems(drops: DropItem[], winnerItemId: number, count: number = 40) {
  const items: DropItem['item'][] = []

  for (let i = 0; i < count - 5; i++) {
    const rand = Math.random() * 100
    let cumulative = 0
    for (const drop of drops) {
      cumulative += drop.chance
      if (rand <= cumulative) {
        items.push(drop.item)
        break
      }
    }
    if (items.length <= i) items.push(drops[0].item)
  }

  const winner = drops.find(d => d.item.id === winnerItemId)!.item
  items.push(winner)

  for (let i = 0; i < 4; i++) {
    const rand = Math.random() * 100
    let cumulative = 0
    for (const drop of drops) {
      cumulative += drop.chance
      if (rand <= cumulative) { items.push(drop.item); break }
    }
    if (items.length <= count - 4 + i) items.push(drops[0].item)
  }

  return items
}

const ITEM_WIDTH = 100
const ITEM_GAP = 8
const ITEM_TOTAL = ITEM_WIDTH + ITEM_GAP
const VISIBLE_ITEMS = 5
const CENTER_OFFSET = Math.floor(VISIBLE_ITEMS / 2)

export function CaseOpeningRoulette({ drops, winnerItemId, onComplete }: RouletteProps) {
  const [items] = useState(() => generateRouletteItems(drops, winnerItemId, 45))
  const [translateX, setTranslateX] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)

  const winnerIndex = items.length - 5
  const targetX = -(winnerIndex * ITEM_TOTAL - CENTER_OFFSET * ITEM_TOTAL + (ITEM_TOTAL / 2))

  useEffect(() => {
    const timer = setTimeout(() => {
      setSpinning(true)
      setTranslateX(targetX)
      setTimeout(() => {
        setSpinning(false)
        onComplete()
      }, 3200)
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const containerWidth = VISIBLE_ITEMS * ITEM_TOTAL - ITEM_GAP

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative overflow-hidden rounded-2xl"
        style={{ width: containerWidth, height: 128 }}>
        {/* Gradient overlays */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

        {/* Center indicator */}
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[104px] border-2 border-accent-purple rounded-xl z-20 pointer-events-none"
          style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' }} />

        <div
          ref={stripRef}
          className="flex items-center gap-2 absolute left-0"
          style={{
            transform: `translateX(${translateX}px)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            paddingLeft: CENTER_OFFSET * ITEM_TOTAL,
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={`flex-shrink-0 rounded-xl flex flex-col items-center justify-center gap-1 ${getRarityBg(item.rarity)}`}
              style={{ width: ITEM_WIDTH, height: 112 }}
            >
              <span className="text-3xl">{item.emoji}</span>
              <p className="text-[9px] text-text-secondary text-center leading-tight px-1 line-clamp-2">{item.name}</p>
            </div>
          ))}
        </div>
      </div>

      {!spinning && translateX === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <motion.div
            className="w-3 h-3 bg-accent-purple rounded-full"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <span className="text-text-secondary text-sm">Выбираем приз...</span>
          <motion.div
            className="w-3 h-3 bg-accent-purple rounded-full"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
        </motion.div>
      )}
    </div>
  )
}

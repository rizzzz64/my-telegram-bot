import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { prisma } from './client.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const GIFT_META: Record<string, { emoji: string; color: string }> = {
  'Teddy Bear':      { emoji: '🧸', color: '#FF9EBB' },
  'Love Heart':      { emoji: '❤️',  color: '#EF4444' },
  'Gift Box':        { emoji: '🎁', color: '#8B5CF6' },
  'Gem':             { emoji: '💎', color: '#67E8F9' },
  'Red Rose':        { emoji: '🌹', color: '#EC4899' },
  'Rocket':          { emoji: '🚀', color: '#6366F1' },
  'Trophy':          { emoji: '🏆', color: '#F59E0B' },
  'Birthday Cake':   { emoji: '🎂', color: '#FB923C' },
  'Diamond Ring':    { emoji: '💍', color: '#E879F9' },
  'Kissed Frog':     { emoji: '🐸', color: '#22C55E' },
  'Precious Peach':  { emoji: '🍑', color: '#FB923C' },
  'Plush Pepe':      { emoji: '🐸', color: '#4ADE80' },
  'Bow Tie':         { emoji: '🎀', color: '#A78BFA' },
  'Top Hat':         { emoji: '🎩', color: '#6B7280' },
  "Durov's Cap":     { emoji: '🧢', color: '#2563EB' },
  "Durov's Glasses": { emoji: '👓', color: '#0EA5E9' },
  'Electric Skull':  { emoji: '💀', color: '#FACC15' },
  'Swiss Watch':     { emoji: '⌚', color: '#94A3B8' },
  'Heart Locket':    { emoji: '💝', color: '#EF4444' },
  'Gem Signet':      { emoji: '💍', color: '#67E8F9' },
  'Jelly Bunny':     { emoji: '🐰', color: '#F472B6' },
  'Joyful Bundle':   { emoji: '🎊', color: '#F59E0B' },
  'Lol Pop':         { emoji: '🍭', color: '#EC4899' },
  'Loot Bag':        { emoji: '💰', color: '#22C55E' },
  'Love Potion':     { emoji: '🧪', color: '#EF4444' },
  'Lucky Locket':    { emoji: '🍀', color: '#22C55E' },
  'Magic Potion':    { emoji: '🔮', color: '#A78BFA' },
  'Mini Oscar':      { emoji: '🏆', color: '#F59E0B' },
  'Nail Bracelet':   { emoji: '📿', color: '#94A3B8' },
  'Neko Helmet':     { emoji: '⛑️',  color: '#EC4899' },
  'Pool Float':      { emoji: '🏊', color: '#67E8F9' },
  'Resistance Dog':  { emoji: '🐕', color: '#78350F' },
  'Scared Cat':      { emoji: '🐱', color: '#6B7280' },
  'Skull Flower':    { emoji: '💐', color: '#EC4899' },
  'Snow Globe':      { emoji: '❄️',  color: '#BAE6FD' },
  'Stellar Rocket':  { emoji: '🚀', color: '#818CF8' },
  'Surge Board':     { emoji: '🏄', color: '#0EA5E9' },
  'Toy Bear':        { emoji: '🧸', color: '#FCA5A5' },
  'Trapped Heart':   { emoji: '💔', color: '#EF4444' },
  'Victory Medal':   { emoji: '🥇', color: '#F59E0B' },
  'Westside Sign':   { emoji: '🤟', color: '#6B7280' },
  'Algorithm Cup':   { emoji: '🏆', color: '#A78BFA' },
  'Astral Shard':    { emoji: '💠', color: '#67E8F9' },
  'Bunny Muffin':    { emoji: '🐰', color: '#F472B6' },
  'Clover Pin':      { emoji: '🍀', color: '#22C55E' },
  'Cookie Heart':    { emoji: '🍪', color: '#FB923C' },
  'Heroic Helmet':   { emoji: '⛑️',  color: '#EF4444' },
  'Ion Gem':         { emoji: '💎', color: '#0EA5E9' },
  'Jolly Chimp':     { emoji: '🐒', color: '#FB923C' },
  'Light Sword':     { emoji: '⚔️',  color: '#67E8F9' },
}

const CASE_META: Record<string, { emoji: string; color: string; category: string }> = {
  'plushie-pepe':   { emoji: '🐸', color: '#22C55E',  category: 'legendary' },
  'durov-street':   { emoji: '🎩', color: '#6366F1',  category: 'regular'   },
  'premium-crown':  { emoji: '👑', color: '#FBBF24',  category: 'premium'   },
  'diamond-vault':  { emoji: '💎', color: '#67E8F9',  category: 'premium'   },
  'scared-cat':     { emoji: '🐱', color: '#94A3B8',  category: 'regular'   },
  'stellar-rocket': { emoji: '🚀', color: '#818CF8',  category: 'daily'     },
  'neon-heart':     { emoji: '❤️',  color: '#EF4444',  category: 'regular'   },
  'mil-spec':       { emoji: '🎖️', color: '#78350F',  category: 'regular'   },
  'lucky-clover':   { emoji: '🍀', color: '#22C55E',  category: 'daily'     },
  'gift-box':       { emoji: '🎁', color: '#8B5CF6',  category: 'daily'     },
  'meme-party':     { emoji: '🎉', color: '#F59E0B',  category: 'regular'   },
  'nft-prism':      { emoji: '💠', color: '#A78BFA',  category: 'premium'   },
  'pepe-crystal':   { emoji: '🐸', color: '#34D399',  category: 'premium'   },
  'golden-premium': { emoji: '🌟', color: '#F59E0B',  category: 'legendary' },
  'aqua-shark':     { emoji: '🦈', color: '#0EA5E9',  category: 'daily'     },
  'bunny-nft':      { emoji: '🐰', color: '#F472B6',  category: 'daily'     },
  'space-doge':     { emoji: '🐕', color: '#6366F1',  category: 'daily'     },
  'legendary-duck': { emoji: '🦆', color: '#FACC15',  category: 'rare'      },
  'street-skull':   { emoji: '💀', color: '#6B7280',  category: 'regular'   },
  'love-frog':      { emoji: '🐸', color: '#EC4899',  category: 'premium'   },
  'ice-bear':       { emoji: '🐻', color: '#BAE6FD',  category: 'daily'     },
  'dark-reaper':    { emoji: '☠️',  color: '#374151',  category: 'regular'   },
  'royal-cat':      { emoji: '🐱', color: '#FBBF24',  category: 'regular'   },
  'mystery-chest':  { emoji: '🗝️',  color: '#DDD6FE',  category: 'legendary' },
}

function rarityFromFloor(floorTon?: number, kind?: string): string {
  if (!floorTon) return kind === 'collectible_gift' ? 'uncommon' : 'common'
  if (floorTon < 5)   return 'uncommon'
  if (floorTon < 15)  return 'rare'
  if (floorTon < 100) return 'epic'
  return 'legendary'
}

function gameValueFromFloor(floorTon?: number, kind?: string): number {
  if (!floorTon) return kind === 'collectible_gift' ? 150 : 50
  return Math.min(Math.round(floorTon * 110), 500000)
}

interface DropEntry {
  name: string
  kind: string
  chance_bp: number
  floor_ton_reference?: number
}

interface CaseEntry {
  id: string
  name: string
  proposed_price_stars: number
  drops: DropEntry[]
}

// In-process cache: name::kind → DB item id
const itemIdCache = new Map<string, number>()

async function findOrCreateItem(drop: DropEntry): Promise<number> {
  const key = `${drop.name}::${drop.kind}`
  if (itemIdCache.has(key)) return itemIdCache.get(key)!

  const existing = await prisma.item.findFirst({ where: { name: drop.name, giftKind: drop.kind } })
  if (existing) {
    itemIdCache.set(key, existing.id)
    return existing.id
  }

  const gm = GIFT_META[drop.name] ?? { emoji: '🎁', color: '#8B5CF6' }
  const rarity = rarityFromFloor(drop.floor_ton_reference, drop.kind)
  const gameValue = gameValueFromFloor(drop.floor_ton_reference, drop.kind)

  const created = await prisma.item.create({
    data: {
      name: drop.name,
      emoji: gm.emoji,
      color: gm.color,
      rarity,
      category: 'telegram_gift',
      gameValue,
      giftKind: drop.kind,
      description: drop.kind === 'collectible_gift'
        ? `Коллекционный подарок Telegram${drop.floor_ton_reference ? ` (~${drop.floor_ton_reference} TON)` : ''}`
        : 'Обычный подарок Telegram',
    },
  })
  itemIdCache.set(key, created.id)
  return created.id
}

export async function importCases(): Promise<void> {
  try {
    const raw = readFileSync(join(__dirname, 'cases-import.json'), 'utf-8')
    const data = JSON.parse(raw) as { cases: CaseEntry[] }

    let newCases = 0

    for (let i = 0; i < data.cases.length; i++) {
      const c = data.cases[i]
      const meta = CASE_META[c.id] ?? { emoji: '📦', color: '#8B5CF6', category: 'regular' }

      // Resolve all items first
      const dropItems: { itemId: number; chance: number }[] = []
      for (const drop of c.drops) {
        const itemId = await findOrCreateItem(drop)
        dropItems.push({ itemId, chance: drop.chance_bp })
      }

      const existing = await prisma.case.findUnique({ where: { slug: c.id } })
      if (existing) {
        // Update metadata + replace drops
        await prisma.case.update({
          where: { slug: c.id },
          data: {
            name: c.name,
            price: c.proposed_price_stars,
            imageEmoji: meta.emoji,
            color: meta.color,
            category: meta.category,
            currency: 'stars',
            sortOrder: 100 + i,
          },
        })
        await prisma.caseDrop.deleteMany({ where: { caseId: existing.id } })
        await prisma.caseDrop.createMany({ data: dropItems.map(d => ({ caseId: existing.id, ...d })) })
      } else {
        const created = await prisma.case.create({
          data: {
            slug: c.id,
            name: c.name,
            description: `Telegram Gifts — ${c.drops.length} possible prizes`,
            imageEmoji: meta.emoji,
            color: meta.color,
            category: meta.category,
            price: c.proposed_price_stars,
            currency: 'stars',
            isActive: true,
            isLimited: false,
            sortOrder: 100 + i,
          },
        })
        await prisma.caseDrop.createMany({ data: dropItems.map(d => ({ caseId: created.id, ...d })) })
        newCases++
      }
    }

    console.log(`📦 importCases: done. New cases added: ${newCases}`)
  } catch (err) {
    console.error('⚠️  importCases failed (non-fatal):', err)
  }
}

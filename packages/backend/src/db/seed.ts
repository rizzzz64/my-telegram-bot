import { PrismaClient } from '@prisma/client'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

const items = [
  { name: 'Розовый Мишка', emoji: '🐻', rarity: 'common', category: 'plush', gameValue: 50, color: '#FF9EBB' },
  { name: 'Синяя Звезда', emoji: '⭐', rarity: 'common', category: 'star', gameValue: 75, color: '#60A5FA' },
  { name: 'Зелёный Листик', emoji: '🍀', rarity: 'common', category: 'nature', gameValue: 60, color: '#34D399' },
  { name: 'Оранжевый Огонёк', emoji: '🔥', rarity: 'uncommon', category: 'fire', gameValue: 150, color: '#FB923C' },
  { name: 'Фиолетовый Кристалл', emoji: '💎', rarity: 'uncommon', category: 'crystal', gameValue: 200, color: '#A78BFA' },
  { name: 'Золотая Корона', emoji: '👑', rarity: 'rare', category: 'royal', gameValue: 500, color: '#FBBF24' },
  { name: 'Радужный Единорог', emoji: '🦄', rarity: 'rare', category: 'magic', gameValue: 750, color: '#F472B6' },
  { name: 'Серебряный Щит', emoji: '🛡️', rarity: 'uncommon', category: 'armor', gameValue: 300, color: '#94A3B8' },
  { name: 'Алмазный Меч', emoji: '⚔️', rarity: 'epic', category: 'weapon', gameValue: 1500, color: '#67E8F9' },
  { name: 'Огненный Дракон', emoji: '🐉', rarity: 'epic', category: 'dragon', gameValue: 2000, color: '#EF4444' },
  { name: 'Лунный Камень', emoji: '🌙', rarity: 'rare', category: 'moon', gameValue: 800, color: '#C4B5FD' },
  { name: 'Солнечный Цветок', emoji: '🌻', rarity: 'common', category: 'flower', gameValue: 80, color: '#FDE68A' },
  { name: 'Морская Раковина', emoji: '🐚', rarity: 'uncommon', category: 'sea', gameValue: 180, color: '#67E8F9' },
  { name: 'Ледяная Снежинка', emoji: '❄️', rarity: 'rare', category: 'ice', gameValue: 600, color: '#BAE6FD' },
  { name: 'Волшебная Палочка', emoji: '🪄', rarity: 'epic', category: 'magic', gameValue: 1800, color: '#DDD6FE' },
  { name: 'Золотой Трофей', emoji: '🏆', rarity: 'legendary', category: 'trophy', gameValue: 5000, color: '#F59E0B' },
  { name: 'Чёрная Роза', emoji: '🥀', rarity: 'rare', category: 'flower', gameValue: 700, color: '#6B7280' },
  { name: 'Радужный Шар', emoji: '🔮', rarity: 'epic', category: 'magic', gameValue: 1200, color: '#818CF8' },
  { name: 'Пушистый Котик', emoji: '🐱', rarity: 'common', category: 'animal', gameValue: 90, color: '#FCA5A5' },
  { name: 'Космический Корабль', emoji: '🚀', rarity: 'legendary', category: 'space', gameValue: 10000, color: '#6366F1' },
]

const cases = [
  {
    name: 'Стартовый Кейс',
    description: 'Бесплатный кейс для новичков! Содержит базовые предметы.',
    imageEmoji: '🎁',
    color: '#10B981',
    category: 'free',
    price: 0,
    currency: 'tickets',
    sortOrder: 1,
    items: [0, 1, 2, 11, 18],
    chances: [30, 25, 25, 15, 5],
  },
  {
    name: 'Обычный Кейс',
    description: 'Стандартный кейс с хорошими предметами.',
    imageEmoji: '📦',
    color: '#6366F1',
    category: 'regular',
    price: 100,
    currency: 'coins',
    sortOrder: 2,
    items: [0, 1, 2, 3, 4, 7, 11, 12, 18],
    chances: [20, 18, 17, 15, 12, 8, 5, 3, 2],
  },
  {
    name: 'Огненный Кейс',
    description: 'Горячие предметы внутри! Шанс на редкие награды.',
    imageEmoji: '🔥',
    color: '#EF4444',
    category: 'regular',
    price: 250,
    currency: 'coins',
    sortOrder: 3,
    items: [3, 4, 5, 6, 7, 9, 13, 16],
    chances: [30, 25, 15, 12, 8, 5, 3, 2],
  },
  {
    name: 'Магический Кейс',
    description: 'Волшебные предметы со сверхъестественной силой.',
    imageEmoji: '🪄',
    color: '#8B5CF6',
    category: 'rare',
    price: 500,
    currency: 'coins',
    sortOrder: 4,
    items: [6, 10, 14, 15, 17, 19],
    chances: [35, 25, 20, 10, 7, 3],
  },
  {
    name: 'Премиум Кейс',
    description: 'Лучшие предметы! Гарантирован редкий дроп.',
    imageEmoji: '💎',
    color: '#F59E0B',
    category: 'premium',
    price: 1000,
    currency: 'coins',
    sortOrder: 5,
    items: [5, 8, 9, 14, 15, 19],
    chances: [25, 25, 20, 15, 10, 5],
  },
  {
    name: 'Космический Кейс',
    description: 'Невероятно редкий кейс с легендарными предметами!',
    imageEmoji: '🚀',
    color: '#6366F1',
    category: 'legendary',
    price: 2500,
    currency: 'coins',
    sortOrder: 6,
    items: [8, 9, 14, 15, 19],
    chances: [30, 25, 25, 15, 5],
  },
  {
    name: 'Ежедневный Кейс',
    description: 'Открывай раз в день бесплатно!',
    imageEmoji: '📅',
    color: '#06B6D4',
    category: 'daily',
    price: 0,
    currency: 'coins',
    sortOrder: 0,
    items: [0, 1, 2, 3, 11, 12],
    chances: [30, 25, 20, 12, 8, 5],
  },
  {
    name: 'Реферальный Кейс',
    description: 'Награда за приглашение друзей!',
    imageEmoji: '👥',
    color: '#EC4899',
    category: 'referral',
    price: 1,
    currency: 'tickets',
    sortOrder: 7,
    items: [4, 5, 7, 10, 13],
    chances: [30, 25, 20, 15, 10],
  },
  {
    name: 'VIP Кейс',
    description: 'Эксклюзивный кейс для VIP игроков.',
    imageEmoji: '👑',
    color: '#FBBF24',
    category: 'vip',
    price: 5000,
    currency: 'coins',
    sortOrder: 8,
    items: [5, 8, 9, 14, 15, 16, 19],
    chances: [20, 20, 18, 15, 12, 10, 5],
  },
  {
    name: 'All-In Кейс',
    description: 'Ставь всё на одну карту! Высокий риск — высокая награда.',
    imageEmoji: '🎰',
    color: '#F97316',
    category: 'allin',
    price: 750,
    currency: 'coins',
    sortOrder: 9,
    items: [0, 9, 15, 19],
    chances: [70, 15, 10, 5],
  },
]

async function main() {
  console.log('🌱 Начинаю заполнение базы данных...')

  await prisma.$executeRaw`DELETE FROM craft_ingredient_uses`
  await prisma.$executeRaw`DELETE FROM crafts`
  await prisma.$executeRaw`DELETE FROM craft_ingredients`
  await prisma.$executeRaw`DELETE FROM craft_recipes`
  await prisma.$executeRaw`DELETE FROM upgrades`
  await prisma.$executeRaw`DELETE FROM case_openings`
  await prisma.$executeRaw`DELETE FROM contest_entries`
  await prisma.$executeRaw`DELETE FROM contests`
  await prisma.$executeRaw`DELETE FROM promo_code_usages`
  await prisma.$executeRaw`DELETE FROM promo_codes`
  await prisma.$executeRaw`DELETE FROM transactions`
  await prisma.$executeRaw`DELETE FROM user_items`
  await prisma.$executeRaw`DELETE FROM case_drops`
  await prisma.$executeRaw`DELETE FROM cases`
  await prisma.$executeRaw`DELETE FROM items`
  await prisma.$executeRaw`DELETE FROM users`

  console.log('📦 Создаю предметы...')
  const createdItems = []
  for (const item of items) {
    const created = await prisma.item.create({
      data: {
        name: item.name,
        emoji: item.emoji,
        rarity: item.rarity,
        category: item.category,
        gameValue: item.gameValue,
        color: item.color,
        isActive: true,
      }
    })
    createdItems.push(created)
  }
  console.log(`✅ Создано ${createdItems.length} предметов`)

  console.log('🎁 Создаю кейсы...')
  for (const caseData of cases) {
    const createdCase = await prisma.case.create({
      data: {
        name: caseData.name,
        description: caseData.description,
        imageEmoji: caseData.imageEmoji,
        color: caseData.color,
        category: caseData.category,
        price: caseData.price,
        currency: caseData.currency,
        isActive: true,
        sortOrder: caseData.sortOrder,
      }
    })

    for (let i = 0; i < caseData.items.length; i++) {
      const itemIndex = caseData.items[i]
      const chance = caseData.chances[i]
      await prisma.caseDrop.create({
        data: {
          caseId: createdCase.id,
          itemId: createdItems[itemIndex].id,
          chance,
        }
      })
    }
  }
  console.log(`✅ Создано ${cases.length} кейсов`)

  console.log('🧪 Создаю рецепты крафта...')
  const recipe1 = await prisma.craftRecipe.create({
    data: {
      name: 'Звёздный Кристалл',
      resultItemId: createdItems[4].id,
    }
  })
  await prisma.craftIngredient.createMany({
    data: [
      { recipeId: recipe1.id, itemId: createdItems[0].id, quantity: 2 },
      { recipeId: recipe1.id, itemId: createdItems[1].id, quantity: 1 },
    ]
  })

  const recipe2 = await prisma.craftRecipe.create({
    data: {
      name: 'Огненная Корона',
      resultItemId: createdItems[5].id,
    }
  })
  await prisma.craftIngredient.createMany({
    data: [
      { recipeId: recipe2.id, itemId: createdItems[3].id, quantity: 2 },
      { recipeId: recipe2.id, itemId: createdItems[7].id, quantity: 1 },
    ]
  })
  console.log('✅ Создано 2 рецепта крафта')

  console.log('🏆 Создаю конкурсы...')
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  await prisma.contest.createMany({
    data: [
      {
        name: 'Ежедневный Розыгрыш',
        description: 'Розыгрыш среди всех активных игроков! Призы каждый день.',
        prizeEmoji: '🎁',
        prizeCoins: 1000,
        maxEntries: 500,
        endsAt: tomorrow,
        isActive: true,
      },
      {
        name: 'Недельный Чемпионат',
        description: 'Большой недельный розыгрыш с крутыми призами!',
        prizeEmoji: '🏆',
        prizeCoins: 10000,
        maxEntries: 1000,
        endsAt: nextWeek,
        isActive: true,
      },
    ]
  })
  console.log('✅ Создано 2 конкурса')

  console.log('🎟️ Создаю промокоды...')
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  await prisma.promoCode.createMany({
    data: [
      {
        code: 'WELCOME500',
        rewardType: 'coins',
        rewardAmount: 500,
        maxUses: 1000,
        expiresAt: nextMonth,
        isActive: true,
      },
      {
        code: 'FREECASE',
        rewardType: 'tickets',
        rewardAmount: 3,
        maxUses: 500,
        expiresAt: nextMonth,
        isActive: true,
      },
      {
        code: 'GIFT2025',
        rewardType: 'coins',
        rewardAmount: 1000,
        maxUses: 100,
        expiresAt: nextMonth,
        isActive: true,
      },
    ]
  })
  console.log('✅ Создано 3 промокода: WELCOME500, FREECASE, GIFT2025')

  console.log('👤 Создаю демо-пользователя...')
  const demoUser = await prisma.user.create({
    data: {
      telegramId: 'demo_user',
      username: 'demo_player',
      firstName: 'Демо',
      lastName: 'Игрок',
      coins: 2500,
      tickets: 5,
      experience: 1200,
      level: 5,
      rank: 'silver',
      referralCode: 'DEMO' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      isAdmin: false,
    }
  })

  await prisma.userItem.createMany({
    data: [
      { userId: demoUser.id, itemId: createdItems[0].id, obtainedFrom: 'case_opening' },
      { userId: demoUser.id, itemId: createdItems[1].id, obtainedFrom: 'case_opening' },
      { userId: demoUser.id, itemId: createdItems[3].id, obtainedFrom: 'case_opening' },
      { userId: demoUser.id, itemId: createdItems[4].id, obtainedFrom: 'case_opening' },
      { userId: demoUser.id, itemId: createdItems[11].id, obtainedFrom: 'daily_bonus' },
    ]
  })

  console.log('👑 Создаю admin-пользователя...')
  await prisma.user.create({
    data: {
      telegramId: process.env.ADMIN_TELEGRAM_ID || '999999999',
      username: 'admin',
      firstName: 'Admin',
      coins: 99999,
      tickets: 999,
      experience: 50000,
      level: 100,
      rank: 'platinum',
      referralCode: 'ADMIN' + crypto.randomBytes(4).toString('hex').toUpperCase(),
      isAdmin: true,
    }
  })

  console.log('\n🎉 База данных успешно заполнена!')
  console.log('💡 Демо-промокоды: WELCOME500, FREECASE, GIFT2025')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

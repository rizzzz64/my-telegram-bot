import { FastifyInstance } from 'fastify'
import { prisma } from '../db/client.js'

export async function userRoutes(app: FastifyInstance) {
  app.get('/me', async (request, reply) => {
    const userId = request.userId!
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        coins: true,
        tickets: true,
        experience: true,
        level: true,
        rank: true,
        referralCode: true,
        isAdmin: true,
        dailyStreak: true,
        lastDailyBonus: true,
        createdAt: true,
        _count: {
          select: {
            inventory: { where: { status: 'active' } },
            referrals: true,
            caseOpenings: true,
          }
        }
      }
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return reply.send(user)
  })

  app.get('/daily-bonus', async (request, reply) => {
    const userId = request.userId!
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const now = new Date()
    const lastBonus = user.lastDailyBonus

    if (lastBonus) {
      const hoursSince = (now.getTime() - lastBonus.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 20) {
        const nextAvailable = new Date(lastBonus.getTime() + 20 * 60 * 60 * 1000)
        return reply.send({
          available: false,
          nextAvailableAt: nextAvailable.toISOString(),
          hoursLeft: Math.ceil(20 - hoursSince),
        })
      }
    }

    const isConsecutive = lastBonus &&
      (now.getTime() - lastBonus.getTime()) < 48 * 60 * 60 * 1000

    const newStreak = isConsecutive ? user.dailyStreak + 1 : 1
    const baseReward = 100
    const streakBonus = Math.min(newStreak * 25, 500)
    const totalReward = baseReward + streakBonus

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          coins: { increment: totalReward },
          lastDailyBonus: now,
          dailyStreak: newStreak,
        }
      }),
      prisma.transaction.create({
        data: {
          userId,
          type: 'daily_bonus',
          amount: totalReward,
          currency: 'coins',
          description: `Ежедневный бонус (серия: ${newStreak})`,
        }
      })
    ])

    return reply.send({
      available: true,
      claimed: true,
      coinsEarned: totalReward,
      streak: newStreak,
      streakBonus,
    })
  })

  app.get('/transactions', async (request, reply) => {
    const userId = request.userId!
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send(transactions)
  })

  app.get('/leaderboard', async (request, reply) => {
    const top = await prisma.user.findMany({
      orderBy: { experience: 'desc' },
      take: 50,
      select: {
        id: true,
        username: true,
        firstName: true,
        experience: true,
        level: true,
        rank: true,
        _count: { select: { caseOpenings: true } }
      }
    })
    return reply.send(top)
  })
}

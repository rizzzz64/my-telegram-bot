import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import { adminMiddleware } from '../middleware/auth.js'

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', adminMiddleware)

  app.get('/stats', async (request, reply) => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const [totalUsers, openingCount, totalCoins, newUsersToday] = await Promise.all([
      prisma.user.count(),
      prisma.caseOpening.count(),
      prisma.user.aggregate({ _sum: { coins: true } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
    ])
    return reply.send({
      stats: {
        totalUsers,
        totalOpenings: openingCount,
        totalCoinsInCirculation: totalCoins._sum.coins || 0,
        newUsersToday,
      }
    })
  })

  app.get('/users', async (request, reply) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, telegramId: true, username: true, firstName: true,
        coins: true, tickets: true, level: true,
        isBanned: true, isAdmin: true, createdAt: true,
      }
    })
    return reply.send({ users })
  })

  app.patch('/users/:id/ban', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { isBanned } = request.body as { isBanned: boolean }
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isBanned }
    })
    return reply.send({ success: true, isBanned: user.isBanned })
  })

  app.post('/users/:id/gift', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { coins = 0, tickets = 0 } = request.body as { coins?: number; tickets?: number }
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { coins: { increment: coins }, tickets: { increment: tickets } },
    })
    if (coins > 0) {
      await prisma.transaction.create({
        data: { userId: user.id, type: 'admin_gift', amount: coins, currency: 'coins', description: `Подарок от администратора` }
      })
    }
    return reply.send({ success: true, coins: user.coins })
  })

  app.get('/promo-codes', async (request, reply) => {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } }
    })
    return reply.send(promos)
  })

  const promoSchema = z.object({
    code: z.string().min(1).max(50).toUpperCase(),
    rewardType: z.enum(['coins', 'tickets']),
    rewardAmount: z.number().int().positive(),
    maxUses: z.number().int().positive().default(100),
    expiresAt: z.string().optional(),
  })

  app.post('/promo-codes', async (request, reply) => {
    const parsed = promoSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid input' })
    const { expiresAt, ...data } = parsed.data
    const promo = await prisma.promoCode.create({
      data: { ...data, expiresAt: expiresAt ? new Date(expiresAt) : undefined }
    })
    return reply.send(promo)
  })

  app.patch('/promo-codes/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string }
    const promo = await prisma.promoCode.findUnique({ where: { id: parseInt(id) } })
    if (!promo) return reply.status(404).send({ error: 'Not found' })
    const updated = await prisma.promoCode.update({
      where: { id: parseInt(id) },
      data: { isActive: !promo.isActive }
    })
    return reply.send(updated)
  })

  app.patch('/cases/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { isActive } = request.body as { isActive: boolean }
    const c = await prisma.case.update({ where: { id: parseInt(id) }, data: { isActive } })
    return reply.send({ success: true, isActive: c.isActive })
  })

  app.get('/contests', async (request, reply) => {
    const contests = await prisma.contest.findMany({
      include: { _count: { select: { entries: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return reply.send(contests)
  })
}

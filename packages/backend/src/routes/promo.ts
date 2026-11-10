import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client.js'

const activateSchema = z.object({ code: z.string().min(1).max(50).toUpperCase() })

export async function promoRoutes(app: FastifyInstance) {
  app.post('/activate', async (request, reply) => {
    const parsed = activateSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid promo code' })
    const { code } = parsed.data
    const userId = request.userId!

    try {
      const result = await prisma.$transaction(async (tx) => {
        const promo = await tx.promoCode.findUnique({ where: { code } })
        if (!promo || !promo.isActive) throw new Error('Промокод не найден или неактивен')

        const now = new Date()
        if (promo.expiresAt && promo.expiresAt < now) throw new Error('Промокод истёк')
        if (promo.usedCount >= promo.maxUses) throw new Error('Промокод исчерпан')

        const existing = await tx.promoCodeUsage.findUnique({
          where: { promoId_userId: { promoId: promo.id, userId } }
        })
        if (existing) throw new Error('Вы уже использовали этот промокод')

        await tx.promoCodeUsage.create({ data: { promoId: promo.id, userId } })
        await tx.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } }
        })

        if (promo.rewardType === 'coins') {
          await tx.user.update({
            where: { id: userId },
            data: { coins: { increment: promo.rewardAmount } }
          })
          await tx.transaction.create({
            data: {
              userId,
              type: 'promo_code',
              amount: promo.rewardAmount,
              currency: 'coins',
              description: `Промокод ${code}`,
            }
          })
        } else if (promo.rewardType === 'tickets') {
          await tx.user.update({
            where: { id: userId },
            data: { tickets: { increment: promo.rewardAmount } }
          })
          await tx.transaction.create({
            data: {
              userId,
              type: 'promo_code',
              amount: promo.rewardAmount,
              currency: 'tickets',
              description: `Промокод ${code}`,
            }
          })
        }

        const updatedUser = await tx.user.findUnique({ where: { id: userId } })
        return {
          rewardType: promo.rewardType,
          rewardAmount: promo.rewardAmount,
          newCoins: updatedUser!.coins,
          newTickets: updatedUser!.tickets,
        }
      })

      return reply.send({ success: true, ...result })
    } catch (err: any) {
      return reply.status(400).send({ error: err?.message || 'Failed to activate promo code' })
    }
  })
}

import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client.js'

const crashSchema = z.object({
  bet: z.number().int().positive(),
  won: z.boolean(),
  multiplier: z.number().positive().max(1000),
})

const mineStartSchema = z.object({
  bet: z.number().int().positive(),
})

const mineCollectSchema = z.object({
  earned: z.number().int().min(0),
})

export async function gameRoutes(app: FastifyInstance) {
  // Crash: deduct bet, credit winnings
  app.post('/crash', async (request, reply) => {
    const parsed = crashSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid input' })

    const { bet, won, multiplier } = parsed.data
    const userId = request.userId!

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } })
      if (!user) throw new Error('User not found')
      if (user.coins < bet) throw new Error('Not enough coins')

      const payout = won ? Math.round(bet * multiplier) : 0
      const delta = payout - bet // negative on loss, positive on win

      const updated = await tx.user.update({
        where: { id: userId },
        data: { coins: { increment: delta } },
      })

      await tx.transaction.create({
        data: {
          userId,
          type: 'crash_game',
          amount: delta,
          currency: 'coins',
          description: won ? `Краш x${multiplier} — выиграл ${payout} монет` : `Краш — потеря ${bet} монет`,
        },
      })

      return { coins: updated.coins, tickets: updated.tickets }
    })

    return reply.send(result)
  })

  // Mine: deduct bet on start
  app.post('/mine/start', async (request, reply) => {
    const parsed = mineStartSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid input' })

    const { bet } = parsed.data
    const userId = request.userId!

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } })
      if (!user) throw new Error('User not found')
      if (user.coins < bet) throw new Error('Not enough coins')

      const updated = await tx.user.update({
        where: { id: userId },
        data: { coins: { decrement: bet } },
      })

      await tx.transaction.create({
        data: {
          userId,
          type: 'mine_start',
          amount: -bet,
          currency: 'coins',
          description: `Майнинг — ставка ${bet} монет`,
        },
      })

      return { coins: updated.coins, tickets: updated.tickets }
    })

    return reply.send(result)
  })

  // Mine: credit earnings on collect
  app.post('/mine/collect', async (request, reply) => {
    const parsed = mineCollectSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid input' })

    const { earned } = parsed.data
    const userId = request.userId!

    if (earned === 0) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true, tickets: true } })
      return reply.send({ coins: user!.coins, tickets: user!.tickets })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: earned }, experience: { increment: Math.floor(earned / 10) } },
    })

    await prisma.transaction.create({
      data: {
        userId,
        type: 'mine_collect',
        amount: earned,
        currency: 'coins',
        description: `Майнинг — добыто ${earned} монет`,
      },
    })

    return reply.send({ coins: updated.coins, tickets: updated.tickets })
  })
}

import { FastifyInstance } from 'fastify'
import { prisma } from '../db/client.js'

export async function referralRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const userId = request.userId!
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true }
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const referrals = await prisma.user.findMany({
      where: { referredById: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        createdAt: true,
        _count: { select: { caseOpenings: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const botUsername = process.env.BOT_USERNAME || 'giftforge_bot'
    const referralLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`

    return reply.send({
      referralCode: user.referralCode,
      referralLink,
      referrals,
      totalReferrals: referrals.length,
    })
  })
}

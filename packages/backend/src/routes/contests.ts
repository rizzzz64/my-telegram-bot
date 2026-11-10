import { FastifyInstance } from 'fastify'
import { prisma } from '../db/client.js'

export async function contestRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const contests = await prisma.contest.findMany({
      where: { isActive: true },
      include: { _count: { select: { entries: true } } },
      orderBy: { endsAt: 'asc' }
    })
    return reply.send(contests)
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.userId!

    const contest = await prisma.contest.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: { select: { entries: true } },
        entries: {
          include: { user: { select: { id: true, username: true, firstName: true } } },
          orderBy: { createdAt: 'asc' },
          take: 10,
        }
      }
    })
    if (!contest) return reply.status(404).send({ error: 'Contest not found' })

    const myEntry = await prisma.contestEntry.findUnique({
      where: { contestId_userId: { contestId: parseInt(id), userId } }
    })

    return reply.send({ ...contest, isEntered: !!myEntry })
  })

  app.post('/:id/enter', async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.userId!
    const contestId = parseInt(id)

    const contest = await prisma.contest.findUnique({ where: { id: contestId } })
    if (!contest || !contest.isActive) return reply.status(404).send({ error: 'Contest not found' })

    const now = new Date()
    if (contest.endsAt < now) return reply.status(400).send({ error: 'Contest has ended' })

    const count = await prisma.contestEntry.count({ where: { contestId } })
    if (count >= contest.maxEntries) return reply.status(400).send({ error: 'Contest is full' })

    try {
      await prisma.contestEntry.create({ data: { contestId, userId } })
      return reply.send({ success: true, message: 'Successfully entered contest!' })
    } catch {
      return reply.status(409).send({ error: 'Already entered this contest' })
    }
  })
}

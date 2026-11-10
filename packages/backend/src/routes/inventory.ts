import { FastifyInstance } from 'fastify'
import { prisma } from '../db/client.js'

export async function inventoryRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const userId = request.userId!
    const items = await prisma.userItem.findMany({
      where: { userId, status: 'active' },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(items)
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.userId!
    const userItem = await prisma.userItem.findFirst({
      where: { id: parseInt(id), userId, status: 'active' },
      include: { item: true }
    })
    if (!userItem) return reply.status(404).send({ error: 'Item not found' })
    return reply.send(userItem)
  })
}

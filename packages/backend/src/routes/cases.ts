import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import { openCase } from '../services/caseService.js'

export async function caseRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const cases = await prisma.case.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        drops: {
          include: { item: true },
          orderBy: { chance: 'desc' },
        }
      }
    })
    return reply.send(cases)
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const caseData = await prisma.case.findUnique({
      where: { id: parseInt(id) },
      include: {
        drops: {
          include: { item: true },
          orderBy: { chance: 'desc' },
        }
      }
    })
    if (!caseData) return reply.status(404).send({ error: 'Case not found' })
    return reply.send(caseData)
  })

  app.post('/:id/open', async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.userId!
    const caseId = parseInt(id)

    if (isNaN(caseId)) return reply.status(400).send({ error: 'Invalid case ID' })

    try {
      const result = await openCase(userId, caseId)
      return reply.send(result)
    } catch (err: any) {
      const message = err?.message || 'Unknown error'
      if (message.includes('Not enough')) {
        return reply.status(402).send({ error: message })
      }
      return reply.status(400).send({ error: message })
    }
  })
}

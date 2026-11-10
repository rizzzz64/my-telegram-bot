import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import * as crypto from 'crypto'
import { prisma } from '../db/client.js'

const upgradeSchema = z.object({
  sourceItemId: z.number().int().positive(),
  targetItemId: z.number().int().positive(),
})

export async function upgradeRoutes(app: FastifyInstance) {
  app.get('/odds/:sourceItemId/:targetItemId', async (request, reply) => {
    const { sourceItemId, targetItemId } = request.params as { sourceItemId: string; targetItemId: string }
    const userId = request.userId!

    const sourceUserItem = await prisma.userItem.findFirst({
      where: { id: parseInt(sourceItemId), userId, status: 'active' },
      include: { item: true }
    })
    if (!sourceUserItem) return reply.status(404).send({ error: 'Source item not found' })

    const targetItem = await prisma.item.findUnique({ where: { id: parseInt(targetItemId) } })
    if (!targetItem) return reply.status(404).send({ error: 'Target item not found' })

    const ratio = targetItem.gameValue / sourceUserItem.item.gameValue
    let chance: number
    if (ratio <= 1) chance = 90
    else if (ratio <= 2) chance = 60
    else if (ratio <= 5) chance = 35
    else if (ratio <= 10) chance = 15
    else chance = 5

    return reply.send({ chance, ratio: ratio.toFixed(2) })
  })

  app.post('/', async (request, reply) => {
    const parsed = upgradeSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Invalid input' })
    const { sourceItemId, targetItemId } = parsed.data
    const userId = request.userId!

    try {
      const result = await prisma.$transaction(async (tx) => {
        const sourceUserItem = await tx.userItem.findFirst({
          where: { id: sourceItemId, userId, status: 'active' },
          include: { item: true }
        })
        if (!sourceUserItem) throw new Error('Source item not found')

        const targetItem = await tx.item.findUnique({ where: { id: targetItemId } })
        if (!targetItem) throw new Error('Target item not found')

        const ratio = targetItem.gameValue / sourceUserItem.item.gameValue
        let chance: number
        if (ratio <= 1) chance = 90
        else if (ratio <= 2) chance = 60
        else if (ratio <= 5) chance = 35
        else if (ratio <= 10) chance = 15
        else chance = 5

        const randomBytes = crypto.randomBytes(4)
        const roll = randomBytes.readUInt32BE(0) % 100
        const success = roll < chance

        await tx.userItem.update({ where: { id: sourceItemId }, data: { status: 'used_upgrade' } })

        let newUserItem = null
        if (success) {
          newUserItem = await tx.userItem.create({
            data: { userId, itemId: targetItemId, obtainedFrom: 'upgrade' }
          })
        }

        await tx.upgrade.create({
          data: { userId, sourceItemId, targetItemId, chance, success }
        })

        return { success, chance, roll, item: success ? targetItem : null, newUserItem }
      })

      return reply.send(result)
    } catch (err: any) {
      return reply.status(400).send({ error: err?.message || 'Upgrade failed' })
    }
  })
}

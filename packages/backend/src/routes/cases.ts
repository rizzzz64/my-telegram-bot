import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db/client.js'
import { openCase } from '../services/caseService.js'
import https from 'https'

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

  // Create Telegram Stars invoice for a case
  app.post('/:id/invoice', async (request, reply) => {
    const { id } = request.params as { id: string }
    const caseId = parseInt(id)
    if (isNaN(caseId)) return reply.status(400).send({ error: 'Invalid case ID' })

    const caseData = await prisma.case.findUnique({ where: { id: caseId } })
    if (!caseData || !caseData.isActive) return reply.status(404).send({ error: 'Case not found' })
    if (caseData.currency !== 'stars') return reply.status(400).send({ error: 'This case does not use Stars' })

    const botToken = process.env.BOT_TOKEN
    if (!botToken) return reply.status(500).send({ error: 'Bot not configured' })

    const user = await prisma.user.findUnique({ where: { id: request.userId! } })
    if (!user) return reply.status(404).send({ error: 'User not found' })

    const payload = JSON.stringify({ caseId, userId: user.id, telegramId: user.telegramId })

    // Telegram requires: title 1-32 chars, description 1-255, provider_token '' for Stars (XTR)
    const title = caseData.name.slice(0, 32)
    const body = JSON.stringify({
      title,
      description: `Открытие кейса "${title}" в GiftForge`.slice(0, 255),
      payload: Buffer.from(payload).toString('base64'),
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: title, amount: caseData.price }],
    })

    try {
      const invoiceUrl = await new Promise<string>((resolve, reject) => {
        const req = https.request({
          hostname: 'api.telegram.org',
          path: `/bot${botToken}/createInvoiceLink`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        }, res => {
          let data = ''
          res.on('data', chunk => { data += chunk })
          res.on('end', () => {
            try {
              const json = JSON.parse(data)
              if (json.ok) resolve(json.result)
              else reject(new Error(json.description || 'Telegram API error'))
            } catch (e) { reject(new Error('Invalid Telegram response: ' + data.slice(0, 200))) }
          })
        })
        req.on('error', reject)
        req.write(body)
        req.end()
      })

      return reply.send({ url: invoiceUrl })
    } catch (err: any) {
      app.log.error({ err: err?.message }, 'createInvoiceLink failed')
      return reply.status(400).send({ error: err?.message || 'Не удалось создать счёт на оплату' })
    }
  })

  // Open a stars case after successful payment (called by bot after successful_payment)
  app.post('/:id/open-stars', async (request, reply) => {
    const { id } = request.params as { id: string }
    const caseId = parseInt(id)
    if (isNaN(caseId)) return reply.status(400).send({ error: 'Invalid case ID' })

    // This endpoint is called internally by the bot — requires admin or internal secret
    const internalSecret = request.headers['x-internal-secret'] as string | undefined
    const expectedSecret = process.env.INTERNAL_SECRET || process.env.BOT_TOKEN?.slice(-16)
    if (internalSecret !== expectedSecret) {
      return reply.status(403).send({ error: 'Forbidden' })
    }

    const { userId } = request.body as { userId: number }
    if (!userId) return reply.status(400).send({ error: 'Missing userId' })

    // Temporarily bypass stars check for this call
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: { drops: { include: { item: true } } },
    })
    if (!caseData || !caseData.isActive) return reply.status(404).send({ error: 'Case not found' })

    try {
      // Record the opening without charge (payment already done via Stars)
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } })
        if (!user || user.isBanned) throw new Error('User not found or banned')
        if (!caseData.drops.length) throw new Error('Case has no items')

        const totalChance = caseData.drops.reduce((s, d) => s + d.chance, 0)
        const roll = Math.floor(Math.random() * totalChance)
        let acc = 0; let wonItemId = caseData.drops[0].itemId
        for (const drop of caseData.drops) { acc += drop.chance; if (roll < acc) { wonItemId = drop.itemId; break } }
        const wonItem = caseData.drops.find(d => d.itemId === wonItemId)!.item

        const userItem = await tx.userItem.create({ data: { userId, itemId: wonItemId, obtainedFrom: 'case_opening_stars' } })
        await tx.caseOpening.create({ data: { userId, caseId, itemId: wonItemId } })
        await tx.transaction.create({ data: { userId, type: 'case_open_stars', amount: -caseData.price, currency: 'stars', description: `Открытие "${caseData.name}" за звёзды` } })
        await tx.user.update({ where: { id: userId }, data: { experience: { increment: 20 } } })

        return { userItem, item: wonItem, drops: caseData.drops.map(d => ({ item: d.item, chance: d.chance })) }
      })
      return reply.send(result)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })
}

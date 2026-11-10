import { FastifyRequest, FastifyReply } from 'fastify'
import * as crypto from 'crypto'
import { prisma } from '../db/client.js'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    userId?: number
    telegramUser?: TelegramUser
    isAdmin?: boolean
  }
}

function validateTelegramInitData(initData: string, botToken: string): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    params.delete('hash')
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
    const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

    if (hash !== expectedHash) return null

    const authDate = parseInt(params.get('auth_date') || '0')
    const now = Math.floor(Date.now() / 1000)
    if (now - authDate > 86400) return null

    const userStr = params.get('user')
    if (!userStr) return null
    return JSON.parse(userStr) as TelegramUser
  } catch {
    return null
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const demoMode = process.env.DEMO_MODE === 'true'
  const nodeEnv = process.env.NODE_ENV

  const initData = request.headers['x-telegram-init-data'] as string | undefined

  if (demoMode && nodeEnv !== 'production') {
    // Demo mode: allow requests with demo user ID
    const demoUserId = request.headers['x-demo-user-id'] as string | undefined

    if (demoUserId === 'demo_user' || !demoUserId) {
      let user = await prisma.user.findUnique({ where: { telegramId: 'demo_user' } })
      if (!user) {
        const refCode = 'DEMO' + crypto.randomBytes(4).toString('hex').toUpperCase()
        user = await prisma.user.create({
          data: {
            telegramId: 'demo_user',
            username: 'demo_player',
            firstName: 'Демо',
            lastName: 'Игрок',
            coins: 2500,
            tickets: 5,
            experience: 1200,
            level: 5,
            rank: 'silver',
            referralCode: refCode,
          }
        })
      }
      request.userId = user.id
      request.isAdmin = user.isAdmin
      request.telegramUser = { id: 0, first_name: 'Демо', username: 'demo_player' }
      return
    }
  }

  if (!initData) {
    return reply.status(401).send({ error: 'Unauthorized: missing initData' })
  }

  const botToken = process.env.BOT_TOKEN || ''
  const telegramUser = validateTelegramInitData(initData, botToken)

  if (!telegramUser) {
    return reply.status(401).send({ error: 'Unauthorized: invalid initData' })
  }

  const telegramId = String(telegramUser.id)
  let user = await prisma.user.findUnique({ where: { telegramId } })

  if (!user) {
    const refCode = 'REF' + crypto.randomBytes(5).toString('hex').toUpperCase()
    user = await prisma.user.create({
      data: {
        telegramId,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        coins: 500,
        tickets: 3,
        referralCode: refCode,
        isAdmin: telegramId === process.env.ADMIN_TELEGRAM_ID,
      }
    })
  }

  if (user.isBanned) {
    return reply.status(403).send({ error: 'Forbidden: user is banned' })
  }

  request.userId = user.id
  request.isAdmin = user.isAdmin
  request.telegramUser = telegramUser
}

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  if (!request.isAdmin) {
    return reply.status(403).send({ error: 'Forbidden: admin access required' })
  }
}

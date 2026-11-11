import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { authMiddleware } from './middleware/auth.js'
import { userRoutes } from './routes/users.js'
import { caseRoutes } from './routes/cases.js'
import { inventoryRoutes } from './routes/inventory.js'
import { upgradeRoutes } from './routes/upgrades.js'
import { craftRoutes } from './routes/craft.js'
import { contestRoutes } from './routes/contests.js'
import { referralRoutes } from './routes/referrals.js'
import { promoRoutes } from './routes/promo.js'
import { adminRoutes } from './routes/admin.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'warn' : 'error',
  }
})

await app.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.APP_URL || '']
    : true,
  credentials: true,
})

await app.register(helmet, { contentSecurityPolicy: false })

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

app.addHook('preHandler', authMiddleware)

await app.register(userRoutes, { prefix: '/api/users' })
await app.register(caseRoutes, { prefix: '/api/cases' })
await app.register(inventoryRoutes, { prefix: '/api/inventory' })
await app.register(upgradeRoutes, { prefix: '/api/upgrades' })
await app.register(craftRoutes, { prefix: '/api/craft' })
await app.register(contestRoutes, { prefix: '/api/contests' })
await app.register(referralRoutes, { prefix: '/api/referrals' })
await app.register(promoRoutes, { prefix: '/api/promo' })
await app.register(adminRoutes, { prefix: '/api/admin' })

app.get('/health', async () => ({
  status: 'ok',
  demo: process.env.DEMO_MODE === 'true',
  timestamp: new Date().toISOString()
}))

const port = parseInt(process.env.PORT || process.env.API_PORT || '3001')
try {
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`\n🚀 GiftForge Backend запущен на http://localhost:${port}`)
  console.log(`📋 Режим: ${process.env.DEMO_MODE === 'true' ? 'DEMO' : 'PRODUCTION'}`)
  console.log(`💾 База данных: ${process.env.DATABASE_URL}`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

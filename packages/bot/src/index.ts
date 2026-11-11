import 'dotenv/config'
import { Bot, InlineKeyboard } from 'grammy'

const BOT_TOKEN = process.env.BOT_TOKEN || ''
const APP_URL = process.env.APP_URL || 'http://localhost:5173'
const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID || ''

if (!BOT_TOKEN || BOT_TOKEN === 'demo_token_not_real') {
  console.log('\n⚠️  BOT_TOKEN не настроен.')
  console.log('📖 Следуй инструкции в README_RU.md для получения токена.')
  console.log('🔧 Пока можешь открыть Mini App напрямую: ' + APP_URL)
  process.exit(0)
}

const bot = new Bot(BOT_TOKEN)

bot.command('start', async (ctx) => {
  const userId = ctx.from?.id
  const startParam = ctx.match

  if (startParam?.startsWith('ref_')) {
    const refCode = startParam.replace('ref_', '')
    try {
      await fetch(`${process.env.API_URL || 'http://localhost:3001'}/api/users/referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-demo-user-id': 'demo_user' },
        body: JSON.stringify({ referralCode: refCode, newUserId: userId }),
      })
    } catch {}
  }

  const keyboard = new InlineKeyboard()
    .webApp('🎁 Играть в GiftForge', APP_URL)
    .row()
    .text('👤 Мой профиль', 'profile')
    .text('❓ Помощь', 'help')

  await ctx.reply(
    `🎁 *Добро пожаловать в GiftForge!*\n\n` +
    `Привет, *${ctx.from?.first_name}*! 👋\n\n` +
    `🎮 GiftForge — это игра с виртуальными подарками!\n\n` +
    `✨ *Что можно делать:*\n` +
    `• 📦 Открывать кейсы с призами\n` +
    `• ⚡ Улучшать предметы (Апгрейд)\n` +
    `• 🏆 Участвовать в конкурсах\n` +
    `• 👥 Приглашать друзей\n` +
    `• 🎟️ Использовать промокоды\n\n` +
    `🚀 Нажми кнопку ниже и начни играть!`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard,
    }
  )
})

bot.command('help', async (ctx) => {
  await ctx.reply(
    `❓ *Помощь по GiftForge*\n\n` +
    `📋 *Команды:*\n` +
    `/start — Главное меню\n` +
    `/app — Открыть игру\n` +
    `/profile — Мой профиль\n` +
    `/help — Эта справка\n` +
    `/paysupport — Поддержка по платежам\n\n` +
    `🎮 *Как играть:*\n` +
    `1. Нажми «🎁 Играть» для открытия игры\n` +
    `2. Открывай кейсы за монеты или билеты\n` +
    `3. Собирай коллекцию предметов\n` +
    `4. Улучшай предметы через Апгрейд\n` +
    `5. Участвуй в бесплатных розыгрышах\n\n` +
    `💬 По всем вопросам пиши в чат поддержки.`,
    { parse_mode: 'Markdown' }
  )
})

bot.command('app', async (ctx) => {
  const keyboard = new InlineKeyboard().webApp('🎁 Открыть GiftForge', APP_URL)
  await ctx.reply('🎮 Открой игру:', { reply_markup: keyboard })
})

bot.command('profile', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .webApp('👤 Перейти в профиль', `${APP_URL}#profile`)
  await ctx.reply(
    `👤 *Твой профиль*\n\nId: \`${ctx.from?.id}\`\nИмя: ${ctx.from?.first_name}`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  )
})

bot.command('paysupport', async (ctx) => {
  await ctx.reply(
    `💳 *Поддержка по платежам*\n\n` +
    `ℹ️ GiftForge использует только виртуальные монеты и билеты.\n` +
    `Реальные платежи в игре не предусмотрены.\n\n` +
    `Если у вас возникли вопросы, напишите в поддержку.`,
    { parse_mode: 'Markdown' }
  )
})

bot.on('callback_query:data', async (ctx) => {
  if (ctx.callbackQuery.data === 'help') {
    await ctx.answerCallbackQuery()
    const keyboard = new InlineKeyboard().webApp('🎁 Открыть GiftForge', APP_URL)
    await ctx.reply('❓ Используй /help для справки или открой игру:', { reply_markup: keyboard })
  } else if (ctx.callbackQuery.data === 'profile') {
    await ctx.answerCallbackQuery()
    const keyboard = new InlineKeyboard().webApp('👤 Мой профиль', `${APP_URL}#profile`)
    await ctx.reply('👤 Перейди в игру для просмотра профиля:', { reply_markup: keyboard })
  }
})

// Telegram Stars payment handlers
bot.on('pre_checkout_query', async (ctx) => {
  // Always approve the payment
  await ctx.answerPreCheckoutQuery(true)
})

bot.on('message:successful_payment', async (ctx) => {
  const payment = ctx.message.successful_payment
  if (!payment) return

  try {
    const payloadStr = Buffer.from(payment.invoice_payload, 'base64').toString('utf-8')
    const payload = JSON.parse(payloadStr) as { caseId: number; userId: number; telegramId: string }

    const API_URL = process.env.API_URL || 'http://localhost:3001'
    const internalSecret = (process.env.INTERNAL_SECRET || process.env.BOT_TOKEN?.slice(-16)) ?? ''

    const res = await fetch(`${API_URL}/api/cases/${payload.caseId}/open-stars`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify({ userId: payload.userId }),
    })

    if (res.ok) {
      const data = await res.json() as { item?: { name: string; emoji: string } }
      const item = data.item
      await ctx.reply(
        `🎉 *Платёж получен!*\n\n` +
        `Ты потратил *${payment.total_amount} ⭐* на открытие кейса.\n\n` +
        (item ? `🎁 Выпало: *${item.emoji} ${item.name}*\n\n` : '') +
        `Открой приложение, чтобы увидеть свой предмет!`,
        {
          parse_mode: 'Markdown',
          reply_markup: new InlineKeyboard().webApp('🎁 Открыть GiftForge', APP_URL),
        }
      )
    } else {
      await ctx.reply('⭐ Оплата получена! Открой приложение, чтобы забрать приз.', {
        reply_markup: new InlineKeyboard().webApp('🎁 Открыть GiftForge', APP_URL),
      })
    }
  } catch (err) {
    console.error('Stars payment processing error:', err)
    await ctx.reply('⭐ Оплата получена! Открой приложение, чтобы забрать приз.', {
      reply_markup: new InlineKeyboard().webApp('🎁 Открыть GiftForge', APP_URL),
    })
  }
})

bot.catch((err) => {
  const e = err.error as any
  // 409 Conflict = another instance running; exit so Render can retry cleanly
  if (e?.error_code === 409) {
    console.warn('⚠️  Bot 409 Conflict — another instance running. Waiting 15s then exiting...')
    setTimeout(() => process.exit(0), 15000)
    return
  }
  console.error('Bot error:', err)
})

console.log('\n🤖 GiftForge Bot запускается...')
bot.start({
  onStart: (info) => {
    console.log(`✅ Бот @${info.username} запущен!`)
    console.log(`🎮 Mini App: ${APP_URL}`)
  }
})

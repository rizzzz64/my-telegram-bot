import asyncio
import logging
from aiogram import Bot, Dispatcher, F, types
from aiogram.filters import Command
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

# 🔑 Твой токен от BotFather:
BOT_TOKEN = "8872674550:AAF2m2uYYH6QcUZDDAGorPt0Mz7TO3zAzdI"

# 🌐 Твоя готовая ссылка с Vercel:
WEBAPP_URL = "https://tg-bot-developer-portfolio.vercel.app" 

# 💬 Твой юзернейм в ТГ (без @):
YOUR_TELEGRAM_USERNAME = "Kirdigo" # <-- Впиши сюда свой юзернейм в ТГ!

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# 🔘 Главная клавиатура
def get_main_keyboard():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="🚀 Открыть WebApp Портфолио", 
                web_app=WebAppInfo(url=WEBAPP_URL)
            )
        ],
        [
            InlineKeyboardButton(
                text="💬 Написать мне в ЛС", 
                url=f"https://t.me/{YOUR_TELEGRAM_USERNAME}"
            )
        ]
    ])
    return keyboard

# 🚀 Старт бота
@dp.message(Command("start"))
async def start_cmd(message: types.Message):
    text = (
        f"👋 **Салют, {message.from_user.first_name}!**\n\n"
        "🔥 Нажми на кнопку ниже, чтобы открыть моё **Интерактивное WebApp Портфолио**!\n\n"
        "Там ты можешь посчитать цену разработки, посмотреть стек технологий и протестировать демо-магазин! 🤖⚡"
    )
    await message.answer(text, parse_mode="Markdown", reply_markup=get_main_keyboard())

async def main():
    logging.basicConfig(level=logging.INFO)
    print("🚀 Бот @k1rd1g0_bot успешно запущен и готов к работе!")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
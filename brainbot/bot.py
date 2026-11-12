import asyncio
import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://example.com")

if not BOT_TOKEN:
    raise SystemExit("BOT_TOKEN не задан. Положи токен в .env")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()


@dp.message(CommandStart())
async def start(msg: types.Message):
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🎮 Открыть Brain Battle", web_app=WebAppInfo(url=WEBAPP_URL))],
        [InlineKeyboardButton(text="💬 Поддержка", url="https://t.me/")],
    ])
    await msg.answer(
        f"👋 Привет, {msg.from_user.first_name}!\n\n"
        "Добро пожаловать в <b>Brain Battle</b> — открывай кейсы, "
        "получай брейнротов и обменивай их на призы!\n\n"
        "Жми на кнопку ниже 👇",
        parse_mode="HTML",
        reply_markup=kb,
    )


async def main():
    print(f"Бот запущен. WebApp URL: {WEBAPP_URL}")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())

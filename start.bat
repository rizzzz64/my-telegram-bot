@echo off
chcp 65001 >nul
title GiftForge — Запуск
color 0A

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║        🎁 GiftForge — Запуск          ║
echo  ╚═══════════════════════════════════════╝
echo.

:: Проверка, что setup.bat был запущен
if not exist "node_modules" (
    echo  ❌ Зависимости не установлены!
    echo  Сначала запусти setup.bat
    pause
    exit /b 1
)

if not exist "packages\backend\prisma\dev.db" (
    echo  ❌ База данных не найдена!
    echo  Сначала запусти setup.bat
    pause
    exit /b 1
)

echo  Запускаю Backend (порт 3001) и Frontend (порт 5173)...
echo  Подожди 10-15 секунд...
echo.

:: Запуск в отдельных окнах
start "GiftForge Backend" cmd /k "cd /d %~dp0packages\backend && npx tsx src/index.ts && pause"
timeout /t 3 /nobreak >nul
start "GiftForge Frontend" cmd /k "cd /d %~dp0packages\frontend && npx vite && pause"
timeout /t 5 /nobreak >nul

echo  ╔═══════════════════════════════════════════════╗
echo  ║                                               ║
echo  ║   🌐 Открой в браузере:                       ║
echo  ║   http://localhost:5173                       ║
echo  ║                                               ║
echo  ║   📡 API сервер:                              ║
echo  ║   http://localhost:3001/health                ║
echo  ║                                               ║
echo  ║   Нажми Ctrl+C для остановки                  ║
echo  ║                                               ║
echo  ╚═══════════════════════════════════════════════╝
echo.
echo  Демо-промокоды: WELCOME500 / FREECASE / GIFT2025
echo.

:: Открыть браузер автоматически
timeout /t 8 /nobreak >nul
start "" "http://localhost:5173"

echo  Браузер открыт! Если не открылся — перейди вручную.
echo.
pause

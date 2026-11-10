@echo off
chcp 65001 >nul
title GiftForge — Первичная настройка
color 0B

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║        🎁 GiftForge — Настройка       ║
echo  ╚═══════════════════════════════════════╝
echo.

:: ─── Проверка Node.js ───────────────────────────────────────────────────────
echo [1/6] Проверяю наличие Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ❌ Node.js не найден!
    echo.
    echo  Установи Node.js:
    echo  1. Открой браузер и перейди на: https://nodejs.org
    echo  2. Нажми кнопку «LTS» (рекомендуемая версия)
    echo  3. Скачай установщик для Windows
    echo  4. Запусти его и нажимай «Next» до конца
    echo  5. ПЕРЕЗАПУСТИ это окно командной строки
    echo  6. Снова запусти setup.bat
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  ✅ Node.js %NODE_VER% найден

:: ─── Проверка npm ───────────────────────────────────────────────────────────
echo [2/6] Проверяю npm...
for /f "tokens=*" %%i in ('npm --version') do set NPM_VER=%%i
echo  ✅ npm %NPM_VER% найден

:: ─── Создание .env ──────────────────────────────────────────────────────────
echo [3/6] Создаю файл конфигурации...
if not exist ".env" (
    copy ".env.example" ".env" >nul
    echo  ✅ Файл .env создан из примера
    echo.
    echo  ⚠️  Пока настроен DEMO_MODE=true
    echo  После получения BOT_TOKEN открой .env и замени demo_token_not_real
) else (
    echo  ✅ Файл .env уже существует
)

:: ─── Установка зависимостей ─────────────────────────────────────────────────
echo [4/6] Устанавливаю зависимости (это может занять 1-3 минуты)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Ошибка установки зависимостей!
    echo  Попробуй: npm cache clean --force
    pause
    exit /b 1
)
echo  ✅ Зависимости установлены

:: ─── Генерация Prisma Client ────────────────────────────────────────────────
echo [5/6] Настраиваю базу данных...
cd packages\backend
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Ошибка генерации Prisma!
    cd ..\..
    pause
    exit /b 1
)
call npx prisma db push --force-reset
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Ошибка создания таблиц!
    cd ..\..
    pause
    exit /b 1
)
cd ..\..
echo  ✅ База данных создана

:: ─── Заполнение демо-данными ────────────────────────────────────────────────
echo [6/6] Добавляю демонстрационные данные...
cd packages\backend
call npx tsx src/db/seed.ts
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  Предупреждение при заполнении данных (можно продолжить)
)
cd ..\..

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║      ✅ Настройка завершена!          ║
echo  ╚═══════════════════════════════════════╝
echo.
echo  Следующий шаг: запусти start.bat
echo  После запуска открой: http://localhost:5173
echo.
echo  Демо-промокоды для тестирования:
echo   • WELCOME500  — 500 монет
echo   • FREECASE    — 3 билета
echo   • GIFT2025    — 1000 монет
echo.
pause

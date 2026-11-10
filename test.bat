@echo off
chcp 65001 >nul
title GiftForge — Тесты
color 0E

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║        🧪 GiftForge — Тесты           ║
echo  ╚═══════════════════════════════════════╝
echo.

echo [1/3] Проверяю TypeScript в backend...
cd packages\backend
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Ошибки TypeScript в backend!
) else (
    echo  ✅ Backend TypeScript OK
)
cd ..\..

echo [2/3] Проверяю TypeScript в frontend...
cd packages\frontend
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Ошибки TypeScript в frontend!
) else (
    echo  ✅ Frontend TypeScript OK
)
cd ..\..

echo [3/3] Запускаю unit-тесты backend...
cd packages\backend
call npx vitest run 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  Тесты не найдены или есть ошибки
) else (
    echo  ✅ Тесты пройдены
)
cd ..\..

echo.
echo  Тестирование завершено!
pause

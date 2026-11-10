@echo off
chcp 65001 >nul
title GiftForge — Сборка
color 0D

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║        📦 GiftForge — Сборка          ║
echo  ╚═══════════════════════════════════════╝
echo.

echo [1/2] Собираю Backend...
cd packages\backend
call npx tsc
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Ошибка сборки Backend!
    cd ..\..
    pause
    exit /b 1
)
echo  ✅ Backend собран в packages/backend/dist/
cd ..\..

echo [2/2] Собираю Frontend...
cd packages\frontend
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Ошибка сборки Frontend!
    cd ..\..
    pause
    exit /b 1
)
echo  ✅ Frontend собран в packages/frontend/dist/
cd ..\..

echo.
echo  ✅ Сборка завершена успешно!
echo  Файлы готовы к деплою на сервер.
pause

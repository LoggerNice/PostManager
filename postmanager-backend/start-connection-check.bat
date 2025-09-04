@echo off
echo ========================================
echo PostManager - Задача "Проверка связи"
echo ========================================
echo.

echo Сборка проекта...
call npm run build

if %errorlevel% neq 0 (
    echo Ошибка при сборке проекта!
    pause
    exit /b 1
)

echo.
echo Выберите режим запуска:
echo 1. Создать задачу один раз (тестирование)
echo 2. Запустить cron задачу (каждый день в 23:53)
echo.
set /p choice="Введите номер (1 или 2): "

if "%choice%"=="1" (
    echo.
    echo Запуск однократного создания задачи...
    call npm run connection-check:once
) else if "%choice%"=="2" (
    echo.
    echo Запуск cron задачи...
    echo Задачи будут создаваться каждый день в 23:53
    echo Для остановки нажмите Ctrl+C
    echo.
    call npm run connection-check:cron
) else (
    echo Неверный выбор!
    pause
    exit /b 1
)

echo.
echo Завершено.
pause

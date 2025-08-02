# PostManager - Система управления задачами с WebSocket

Система управления задачами с real-time обновлениями через WebSocket + Socket.IO.

## Особенности

- ✅ Real-time обновления задач через WebSocket
- ✅ Drag & Drop для перемещения задач
- ✅ Система уведомлений
- ✅ Автоматическая сортировка по приоритету
- ✅ Индикатор состояния подключения
- ✅ Fallback на polling при отсутствии WebSocket

## Установка и запуск

### Предварительные требования
1. Node.js (версия 16 или выше)
2. PostgreSQL
3. Git

### Быстрый старт
1. Склонировать проект: `git clone <repository-url>`
2. Установить PostgreSQL и создать базу данных
3. Запустить все сервисы: `start-all.cmd` (Windows) или следовать инструкциям ниже

### Ручная установка

#### Backend
```bash
cd postmanager-backend
npm install
npx prisma migrate dev --name init
npm run dev
```

#### Frontend
```bash
cd postmanager-frontend
npm install
npm run dev
```

### Доступ к приложению
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3045

## WebSocket система

Приложение использует WebSocket + Socket.IO для real-time обновлений:

- **Мгновенные обновления** задач при создании, изменении, удалении
- **Автоматическое переподключение** при потере связи
- **Система уведомлений** для участников проекта
- **Индикатор подключения** в интерфейсе

Подробнее см. [WEBSOCKET_SYSTEM.md](WEBSOCKET_SYSTEM.md)

## Тестирование WebSocket

Для проверки работы WebSocket системы:
1. Откройте проект в нескольких вкладках браузера
2. Создайте, обновите или удалите задачу в одной вкладке
3. Наблюдайте мгновенные обновления в других вкладках
4. Проверьте появление уведомлений в правом нижнем углу

## Структура проекта

```
├── postmanager-backend/     # Node.js + Express + Socket.IO
├── postmanager-frontend/    # Next.js + React + Socket.IO Client
├── WEBSOCKET_SYSTEM.md      # Документация WebSocket системы
└── start-all.cmd           # Скрипт запуска всех сервисов
```

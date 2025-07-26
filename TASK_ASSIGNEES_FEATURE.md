# Функциональность управления исполнителями задач

## Обзор

Добавлена возможность назначения множественных исполнителей к задачам. Теперь каждая задача может иметь несколько исполнителей одновременно.

## Изменения в базе данных

### Новая таблица TaskAssignee
```sql
CREATE TABLE "TaskAssignee" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);
```

### Обновленная схема Prisma
- Добавлена модель `TaskAssignee` для связи многие-ко-многим
- Обновлена модель `Task` с полем `assignees`
- Обновлена модель `User` с полем `assignedTasks`

## API Эндпоинты

### Получение исполнителей задачи
```
GET /tasks/:taskId/assignees
```
Возвращает список всех исполнителей задачи.

### Добавление исполнителей
```
POST /tasks/:taskId/assignees
Body: { "userIds": [1, 2, 3] }
```
Добавляет новых исполнителей к задаче.

### Обновление исполнителей (замена всех)
```
PUT /tasks/:taskId/assignees
Body: { "userIds": [1, 2, 3] }
```
Заменяет всех текущих исполнителей новыми.

### Удаление исполнителей
```
DELETE /tasks/:taskId/assignees
Body: { "userIds": [1, 2, 3] }
```
Удаляет указанных исполнителей из задачи.

## Фронтенд компоненты

### AssigneesModal
Новый компонент для управления исполнителями задачи:
- Мультиселект для выбора пользователей
- Отображение текущих исполнителей
- Возможность добавления/удаления исполнителей

### Обновленный TaskCard
- Отображение исполнителей в виде тегов
- Кнопка для открытия модала управления исполнителями
- Показ количества исполнителей

## Типы данных

### TaskAssignee
```typescript
interface TaskAssignee {
    id: number;
    taskId: number;
    userId: number;
    assignedAt: Date;
    user: IUser;
}
```

### Обновленный Task
```typescript
interface Task {
    // ... существующие поля
    assignees?: TaskAssignee[]; // Множественные исполнители
}
```

## Использование

### В компонентах React
```typescript
import { useGetTaskAssigneesQuery, useAddTaskAssigneesMutation } from '@/store/api/task.api';

// Получение исполнителей
const { data: assignees } = useGetTaskAssigneesQuery(taskId);

// Добавление исполнителей
const [addAssignees] = useAddTaskAssigneesMutation();
await addAssignees({ taskId, userIds: [1, 2, 3] });
```

### Открытие модала управления исполнителями
```typescript
<AssigneesModal
    visible={showAssigneesModal}
    onClose={() => setShowAssigneesModal(false)}
    taskId={task.id}
/>
```

## Особенности реализации

1. **Обратная совместимость**: Сохранено поле `assignee` для совместимости с существующим кодом
2. **Валидация**: Проверка существования пользователей перед назначением
3. **Дубликаты**: Автоматическое пропускание дубликатов при добавлении
4. **UI/UX**: Интуитивный интерфейс с мультиселектом и тегами
5. **Производительность**: Оптимизированные запросы с включением связанных данных

## Миграция

Для применения изменений выполните:
```bash
cd postmanager-backend
npx prisma migrate dev --name add_task_assignees
```

## Тестирование

1. Создайте задачу
2. Откройте модал управления исполнителями
3. Выберите нескольких пользователей
4. Сохраните изменения
5. Проверьте отображение исполнителей в карточке задачи 
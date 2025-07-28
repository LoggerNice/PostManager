import { Task, TaskPriority } from '@/types/task.types';

/**
 * Функция для сортировки задач по приоритету
 * HIGH -> MEDIUM -> LOW -> order -> createdAt
 */
export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    // Сначала сортируем по приоритету (HIGH -> MEDIUM -> LOW)
    const priorityOrder = { 
      'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 
      'Высокий': 3, 'Средний': 2, 'Низкий': 1 
    };
    const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
    const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
    
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // По убыванию (HIGH первым)
    }
    
    // Если приоритеты одинаковые, сортируем по полю order
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB;
  });
};

/**
 * Функция для группировки и сортировки задач по статусам
 */
export const groupAndSortTasks = (tasks: Task[]) => {
  const grouped: Record<string, Task[]> = {
    IN_PROGRESS: [],
    PROBLEM: [],
    COMPLETED: []
  };

  tasks.forEach((task) => {
    const status = task.status as keyof typeof grouped;
    if (status in grouped) {
      grouped[status].push(task);
    }
  });

  // Сортируем задачи в каждой группе по приоритету
  Object.keys(grouped).forEach(status => {
    grouped[status as keyof typeof grouped] = sortTasksByPriority(grouped[status as keyof typeof grouped]);
  });

  return grouped;
}; 
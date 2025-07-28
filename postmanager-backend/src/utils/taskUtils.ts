import { Prisma } from '@prisma/client';

/**
 * Стандартная сортировка задач по приоритету
 * HIGH -> MEDIUM -> LOW -> order -> createdAt
 */
export const getTaskOrderBy = (): Prisma.TaskOrderByWithRelationInput[] => [
    {
        priority: 'desc' // HIGH -> MEDIUM -> LOW
    },
    {
        order: 'asc' // Вторичная сортировка по порядку
    },
    {
        createdAt: 'asc' // Третичная сортировка по дате создания
    }
];

/**
 * Получает задачи с сортировкой по приоритету
 */
export const getTasksWithPrioritySort = async (prisma: any, options: {
    where?: Prisma.TaskWhereInput;
    include?: Prisma.TaskInclude;
}) => {
    return await prisma.task.findMany({
        ...options,
        orderBy: getTaskOrderBy()
    });
}; 
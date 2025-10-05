import type { Request, Response } from 'express';
import type { TaskStatus, TaskPriority, TaskType } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { getTaskOrderBy } from '../utils/taskUtils.js';
import { getWebSocketServer } from '../websocketServer.js';

// Типы для WebSocket событий
type TaskEventType = 'task_created' | 'task_updated' | 'task_deleted';
type NotificationType = 'task_created' | 'task_updated' | 'task_deleted' | 'comment_added';

// Типы и интерфейсы
interface TaskInclude {
    assignees: {
        include: {
            user: {
                select: {
                    id: true;
                    name: true;
                    department: {
                        select: {
                            id: true;
                            name: true;
                        };
                    };
                };
            };
        };
    };
    creator: {
        select: {
            id: true;
            name: true;
            department: {
                select: {
                    id: true;
                    name: true;
                };
            };
        };
    };
    project: {
        select: {
            id: true;
            title: true;
            description: true;
        };
    };
}

interface CreateTaskData {
    title: string;
    description?: string;
    status: TaskStatus;
    priority?: TaskPriority;
    taskType?: TaskType;
    projectId: string;
    deadline?: string;
    order?: number;
    assigneeIds?: number[];
    creatorId?: number; // ID создателя задачи
}

interface UpdateTaskData {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    taskType?: TaskType;
    deadline?: string;
    order?: number;
    assigneeIds?: number[];
}

// Константы
const TASK_INCLUDE_CONFIG: TaskInclude = {
    assignees: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    department: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }
    },
    creator: {
        select: {
            id: true,
            name: true,
            department: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    },
    project: {
        select: {
            id: true,
            title: true,
            description: true
        }
    }
};

const STATUS_DISPLAY_TEXT: Record<TaskStatus, string> = {
    TODO: 'К выполнению',
    IN_PROGRESS: 'В работе',
    PROBLEM: 'Согласование',
    COMPLETED: 'Выполнено',
    CANCELLED: 'Отменено'
};

// Узкий select для списков задач (минимально необходимые поля для UI)
const TASK_LIST_SELECT = {
    id: true,
    title: true,
    description: true,
    priority: true,
    status: true,
    taskType: true,
    projectId: true,
    creatorId: true,
    createdAt: true,
    updatedAt: true,
    deadline: true,
    order: true,
    project: {
        select: {
            id: true,
            title: true
        }
    },
    creator: {
        select: {
            id: true,
            name: true,
            department: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    },
    assignees: {
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    department: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }
        }
    }
} as const;

// Утилиты валидации
const validateTaskId = (taskId: string): number => {
    const id = parseInt(taskId);
    if (isNaN(id)) {
        throw new Error('Неверный ID задачи');
    }
    return id;
};

const validateProjectId = (projectId: string): number => {
    const id = parseInt(projectId);
    if (isNaN(id) || !projectId) {
        throw new Error('ID проекта обязателен');
    }
    return id;
};

const validateUserIds = (userIds: any[]): number[] => {
    if (!Array.isArray(userIds)) {
        throw new Error('Список ID пользователей должен быть массивом');
    }
    return userIds.map(id => {
        const numId = parseInt(id.toString());
        if (isNaN(numId)) {
            throw new Error('Неверный ID пользователя');
        }
        return numId;
    });
};

// Утилиты для работы с порядком задач
const calculateTaskOrder = async (projectId: number, status: TaskStatus, order?: number): Promise<number> => {
    if (order === undefined || order === null) {
        const maxOrderTask = await prisma.task.findFirst({
            where: { projectId, status },
            orderBy: { order: 'desc' }
        });
        return (maxOrderTask?.order ?? -1) + 1;
    }
    return order;
};

const adjustTaskOrderOnCreate = async (projectId: number, status: TaskStatus, order: number): Promise<void> => {
    const existingTask = await prisma.task.findFirst({
        where: { projectId, status, order }
    });

    if (existingTask) {
        await prisma.task.updateMany({
            where: {
                projectId,
                status,
                order: { gte: order }
            },
            data: { order: { increment: 1 } }
        });
    }
};

const adjustTaskOrderOnDelete = async (projectId: number, status: TaskStatus, deletedOrder: number): Promise<void> => {
    await prisma.task.updateMany({
        where: {
            projectId,
            status,
            order: { gt: deletedOrder }
        },
        data: { order: { decrement: 1 } }
    });
};

const handleStatusChange = async (task: any, newStatus: TaskStatus): Promise<number> => {
    // Удаляем из старой колонки
    await prisma.task.updateMany({
        where: {
            projectId: task.projectId,
            status: task.status,
            order: { gt: task.order || 0 }
        },
        data: { order: { decrement: 1 } }
    });

    // Добавляем в новую колонку
    const maxOrderTask = await prisma.task.findFirst({
        where: { projectId: task.projectId, status: newStatus },
        orderBy: { order: 'desc' }
    });

    return (maxOrderTask?.order ?? -1) + 1;
};

const handleOrderChange = async (task: any, newOrder: number): Promise<void> => {
    const currentOrder = task.order || 0;

    if (newOrder > currentOrder) {
        // Перемещение вниз
        await prisma.task.updateMany({
            where: {
                projectId: task.projectId,
                status: task.status,
                order: { gt: currentOrder, lte: newOrder }
            },
            data: { order: { decrement: 1 } }
        });
    } else {
        // Перемещение вверх
        await prisma.task.updateMany({
            where: {
                projectId: task.projectId,
                status: task.status,
                order: { gte: newOrder, lt: currentOrder }
            },
            data: { order: { increment: 1 } }
        });
    }
};

// Утилиты для работы с исполнителями
const manageTaskAssignees = async (taskId: number, assigneeIds?: number[], creatorId?: number): Promise<void> => {
    if (!assigneeIds || !Array.isArray(assigneeIds)) return;

    await prisma.taskAssignee.deleteMany({ where: { taskId } });

    if (assigneeIds.length > 0) {
        // Создаем исполнителей включая создателя задачи, если он указан в списке
        await prisma.taskAssignee.createMany({
            data: assigneeIds.map(userId => ({ taskId, userId })),
            skipDuplicates: true
        });
    }
};

const getTaskWithAssignees = async (taskId: number) => {
    return prisma.task.findUnique({
        where: { id: taskId },
        include: TASK_INCLUDE_CONFIG
    });
};

// Утилиты для WebSocket уведомлений
const sendTaskWebSocketEvent = (eventType: TaskEventType, data: any, immediate: boolean = false): void => {
    const wsServer = getWebSocketServer();
    if (wsServer) {
        if (immediate) {
            wsServer.sendTaskEventToProjectImmediate(eventType, data);
        } else {
            wsServer.sendTaskEventToProject(eventType, data);
        }
    }
};

const sendTaskNotificationToProject = async (
    projectId: number,
    taskId: number,
    taskTitle: string,
    message: string,
    type: NotificationType = 'task_updated',
    excludeUserId?: number
): Promise<void> => {
    const wsServer = getWebSocketServer();
    if (!wsServer) return;

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true }
    });

    if (!project) return;

    const notification = {
        type,
        title: project.title || 'Неизвестный проект',
        message,
        taskId,
        projectId,
        timestamp: new Date().toISOString()
    };

    wsServer.sendNotificationToProject(projectId, notification, excludeUserId);
};

// Основные контроллеры
export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, status, priority, taskType, projectId, deadline, order, assigneeIds, creatorId }: CreateTaskData = req.body;

        const projectIdNum = validateProjectId(projectId);
        const taskOrder = await calculateTaskOrder(projectIdNum, status, order);

        await adjustTaskOrderOnCreate(projectIdNum, status, taskOrder);

        // Определяем создателя задачи
        let taskCreatorId: number;
        if (creatorId) {
            // Если передан ID создателя, проверяем его существование
            const creator = await prisma.user.findUnique({ where: { id: creatorId } });
            if (!creator) {
                res.status(400).json({ message: 'Пользователь-создатель не найден' });
                return;
            }
            taskCreatorId = creatorId;
        } else {
            // Если ID создателя не передан, используем ID текущего пользователя из сессии
            // В реальном приложении это должно приходить из middleware аутентификации
            if (!req.user?.id) {
                res.status(401).json({ message: 'Необходима аутентификация для создания задачи' });
                return;
            }
            taskCreatorId = req.user.id;
        }

        // Определяем приоритет на основе дедлайна, если приоритет не указан явно
        let finalPriority = priority;
        if (!finalPriority && deadline) {
            const deadlineDate = new Date(deadline);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            // Сравниваем только даты (без времени)
            const deadlineDateOnly = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const tomorrowDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
            
            if (deadlineDateOnly.getTime() === todayDateOnly.getTime()) {
                finalPriority = 'HIGH';
            } else if (deadlineDateOnly.getTime() === tomorrowDateOnly.getTime()) {
                finalPriority = 'MEDIUM';
            } else {
                finalPriority = 'LOW';
            }
        } else if (!finalPriority) {
            finalPriority = 'LOW';
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                status,
                priority: finalPriority,
                taskType: taskType || 'OTHER',
                order: taskOrder,
                deadline: deadline ? new Date(deadline) : null,
                project: { connect: { id: projectIdNum } },
                creator: { connect: { id: taskCreatorId } }
            },
            include: TASK_INCLUDE_CONFIG
        });

        await manageTaskAssignees(task.id, assigneeIds, taskCreatorId);
        const taskWithAssignees = await getTaskWithAssignees(task.id);

        // WebSocket уведомления
        sendTaskWebSocketEvent('task_created', {
            task: taskWithAssignees,
            projectId: projectIdNum,
            userId: req.user?.id, // предполагается, что пользователь добавлен в middleware
            assigneeIds: taskWithAssignees?.assignees?.map(a => a.userId) || []
        }, true); // немедленная отправка для создания задач

        await sendTaskNotificationToProject(
            projectIdNum,
            task.id,
            title,
            `Создана задача "${title}"`,
            'task_created',
            req.user?.id
        );

        res.status(201).json(taskWithAssignees);
    } catch (error) {
        console.error('Ошибка при создании задачи:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при создании задачи';
        res.status(400).json({ message });
    }
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const tasks = await prisma.task.findMany({
            include: TASK_INCLUDE_CONFIG,
            orderBy: getTaskOrderBy()
        });
        res.json(tasks);
    } catch (error) {
        console.error('Ошибка при получении задач:', error);
        res.status(500).json({ message: 'Ошибка при получении задач' });
    }
};

export const getUserTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = parseInt(req.params.userId);
        if (isNaN(userId)) {
            res.status(400).json({ message: 'Неверный ID пользователя' });
            return;
        }

        const tasks = await prisma.task.findMany({
            where: {
                assignees: {
                    some: {
                        userId: userId
                    }
                }
            },
            select: TASK_LIST_SELECT,
            orderBy: getTaskOrderBy()
        });

        res.json(tasks);
        console.log(tasks);
    } catch (error) {
        console.error('Ошибка при получении задач пользователя:', error);
        res.status(500).json({ message: 'Ошибка при получении задач пользователя' });
    }
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = validateTaskId(req.params.taskId);
        const task = await getTaskWithAssignees(taskId);

        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }

        res.json(task);
    } catch (error) {
        console.error('Ошибка при получении задачи:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при получении задачи';
        res.status(400).json({ message });
    }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = validateTaskId(req.params.taskId);
        const { title, description, status, priority, taskType, deadline, order, assigneeIds }: UpdateTaskData = req.body;

        const currentTask = await prisma.task.findUnique({ where: { id: taskId } });
        if (!currentTask) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }

        // Валидация входных данных
        if (title !== undefined && !title.trim()) {
            res.status(400).json({ message: 'Название задачи не может быть пустым' });
            return;
        }

        if (priority !== undefined && !['LOW', 'MEDIUM', 'HIGH'].includes(priority)) {
            res.status(400).json({ message: 'Неверный приоритет задачи' });
            return;
        }

        if (status !== undefined && !['TODO', 'IN_PROGRESS', 'PROBLEM', 'COMPLETED', 'CANCELLED'].includes(status)) {
            res.status(400).json({ message: 'Неверный статус задачи' });
            return;
        }

        if (taskType !== undefined && !['METHODOLOGIES', 'TESTING_PREPARATION', 'DEBUG_CHECK', 'MEETING', 'OTHER'].includes(taskType)) {
            res.status(400).json({ message: 'Неверный тип задачи' });
            return;
        }

        // Валидация и обработка даты
        let parsedDeadline: Date | null = null;
        if (deadline !== undefined) {
            if (deadline) {
                parsedDeadline = new Date(deadline);
                if (isNaN(parsedDeadline.getTime())) {
                    res.status(400).json({ message: 'Неверный формат даты' });
                    return;
                }
            }
        }

        // Валидация исполнителей
        if (assigneeIds !== undefined && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
            const validUserIds = validateUserIds(assigneeIds);
            const users = await prisma.user.findMany({
                where: { id: { in: validUserIds } }
            });
            if (users.length !== validUserIds.length) {
                res.status(400).json({ message: 'Некоторые указанные исполнители не найдены' });
                return;
            }
        }

        // Выполняем все операции в транзакции
        const result = await prisma.$transaction(async (tx) => {
            const updateData: any = {};
            if (title !== undefined) updateData.title = title.trim();
            if (description !== undefined) updateData.description = description;
            if (priority !== undefined) updateData.priority = priority;
            if (taskType !== undefined) updateData.taskType = taskType;
            if (deadline !== undefined) updateData.deadline = parsedDeadline;

            // Автоматически определяем приоритет на основе дедлайна, если приоритет не указан явно
            if (deadline !== undefined && priority === undefined) {
                if (parsedDeadline) {
                    const deadlineDate = parsedDeadline;
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    // Сравниваем только даты (без времени)
                    const deadlineDateOnly = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());
                    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const tomorrowDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
                    
                    if (deadlineDateOnly.getTime() === todayDateOnly.getTime()) {
                        updateData.priority = 'HIGH';
                    } else if (deadlineDateOnly.getTime() === tomorrowDateOnly.getTime()) {
                        updateData.priority = 'MEDIUM';
                    } else {
                        updateData.priority = 'LOW';
                    }
                } else {
                    updateData.priority = 'LOW';
                }
            }

            // Обработка изменения статуса
            if (status !== undefined && status !== currentTask.status) {
                updateData.status = status;
                updateData.order = await handleStatusChange(currentTask, status);
            } else if (order !== undefined && order !== currentTask.order) {
                await handleOrderChange(currentTask, order);
                updateData.order = order;
            }

            const updatedTask = await tx.task.update({
                where: { id: taskId },
                data: updateData,
                include: TASK_INCLUDE_CONFIG
            });

            // Получаем старых исполнителей для сравнения
            const oldAssignees = await tx.taskAssignee.findMany({
                where: { taskId },
                select: { userId: true }
            });
            const oldAssigneeIds = oldAssignees.map(a => a.userId);

            // Обновляем исполнителей если они переданы
            if (assigneeIds !== undefined) {
                await tx.taskAssignee.deleteMany({ where: { taskId } });

                if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
                    await tx.taskAssignee.createMany({
                        data: assigneeIds.map(userId => ({ taskId, userId })),
                        skipDuplicates: true
                    });
                }
            }

            const taskWithAssignees = await tx.task.findUnique({
                where: { id: taskId },
                include: TASK_INCLUDE_CONFIG
            });

            return { updatedTask, taskWithAssignees, oldAssigneeIds };
        });

        if (!result.taskWithAssignees) {
            res.status(500).json({ message: 'Ошибка при получении обновленной задачи' });
            return;
        }
        
        const newAssigneeIds = result.taskWithAssignees.assignees?.map(a => a.userId) || [];
        
        // Определяем изменения в назначениях
        const addedAssignees = newAssigneeIds.filter(id => !result.oldAssigneeIds.includes(id));
        const removedAssignees = result.oldAssigneeIds.filter(id => !newAssigneeIds.includes(id));

        // WebSocket уведомления
        const eventData = {
            task: result.taskWithAssignees,
            projectId: currentTask.projectId!,
            userId: req.user?.id,
            assigneeIds: newAssigneeIds,
            oldStatus: currentTask.status,
            newStatus: status || currentTask.status
        };

        // Если изменились исполнители, отправляем специальное событие
        if (addedAssignees.length > 0 || removedAssignees.length > 0) {
            const wsServer = getWebSocketServer();
            if (wsServer) {
                wsServer.sendTaskAssignmentEvent({
                    ...eventData,
                    assigneeIds: addedAssignees,
                    unassignedUserIds: removedAssignees
                });
            }
        }

        sendTaskWebSocketEvent('task_updated', eventData);

        if (status !== undefined && status !== currentTask.status) {
            const statusText = STATUS_DISPLAY_TEXT[status] || status;
            await sendTaskNotificationToProject(
                currentTask.projectId!,
                taskId,
                currentTask.title,
                `Задача "${currentTask.title}" переведена в статус "${statusText}"`,
                'task_updated',
                req.user?.id
            );
        }

        res.json(result.taskWithAssignees);
    } catch (error) {
        console.error('Ошибка при обновлении задачи:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при обновлении задачи';
        res.status(400).json({ message });
    }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = validateTaskId(req.params.taskId);

        const taskToDelete = await getTaskWithAssignees(taskId);
        if (!taskToDelete) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }

        await prisma.task.delete({ where: { id: taskId } });

        // Корректируем порядок только если задача принадлежит проекту
        if (taskToDelete.projectId) {
            await adjustTaskOrderOnDelete(taskToDelete.projectId, taskToDelete.status, taskToDelete.order || 0);
        }

        // WebSocket уведомления
        sendTaskWebSocketEvent('task_deleted', {
            taskId,
            projectId: taskToDelete.projectId!,
            userId: req.user?.id,
            assigneeIds: taskToDelete.assignees?.map(a => a.userId) || []
        }, true); // немедленная отправка для удаления

        await sendTaskNotificationToProject(
            taskToDelete.projectId!,
            taskId,
            taskToDelete.title,
            `Задача "${taskToDelete.title}" была удалена`,
            'task_deleted',
            req.user?.id
        );

        res.status(200).json({ message: 'Задача удалена' });
    } catch (error) {
        console.error('Ошибка при удалении задачи:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при удалении задачи';
        res.status(400).json({ message });
    }
};

export const getTaskComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = validateTaskId(req.params.taskId);

        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json(comments);
    } catch (error) {
        console.error('Ошибка при получении комментариев задачи:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при получении комментариев задачи';
        res.status(400).json({ message });
    }
};

export const addTaskAssignees = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = validateTaskId(req.params.taskId);
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ message: 'Список ID пользователей обязателен' });
            return;
        }

        const validUserIds = validateUserIds(userIds);

        // Проверяем существование задачи
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }

        // Проверяем существование пользователей
        const users = await prisma.user.findMany({
            where: { id: { in: validUserIds } }
        });

        if (users.length !== validUserIds.length) {
            res.status(400).json({ message: 'Некоторые пользователи не найдены' });
            return;
        }

        await prisma.taskAssignee.createMany({
            data: validUserIds.map(userId => ({ taskId, userId })),
            skipDuplicates: true
        });

        const updatedTask = await getTaskWithAssignees(taskId);
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Ошибка при добавлении исполнителей:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при добавлении исполнителей';
        res.status(400).json({ message });
    }
};

export const removeTaskAssignees = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = validateTaskId(req.params.taskId);
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ message: 'Список ID пользователей обязателен' });
            return;
        }

        const validUserIds = validateUserIds(userIds);

        // Проверяем существование задачи
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }

        await prisma.taskAssignee.deleteMany({
            where: {
                taskId,
                userId: { in: validUserIds }
            }
        });

        const updatedTask = await getTaskWithAssignees(taskId);
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Ошибка при удалении исполнителей:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при удалении исполнителей';
        res.status(400).json({ message });
    }
};

export const getTaskAssignees = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = validateTaskId(req.params.taskId);

        const task = await getTaskWithAssignees(taskId);
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }

        res.status(200).json(task.assignees);
    } catch (error) {
        console.error('Ошибка при получении исполнителей задачи:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при получении исполнителей задачи';
        res.status(400).json({ message });
    }
};

export const updateTaskAssignees = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskId = validateTaskId(req.params.taskId);
        const { userIds } = req.body;

        // Проверяем существование задачи
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }

        // Удаляем всех текущих исполнителей
        await prisma.taskAssignee.deleteMany({ where: { taskId } });

        // Добавляем новых исполнителей, если они переданы
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            const validUserIds = validateUserIds(userIds);

            // Проверяем существование пользователей
            const users = await prisma.user.findMany({
                where: { id: { in: validUserIds } }
            });

            if (users.length !== validUserIds.length) {
                res.status(400).json({ message: 'Некоторые пользователи не найдены' });
                return;
            }

            await prisma.taskAssignee.createMany({
                data: validUserIds.map(userId => ({ taskId, userId }))
            });
        }

        const updatedTask = await getTaskWithAssignees(taskId);
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Ошибка при обновлении исполнителей задачи:', error);
        const message = error instanceof Error ? error.message : 'Ошибка при обновлении исполнителей задачи';
        res.status(400).json({ message });
    }
};

export const updateTaskPriorities = async (req: Request, res: Response): Promise<void> => {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Сравниваем только даты (без времени)
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        
        let updatedCount = 0;
        
        // Обновляем приоритет для задач с дедлайном сегодня (HIGH)
        const highPriorityResult = await prisma.task.updateMany({
            where: {
                deadline: {
                    gte: todayDateOnly,
                    lt: new Date(todayDateOnly.getTime() + 24 * 60 * 60 * 1000) // следующий день
                },
                priority: { not: 'HIGH' },
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            },
            data: { priority: 'HIGH' }
        });
        updatedCount += highPriorityResult.count;
        
        // Обновляем приоритет для задач с дедлайном завтра (MEDIUM)
        const mediumPriorityResult = await prisma.task.updateMany({
            where: {
                deadline: {
                    gte: tomorrowDateOnly,
                    lt: new Date(tomorrowDateOnly.getTime() + 24 * 60 * 60 * 1000) // следующий день
                },
                priority: { notIn: ['HIGH', 'MEDIUM'] },
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            },
            data: { priority: 'MEDIUM' }
        });
        updatedCount += mediumPriorityResult.count;
        
        res.status(200).json({ 
            message: 'Приоритеты задач обновлены успешно',
            updatedCount 
        });
    } catch (error) {
        console.error('Ошибка при обновлении приоритетов задач:', error);
        res.status(500).json({ message: 'Ошибка при обновлении приоритетов задач' });
    }
};
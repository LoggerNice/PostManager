import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, status, priority, projectId, deadline, order } = req.body;
        
        console.log('createTask called with:');
        console.log('body:', req.body);
        
        if (!projectId) {
            res.status(400).json({ message: 'ID проекта обязателен' });
            return;
        }

        // Если order не передан, определяем его автоматически
        let taskOrder = order;
        if (taskOrder === undefined || taskOrder === null) {
            // Находим максимальный order среди задач с тем же статусом в проекте
            const maxOrderTask = await prisma.task.findFirst({
                where: {
                    projectId: parseInt(projectId),
                    status: status
                },
                orderBy: {
                    order: 'desc'
                }
            });
            
            // Устанавливаем order как максимальный + 1, или 0 если задач нет
            taskOrder = (maxOrderTask && maxOrderTask.order !== null) ? (maxOrderTask.order + 1) : 0;
        } else {
            // Если order передан, проверяем на дублирование и корректируем при необходимости
            const existingTask = await prisma.task.findFirst({
                where: {
                    projectId: parseInt(projectId),
                    status: status,
                    order: taskOrder
                }
            });
            
            if (existingTask) {
                // Если задача с таким order уже существует, сдвигаем все последующие задачи
                await prisma.task.updateMany({
                    where: {
                        projectId: parseInt(projectId),
                        status: status,
                        order: {
                            gte: taskOrder
                        }
                    },
                    data: {
                        order: {
                            increment: 1
                        }
                    }
                });
            }
        }

        console.log('Calculated order:', taskOrder);

        const task = await prisma.task.create({
            data: {
                title,
                description,
                status,
                priority,
                order: taskOrder,
                deadline: deadline ? new Date(deadline) : null,
                project: {
                    connect: { id: parseInt(projectId) }
                }
            },
        });
        
        console.log('Created task:', task);
        res.status(201).json(task);
    } catch (error) {
        console.error('Ошибка при создании задачи:', error);
        res.status(500).json({ message: 'Ошибка при создании задачи' });
    }
}

export const getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const tasks = await prisma.task.findMany();
        res.json(tasks);
    } catch (error) {
        console.error('Ошибка при получении задач:', error);
        res.status(500).json({ message: 'Ошибка при получении задач' });
    }
}

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId } = req.params;
        const task = await prisma.task.findUnique({ where: { id: parseInt(taskId) } });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        res.json(task);
    } catch (error) {
        console.error('Ошибка при получении задачи:', error);
        res.status(500).json({ message: 'Ошибка при получении задачи' });
    }
}

export const updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId } = req.params;
        const { title, description, status, priority, deadline, order } = req.body;
        
        // Проверяем, что taskId является валидным числом
        const taskIdNum = parseInt(taskId);
        if (isNaN(taskIdNum)) {
            res.status(400).json({ message: 'Неверный ID задачи' });
            return;
        }
        
        // Получаем текущую задачу для сравнения
        const currentTask = await prisma.task.findUnique({
            where: { id: taskIdNum }
        });
        
        if (!currentTask) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        
        // Подготавливаем данные для обновления, исключая undefined значения
        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (priority !== undefined) updateData.priority = priority;
        if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
        
        // Обрабатываем изменение статуса и порядка
        const newStatus = status !== undefined ? status : currentTask.status;
        const newOrder = order !== undefined ? order : currentTask.order;
        
        // Если статус изменился, нужно пересчитать порядок
        if (status !== undefined && status !== currentTask.status) {
            // Удаляем задачу из старой колонки (сдвигаем порядок)
            await prisma.task.updateMany({
                where: {
                    projectId: currentTask.projectId,
                    status: currentTask.status,
                    order: {
                        gt: currentTask.order || 0
                    }
                },
                data: {
                    order: {
                        decrement: 1
                    }
                }
            });
            
            // Находим максимальный order в новой колонке
            const maxOrderTask = await prisma.task.findFirst({
                where: {
                    projectId: currentTask.projectId,
                    status: newStatus
                },
                orderBy: {
                    order: 'desc'
                }
            });
            
            // Устанавливаем новый порядок в конец новой колонки
            updateData.order = (maxOrderTask && maxOrderTask.order !== null) ? (maxOrderTask.order + 1) : 0;
            updateData.status = newStatus;
        } else if (order !== undefined && order !== currentTask.order) {
            // Если изменился только порядок в той же колонке
            const existingTask = await prisma.task.findFirst({
                where: {
                    projectId: currentTask.projectId,
                    status: newStatus,
                    order: newOrder,
                    id: {
                        not: taskIdNum // Исключаем текущую задачу
                    }
                }
            });
            
            if (existingTask) {
                // Если позиция занята, сдвигаем задачи
                if (newOrder > (currentTask.order || 0)) {
                    // Перемещение вниз - сдвигаем задачи вверх
                    await prisma.task.updateMany({
                        where: {
                            projectId: currentTask.projectId,
                            status: newStatus,
                            order: {
                                gt: currentTask.order || 0,
                                lte: newOrder
                            }
                        },
                        data: {
                            order: {
                                decrement: 1
                            }
                        }
                    });
                } else {
                    // Перемещение вверх - сдвигаем задачи вниз
                    await prisma.task.updateMany({
                        where: {
                            projectId: currentTask.projectId,
                            status: newStatus,
                            order: {
                                gte: newOrder,
                                lt: currentTask.order || 0
                            }
                        },
                        data: {
                            order: {
                                increment: 1
                            }
                        }
                    });
                }
            }
            
            updateData.order = newOrder;
        }
        
        console.log('updateData:', updateData);
        
        const updatedTask = await prisma.task.update({
            where: { id: taskIdNum },
            data: updateData,
        });
        
        res.json(updatedTask);
    } catch (error) {
        console.error('Ошибка при обновлении задачи:', error);
        res.status(500).json({ message: 'Ошибка при обновлении задачи' });
    }
}

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId } = req.params;
        const taskIdNum = parseInt(taskId);
        
        if (isNaN(taskIdNum)) {
            res.status(400).json({ message: 'Неверный ID задачи' });
            return;
        }
        
        // Получаем задачу перед удалением для корректировки порядка
        const taskToDelete = await prisma.task.findUnique({
            where: { id: taskIdNum }
        });
        
        if (!taskToDelete) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        
        // Удаляем задачу
        await prisma.task.delete({ where: { id: taskIdNum } });
        
        // Сдвигаем порядок всех последующих задач в той же колонке
        await prisma.task.updateMany({
            where: {
                projectId: taskToDelete.projectId,
                status: taskToDelete.status,
                order: {
                    gt: taskToDelete.order || 0
                }
            },
            data: {
                order: {
                    decrement: 1
                }
            }
        });
        
        console.log(`Task ${taskIdNum} deleted, order adjusted for remaining tasks`);
        res.status(200).json({ message: 'Задача удалена' });
    } catch (error) {
        console.error('Ошибка при удалении задачи:', error);
        res.status(500).json({ message: 'Ошибка при удалении задачи' });
    }
}

export const getTaskComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId } = req.params;
        const task = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            include: { comments: true },
        });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        res.status(200).json(task.comments);
    } catch (error) {
        console.error('Ошибка при получении комментариев задачи:', error);
        res.status(500).json({ message: 'Ошибка при получении комментариев задачи' });
    }
}


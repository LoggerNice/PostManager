import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { executeCyclicTasks } from '../services/cyclicTaskExecutor.js';

// Получение всех цикличных задач
export const getCyclicTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const cyclicTasks = await prisma.cyclicTask.findMany({
            include: {
                project: true,
                assignees: {
                    include: {
                        user: {
                            include: {
                                department: true
                            }
                        }
                    }
                },
                creator: {
                    include: {
                        department: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(cyclicTasks);
    } catch (error) {
        console.error('Ошибка при получении цикличных задач:', error);
        res.status(500).json({ message: 'Ошибка при получении цикличных задач' });
    }
};

// Получение цикличной задачи по ID
export const getCyclicTaskById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const cyclicTask = await prisma.cyclicTask.findUnique({
            where: { id: parseInt(id) },
            include: {
                project: true,
                assignees: {
                    include: {
                        user: {
                            include: {
                                department: true
                            }
                        }
                    }
                },
                creator: {
                    include: {
                        department: true
                    }
                }
            }
        });

        if (!cyclicTask) {
            res.status(404).json({ message: 'Цикличная задача не найдена' });
            return;
        }

        res.json(cyclicTask);
    } catch (error) {
        console.error('Ошибка при получении цикличной задачи:', error);
        res.status(500).json({ message: 'Ошибка при получении цикличной задачи' });
    }
};

// Создание новой цикличной задачи
export const createCyclicTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, dayOfWeek, deadline, deadlineDay, projectId, assigneeIds } = req.body;

        // Валидация обязательных полей
        if (!title || !dayOfWeek || !deadline || !projectId || !assigneeIds || !Array.isArray(assigneeIds) || assigneeIds.length === 0) {
            res.status(400).json({ 
                message: 'Название, день недели, время выполнения, проект и исполнители обязательны' 
            });
            return;
        }

        // Проверка существования проекта
        const project = await prisma.project.findUnique({
            where: { id: projectId }
        });

        if (!project) {
            res.status(404).json({ message: 'Проект не найден' });
            return;
        }

        // Проверка существования исполнителей
        const assignees = await prisma.user.findMany({
            where: { id: { in: assigneeIds } }
        });

        if (assignees.length !== assigneeIds.length) {
            res.status(404).json({ message: 'Один или несколько исполнителей не найдены' });
            return;
        }

        // Проверка прав доступа для менеджеров
        if (req.user?.role === 'MANAGER') {
            const invalidAssignees = assignees.filter(assignee => assignee.departmentId !== req.user!.departmentId);
            if (invalidAssignees.length > 0) {
                res.status(403).json({ 
                    message: 'Вы можете назначать задачи только сотрудникам своего отдела' 
                });
                return;
            }
        }

        const cyclicTask = await prisma.cyclicTask.create({
            data: {
                title,
                description,
                dayOfWeek,
                deadline,
                deadlineDay: deadlineDay || null,
                projectId,
                creatorId: req.user!.id,
                isActive: true,
                assignees: {
                    create: assigneeIds.map(assigneeId => ({
                        userId: assigneeId
                    }))
                }
            },
            include: {
                project: true,
                assignees: {
                    include: {
                        user: {
                            include: {
                                department: true
                            }
                        }
                    }
                },
                creator: {
                    include: {
                        department: true
                    }
                }
            }
        });

        res.status(201).json(cyclicTask);
    } catch (error) {
        console.error('Ошибка при создании цикличной задачи:', error);
        res.status(500).json({ message: 'Ошибка при создании цикличной задачи' });
    }
};

// Обновление цикличной задачи
export const updateCyclicTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, description, dayOfWeek, deadline, deadlineDay, projectId, assigneeIds, isActive } = req.body;

        // Проверка существования задачи
        const existingTask = await prisma.cyclicTask.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingTask) {
            res.status(404).json({ message: 'Цикличная задача не найдена' });
            return;
        }

        // Проверка прав доступа
        if (req.user?.role === 'MANAGER' && existingTask.creatorId !== req.user.id) {
            res.status(403).json({ 
                message: 'Вы можете редактировать только свои цикличные задачи' 
            });
            return;
        }

        // Если меняются исполнители, проверяем права для менеджеров
        if (assigneeIds && req.user?.role === 'MANAGER') {
            const assignees = await prisma.user.findMany({
                where: { id: { in: assigneeIds } }
            });

            const invalidAssignees = assignees.filter(assignee => assignee.departmentId !== req.user!.departmentId);
            if (invalidAssignees.length > 0) {
                res.status(403).json({ 
                    message: 'Вы можете назначать задачи только сотрудникам своего отдела' 
                });
                return;
            }
        }

        // Если меняется проект, проверяем его существование
        if (projectId) {
            const project = await prisma.project.findUnique({
                where: { id: projectId }
            });

            if (!project) {
                res.status(404).json({ message: 'Проект не найден' });
                return;
            }
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (dayOfWeek !== undefined) updateData.dayOfWeek = dayOfWeek;
        if (deadline !== undefined) updateData.deadline = deadline;
        if (deadlineDay !== undefined) updateData.deadlineDay = deadlineDay || null;
        if (projectId !== undefined) updateData.projectId = projectId;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Если меняются исполнители, обновляем связи
        if (assigneeIds !== undefined) {
            updateData.assignees = {
                deleteMany: {},
                create: assigneeIds.map((assigneeId: number) => ({
                    userId: assigneeId
                }))
            };
        }

        const cyclicTask = await prisma.cyclicTask.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                project: true,
                assignees: {
                    include: {
                        user: {
                            include: {
                                department: true
                            }
                        }
                    }
                },
                creator: {
                    include: {
                        department: true
                    }
                }
            }
        });

        res.json(cyclicTask);
    } catch (error) {
        console.error('Ошибка при обновлении цикличной задачи:', error);
        res.status(500).json({ message: 'Ошибка при обновлении цикличной задачи' });
    }
};

// Удаление цикличной задачи
export const deleteCyclicTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Проверка существования задачи
        const existingTask = await prisma.cyclicTask.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingTask) {
            res.status(404).json({ message: 'Цикличная задача не найдена' });
            return;
        }

        // Проверка прав доступа
        if (req.user?.role === 'MANAGER' && existingTask.creatorId !== req.user.id) {
            res.status(403).json({ 
                message: 'Вы можете удалять только свои цикличные задачи' 
            });
            return;
        }

        await prisma.cyclicTask.delete({
            where: { id: parseInt(id) }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении цикличной задачи:', error);
        res.status(500).json({ message: 'Ошибка при удалении цикличной задачи' });
    }
};

// Переключение статуса активности цикличной задачи
export const toggleCyclicTaskStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        // Проверка существования задачи
        const existingTask = await prisma.cyclicTask.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingTask) {
            res.status(404).json({ message: 'Цикличная задача не найдена' });
            return;
        }

        // Проверка прав доступа
        if (req.user?.role === 'MANAGER' && existingTask.creatorId !== req.user.id) {
            res.status(403).json({ 
                message: 'Вы можете изменять статус только своих цикличных задач' 
            });
            return;
        }

        const cyclicTask = await prisma.cyclicTask.update({
            where: { id: parseInt(id) },
            data: { isActive: isActive },
            include: {
                project: true,
                assignees: {
                    include: {
                        user: {
                            include: {
                                department: true
                            }
                        }
                    }
                },
                creator: {
                    include: {
                        department: true
                    }
                }
            }
        });

        res.json(cyclicTask);
    } catch (error) {
        console.error('Ошибка при изменении статуса цикличной задачи:', error);
        res.status(500).json({ message: 'Ошибка при изменении статуса цикличной задачи' });
    }
};

// Принудительное выполнение циклических задач
export const executeCyclicTasksManually = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('🚀 Запуск принудительного выполнения циклических задач...');
        
        // Выполняем циклические задачи
        await executeCyclicTasks();
        
        res.json({ 
            message: 'Цикличные задачи выполнены успешно',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Ошибка при принудительном выполнении циклических задач:', error);
        res.status(500).json({ message: 'Ошибка при выполнении цикличных задач' });
    }
};

import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

// Получение всех групп заданий
export const getTaskGroups = async (req: Request, res: Response): Promise<void> => {
    try {
        const taskGroups = await prisma.taskGroup.findMany({
            include: {
                missions: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });
        res.json(taskGroups);
    } catch (error) {
        console.error('Ошибка при получении групп заданий:', error);
        res.status(500).json({ message: 'Ошибка при получении групп заданий' });
    }
};

// Получение группы заданий по ID
export const getTaskGroupById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { groupId } = req.params;
        const taskGroup = await prisma.taskGroup.findUnique({
            where: { id: parseInt(groupId) },
            include: {
                missions: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });

        if (!taskGroup) {
            res.status(404).json({ message: 'Группа заданий не найдена' });
            return;
        }

        res.json(taskGroup);
    } catch (error) {
        console.error('Ошибка при получении группы заданий:', error);
        res.status(500).json({ message: 'Ошибка при получении группы заданий' });
    }
};

// Создание группы заданий
export const createTaskGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ message: 'Название группы обязательно' });
            return;
        }

        const taskGroup = await prisma.taskGroup.create({
            data: { name }
        });

        res.status(201).json(taskGroup);
    } catch (error) {
        console.error('Ошибка при создании группы заданий:', error);
        res.status(500).json({ message: 'Ошибка при создании группы заданий' });
    }
};

// Обновление группы заданий
export const updateTaskGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { groupId } = req.params;
        const { name } = req.body;

        const taskGroup = await prisma.taskGroup.update({
            where: { id: parseInt(groupId) },
            data: { name }
        });

        res.json(taskGroup);
    } catch (error) {
        console.error('Ошибка при обновлении группы заданий:', error);
        res.status(500).json({ message: 'Ошибка при обновлении группы заданий' });
    }
};

// Удаление группы заданий
export const deleteTaskGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { groupId } = req.params;

        await prisma.taskGroup.delete({
            where: { id: parseInt(groupId) }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении группы заданий:', error);
        res.status(500).json({ message: 'Ошибка при удалении группы заданий' });
    }
};

// Получение всех заданий
export const getMissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const missions = await prisma.mission.findMany({
            include: {
                group: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        res.json(missions);
    } catch (error) {
        console.error('Ошибка при получении заданий:', error);
        res.status(500).json({ message: 'Ошибка при получении заданий' });
    }
};

// Получение задания по ID
export const getMissionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const mission = await prisma.mission.findUnique({
            where: { id: parseInt(missionId) },
            include: {
                group: true
            }
        });

        if (!mission) {
            res.status(404).json({ message: 'Задание не найдено' });
            return;
        }

        res.json(mission);
    } catch (error) {
        console.error('Ошибка при получении задания:', error);
        res.status(500).json({ message: 'Ошибка при получении задания' });
    }
};

// Создание задания
export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, command, hint, groupId } = req.body;

        if (!title || !description || !command) {
            res.status(400).json({ message: 'Название, описание и команда обязательны' });
            return;
        }

        const mission = await prisma.mission.create({
            data: {
                title,
                description,
                command,
                hint: hint || '',
                groupId: groupId ? parseInt(groupId) : null
            },
            include: {
                group: true
            }
        });

        res.status(201).json(mission);
    } catch (error) {
        console.error('Ошибка при создании задания:', error);
        res.status(500).json({ message: 'Ошибка при создании задания' });
    }
};

// Обновление задания
export const updateMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const { title, description, command, hint, groupId } = req.body;

        const mission = await prisma.mission.update({
            where: { id: parseInt(missionId) },
            data: {
                title,
                description,
                command,
                hint,
                groupId: groupId ? parseInt(groupId) : null
            },
            include: {
                group: true
            }
        });

        res.json(mission);
    } catch (error) {
        console.error('Ошибка при обновлении задания:', error);
        res.status(500).json({ message: 'Ошибка при обновлении задания' });
    }
};

// Удаление задания
export const deleteMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;

        await prisma.mission.delete({
            where: { id: parseInt(missionId) }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении задания:', error);
        res.status(500).json({ message: 'Ошибка при удалении задания' });
    }
};

// Получение результатов тренировок
export const getTrainingResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const trainingResults = await prisma.trainingResult.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        login: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                completedAt: 'desc'
            }
        });
        res.json(trainingResults);
    } catch (error) {
        console.error('Ошибка при получении результатов тренировок:', error);
        res.status(500).json({ message: 'Ошибка при получении результатов тренировок' });
    }
};

// Получение результатов тренировок пользователя
export const getUserTrainingResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const trainingResults = await prisma.trainingResult.findMany({
            where: { userId: parseInt(userId) },
            orderBy: {
                completedAt: 'desc'
            }
        });
        res.json(trainingResults);
    } catch (error) {
        console.error('Ошибка при получении результатов тренировок пользователя:', error);
        res.status(500).json({ message: 'Ошибка при получении результатов тренировок пользователя' });
    }
};

// Сохранение результата тренировки
export const saveTrainingResult = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, sessionId, totalTasks, correctAnswers, incorrectAnswers } = req.body;

        if (!userId || !sessionId || totalTasks === undefined || correctAnswers === undefined || incorrectAnswers === undefined) {
            res.status(400).json({ message: 'Все поля обязательны' });
            return;
        }

        // Проверяем, существует ли уже результат для этой сессии
        const existingResult = await prisma.trainingResult.findUnique({
            where: { sessionId }
        });

        if (existingResult) {
            res.status(409).json({ message: 'Результат для этой сессии уже существует' });
            return;
        }

        const trainingResult = await prisma.trainingResult.create({
            data: {
                userId: parseInt(userId),
                sessionId,
                totalTasks,
                correctAnswers,
                incorrectAnswers
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        login: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        res.status(201).json(trainingResult);
    } catch (error) {
        console.error('Ошибка при сохранении результата тренировки:', error);
        res.status(500).json({ message: 'Ошибка при сохранении результата тренировки' });
    }
};

// Получение рейтинга тренировок
export const getTrainingRatings = async (req: Request, res: Response): Promise<void> => {
    try {
        const ratings = await prisma.trainingResult.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        login: true,
                        department: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                completedAt: 'desc'
            }
        });

        // Группируем результаты по пользователям и вычисляем статистику
        const userStats = new Map();

        ratings.forEach(result => {
            const userId = result.user.id;
            if (!userStats.has(userId)) {
                userStats.set(userId, {
                    id: result.id,
                    employee: result.user,
                    totalTasks: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    createdAt: result.completedAt
                });
            }

            const stats = userStats.get(userId);
            stats.totalTasks += result.totalTasks;
            stats.correctAnswers += result.correctAnswers;
            stats.incorrectAnswers += result.incorrectAnswers;
        });

        const finalRatings = Array.from(userStats.values()).map(rating => ({
            ...rating,
            employee: {
                ...rating.employee,
                departmentName: rating.employee.department?.name
            }
        }));

        res.json(finalRatings);
    } catch (error) {
        console.error('Ошибка при получении рейтинга:', error);
        res.status(500).json({ message: 'Ошибка при получении рейтинга' });
    }
};

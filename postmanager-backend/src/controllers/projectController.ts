import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const createProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, startDate, endDate, client, departmentIds, userIds } = req.body;

        // Валидация обязательных полей
        if (!title || !client) {
            res.status(400).json({ message: 'Название проекта и клиент обязательны' });
            return;
        }

        // Проверка существования проекта с таким же названием
        const existingProject = await prisma.project.findFirst({
            where: {
                title
            }
        });

        if (existingProject) {
            res.status(400).json({ message: 'Проект с таким названием уже существует' });
            return;
        }

        // Обработка дат
        const formattedStartDate = startDate ? new Date(startDate) : null;
        const formattedEndDate = endDate ? new Date(endDate) : null;

        // Проверка корректности дат
        if (formattedStartDate && formattedEndDate && formattedStartDate > formattedEndDate) {
            res.status(400).json({ message: 'Дата начала не может быть позже даты окончания' });
            return;
        }

        // Создание проекта
        const project = await prisma.project.create({
            data: {
                title,
                description,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                client,
                department: departmentIds ? {
                    connect: departmentIds.map((id: string) => ({ id: parseInt(id) }))
                } : undefined,
                users: userIds ? {
                    connect: userIds.map((id: string) => ({ id: parseInt(id) }))
                } : undefined
            },
            include: {
                department: true,
                users: true
            }
        });

        res.status(200).json(project);
    } catch (error) {
        console.error('Ошибка при создании проекта:', error);
        res.status(400).json({ message: 'Ошибка при создании проекта' });
    }
}

export const getProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const projects = await prisma.project.findMany();
        res.status(200).json(projects);
    } catch (error) {
        console.error('Ошибка при получении проектов:', error);
        res.status(500).json({ message: 'Ошибка при получении проектов' });
    }
}

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) },
            include: {
                users: {
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
                department: true
            }
        });
        if (!project) {
            res.status(404).json({ message: 'Проект не найден' });
            return;
        }
        res.status(200).json(project);
    } catch (error) {
        console.error('Ошибка при получении проекта:', error);
        res.status(500).json({ message: 'Ошибка при получении проекта' });
    }
}

export const updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;
        const { title, description, startDate, endDate, client, departmentIds, userIds } = req.body;
        const updatedProject = await prisma.project.update({
            where: { id: parseInt(projectId) },
            data: { title, description, startDate, endDate, client, department: departmentIds ? {
                connect: departmentIds.map((id: string) => ({ id: parseInt(id) }))
            } : undefined,
                users: userIds ? {
                    connect: userIds.map((id: string) => ({ id: parseInt(id) }))
                } : undefined
            },
        });
        res.status(200).json(updatedProject);
    } catch (error) {
        console.error('Ошибка при обновлении проекта:', error);
        res.status(500).json({ message: 'Ошибка при обновлении проекта' });
    }
}

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;
        await prisma.project.delete({ where: { id: parseInt(projectId) } });
        res.status(200).json({ message: 'Проект удален' });
    } catch (error) {
        console.error('Ошибка при удалении проекта:', error);
        res.status(500).json({ message: 'Ошибка при удалении проекта' });
    }
}

export const getProjectTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) },
            include: { tasks: true },
        });
        if (!project) {
            res.status(404).json({ message: 'Проект не найден' });
            return;
        }
        res.status(200).json(project.tasks);
    } catch (error) {
        console.error('Ошибка при получении задач проекта:', error);
        res.status(500).json({ message: 'Ошибка при получении задач проекта' });

    }
}

export const getProjectsByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const projects = await prisma.project.findMany({
            where: { 
                OR: [
                    { users: { some: { id: parseInt(userId) } } },
                    { tasks: { some: { assigneeId: parseInt(userId) } } }
                ]
            },
            select: {
                id: true,
                title: true
            }
        });
        res.status(200).json(projects);
    } catch (error) {
        console.error('Ошибка при получении проектов пользователя:', error);
        res.status(500).json({ message: 'Ошибка при получении проектов пользователя' });
    }
}

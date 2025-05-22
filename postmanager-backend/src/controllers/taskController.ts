import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, status, priority, projectId, deadline } = req.body;
        
        if (!projectId) {
            res.status(400).json({ message: 'ID проекта обязателен' });
            return;
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                status,
                priority,
                deadline: deadline ? new Date(deadline) : null,
                project: {
                    connect: { id: parseInt(projectId) }
                }
            },
        });
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
        const { title, description, status, priority, deadline } = req.body;
        const updatedTask = await prisma.task.update({
            where: { id: parseInt(taskId) },
            data: { 
                title, 
                description, 
                status,
                priority,
                deadline: deadline ? new Date(deadline) : null
            },
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
        await prisma.task.delete({ where: { id: parseInt(taskId) } });
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


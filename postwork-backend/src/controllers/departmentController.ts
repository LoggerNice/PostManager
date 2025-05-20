import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;
        const department = await prisma.department.create({
            data: {
                name,
            },
        });
        res.status(200).json(department);
    } catch (error) {
        console.error('Ошибка при создании отдела:', error);
        res.status(500).json({ message: 'Ошибка при создании отдела' });
    }
}

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
        const departments = await prisma.department.findMany();
        res.status(200).json(departments);
    } catch (error) {
        console.error('Ошибка при получении отделов:', error);
        res.status(500).json({ message: 'Ошибка при получении отделов' });
    }
}

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentId } = req.params;
        const department = await prisma.department.findUnique({ where: { id: parseInt(departmentId) } });
        if (!department) {
            res.status(404).json({ message: 'Отдел не найден' });
            return;
        }
        res.status(200).json(department);
    } catch (error) {
        console.error('Ошибка при получении отдела:', error);
        res.status(500).json({ message: 'Ошибка при получении отдела' });
    }
}

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentId } = req.params;
        const { name } = req.body;
        const updatedDepartment = await prisma.department.update({
            where: { id: parseInt(departmentId) },
            data: { name },
        });
        res.status(200).json(updatedDepartment);
    } catch (error) {
        console.error('Ошибка при обновлении отдела:', error);
        res.status(500).json({ message: 'Ошибка при обновлении отдела' });
    }
}

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentId } = req.params;
        await prisma.department.delete({ where: { id: parseInt(departmentId) } });
        res.status(200).json({ message: 'Отдел удален' });
    } catch (error) {
        console.error('Ошибка при удалении отдела:', error);
        res.status(500).json({ message: 'Ошибка при удалении отдела' });
    }
}

export const getDepartmentUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentId } = req.params;
        const department = await prisma.department.findUnique({
            where: { id: parseInt(departmentId) },
            include: { users: true },
        });
        if (!department) {
            res.status(404).json({ message: 'Отдел не найден' });
            return;
        }
        res.status(200).json(department.users);
    } catch (error) {
        console.error('Ошибка при получении пользователей отдела:', error);
        res.status(500).json({ message: 'Ошибка при получении пользователей отдела' });
    }
}

export const getDepartmentProjects = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentId } = req.params;
        const department = await prisma.department.findUnique({
            where: { id: parseInt(departmentId) },
            include: { projects: true },
        });
        if (!department) {
            res.status(404).json({ message: 'Отдел не найден' });
            return;
        }
        res.status(200).json(department.projects);
    } catch (error) {
        console.error('Ошибка при получении проектов отдела:', error);
        res.status(500).json({ message: 'Ошибка при получении проектов отдела' });
    }
}

export const getDepartmentTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const { departmentId } = req.params;
        const department = await prisma.department.findUnique({
            where: { id: parseInt(departmentId) },
            include: { projects: { include: { tasks: true } } },
        });
        if (!department) {
            res.status(404).json({ message: 'Отдел не найден' });
            return;
        }
        const tasks = department.projects.flatMap(project => project.tasks);
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Ошибка при получении задач отдела:', error);
        res.status(500).json({ message: 'Ошибка при получении задач отдела' });
    }
}


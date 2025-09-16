import type { Request, Response } from 'express';
import * as os from 'os';
import prisma from '../utils/prisma.js';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

// Middleware для проверки прав администратора
export const requireAdminAccess = (req: Request, res: Response, next: Function): void => {
    if (!req.user) {
        res.status(401).json({ message: 'Необходима авторизация' });
        return;
    }

    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER') {
        res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора или менеджера.' });
        return;
    }

    next();
};

// Получение общей статистики системы
export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
    try {
        // Получаем статистику параллельно
        const [
            totalUsers,
            totalProjects,
            totalTasks,
            totalDepartments,
            activeProjects,
            completedTasks,
            pendingTasks
        ] = await Promise.all([
            prisma.user.count(),
            prisma.project.count(),
            prisma.task.count(),
            prisma.department.count(),
            prisma.project.count({ where: { endDate: { gte: new Date() } } }),
            prisma.task.count({ where: { status: 'COMPLETED' } }),
            prisma.task.count({ where: { status: { in: ['TODO', 'IN_PROGRESS'] } } })
        ]);

        // Просроченные проекты
        const overdueProjects = await prisma.project.count({
            where: { 
                endDate: { lt: new Date() },
                tasks: { some: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }
            }
        });

        const stats = {
            totalUsers,
            totalProjects,
            totalTasks,
            totalDepartments,
            activeProjects,
            completedTasks,
            pendingTasks,
            overdueProjects
        };

        res.json(stats);
    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        res.status(500).json({ message: 'Ошибка при получении статистики' });
    }
};

// Получение системных метрик
export const getSystemMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
        
        // Получаем информацию о CPU
        const cpus = os.cpus();
        
        // Получаем информацию о памяти
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsagePercent = (usedMemory / totalMemory) * 100;
        
        // Получаем информацию о загрузке системы
        const loadAverage = os.loadavg();
        
        // Получаем информацию о диске (если доступно)
        const diskUsage = await getDiskUsage();
        
        // Получаем CPU usage с обработкой ошибок
        let cpuUsage = 0;
        try {
            cpuUsage = await getCpuUsage();
        } catch (cpuError) {
            console.warn('Ошибка получения CPU usage, используем 0:', cpuError);
            cpuUsage = 0;
        }
        
        const metrics = {
            cpu: {
                usage: Math.round(cpuUsage),
                cores: cpus.length,
                loadAverage: loadAverage[0] // 1-минутная средняя загрузка
            },
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
                usagePercent: Math.round(memoryUsagePercent)
            },
            disk: diskUsage,
            uptime: os.uptime(),
            timestamp: new Date().toISOString()
        };

        res.json(metrics);
    } catch (error) {
        console.error('Ошибка при получении системных метрик:', error);
        res.status(500).json({ 
            message: 'Ошибка при получении системных метрик',
            error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
        });
    }
};

// Функция для получения использования CPU
async function getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
        const startMeasure = cpuAverage();
        
        setTimeout(() => {
            const endMeasure = cpuAverage();
            const idleDifference = endMeasure.idle - startMeasure.idle;
            const totalDifference = endMeasure.total - startMeasure.total;
            const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
            resolve(percentageCPU);
        }, 100);
    });
}

// Функция для расчета средней загрузки CPU
function cpuAverage() {
    const cpus = os.cpus();
    
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    
    for (let i = 0; i < cpus.length; i++) {
        const cpu = cpus[i].times;
        user += cpu.user;
        nice += cpu.nice;
        sys += cpu.sys;
        idle += cpu.idle;
        irq += cpu.irq;
    }
    
    const total = user + nice + sys + idle + irq;
    
    return {
        idle: idle,
        total: total
    };
}

// Функция для получения использования диска
async function getDiskUsage(): Promise<{ used: number; free: number; total: number; usagePercent: number }> {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Получаем информацию о корневом диске
        const stats = fs.statSync('.');
        
        // Для Windows используем другой подход
        if (process.platform === 'win32') {
            // Возвращаем приблизительные значения для Windows
            return {
                used: 0,
                free: 0,
                total: 0,
                usagePercent: 0
            };
        }
        
        // Для Unix-систем можно использовать statvfs или аналогичные методы
        // Здесь возвращаем базовые значения
        return {
            used: 0,
            free: 0,
            total: 0,
            usagePercent: 0
        };
    } catch (error) {
        console.error('Ошибка при получении информации о диске:', error);
        return {
            used: 0,
            free: 0,
            total: 0,
            usagePercent: 0
        };
    }
}

// Получение активности пользователей
export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            include: {
                tasks: {
                    select: {
                        id: true,
                        status: true,
                        updatedAt: true
                    }
                },
                assignedTasks: {
                    include: {
                        task: {
                            select: {
                                id: true,
                                status: true,
                                updatedAt: true
                            }
                        }
                    }
                },
                department: {
                    select: {
                        name: true
                    }
                }
            }
        });

        const userActivity = users.map(user => {
            const allTasks = [
                ...user.tasks,
                ...user.assignedTasks.map(at => at.task)
            ];
            
            const totalTasks = allTasks.length;
            const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
            const activeTasks = allTasks.filter(t => ['TODO', 'IN_PROGRESS'].includes(t.status)).length;
            
            // Последняя активность
            const lastActivity = allTasks.reduce((latest, task) => 
                task.updatedAt > latest ? task.updatedAt : latest, 
                user.updatedAt
            );

            return {
                userId: user.id,
                userName: user.name,
                department: user.department?.name || 'Не назначен',
                totalTasks,
                completedTasks,
                activeTasks,
                lastActivity: lastActivity.toISOString()
            };
        });

        res.json(userActivity);
    } catch (error) {
        console.error('Ошибка при получении активности пользователей:', error);
        res.status(500).json({ message: 'Ошибка при получении активности пользователей' });
    }
};

// Получение аналитики по проектам
export const getProjectAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const projects = await prisma.project.findMany({
            include: {
                tasks: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            }
        });

        const projectAnalytics = projects.map(project => {
            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            
            const today = new Date();
            const startDate = project.startDate ? new Date(project.startDate) : today;
            const endDate = project.endDate ? new Date(project.endDate) : today;
            const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
            
            let status = 'В процессе';
            if (progress === 100) status = 'Завершен';
            else if (daysRemaining === 0 && progress < 100) status = 'Просрочен';
            else if (startDate > today) status = 'Планируется';

            return {
                projectId: project.id,
                title: project.title,
                totalTasks,
                completedTasks,
                progress,
                status,
                startDate: project.startDate?.toISOString() || '',
                endDate: project.endDate?.toISOString() || '',
                daysRemaining
            };
        });

        res.json(projectAnalytics);
    } catch (error) {
        console.error('Ошибка при получении аналитики проектов:', error);
        res.status(500).json({ message: 'Ошибка при получении аналитики проектов' });
    }
};

// Получение статистики по отделам
export const getDepartmentStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                users: {
                    include: {
                        tasks: {
                            select: {
                                status: true
                            }
                        },
                        assignedTasks: {
                            include: {
                                task: {
                                    select: {
                                        status: true
                                    }
                                }
                            }
                        }
                    }
                },
                projects: true
            }
        });

        const departmentStats = departments.map(dept => {
            const userCount = dept.users.length;
            const projectCount = dept.projects.length;
            
            // Подсчет задач по всем пользователям отдела
            let taskCount = 0;
            let completedTaskCount = 0;
            
            dept.users.forEach(user => {
                const userTasks = [
                    ...user.tasks,
                    ...user.assignedTasks.map(at => at.task)
                ];
                
                taskCount += userTasks.length;
                completedTaskCount += userTasks.filter(t => t.status === 'COMPLETED').length;
            });

            const averageProgress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

            return {
                departmentId: dept.id,
                name: dept.name,
                userCount,
                projectCount,
                taskCount,
                completedTaskCount,
                averageProgress
            };
        });

        res.json(departmentStats);
    } catch (error) {
        console.error('Ошибка при получении статистики отделов:', error);
        res.status(500).json({ message: 'Ошибка при получении статистики отделов' });
    }
};

// Получение всех пользователей для админ панели
export const getAllUsersAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Исключаем пароли из ответа
        const usersWithoutPasswords = users.map(({ password, ...user }) => user);
        
        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ message: 'Ошибка при получении пользователей' });
    }
};

// Создание пользователя администратором
export const createUserAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, login, password, role, departmentId } = req.body;

        if (!name || !login || !password || !role) {
            res.status(400).json({ message: 'Все поля обязательны' });
            return;
        }

        // Проверяем, не существует ли пользователь с таким логином
        const existingUser = await prisma.user.findUnique({
            where: { login }
        });

        if (existingUser) {
            res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
            return;
        }

        // Хэшируем пароль
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                login,
                password: hashedPassword,
                role: role as any,
                departmentId: departmentId || null
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Исключаем пароль из ответа
        const { password: _, ...userWithoutPassword } = user;
        
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Ошибка при создании пользователя:', error);
        res.status(500).json({ message: 'Ошибка при создании пользователя' });
    }
};

// Обновление пользователя администратором
export const updateUserAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, login, role, departmentId, password } = req.body;



        // Валидация обязательных полей
        if (!name || !login || !role) {
            res.status(400).json({ message: 'Имя, логин и роль обязательны' });
            return;
        }

        // Проверяем, не занят ли логин другим пользователем
        const existingUser = await prisma.user.findFirst({
            where: { 
                login,
                NOT: { id: parseInt(id) }
            }
        });

        if (existingUser) {
            res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
            return;
        }

        const updateData: any = {
            name,
            login,
            role: role as any,
            departmentId: departmentId ? parseInt(departmentId.toString()) : null
        };

        // Если указан новый пароль, хэшируем его
        if (password && password.trim()) {
            const bcrypt = await import('bcrypt');
            updateData.password = await bcrypt.hash(password, 10);
        }



        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        // Исключаем пароль из ответа
        const { password: _, ...userWithoutPassword } = user;
        
        res.json(userWithoutPassword);
    } catch (error: any) {
        console.error('Ошибка при обновлении пользователя:', error);
        
        // Более детальная обработка ошибок Prisma
        if (error.code === 'P2002') {
            res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
        } else if (error.code === 'P2025') {
            res.status(404).json({ message: 'Пользователь не найден' });
        } else {
            res.status(500).json({ 
                message: 'Ошибка при обновлении пользователя',
                error: error.message 
            });
        }
    }
};

// Удаление пользователя администратором
export const deleteUserAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id: parseInt(id) }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении пользователя:', error);
        res.status(500).json({ message: 'Ошибка при удалении пользователя' });
    }
};

// Получение всех отделов для админ панели
export const getAllDepartmentsAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                users: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                projects: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        res.json(departments);
    } catch (error) {
        console.error('Ошибка при получении отделов:', error);
        res.status(500).json({ message: 'Ошибка при получении отделов' });
    }
};

// Создание отдела администратором
export const createDepartmentAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = req.body;

        if (!name) {
            res.status(400).json({ message: 'Название отдела обязательно' });
            return;
        }

        const department = await prisma.department.create({
            data: { name },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                projects: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.status(201).json(department);
    } catch (error) {
        console.error('Ошибка при создании отдела:', error);
        res.status(500).json({ message: 'Ошибка при создании отдела' });
    }
};

// Обновление отдела администратором
export const updateDepartmentAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const department = await prisma.department.update({
            where: { id: parseInt(id) },
            data: { name },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                projects: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.json(department);
    } catch (error) {
        console.error('Ошибка при обновлении отдела:', error);
        res.status(500).json({ message: 'Ошибка при обновлении отдела' });
    }
};

// Удаление отдела администратором
export const deleteDepartmentAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        await prisma.department.delete({
            where: { id: parseInt(id) }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Ошибка при удалении отдела:', error);
        res.status(500).json({ message: 'Ошибка при удалении отдела' });
    }
};

// Заглушки для системных настроек и логов
export const getSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        // Заглушка для системных настроек
        const settings = {
            maintenanceMode: false,
            allowUserRegistration: true,
            defaultUserRole: 'USER',
            sessionTimeout: 60,
            maxFileSize: 10,
            allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'gif']
        };

        res.json(settings);
    } catch (error) {
        console.error('Ошибка при получении настроек:', error);
        res.status(500).json({ message: 'Ошибка при получении настроек' });
    }
};

export const updateSystemSettings = async (req: Request, res: Response): Promise<void> => {
    try {
        // Заглушка для обновления системных настроек
        const settings = req.body;
        
        // В реальном проекте здесь было бы сохранение в базу данных или конфиг файл
        res.json(settings);
    } catch (error) {
        console.error('Ошибка при обновлении настроек:', error);
        res.status(500).json({ message: 'Ошибка при обновлении настроек' });
    }
};

export const getSystemLogs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 50, level } = req.query;
        
        // Расширенная заглушка для системных логов с разными уровнями
        const allLogs = [
            {
                id: 1,
                level: 'INFO',
                message: 'Система успешно запущена',
                userId: null,
                userName: null,
                timestamp: new Date(Date.now() - 10000).toISOString(),
                action: 'SYSTEM_START',
                details: { version: '1.0.0' }
            },
            {
                id: 2,
                level: 'INFO',
                message: 'Пользователь успешно авторизован',
                userId: 1,
                userName: 'Admin User',
                timestamp: new Date(Date.now() - 30000).toISOString(),
                action: 'USER_LOGIN',
                details: { ip: '127.0.0.1' }
            },
            {
                id: 3,
                level: 'WARN',
                message: 'Попытка доступа к защищенному ресурсу',
                userId: 2,
                userName: 'Test User',
                timestamp: new Date(Date.now() - 60000).toISOString(),
                action: 'UNAUTHORIZED_ACCESS',
                details: { endpoint: '/admin/settings' }
            },
            {
                id: 4,
                level: 'ERROR',
                message: 'Ошибка подключения к базе данных',
                userId: null,
                userName: null,
                timestamp: new Date(Date.now() - 120000).toISOString(),
                action: 'DATABASE_ERROR',
                details: { error: 'Connection timeout' }
            },
            {
                id: 5,
                level: 'INFO',
                message: 'Создан новый проект',
                userId: 1,
                userName: 'Manager User',
                timestamp: new Date(Date.now() - 180000).toISOString(),
                action: 'PROJECT_CREATED',
                details: { projectId: 10, projectTitle: 'Новый проект' }
            },
            {
                id: 6,
                level: 'WARN',
                message: 'Превышен лимит неудачных попыток входа',
                userId: 3,
                userName: 'Unknown',
                timestamp: new Date(Date.now() - 240000).toISOString(),
                action: 'LOGIN_ATTEMPT_LIMIT',
                details: { ip: '192.168.1.100', attempts: 5 }
            },
            {
                id: 7,
                level: 'ERROR',
                message: 'Критическая ошибка при сохранении файла',
                userId: 2,
                userName: 'Test User',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                action: 'FILE_SAVE_ERROR',
                details: { filename: 'document.pdf', size: '5.2MB' }
            },
            {
                id: 8,
                level: 'INFO',
                message: 'Задача успешно создана',
                userId: 1,
                userName: 'Admin User',
                timestamp: new Date(Date.now() - 360000).toISOString(),
                action: 'TASK_CREATED',
                details: { taskId: 25, taskTitle: 'Новая задача' }
            }
        ];

        // Фильтрация по уровню, если указан
        let filteredLogs = allLogs;
        if (level && typeof level === 'string' && level.trim() !== '') {
            filteredLogs = allLogs.filter(log => log.level === level.toUpperCase());
        }

        // Простая пагинация
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 50;
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        
        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

        res.json(paginatedLogs);
    } catch (error) {
        console.error('Ошибка при получении логов:', error);
        res.status(500).json({ message: 'Ошибка при получении логов' });
    }
};

export const createBackup = async (req: Request, res: Response): Promise<void> => {
    try {
        // Создаем директорию для backup'ов если её нет
        const backupDir = path.join(process.cwd(), 'backups');
        try {
            await fs.access(backupDir);
        } catch {
            await fs.mkdir(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupId = `postmanager_backup_${timestamp}`;
        const backupFileName = `${backupId}.sql`;
        const backupFilePath = path.join(backupDir, backupFileName);

        // Создаем SQL дамп с помощью Prisma
        const sqlContent = await generateSQLBackup();
        
        // Записываем SQL в файл
        await fs.writeFile(backupFilePath, sqlContent, 'utf8');

        const downloadUrl = `http://localhost:3045/admin/backup/${backupId}/download`;

        res.json({ 
            backupId, 
            downloadUrl,
            fileName: backupFileName,
            message: 'Резервная копия успешно создана'
        });
    } catch (error) {
        console.error('Ошибка при создании резервной копии:', error);
        res.status(500).json({ 
            message: 'Ошибка при создании резервной копии',
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
        });
    }
};

// Функция для создания SQL backup через Prisma
async function generateSQLBackup(): Promise<string> {
    let sqlContent = `-- PostManager Database Backup
-- Created: ${new Date().toISOString()}
-- Generated by PostManager Admin Panel

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;

`;

    try {
        // Получаем данные из всех основных таблиц
        const [users, departments, projects, tasks, comments] = await Promise.all([
            prisma.user.findMany(),
            prisma.department.findMany(),
            prisma.project.findMany(),
            prisma.task.findMany(),
            prisma.comment.findMany()
        ]);

        // Добавляем данные пользователей
        if (users.length > 0) {
            sqlContent += `-- Users data\n`;
            for (const user of users) {
                const createdAt = user.createdAt ? user.createdAt.toISOString() : new Date().toISOString();
                const updatedAt = user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString();
                const departmentId = user.departmentId || 'NULL';
                const login = user.login?.replace(/'/g, "''") || '';
                const name = user.name?.replace(/'/g, "''") || '';
                const password = user.password?.replace(/'/g, "''") || '';
                sqlContent += `INSERT INTO "User" (id, login, name, password, role, "departmentId", "createdAt", "updatedAt") VALUES (${user.id}, '${login}', '${name}', '${password}', '${user.role}', ${departmentId}, '${createdAt}', '${updatedAt}');\n`;
            }
            sqlContent += '\n';
        }

        // Добавляем данные отделов
        if (departments.length > 0) {
            sqlContent += `-- Departments data\n`;
            for (const dept of departments) {
                const createdAt = dept.createdAt ? dept.createdAt.toISOString() : new Date().toISOString();
                const updatedAt = dept.updatedAt ? dept.updatedAt.toISOString() : new Date().toISOString();
                const name = dept.name?.replace(/'/g, "''") || '';
                sqlContent += `INSERT INTO "Department" (id, name, "createdAt", "updatedAt") VALUES (${dept.id}, '${name}', '${createdAt}', '${updatedAt}');\n`;
            }
            sqlContent += '\n';
        }

        // Добавляем данные проектов
        if (projects.length > 0) {
            sqlContent += `-- Projects data\n`;
            for (const project of projects) {
                const createdAt = project.createdAt ? project.createdAt.toISOString() : new Date().toISOString();
                const updatedAt = project.updatedAt ? project.updatedAt.toISOString() : new Date().toISOString();
                const title = project.title?.replace(/'/g, "''") || '';
                const description = project.description?.replace(/'/g, "''") || '';
                sqlContent += `INSERT INTO "Project" (id, title, description, status, "authorId", "departmentId", "createdAt", "updatedAt") VALUES (${project.id}, '${title}', '${description}', '${project.status}', ${project.authorId}, ${project.departmentId}, '${createdAt}', '${updatedAt}');\n`;
            }
            sqlContent += '\n';
        }

        // Добавляем данные задач
        if (tasks.length > 0) {
            sqlContent += `-- Tasks data\n`;
            for (const task of tasks) {
                const createdAt = task.createdAt ? task.createdAt.toISOString() : new Date().toISOString();
                const updatedAt = task.updatedAt ? task.updatedAt.toISOString() : new Date().toISOString();
                const dueDate = task.dueDate ? `'${task.dueDate.toISOString()}'` : 'NULL';
                const assigneeId = task.assigneeId || 'NULL';
                const title = task.title?.replace(/'/g, "''") || '';
                const description = task.description?.replace(/'/g, "''") || '';
                sqlContent += `INSERT INTO "Task" (id, title, description, status, priority, "projectId", "authorId", "assigneeId", "dueDate", "createdAt", "updatedAt") VALUES (${task.id}, '${title}', '${description}', '${task.status}', '${task.priority}', ${task.projectId}, ${task.authorId}, ${assigneeId}, ${dueDate}, '${createdAt}', '${updatedAt}');\n`;
            }
            sqlContent += '\n';
        }

        // Добавляем данные комментариев
        if (comments.length > 0) {
            sqlContent += `-- Comments data\n`;
            for (const comment of comments) {
                const createdAt = comment.createdAt ? comment.createdAt.toISOString() : new Date().toISOString();
                const updatedAt = comment.updatedAt ? comment.updatedAt.toISOString() : new Date().toISOString();
                const content = comment.content?.replace(/'/g, "''") || '';
                sqlContent += `INSERT INTO "Comment" (id, content, "taskId", "authorId", "createdAt", "updatedAt") VALUES (${comment.id}, '${content}', ${comment.taskId}, ${comment.authorId}, '${createdAt}', '${updatedAt}');\n`;
            }
            sqlContent += '\n';
        }

        // Обновляем последовательности
        sqlContent += `-- Update sequences\n`;
        if (users.length > 0) {
            const maxUserId = Math.max(...users.map(u => u.id));
            sqlContent += `SELECT setval('"User_id_seq"', ${maxUserId}, true);\n`;
        }
        if (departments.length > 0) {
            const maxDeptId = Math.max(...departments.map(d => d.id));
            sqlContent += `SELECT setval('"Department_id_seq"', ${maxDeptId}, true);\n`;
        }
        if (projects.length > 0) {
            const maxProjectId = Math.max(...projects.map(p => p.id));
            sqlContent += `SELECT setval('"Project_id_seq"', ${maxProjectId}, true);\n`;
        }
        if (tasks.length > 0) {
            const maxTaskId = Math.max(...tasks.map(t => t.id));
            sqlContent += `SELECT setval('"Task_id_seq"', ${maxTaskId}, true);\n`;
        }
        if (comments.length > 0) {
            const maxCommentId = Math.max(...comments.map(c => c.id));
            sqlContent += `SELECT setval('"Comment_id_seq"', ${maxCommentId}, true);\n`;
        }

        sqlContent += `\n-- Backup completed successfully\n-- Total records: ${users.length + departments.length + projects.length + tasks.length + comments.length}\n`;

    } catch (error) {
        console.error('Ошибка при генерации SQL:', error);
        sqlContent += `-- ERROR: Failed to generate complete backup\n-- Error: ${error}\n`;
    }

    return sqlContent;
}

// Скачивание резервной копии
export const downloadBackup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { backupId } = req.params;
        
        // Путь к файлу резервной копии
        const backupDir = path.join(process.cwd(), 'backups');
        const backupFileName = `${backupId}.sql`;
        const backupFilePath = path.join(backupDir, backupFileName);

        // Проверяем существование файла
        try {
            await fs.access(backupFilePath);
        } catch {
            return res.status(404).json({ message: 'Файл резервной копии не найден' });
        }

        // Получаем информацию о файле
        const stats = await fs.stat(backupFilePath);
        const fileSize = stats.size;

        // Устанавливаем заголовки для скачивания файла
        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${backupFileName}"`);
        res.setHeader('Content-Length', fileSize);

        // Создаем поток для чтения файла
        const fileStream = fsSync.createReadStream(backupFilePath);
        
        // Отправляем файл пользователю
        fileStream.pipe(res);

        // Обработка ошибок потока
        fileStream.on('error', (error: Error) => {
            console.error('Ошибка при чтении файла резервной копии:', error);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Ошибка при скачивании файла' });
            }
        });

        // Удаляем файл после скачивания (опционально, через час)
        setTimeout(async () => {
            try {
                await fs.unlink(backupFilePath);
                console.log(`Файл резервной копии ${backupFileName} удален`);
            } catch (error) {
                console.error('Ошибка при удалении файла резервной копии:', error);
            }
        }, 60 * 60 * 1000); // 1 час

    } catch (error) {
        console.error('Ошибка при скачивании резервной копии:', error);
        res.status(500).json({ message: 'Ошибка при скачивании резервной копии' });
    }
};

export const clearCache = async (req: Request, res: Response): Promise<void> => {
    try {
        // Заглушка для очистки кэша
        res.status(200).json({ message: 'Кэш успешно очищен' });
    } catch (error) {
        console.error('Ошибка при очистке кэша:', error);
        res.status(500).json({ message: 'Ошибка при очистке кэша' });
    }
};

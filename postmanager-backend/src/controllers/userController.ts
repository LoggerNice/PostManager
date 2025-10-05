import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                login: true,
                name: true,
                role: true,
                departmentId: true,
                createdAt: true,
                updatedAt: true,
                department: {
                    select: { id: true, name: true }
                }
            }
        });





        res.json(users);
    } catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ message: 'Ошибка при получении пользователей' });
    }
}

export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
    const { userId } = req.params;
        const user = await prisma.user.findUnique({ 
            where: { id: parseInt(userId) },
            select: {
                id: true,
                login: true,
                name: true,
                role: true,
                departmentId: true,
                createdAt: true,
                updatedAt: true,
                department: {
                    select: { id: true, name: true }
                }
            }
        });
        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }
        res.json(user);
    } catch (error) {
        console.error('Ошибка при получении пользователя:', error);
        res.status(500).json({ message: 'Ошибка при получении пользователя' });
    }
}   

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            res.status(400).json({ message: 'Логин и пароль обязательны' });
            return;
        }
        const user = await prisma.user.findUnique({ 
            where: { login },
            include: {
                department: true
            }
        });
        if (!user) {
            res.status(401).json({ message: 'Неверный логин или пароль' });
            return;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            res.status(401).json({ message: 'Неверный логин или пароль' });
            return;
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET не настроен');
        }

        const tokenPayload = {
            userId: user.id,
            login: user.login,
            name: user.name,
            role: user.role,
            departmentId: user.departmentId
        };
        
        const accessToken = jwt.sign(tokenPayload, process.env.JWT_SECRET);
        
        res.status(200).json({ 
            token: accessToken, 
            user: {
                id: user.id,
                name: user.name,
                login: user.login,
                role: user.role,
                departmentId: user.departmentId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ message: 'Ошибка при входе' });
    }
}

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { login, name, password, role, departmentId } = req.body;

        if (!login || !name || !password || !departmentId) {
            res.status(400).json({ message: 'Логин, имя, отдел и пароль обязательны' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await prisma.user.findUnique({ where: { login } });
        if (existingUser) {
            res.status(400).json({ message: 'Пользователь с таким логином уже существует' });
            return;
        }

        const user = await prisma.user.create({ 
            data: { login, name, role, password: hashedPassword, departmentId: parseInt(departmentId) },
            select: {
                id: true,
                login: true,
                name: true,
                departmentId: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        });
        res.json(user);
    } catch (error) {
        console.error('Ошибка при регистрации:', error);    
        res.status(400).json({ message: 'Ошибка при регистрации' });
    }
}

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { login, name, departmentId, currentPassword, newPassword } = req.body;
        
        // Проверяем, что пользователь обновляет только свой профиль
        const requestedUserId = parseInt(userId);
        const authenticatedUserId = req.user?.id;
        
        if (requestedUserId !== authenticatedUserId) {
            res.status(403).json({ message: 'Вы можете обновлять только свой собственный профиль' });
            return;
        }

        // Если нужно обновить пароль
        if (currentPassword && newPassword) {
            const user = await prisma.user.findUnique({ where: { id: requestedUserId } });
            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                res.status(400).json({ message: 'Неверный текущий пароль' });
                return;
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            
            const updatedUser = await prisma.user.update({
                where: { id: requestedUserId },
                data: { 
                    login, 
                    name, 
                    departmentId: departmentId ? parseInt(departmentId) : undefined,
                    password: hashedNewPassword
                },
                select: {
                    id: true,
                    login: true,
                    name: true,
                    role: true,
                    departmentId: true,
                    createdAt: true,
                    updatedAt: true,
                    department: { select: { id: true, name: true } }
                }
            });

            res.json(updatedUser);
        } else {
            const updatedUser = await prisma.user.update({
                where: { id: requestedUserId },
                data: { 
                    login, 
                    name, 
                    departmentId: departmentId ? parseInt(departmentId) : undefined
                },
                select: {
                    id: true,
                    login: true,
                    name: true,
                    role: true,
                    departmentId: true,
                    createdAt: true,
                    updatedAt: true,
                    department: { select: { id: true, name: true } }
                }
            });

            res.json(updatedUser);
        }
    } catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
    }
}


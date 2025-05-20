import prisma from '../utils/prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
export const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    }
    catch (error) {
        console.error('Ошибка при получении пользователей:', error);
        res.status(500).json({ message: 'Ошибка при получении пользователей' });
    }
};
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
        if (!user) {
            res.status(404).json({ message: 'Пользователь не найден' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('Ошибка при получении пользователя:', error);
        res.status(500).json({ message: 'Ошибка при получении пользователя' });
    }
};
export const login = async (req, res) => {
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
        const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
        res.status(200).json({ accessToken, user });
    }
    catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({ message: 'Ошибка при входе' });
    }
};
export const register = async (req, res) => {
    try {
        const { login, name, password, departmentId } = req.body;
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
            data: { login, name, password: hashedPassword, departmentId: parseInt(departmentId) },
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
    }
    catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(400).json({ message: 'Ошибка при регистрации' });
    }
};
export const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { login, name, departmentId } = req.body;
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { login, name, departmentId: parseInt(departmentId) }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        res.status(500).json({ message: 'Ошибка при обновлении пользователя' });
    }
};

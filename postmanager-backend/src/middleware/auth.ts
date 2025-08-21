import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

interface JwtPayload {
    userId: number;
    login: string;
    name: string;
    role: string;
    departmentId?: number;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({ message: 'Токен доступа отсутствует' });
            return;
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
        
        try {
            const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
            
            // Добавляем информацию о пользователе в req
            req.user = {
                id: decoded.userId,
                login: decoded.login,
                name: decoded.name,
                role: decoded.role,
                departmentId: decoded.departmentId
            };
            
            next();
        } catch (jwtError) {
            res.status(403).json({ message: 'Недействительный токен доступа' });
            return;
        }
    } catch (error) {
        console.error('Ошибка при проверке токена:', error);
        res.status(500).json({ message: 'Ошибка сервера при проверке токена' });
    }
};

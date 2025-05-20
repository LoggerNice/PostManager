import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

export const createComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, taskId, authorId } = req.body;
        const comment = await prisma.comment.create({
            data: {
                content,
                taskId: parseInt(taskId),
                authorId: parseInt(authorId),
            },
        });
        res.status(200).json(comment);
    } catch (error) {
        console.error('Ошибка при создании комментария:', error);
        res.status(500).json({ message: 'Ошибка при создании комментария' });
    }
}

export const getComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const comments = await prisma.comment.findMany();
        res.status(200).json(comments);
    } catch (error) {
        console.error('Ошибка при получении комментариев:', error);
        res.status(500).json({ message: 'Ошибка при получении комментариев' });
    }
}

export const getCommentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const comment = await prisma.comment.findUnique({ where: { id: parseInt(commentId) } });
        if (!comment) {
            res.status(404).json({ message: 'Комментарий не найден' });
            return;
        }
        res.status(200).json(comment);
    } catch (error) {
        console.error('Ошибка при получении комментария:', error);
        res.status(500).json({ message: 'Ошибка при получении комментария' });
    }
}

export const updateComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const updatedComment = await prisma.comment.update({
            where: { id: parseInt(commentId) },
            data: { content },
        });
        res.status(200).json(updatedComment);
    } catch (error) {
        console.error('Ошибка при обновлении комментария:', error);
        res.status(500).json({ message: 'Ошибка при обновлении комментария' });
    }
}

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        await prisma.comment.delete({ where: { id: parseInt(commentId) } });
        res.status(200).json({ message: 'Комментарий удален' });
    } catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        res.status(500).json({ message: 'Ошибка при удалении комментария' });
    }
}

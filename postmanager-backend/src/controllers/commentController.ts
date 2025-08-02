import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { getWebSocketServer } from '../websocketServer.js';

export const createComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, taskId, authorId } = req.body;
        const comment = await prisma.comment.create({
            data: {
                content,
                taskId: parseInt(taskId),
                authorId: parseInt(authorId),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        // Отправляем уведомление о новом комментарии участникам задачи
        const wsServer = getWebSocketServer();
        if (wsServer) {
            // Получаем информацию о задаче для уведомления
            const task = await prisma.task.findUnique({
                where: { id: parseInt(taskId) },
                include: {
                    project: true
                }
            });

            if (task) {
                // Получаем всех участников проекта для отправки уведомлений
                const projectWithUsers = await prisma.project.findUnique({
                    where: { id: task.projectId! },
                    include: {
                        users: {
                            select: { id: true }
                        }
                    }
                });

                const projectUsers = projectWithUsers?.users || [];

                // Отправляем уведомление всем участникам проекта (кроме автора комментария)
                if (projectUsers.length > 0) {
                    projectUsers.forEach(projectUser => {
                        // Не отправляем уведомление автору комментария
                        if (projectUser.id !== parseInt(authorId)) {
                            wsServer.sendNotificationToUser(projectUser.id, {
                                type: 'comment_added',
                                title: task.project?.title || 'Неизвестный проект',
                                message: `${comment.author?.name || 'Пользователь'} добавил комментарий к задаче "${task.title}"`,
                                taskId: parseInt(taskId),
                                projectId: task.projectId!,
                                userId: parseInt(authorId),
                                timestamp: new Date().toISOString()
                            });
                        }
                    });
                }
            }
        }

        res.status(200).json(comment);
    } catch (error) {
        console.error('Ошибка при создании комментария:', error);
        res.status(500).json({ message: 'Ошибка при создании комментария' });
    }
}

export const getComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId } = req.query;
        
        const whereClause = taskId ? { taskId: parseInt(taskId as string) } : {};
        
        const comments = await prisma.comment.findMany({
            where: whereClause,
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        
        res.status(200).json(comments);
    } catch (error) {
        console.error('Ошибка при получении комментариев:', error);
        res.status(500).json({ message: 'Ошибка при получении комментариев' });
    }
}

export const getCommentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const comment = await prisma.comment.findUnique({ 
            where: { id: parseInt(commentId) },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });
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
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        department: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
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

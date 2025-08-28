import type { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { getWebSocketServer } from '../websocketServer.js';
import { deleteFileByUrl } from './fileController.js';

export const createComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { content, taskId, authorId, fileUrl, fileName, fileSize, isSolution } = req.body;
        const comment = await prisma.comment.create({
            data: {
                content,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileSize: fileSize ? parseInt(fileSize) : null,
                isSolution: isSolution || false,
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
        
        // Добавляем валидацию
        if (!commentId) {
            res.status(400).json({ message: 'ID комментария не указан' });
            return;
        }
        
        const parsedId = parseInt(commentId);
        if (isNaN(parsedId)) {
            res.status(400).json({ message: 'Неверный формат ID комментария' });
            return;
        }
        
        const comment = await prisma.comment.findUnique({ 
            where: { id: parsedId },
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
        const { content, fileUrl, fileName, fileSize } = req.body;
        
        // Получаем текущий комментарий для проверки старого файла
        const currentComment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) },
            select: { fileUrl: true }
        });
        
        if (!currentComment) {
            res.status(404).json({ message: 'Комментарий не найден' });
            return;
        }
        
        // Подготавливаем данные для обновления
        const updateData: any = {};
        if (content !== undefined) updateData.content = content;
        if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
        if (fileName !== undefined) updateData.fileName = fileName;
        if (fileSize !== undefined) updateData.fileSize = fileSize ? parseInt(fileSize) : null;
        
        // Если файл убирается или заменяется, удаляем старый файл
        if (fileUrl === null || (fileUrl !== undefined && fileUrl !== currentComment.fileUrl)) {
            if (currentComment.fileUrl) {
                try {
                    await deleteFileByUrl(currentComment.fileUrl);
                } catch (error) {
                    console.warn('Не удалось удалить старый файл:', error);
                }
            }
        }
        
        // Если файл убирается (fileUrl = null), очищаем все связанные поля
        if (fileUrl === null) {
            updateData.fileUrl = null;
            updateData.fileName = null;
            updateData.fileSize = null;
        }
        
        const updatedComment = await prisma.comment.update({
            where: { id: parseInt(commentId) },
            data: updateData,
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
        
        // Логируем обновление для отладки
        console.log('Комментарий обновлен:', {
            commentId,
            content: content !== undefined ? 'обновлен' : 'не изменен',
            file: fileUrl !== undefined ? 'обновлен' : 'не изменен',
            fileName: fileName || 'не указан',
            oldFileRemoved: currentComment.fileUrl && (fileUrl === null || fileUrl !== currentComment.fileUrl)
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

// Отметить комментарий как просмотренный
export const markCommentAsViewed = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const { userId } = req.body;
        
        if (!commentId || !userId) {
            res.status(400).json({ message: 'Не указаны commentId или userId' });
            return;
        }

        // Проверяем, существует ли уже запись о просмотре
        const existingView = await prisma.commentView.findUnique({
            where: {
                commentId_userId: {
                    commentId: parseInt(commentId),
                    userId: parseInt(userId)
                }
            }
        });

        if (!existingView) {
            // Создаем новую запись о просмотре
            await prisma.commentView.create({
                data: {
                    commentId: parseInt(commentId),
                    userId: parseInt(userId)
                }
            });
        } else {
            // Обновляем время просмотра, если запись уже существует
            await prisma.commentView.update({
                where: {
                    commentId_userId: {
                        commentId: parseInt(commentId),
                        userId: parseInt(userId)
                    }
                },
                data: {
                    viewedAt: new Date()
                }
            });
        }

        res.status(200).json({ message: 'Комментарий отмечен как просмотренный' });
    } catch (error) {
        console.error('Ошибка при отметке комментария как просмотренного:', error);
        res.status(500).json({ message: 'Ошибка при отметке комментария как просмотренного' });
    }
}

// Получить статистику просмотров для нескольких комментариев
export const getCommentViewStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentIds } = req.query;
        
        if (!commentIds) {
            res.status(400).json({ message: 'Не указаны ID комментариев' });
            return;
        }
        
        const commentIdArray = (commentIds as string).split(',').map(id => parseInt(id));
        
        // Получаем все комментарии с их задачами, участниками и просмотрами
        const comments = await prisma.comment.findMany({
            where: { id: { in: commentIdArray } },
            include: {
                task: {
                    include: {
                        assignees: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                },
                views: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        
        const viewStatsArray = comments.map(comment => {
            // Получаем всех участников задачи
            const taskAssignees = comment.task?.assignees || [];
            const totalAssignees = taskAssignees.length;
            
            // Получаем реальные просмотры из базы данных
            const viewers = comment.views.map(view => ({
                userId: view.user.id,
                userName: view.user.name,
                viewedAt: view.viewedAt.toISOString()
            }));
            
            const viewedAssignees = viewers.length;
            
            // Определяем статус просмотра
            let viewStatus: 'none' | 'partial' | 'all' = 'none';
            if (totalAssignees === 0) {
                // Если нет назначенных исполнителей, считаем сообщение прочитанным
                viewStatus = 'all';
            } else if (viewedAssignees > 0 && viewedAssignees < totalAssignees) {
                viewStatus = 'partial';
            } else if (viewedAssignees === totalAssignees && totalAssignees > 0) {
                viewStatus = 'all';
            }
            
            return {
                commentId: comment.id,
                totalAssignees: totalAssignees || 1, // Минимум 1 для корректного отображения
                viewedAssignees: totalAssignees === 0 ? 1 : viewedAssignees,
                viewStatus,
                viewers,
                assignees: taskAssignees.map(assignee => ({
                    userId: assignee.user.id,
                    userName: assignee.user.name,
                    hasViewed: viewers.some(viewer => viewer.userId === assignee.user.id)
                }))
            };
        });
        
        res.status(200).json(viewStatsArray);
    } catch (error) {
        console.error('Ошибка при получении статистики просмотров:', error);
        res.status(500).json({ message: 'Ошибка при получении статистики просмотров' });
    }
}

export const markCommentAsSolution = async (req: Request, res: Response): Promise<void> => {
    try {
        const { commentId } = req.params;
        const { isSolution } = req.body;
        
        if (!commentId) {
            res.status(400).json({ message: 'ID комментария не указан' });
            return;
        }
        
        // Сначала убираем пометку "решение" с других комментариев этой задачи
        const comment = await prisma.comment.findUnique({
            where: { id: parseInt(commentId) }
        });
        
        if (!comment) {
            res.status(404).json({ message: 'Комментарий не найден' });
            return;
        }
        
        if (isSolution && comment.taskId) {
            // Убираем пометку "решение" с других комментариев этой задачи
            await prisma.comment.updateMany({
                where: { 
                    taskId: comment.taskId,
                    id: { not: parseInt(commentId) }
                },
                data: { isSolution: false }
            });
        }
        
        // Обновляем комментарий
        const updatedComment = await prisma.comment.update({
            where: { id: parseInt(commentId) },
            data: { isSolution: isSolution || false },
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
        console.error('Ошибка при пометке комментария как решения:', error);
        res.status(500).json({ message: 'Ошибка при пометке комментария как решения' });
    }
}
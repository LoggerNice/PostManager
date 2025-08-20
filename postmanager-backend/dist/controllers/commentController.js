import prisma from '../utils/prisma.js';
import { getWebSocketServer } from '../websocketServer.js';
export const createComment = async (req, res) => {
    try {
        const { content, taskId, authorId, fileUrl, fileName, fileSize } = req.body;
        const comment = await prisma.comment.create({
            data: {
                content,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                fileSize: fileSize ? parseInt(fileSize) : null,
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
        const wsServer = getWebSocketServer();
        if (wsServer) {
            const task = await prisma.task.findUnique({
                where: { id: parseInt(taskId) },
                include: {
                    project: true
                }
            });
            if (task) {
                const projectWithUsers = await prisma.project.findUnique({
                    where: { id: task.projectId },
                    include: {
                        users: {
                            select: { id: true }
                        }
                    }
                });
                const projectUsers = projectWithUsers?.users || [];
                if (projectUsers.length > 0) {
                    projectUsers.forEach(projectUser => {
                        if (projectUser.id !== parseInt(authorId)) {
                            wsServer.sendNotificationToUser(projectUser.id, {
                                type: 'comment_added',
                                title: task.project?.title || 'Неизвестный проект',
                                message: `${comment.author?.name || 'Пользователь'} добавил комментарий к задаче "${task.title}"`,
                                taskId: parseInt(taskId),
                                projectId: task.projectId,
                                userId: parseInt(authorId),
                                timestamp: new Date().toISOString()
                            });
                        }
                    });
                }
            }
        }
        res.status(200).json(comment);
    }
    catch (error) {
        console.error('Ошибка при создании комментария:', error);
        res.status(500).json({ message: 'Ошибка при создании комментария' });
    }
};
export const getComments = async (req, res) => {
    try {
        const { taskId } = req.query;
        const whereClause = taskId ? { taskId: parseInt(taskId) } : {};
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
    }
    catch (error) {
        console.error('Ошибка при получении комментариев:', error);
        res.status(500).json({ message: 'Ошибка при получении комментариев' });
    }
};
export const getCommentById = async (req, res) => {
    try {
        const { commentId } = req.params;
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
    }
    catch (error) {
        console.error('Ошибка при получении комментария:', error);
        res.status(500).json({ message: 'Ошибка при получении комментария' });
    }
};
export const updateComment = async (req, res) => {
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
    }
    catch (error) {
        console.error('Ошибка при обновлении комментария:', error);
        res.status(500).json({ message: 'Ошибка при обновлении комментария' });
    }
};
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        await prisma.comment.delete({ where: { id: parseInt(commentId) } });
        res.status(200).json({ message: 'Комментарий удален' });
    }
    catch (error) {
        console.error('Ошибка при удалении комментария:', error);
        res.status(500).json({ message: 'Ошибка при удалении комментария' });
    }
};
export const markCommentAsViewed = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { userId } = req.body;
        if (!commentId || !userId) {
            res.status(400).json({ message: 'Не указаны commentId или userId' });
            return;
        }
        const existingView = await prisma.commentView.findUnique({
            where: {
                commentId_userId: {
                    commentId: parseInt(commentId),
                    userId: parseInt(userId)
                }
            }
        });
        if (!existingView) {
            await prisma.commentView.create({
                data: {
                    commentId: parseInt(commentId),
                    userId: parseInt(userId)
                }
            });
        }
        else {
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
    }
    catch (error) {
        console.error('Ошибка при отметке комментария как просмотренного:', error);
        res.status(500).json({ message: 'Ошибка при отметке комментария как просмотренного' });
    }
};
export const getCommentViewStats = async (req, res) => {
    try {
        const { commentIds } = req.query;
        if (!commentIds) {
            res.status(400).json({ message: 'Не указаны ID комментариев' });
            return;
        }
        const commentIdArray = commentIds.split(',').map(id => parseInt(id));
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
            const taskAssignees = comment.task?.assignees || [];
            const totalAssignees = taskAssignees.length;
            const viewers = comment.views.map(view => ({
                userId: view.user.id,
                userName: view.user.name,
                viewedAt: view.viewedAt.toISOString()
            }));
            const viewedAssignees = viewers.length;
            let viewStatus = 'none';
            if (totalAssignees === 0) {
                viewStatus = 'all';
            }
            else if (viewedAssignees > 0 && viewedAssignees < totalAssignees) {
                viewStatus = 'partial';
            }
            else if (viewedAssignees === totalAssignees && totalAssignees > 0) {
                viewStatus = 'all';
            }
            return {
                commentId: comment.id,
                totalAssignees: totalAssignees || 1,
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
    }
    catch (error) {
        console.error('Ошибка при получении статистики просмотров:', error);
        res.status(500).json({ message: 'Ошибка при получении статистики просмотров' });
    }
};
//# sourceMappingURL=commentController.js.map
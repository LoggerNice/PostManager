import prisma from '../utils/prisma.js';
import { getTaskOrderBy } from '../utils/taskUtils';
export const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, projectId, deadline, order, assigneeIds } = req.body;
        console.log('createTask called with:');
        console.log('body:', req.body);
        if (!projectId) {
            res.status(400).json({ message: 'ID проекта обязателен' });
            return;
        }
        let taskOrder = order;
        if (taskOrder === undefined || taskOrder === null) {
            const maxOrderTask = await prisma.task.findFirst({
                where: {
                    projectId: parseInt(projectId),
                    status: status
                },
                orderBy: {
                    order: 'desc'
                }
            });
            taskOrder = (maxOrderTask && maxOrderTask.order !== null) ? (maxOrderTask.order + 1) : 0;
        }
        else {
            const existingTask = await prisma.task.findFirst({
                where: {
                    projectId: parseInt(projectId),
                    status: status,
                    order: taskOrder
                }
            });
            if (existingTask) {
                await prisma.task.updateMany({
                    where: {
                        projectId: parseInt(projectId),
                        status: status,
                        order: {
                            gte: taskOrder
                        }
                    },
                    data: {
                        order: {
                            increment: 1
                        }
                    }
                });
            }
        }
        console.log('Calculated order:', taskOrder);
        const task = await prisma.task.create({
            data: {
                title,
                description,
                status,
                priority,
                order: taskOrder,
                deadline: deadline ? new Date(deadline) : null,
                project: {
                    connect: { id: parseInt(projectId) }
                }
            },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        console.log('Created task:', task);
        if (assigneeIds && Array.isArray(assigneeIds) && assigneeIds.length > 0) {
            await prisma.taskAssignee.createMany({
                data: assigneeIds.map((userId) => ({
                    taskId: task.id,
                    userId: Number(userId)
                })),
                skipDuplicates: true
            });
        }
        const taskWithAssignees = await prisma.task.findUnique({
            where: { id: task.id },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.status(201).json(taskWithAssignees);
    }
    catch (error) {
        console.error('Ошибка при создании задачи:', error);
        res.status(500).json({ message: 'Ошибка при создании задачи' });
    }
};
export const getTasks = async (req, res) => {
    try {
        console.log('Getting tasks with orderBy:', getTaskOrderBy());
        const tasks = await prisma.task.findMany({
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: getTaskOrderBy()
        });
        console.log('Tasks retrieved:', tasks.length, 'tasks');
        console.log('First few tasks priorities:', tasks.slice(0, 3).map(t => ({ id: t.id, title: t.title, priority: t.priority })));
        res.json(tasks);
    }
    catch (error) {
        console.error('Ошибка при получении задач:', error);
        res.status(500).json({ message: 'Ошибка при получении задач' });
    }
};
export const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        res.json(task);
    }
    catch (error) {
        console.error('Ошибка при получении задачи:', error);
        res.status(500).json({ message: 'Ошибка при получении задачи' });
    }
};
export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, status, priority, deadline, order, assigneeIds } = req.body;
        const taskIdNum = parseInt(taskId);
        if (isNaN(taskIdNum)) {
            res.status(400).json({ message: 'Неверный ID задачи' });
            return;
        }
        const currentTask = await prisma.task.findUnique({
            where: { id: taskIdNum }
        });
        if (!currentTask) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (description !== undefined)
            updateData.description = description;
        if (priority !== undefined)
            updateData.priority = priority;
        if (deadline !== undefined) {
            updateData.deadline = deadline ? new Date(deadline) : null;
        }
        const newStatus = status !== undefined ? status : currentTask.status;
        const newOrder = order !== undefined ? order : currentTask.order;
        if (status !== undefined && status !== currentTask.status) {
            await prisma.task.updateMany({
                where: {
                    projectId: currentTask.projectId,
                    status: currentTask.status,
                    order: {
                        gt: currentTask.order || 0
                    }
                },
                data: {
                    order: {
                        decrement: 1
                    }
                }
            });
            const maxOrderTask = await prisma.task.findFirst({
                where: {
                    projectId: currentTask.projectId,
                    status: newStatus
                },
                orderBy: {
                    order: 'desc'
                }
            });
            updateData.order = (maxOrderTask && maxOrderTask.order !== null) ? (maxOrderTask.order + 1) : 0;
            updateData.status = newStatus;
        }
        else if (order !== undefined && order !== currentTask.order) {
            const existingTask = await prisma.task.findFirst({
                where: {
                    projectId: currentTask.projectId,
                    status: newStatus,
                    order: newOrder,
                    id: {
                        not: taskIdNum
                    }
                }
            });
            if (existingTask) {
                if (newOrder > (currentTask.order || 0)) {
                    await prisma.task.updateMany({
                        where: {
                            projectId: currentTask.projectId,
                            status: newStatus,
                            order: {
                                gt: currentTask.order || 0,
                                lte: newOrder
                            }
                        },
                        data: {
                            order: {
                                decrement: 1
                            }
                        }
                    });
                }
                else {
                    await prisma.task.updateMany({
                        where: {
                            projectId: currentTask.projectId,
                            status: newStatus,
                            order: {
                                gte: newOrder,
                                lt: currentTask.order || 0
                            }
                        },
                        data: {
                            order: {
                                increment: 1
                            }
                        }
                    });
                }
            }
            updateData.order = newOrder;
        }
        console.log('updateData:', updateData);
        const updatedTask = await prisma.task.update({
            where: { id: taskIdNum },
            data: updateData,
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (assigneeIds && Array.isArray(assigneeIds)) {
            await prisma.taskAssignee.deleteMany({ where: { taskId: taskIdNum } });
            if (assigneeIds.length > 0) {
                await prisma.taskAssignee.createMany({
                    data: assigneeIds.map((userId) => ({
                        taskId: taskIdNum,
                        userId: Number(userId)
                    })),
                    skipDuplicates: true
                });
            }
        }
        const taskWithAssignees = await prisma.task.findUnique({
            where: { id: taskIdNum },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json(taskWithAssignees);
    }
    catch (error) {
        console.error('Ошибка при обновлении задачи:', error);
        res.status(500).json({ message: 'Ошибка при обновлении задачи' });
    }
};
export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const taskIdNum = parseInt(taskId);
        if (isNaN(taskIdNum)) {
            res.status(400).json({ message: 'Неверный ID задачи' });
            return;
        }
        const taskToDelete = await prisma.task.findUnique({
            where: { id: taskIdNum }
        });
        if (!taskToDelete) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        await prisma.task.delete({ where: { id: taskIdNum } });
        await prisma.task.updateMany({
            where: {
                projectId: taskToDelete.projectId,
                status: taskToDelete.status,
                order: {
                    gt: taskToDelete.order || 0
                }
            },
            data: {
                order: {
                    decrement: 1
                }
            }
        });
        console.log(`Task ${taskIdNum} deleted, order adjusted for remaining tasks`);
        res.status(200).json({ message: 'Задача удалена' });
    }
    catch (error) {
        console.error('Ошибка при удалении задачи:', error);
        res.status(500).json({ message: 'Ошибка при удалении задачи' });
    }
};
export const getTaskComments = async (req, res) => {
    try {
        const { taskId } = req.params;
        const comments = await prisma.comment.findMany({
            where: { taskId: parseInt(taskId) },
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
        console.error('Ошибка при получении комментариев задачи:', error);
        res.status(500).json({ message: 'Ошибка при получении комментариев задачи' });
    }
};
export const addTaskAssignees = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userIds } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ message: 'Список ID пользователей обязателен' });
            return;
        }
        const task = await prisma.task.findUnique({
            where: { id: parseInt(taskId) }
        });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        const users = await prisma.user.findMany({
            where: {
                id: {
                    in: userIds.map((id) => parseInt(id.toString()))
                }
            }
        });
        if (users.length !== userIds.length) {
            res.status(400).json({ message: 'Некоторые пользователи не найдены' });
            return;
        }
        const assignees = await prisma.taskAssignee.createMany({
            data: userIds.map((userId) => ({
                taskId: parseInt(taskId),
                userId: parseInt(userId.toString())
            })),
            skipDuplicates: true
        });
        const updatedTask = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json(updatedTask);
    }
    catch (error) {
        console.error('Ошибка при добавлении исполнителей:', error);
        res.status(500).json({ message: 'Ошибка при добавлении исполнителей' });
    }
};
export const removeTaskAssignees = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userIds } = req.body;
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({ message: 'Список ID пользователей обязателен' });
            return;
        }
        const task = await prisma.task.findUnique({
            where: { id: parseInt(taskId) }
        });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        await prisma.taskAssignee.deleteMany({
            where: {
                taskId: parseInt(taskId),
                userId: {
                    in: userIds.map((id) => parseInt(id.toString()))
                }
            }
        });
        const updatedTask = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json(updatedTask);
    }
    catch (error) {
        console.error('Ошибка при удалении исполнителей:', error);
        res.status(500).json({ message: 'Ошибка при удалении исполнителей' });
    }
};
export const getTaskAssignees = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        res.status(200).json(task.assignees);
    }
    catch (error) {
        console.error('Ошибка при получении исполнителей задачи:', error);
        res.status(500).json({ message: 'Ошибка при получении исполнителей задачи' });
    }
};
export const updateTaskAssignees = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userIds } = req.body;
        const task = await prisma.task.findUnique({
            where: { id: parseInt(taskId) }
        });
        if (!task) {
            res.status(404).json({ message: 'Задача не найдена' });
            return;
        }
        await prisma.taskAssignee.deleteMany({
            where: { taskId: parseInt(taskId) }
        });
        if (userIds && Array.isArray(userIds) && userIds.length > 0) {
            const users = await prisma.user.findMany({
                where: {
                    id: {
                        in: userIds.map((id) => parseInt(id.toString()))
                    }
                }
            });
            if (users.length !== userIds.length) {
                res.status(400).json({ message: 'Некоторые пользователи не найдены' });
                return;
            }
            await prisma.taskAssignee.createMany({
                data: userIds.map((userId) => ({
                    taskId: parseInt(taskId),
                    userId: parseInt(userId.toString())
                }))
            });
        }
        const updatedTask = await prisma.task.findUnique({
            where: { id: parseInt(taskId) },
            include: {
                assignees: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                department: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.status(200).json(updatedTask);
    }
    catch (error) {
        console.error('Ошибка при обновлении исполнителей задачи:', error);
        res.status(500).json({ message: 'Ошибка при обновлении исполнителей задачи' });
    }
};
//# sourceMappingURL=taskController.js.map
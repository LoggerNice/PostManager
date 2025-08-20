import prisma from '../utils/prisma.js';
import { getTaskOrderBy } from '../utils/taskUtils.js';
export const createProject = async (req, res) => {
    try {
        const { title, description, startDate, endDate, client, departmentIds, userIds } = req.body;
        if (!title || !client) {
            res.status(400).json({ message: 'Название проекта и клиент обязательны' });
            return;
        }
        const existingProject = await prisma.project.findFirst({
            where: {
                title
            }
        });
        if (existingProject) {
            res.status(400).json({ message: 'Проект с таким названием уже существует' });
            return;
        }
        const formattedStartDate = startDate ? new Date(startDate) : null;
        const formattedEndDate = endDate ? new Date(endDate) : null;
        if (formattedStartDate && formattedEndDate && formattedStartDate > formattedEndDate) {
            res.status(400).json({ message: 'Дата начала не может быть позже даты окончания' });
            return;
        }
        const project = await prisma.project.create({
            data: {
                title,
                description,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                client,
                department: departmentIds ? {
                    connect: departmentIds.map((id) => ({ id: parseInt(id) }))
                } : undefined,
                users: userIds ? {
                    connect: userIds.map((id) => ({ id: parseInt(id) }))
                } : undefined
            },
            include: {
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                users: {
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
        });
        res.status(200).json(project);
    }
    catch (error) {
        console.error('Ошибка при создании проекта:', error);
        res.status(400).json({ message: 'Ошибка при создании проекта' });
    }
};
export const getProjects = async (req, res) => {
    try {
        const projects = await prisma.project.findMany();
        res.status(200).json(projects);
    }
    catch (error) {
        console.error('Ошибка при получении проектов:', error);
        res.status(500).json({ message: 'Ошибка при получении проектов' });
    }
};
export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await prisma.project.findUnique({
            where: { id: parseInt(projectId) },
            include: {
                users: {
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
                },
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        if (!project) {
            res.status(404).json({ message: 'Проект не найден' });
            return;
        }
        res.status(200).json(project);
    }
    catch (error) {
        console.error('Ошибка при получении проекта:', error);
        res.status(500).json({ message: 'Ошибка при получении проекта' });
    }
};
export const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, description, startDate, endDate, client, departmentIds, userIds } = req.body;
        const formattedStartDate = startDate ? new Date(startDate) : null;
        const formattedEndDate = endDate ? new Date(endDate) : null;
        if (formattedStartDate && formattedEndDate && formattedStartDate > formattedEndDate) {
            res.status(400).json({ message: 'Дата начала не может быть позже даты окончания' });
            return;
        }
        await prisma.project.update({
            where: { id: parseInt(projectId) },
            data: {
                users: {
                    set: []
                },
                department: {
                    set: []
                }
            }
        });
        const updatedProject = await prisma.project.update({
            where: { id: parseInt(projectId) },
            data: {
                title,
                description,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                client,
                department: departmentIds && departmentIds.length > 0 ? {
                    connect: departmentIds.map((id) => ({ id: parseInt(id.toString()) }))
                } : undefined,
                users: userIds && userIds.length > 0 ? {
                    connect: userIds.map((id) => ({ id: parseInt(id.toString()) }))
                } : undefined
            },
            include: {
                users: {
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
                },
                department: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        res.status(200).json(updatedProject);
    }
    catch (error) {
        console.error('Ошибка при обновлении проекта:', error);
        res.status(500).json({ message: 'Ошибка при обновлении проекта' });
    }
};
export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        await prisma.project.delete({ where: { id: parseInt(projectId) } });
        res.status(200).json({ message: 'Проект удален' });
    }
    catch (error) {
        console.error('Ошибка при удалении проекта:', error);
        res.status(500).json({ message: 'Ошибка при удалении проекта' });
    }
};
export const getProjectTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await prisma.task.findMany({
            where: { projectId: parseInt(projectId) },
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
                },
                creator: {
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
                },
                project: {
                    select: {
                        id: true,
                        title: true,
                        description: true
                    }
                }
            },
            orderBy: getTaskOrderBy()
        });
        res.status(200).json(tasks);
    }
    catch (error) {
        console.error('Ошибка при получении задач проекта:', error);
        res.status(500).json({ message: 'Ошибка при получении задач проекта' });
    }
};
export const getProjectsByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { users: { some: { id: parseInt(userId) } } },
                    { tasks: { some: { assigneeId: parseInt(userId) } } }
                ]
            },
            select: {
                id: true,
                title: true
            }
        });
        res.status(200).json(projects);
    }
    catch (error) {
        console.error('Ошибка при получении проектов пользователя:', error);
        res.status(500).json({ message: 'Ошибка при получении проектов пользователя' });
    }
};
//# sourceMappingURL=projectController.js.map
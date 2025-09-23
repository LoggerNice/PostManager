import prisma from '../utils/prisma.js';
import { DayOfWeek } from '@prisma/client';

// Функция для выполнения всех активных цикличных задач
export async function executeCyclicTasks() {
    try {
        console.log('🔄 Начинаем выполнение цикличных задач...');

        // Получаем все активные цикличные задачи
        const cyclicTasks = await (prisma.cyclicTask as any).findMany({
            where: {
                isActive: true
            },
            include: {
                project: true,
                assignees: {
                    include: {
                        user: {
                            include: {
                                department: true
                            }
                        }
                    }
                },
                creator: true
            }
        });

        if (cyclicTasks.length === 0) {
            console.log('📝 Нет активных цикличных задач для выполнения');
            return;
        }

        console.log(`📋 Найдено ${cyclicTasks.length} активных цикличных задач`);

        const today = new Date();
        const currentDayOfWeek = getDayOfWeek(today);
        const currentTime = formatTime(today);

        let tasksCreated = 0;

        for (const cyclicTask of cyclicTasks) {
            // Проверяем, нужно ли создавать задачу сегодня
            if (cyclicTask.dayOfWeek !== currentDayOfWeek) {
                console.log(`⏭️ Пропускаем задачу "${cyclicTask.title}" - не сегодня (${cyclicTask.dayOfWeek} !== ${currentDayOfWeek})`);
                continue;
            }

            // Проверяем, настало ли время создания задачи (всегда в 09:00)
            if (!isTimeToCreate('09:00', currentTime)) {
                console.log(`⏰ Пропускаем задачу "${cyclicTask.title}" - не время (09:00 > ${currentTime})`);
                continue;
            }

            // Проверяем, не была ли уже создана задача сегодня
            const existingTask = await prisma.task.findFirst({
                where: {
                    title: cyclicTask.title,
                    projectId: cyclicTask.projectId,
                    createdAt: {
                        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    }
                }
            });

            if (existingTask) {
                console.log(`⚠️ Задача "${cyclicTask.title}" уже создана сегодня`);
                continue;
            }

            // Создаем одну задачу со всеми исполнителями
            const task = await createTaskFromCyclic(cyclicTask);
            if (task) {
                tasksCreated++;
                const assigneeNames = cyclicTask.assignees.map((ar: any) => ar.user.name).join(', ');
                console.log(`✅ Создана задача "${task.title}" для исполнителей: ${assigneeNames} (ID: ${task.id})`);
            }
        }

        console.log(`🎉 Выполнение завершено. Создано задач: ${tasksCreated}`);

    } catch (error) {
        console.error('❌ Ошибка при выполнении цикличных задач:', error);
    }
}

// Создание задачи на основе цикличной задачи
async function createTaskFromCyclic(cyclicTask: any) {
    try {
        // Вычисляем дедлайн на основе настроек
        const deadline = calculateDeadline(cyclicTask.deadline, cyclicTask.deadlineDay as DayOfWeek | null);

        // Получаем ID всех исполнителей
        const assigneeIds = cyclicTask.assignees.map((ar: any) => ar.user.id);
        
        // Определяем основного исполнителя (первого в списке)
        const primaryAssigneeId = assigneeIds[0];

        const task = await prisma.task.create({
            data: {
                title: cyclicTask.title,
                description: cyclicTask.description || '',
                priority: 'MEDIUM', // Можно сделать настраиваемым
                status: 'IN_PROGRESS',
                taskType: 'OTHER', // Можно сделать настраиваемым
                projectId: cyclicTask.projectId,
                creatorId: cyclicTask.creatorId,
                assigneeId: primaryAssigneeId, // Основной исполнитель
                deadline: deadline,
                order: 1,
                assignees: {
                    create: assigneeIds.map((userId: number) => ({
                        userId: userId
                    }))
                }
            }
        });

        return task;
    } catch (error) {
        console.error(`❌ Ошибка при создании задачи "${cyclicTask.title}":`, error);
        return null;
    }
}

// Получение дня недели в формате Prisma
function getDayOfWeek(date: Date): DayOfWeek {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()] as DayOfWeek;
}

// Форматирование времени в HH:mm
function formatTime(date: Date): string {
    return date.toTimeString().slice(0, 5);
}

// Проверка, настало ли время создания задачи
function isTimeToCreate(creationTime: string, currentTime: string): boolean {
    return currentTime >= creationTime;
}

// Вычисление дедлайна на основе времени выполнения и опционального дня срока
function calculateDeadline(deadlineTime: string, deadlineDay: DayOfWeek | null): Date {
    const now = new Date();
    const [hours, minutes] = deadlineTime.split(':').map(Number);

    // Базовая дата — сегодня
    const deadline = new Date(now);
    deadline.setHours(hours, minutes, 0, 0);

    if (!deadlineDay) {
        // Если день срока не задан, используем тот же день
        return deadline;
    }

    // Если задан конкретный день недели для срока — вычисляем ближайшую дату такого дня (включая сегодня)
    const targetIndexMap: Record<DayOfWeek, number> = {
        SUNDAY: 0,
        MONDAY: 1,
        TUESDAY: 2,
        WEDNESDAY: 3,
        THURSDAY: 4,
        FRIDAY: 5,
        SATURDAY: 6
    };

    const currentDayIndex = new Date().getDay(); // 0..6
    const targetDayIndex = targetIndexMap[deadlineDay];

    let diff = targetDayIndex - currentDayIndex;
    if (diff < 0) diff += 7; // следующий такой день

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    targetDate.setHours(hours, minutes, 0, 0);

    return targetDate;
}
// Функция для однократного выполнения (для тестирования)
export async function executeCyclicTasksOnce() {
    console.log('🚀 Выполняем цикличные задачи один раз...');
    await executeCyclicTasks();
    await prisma.$disconnect();
}


import cron from 'node-cron';
import prisma from './prisma.js';

// Функция для создания задачи "Заполнение личного плана"
async function createConnectionCheckTask() {
    try {
        console.log('🔍 Создаем задачу "Заполнение личного плана"...');

        // Проверяем существование проекта "Прочее" с ID 3
        const project = await prisma.project.findUnique({
            where: { id: 3 },
            include: {
                users: true // Включаем пользователей проекта
            }
        });

        if (!project) {
            console.error('❌ Проект с ID 3 не найден');
            return;
        }

        console.log(`✅ Найден проект: ${project.title}`);

        // Находим первого пользователя для создания задачи (создатель)
        const creator = await prisma.user.findFirst();
        if (!creator) {
            console.error('❌ Не найден пользователь для создания задачи');
            return;
        }

        // Получаем всех пользователей проекта, исключая начальников отделов (MANAGER)
        const projectUsers = project.users.filter(user => user.role !== 'MANAGER');
        
        if (projectUsers.length === 0) {
            console.log('⚠️ В проекте нет назначенных пользователей (исключая начальников отделов), создаем задачу только для создателя');
            
            // Проверяем, что создатель не является начальником отдела
            if (creator.role === 'MANAGER') {
                console.log('⚠️ Создатель является начальником отдела, пропускаем создание задачи');
                return;
            }
            
            // Создаем задачу только для создателя
            const task = await prisma.task.create({
                data: {
                    title: 'Заполнение личного плана',
                    description: 'Ежедневное заполнение личного плана работы',
                    priority: 'HIGH',
                    status: 'IN_PROGRESS',
                    taskType: 'OTHER',
                    projectId: 3, // Проект "Прочее"
                    creatorId: creator.id,
                    assigneeId: creator.id,
                    deadline: getNextFridayDeadline(), // Дедлайн на пятницу до 10:00
                    order: 1,
                    assignees: {
                        create: {
                            userId: creator.id
                        }
                    }
                }
            });

            console.log(`✅ Задача "Заполнение личного плана" создана с ID: ${task.id} для пользователя ${creator.name}`);
        } else {
            console.log(`📋 Создаем задачи для ${projectUsers.length} пользователей проекта (исключая начальников отделов):`);
            
            // Создаем задачи для каждого пользователя проекта (исключая начальников отделов)
            for (const user of projectUsers) {
                const task = await prisma.task.create({
                    data: {
                        title: 'Заполнение личного плана',
                        description: 'Ежедневное заполнение личного плана работы',
                        priority: 'HIGH',
                        status: 'IN_PROGRESS',
                        taskType: 'OTHER',
                        projectId: 3, // Проект "Прочее"
                        creatorId: creator.id,
                        assigneeId: user.id,
                        deadline: getNextFridayDeadline(), // Дедлайн на пятницу до 10:00
                        order: 1,
                        assignees: {
                            create: {
                                userId: user.id
                            }
                        }
                    }
                });

                console.log(`✅ Задача "Заполнение личного плана" создана с ID: ${task.id} для пользователя ${user.name}`);
            }
        }

        console.log(`📋 Детали созданных задач:`);
        console.log(`   - Название: Заполнение личного плана`);
        console.log(`   - Проект: ${project.title}`);
        console.log(`   - Приоритет: HIGH`);
        console.log(`   - Статус: IN_PROGRESS`);
        console.log(`   - Создатель: ${creator.name}`);
        console.log(`   - Дедлайн: Сегодня до 10:00`);

    } catch (error) {
        console.error('❌ Ошибка при создании задачи:', error);
    }
}

// Функция для получения дедлайна на ту же пятницу до 10:00
function getNextFridayDeadline(): Date {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = воскресенье, 5 = пятница
    
    // Если сегодня пятница, используем сегодняшнюю дату
    // Если нет, находим ближайшую пятницу
    const daysUntilFriday = currentDay === 5 ? 0 : currentDay <= 5 ? 5 - currentDay : 5 + 7 - currentDay;
    
    const friday = new Date(now);
    friday.setDate(now.getDate() + daysUntilFriday);
    friday.setHours(10, 0, 0, 0); // 10:00:00.000
    
    return friday;
}

// Функция для запуска всех cron задач
export function startCronJobs() {
    console.log('⏰ Инициализация cron задач...');

    // Запускаем задачу "Заполнение личного плана" каждую пятницу в 8:30
    cron.schedule('30 8 * * 5', async () => {
        console.log('🕐 Время создания задачи "Заполнение личного плана" - 8:30 (пятница)');
        await createConnectionCheckTask();
    }, {
        scheduled: true,
        timezone: "Europe/Moscow" // Используем московское время
    });

    console.log('✅ Cron задачи настроены и запущены');
    console.log('📅 Задачи "Заполнение личного плана" будут создаваться каждую пятницу в 8:30 по московскому времени для каждого исполнителя проекта (исключая начальников отделов)');
}

// Функция для остановки всех cron задач
export function stopCronJobs() {
    console.log('🛑 Остановка cron задач...');
    cron.getTasks().forEach(task => task.stop());
    console.log('✅ Cron задачи остановлены');
}

import cron from 'node-cron';
import prisma from '../utils/prisma.js';

// Функция для создания задачи "Заполнение личного плана"
async function createConnectionCheckTask() {
    try {
        console.log('🔍 Создаем задачу "Заполнение личного плана"...');

        // Проверяем существование проекта "Прочее" с ID 3
        const project = await prisma.project.findUnique({
            where: { id: 17 },
            include: {
                users: true // Включаем пользователей проекта
            }
        });

        if (!project) {
            console.error('❌ Проект с ID 17 не найден');
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
                    projectId: 17, // Проект "Прочее"
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
                        projectId: 17, // Проект "Прочее"
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
    friday.setHours(11, 0, 0, 0); // 10:00:00.000
    
    return friday;
}

// Функция для запуска cron задачи
function startConnectionCheckCron() {
    console.log('⏰ Настраиваем cron задачу для создания "Проверка связи" в 23:45...');
    
    // Запускаем задачу каждую пятницу в 8:30
    cron.schedule('30 8 * * 5', async () => {
        console.log('🕐 Время создания задачи "Заполнение личного плана" - 8:30 (пятница)');
        await createConnectionCheckTask();
    }, {
        scheduled: true,
        timezone: "Europe/Moscow" // Используем московское время
    });

    console.log('✅ Cron задача настроена и запущена');
    console.log('📅 Задачи будут создаваться каждую пятницу в 8:30 по московскому времени');
}

// Функция для однократного создания задачи (для тестирования)
async function createTaskOnce() {
    console.log('🚀 Создаем задачу "Проверка связи" один раз...');
    await createConnectionCheckTask();
    await prisma.$disconnect();
}

// Проверяем аргументы командной строки
const args = process.argv.slice(2);
if (args.includes('--once')) {
    // Создаем задачу один раз
    createTaskOnce();
} else {
    // Запускаем cron задачу
    startConnectionCheckCron();
    
    // Держим процесс активным
    process.on('SIGINT', async () => {
        console.log('\n🛑 Получен сигнал SIGINT, завершаем работу...');
        await prisma.$disconnect();
        process.exit(0);
    });
    
    console.log('🔄 Скрипт запущен и ожидает выполнения cron задач...');
}

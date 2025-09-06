import prisma from '../src/utils/prisma.js';

async function testTaskPriorityUpdate() {
    try {
        console.log('🧪 Тестируем обновление приоритетов задач...');

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Сравниваем только даты (без времени)
        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowDateOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        
        console.log(`📅 Сегодня: ${todayDateOnly.toISOString().split('T')[0]}`);
        console.log(`📅 Завтра: ${tomorrowDateOnly.toISOString().split('T')[0]}`);
        
        // Проверяем задачи с дедлайном сегодня
        const todayTasks = await prisma.task.findMany({
            where: {
                deadline: {
                    gte: todayDateOnly,
                    lt: new Date(todayDateOnly.getTime() + 24 * 60 * 60 * 1000)
                },
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            },
            select: {
                id: true,
                title: true,
                priority: true,
                deadline: true
            }
        });
        
        console.log(`\n📋 Задачи с дедлайном сегодня (${todayTasks.length}):`);
        todayTasks.forEach(task => {
            console.log(`   - ID: ${task.id}, Название: ${task.title}, Приоритет: ${task.priority}, Дедлайн: ${task.deadline?.toISOString().split('T')[0]}`);
        });
        
        // Проверяем задачи с дедлайном завтра
        const tomorrowTasks = await prisma.task.findMany({
            where: {
                deadline: {
                    gte: tomorrowDateOnly,
                    lt: new Date(tomorrowDateOnly.getTime() + 24 * 60 * 60 * 1000)
                },
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            },
            select: {
                id: true,
                title: true,
                priority: true,
                deadline: true
            }
        });
        
        console.log(`\n📋 Задачи с дедлайном завтра (${tomorrowTasks.length}):`);
        tomorrowTasks.forEach(task => {
            console.log(`   - ID: ${task.id}, Название: ${task.title}, Приоритет: ${task.priority}, Дедлайн: ${task.deadline?.toISOString().split('T')[0]}`);
        });
        
        // Тестируем обновление приоритетов
        console.log('\n🔄 Выполняем обновление приоритетов...');
        
        let updatedCount = 0;
        
        // Обновляем приоритет для задач с дедлайном сегодня (HIGH)
        const highPriorityResult = await prisma.task.updateMany({
            where: {
                deadline: {
                    gte: todayDateOnly,
                    lt: new Date(todayDateOnly.getTime() + 24 * 60 * 60 * 1000)
                },
                priority: { not: 'HIGH' },
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            },
            data: { priority: 'HIGH' }
        });
        updatedCount += highPriorityResult.count;
        
        // Обновляем приоритет для задач с дедлайном завтра (MEDIUM)
        const mediumPriorityResult = await prisma.task.updateMany({
            where: {
                deadline: {
                    gte: tomorrowDateOnly,
                    lt: new Date(tomorrowDateOnly.getTime() + 24 * 60 * 60 * 1000)
                },
                priority: { notIn: ['HIGH', 'MEDIUM'] },
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            },
            data: { priority: 'MEDIUM' }
        });
        updatedCount += mediumPriorityResult.count;
        
        console.log(`✅ Обновлено приоритетов задач: ${updatedCount}`);
        console.log(`   - Высокий приоритет (сегодня): ${highPriorityResult.count}`);
        console.log(`   - Средний приоритет (завтра): ${mediumPriorityResult.count}`);
        
    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testTaskPriorityUpdate();

import prisma from '../utils/prisma.js';

async function initDepartments() {
    console.log('🚀 Начинаем инициализацию отделов...');

    try {
        // Проверяем и создаем отдел "УКОИ" с ID 1
        const departmentWithId1 = await prisma.department.findUnique({ where: { id: 1 } });
        if (!departmentWithId1) {
            console.log('📝 Создаем отдел УКОИ с ID 1');
            await prisma.department.create({
                data: {
                    id: 1,
                    name: 'УКОИ'
                }
            });
            console.log('✅ Отдел УКОИ создан');
        } else if (departmentWithId1.name !== 'УКОИ') {
            console.log(`📝 Обновляем название отдела с ID 1 с "${departmentWithId1.name}" на "УКОИ"`);
            await prisma.department.update({
                where: { id: 1 },
                data: { name: 'УКОИ' }
            });
            console.log('✅ Название отдела обновлено');
        } else {
            console.log('✅ Отдел УКОИ уже существует с правильным названием');
        }

        // Выводим все отделы для проверки
        const allDepartments = await prisma.department.findMany();
        console.log('📋 Все отделы в базе данных:');
        allDepartments.forEach(dept => {
            console.log(`  - ID: ${dept.id}, Name: ${dept.name}`);
        });

        console.log('🎉 Инициализация отделов завершена!');
    } catch (error) {
        console.error('❌ Ошибка при инициализации отделов:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

initDepartments();

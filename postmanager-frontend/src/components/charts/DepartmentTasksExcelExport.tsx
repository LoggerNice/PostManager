'use client';

import { useMemo } from 'react';
import { useDepartmentTasks } from '@/hooks/useDepartmentTasks';
import { useGetProjectsQuery } from '@/store/api/project.api';
import * as XLSX from 'xlsx';

interface ExcelTask {
    'Проект': string;
    'Имя пользователя': string;
    'Дата начала': string;
    'Дата конца задачи': string;
    'Название задачи': string;
    'Статус задачи': string;
}

export const formatName = (fullName: string) => {
    const [last, first, middle] = fullName.split(' ');
    return `${last} ${first?.charAt(0) || ''}.${middle?.charAt(0) || ''}.`;
};

export default function DepartmentTasksExcelExport() {
    const { currentUser, departmentId, departmentUsers, departmentTasks, isLoading } = useDepartmentTasks();
    const { data: allProjects = [], isLoading: projectsLoading } = useGetProjectsQuery();

    // Подготавливаем данные для Excel
    const excelData = useMemo<ExcelTask[]>(() => {
        if (!currentUser || departmentTasks.length === 0) return [];

        return departmentTasks.map(task => {
            // Находим проект
            const project = allProjects.find(p => p.id === task.projectId);
            const projectName = project?.title || 'Неизвестный проект';

            // Находим исполнителей
            let assigneeNames: string[] = [];
            if (task.assignees && task.assignees.length > 0) {
                assigneeNames = task.assignees
                    .map(assignee => {
                        const user = departmentUsers.find(u => u.id === assignee.userId);
                        return user?.name || 'Неизвестный пользователь';
                    })
                    .filter(name => name !== 'Неизвестный пользователь');
            } else if (task.assigneeId) {
                const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
                const user = departmentUsers.find(u => u.id === assigneeId);
                if (user) {
                    assigneeNames = [user.name];
                }
            }

            // Определяем даты
            let startDate = '';
            let endDate = '';

            if (task.status === 'COMPLETED') {
                // Для выполненных задач показываем как 1-дневную
                const deadline = new Date(task.deadline);
                const dayBefore = new Date(deadline);
                dayBefore.setDate(deadline.getDate() - 1);
                
                startDate = dayBefore.toLocaleDateString('ru-RU');
                endDate = deadline.toLocaleDateString('ru-RU');
            } else if (task.assignees && task.assignees.length > 0) {
                // Для назначенных задач
                const assignedDate = new Date(task.assignees[0].assignedAt);
                startDate = assignedDate.toLocaleDateString('ru-RU');
                endDate = new Date(task.deadline).toLocaleDateString('ru-RU');
            } else {
                // Для остальных задач
                startDate = new Date(task.createdAt).toLocaleDateString('ru-RU');
                endDate = new Date(task.deadline).toLocaleDateString('ru-RU');
            }

            // Статус задачи - упрощенный
            const taskStatus = task.status === 'COMPLETED' ? 'Выполнено' : 'Не выполнено';

            // Создаем запись для каждого исполнителя
            if (assigneeNames.length > 0) {
                return assigneeNames.map(assigneeName => ({
                    'Проект': projectName,
                    'Имя пользователя': assigneeName,
                    'Дата начала': startDate,
                    'Дата конца задачи': endDate,
                    'Название задачи': task.title,
                    'Статус задачи': taskStatus
                }));
            } else {
                // Если нет исполнителей, создаем одну запись
                return [{
                    'Проект': projectName,
                    'Имя пользователя': 'Не назначен',
                    'Дата начала': startDate,
                    'Дата конца задачи': endDate,
                    'Название задачи': task.title,
                    'Статус задачи': taskStatus
                }];
            }
        }).flat();
    }, [departmentTasks, allProjects, departmentUsers, currentUser]);

    const handleExport = () => {
        if (excelData.length === 0) {
            alert('Нет данных для экспорта');
            return;
        }

        try {
            // Создаем рабочую книгу
            const wb = XLSX.utils.book_new();
            
            // Создаем лист с данными
            const ws = XLSX.utils.json_to_sheet(excelData);
            
            // Устанавливаем ширину столбцов
            const colWidths = [
                { wch: 25 }, // Проект
                { wch: 20 }, // Имя пользователя
                { wch: 15 }, // Дата начала
                { wch: 15 }, // Дата конца задачи
                { wch: 40 }, // Название задачи
                { wch: 15 }  // Статус задачи
            ];
            ws['!cols'] = colWidths;

            // Добавляем лист в книгу
            XLSX.utils.book_append_sheet(wb, ws, 'Задачи отдела');

            // Генерируем имя файла с текущей датой
            const today = new Date();
            const dateStr = today.toLocaleDateString('ru-RU').replace(/\./g, '-');
            const fileName = `Задачи_отдела_${dateStr}.xlsx`;

            // Скачиваем файл
            XLSX.writeFile(wb, fileName);
        } catch (error) {
            console.error('Ошибка при экспорте:', error);
            alert('Произошла ошибка при экспорте файла');
        }
    };

    if (isLoading || projectsLoading) {
        return (
            <div className="flex justify-center items-center h-16">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!departmentId) {
        return (
            <div className="text-red-500 text-center p-4">
                Информация об отделе недоступна
            </div>
        );
    }

    if (excelData.length === 0) {
        return (
            <div className="text-gray-500 text-center p-4">
                Нет задач для экспорта
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Экспорт задач отдела
                </h3>
            </div>
            
            <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    Выгрузите задачи отдела в Excel таблицу со следующими столбцами:
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <li>• Проект - название проекта</li>
                    <li>• Имя пользователя - исполнитель задачи</li>
                    <li>• Дата начала - когда задача началась</li>
                    <li>• Дата конца задачи - дедлайн</li>
                    <li>• Название задачи - описание задачи</li>
                    <li>• Статус задачи - выполнено/не выполнено</li>
                </ul>
            </div>

            <button
                onClick={handleExport}
                disabled={excelData.length === 0}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-600"
            >
                Экспорт Excel
            </button>
        </div>
    );
}

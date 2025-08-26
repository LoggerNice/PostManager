'use client';

import { useMemo } from 'react';
import { useDepartmentTasks } from '@/hooks/useDepartmentTasks';
import { useGetProjectsQuery } from '@/store/api/project.api';
import { useGetCommentsQuery } from '@/store/api/comment.api';
import * as XLSX from 'xlsx';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ExcelTask {
    'Отдел': string;
    'Проект': string;
    'Ответственный от отдела КР': string;
    'Наименование мероприятия': string;
    'Дата принятия задачи': string;
    'Срок исполнения согласно плана проекта': string;
    'Срок исполнения': string;
    'Выполнено\\не выполнено': string;
    'Состояние выполнения\\проблемные вопросы': string;
    'Тип задачи': string;
    'ГК': string;
    'Рабочая неделя': string;
}

export const formatName = (fullName: string) => {
    const [last, first, middle] = fullName.split(' ');
    return `${last} ${first?.charAt(0) || ''}.${middle?.charAt(0) || ''}.`;
};

// Функция для получения начала недели (понедельник)
const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Учитываем, что неделя начинается с понедельника
    d.setDate(diff);
    d.setHours(0, 0, 0, 0); // Обнуляем время для точного сравнения
    return d;
};

// Функция для получения конца недели (пятница)
const getWeekEnd = (date: Date): Date => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4); // +4 дня от понедельника = пятница
    return weekEnd;
};

// Функция для расчета рабочей недели
export const calculateWorkWeek = (taskDeadline: Date | string | null): string => {
    // Если срок не указан, используем конец текущей недели
    const dateToUse = taskDeadline ? new Date(taskDeadline) : getWeekEnd(new Date());
    
    // Получаем начало и конец рабочей недели для задачи
    const deadlineWeekStart = getWeekStart(dateToUse);
    const deadlineWeekEnd = getWeekEnd(dateToUse);
    
    // Форматируем даты для отображения
    const formatDateRange = (start: Date, end: Date): string => {
        return `${start.toLocaleDateString('ru-RU')} - ${end.toLocaleDateString('ru-RU')}`;
    };
    
    // Показываем диапазон дат рабочей недели
    return formatDateRange(deadlineWeekStart, deadlineWeekEnd);
};

interface DepartmentTasksExcelExportProps {
    compact?: boolean;
}

export default function DepartmentTasksExcelExport({ compact = false }: DepartmentTasksExcelExportProps) {
    const { currentUser, departmentId, departmentUsers, departmentTasks, isLoading } = useDepartmentTasks();
    const { data: allProjects = [], isLoading: projectsLoading } = useGetProjectsQuery();
    
    // Получаем все комментарии для задач отдела
    const { data: allComments = [] } = useGetCommentsQuery({}, {
        skip: departmentTasks.length === 0
    });

    // Подготавливаем данные для Excel
    const excelData = useMemo<ExcelTask[]>(() => {
        if (!currentUser || departmentTasks.length === 0) return [];

        return departmentTasks.map(task => {
            // 1. Отдел - отдел исполнителя задачи (если исполнитель не назначен, то отдел создателя)
            const departmentName = task.assignees?.[0]?.user?.department?.name || 'Неизвестный отдел';

            // 2. Проект - Название проекта по задаче
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

            // 5. Дата принятия задачи - дата создания задачи
            const taskAcceptanceDate = new Date(task.createdAt).toLocaleDateString('ru-RU');

            // 6. Срок исполнения согласно плана проекта - дата конца проекта
            const projectEndDate = project?.endDate ? new Date(project.endDate).toLocaleDateString('ru-RU') : '';

            // 7. Срок исполнения - дата конца задачи
            const taskDeadline = task.deadline ? new Date(task.deadline).toLocaleDateString('ru-RU') : '';

            // 8. Выполнено\не выполнено - состояние задачи
            const isCompleted = task.status === 'COMPLETED' ? 'Выполнено' : 'Не выполнено';

            // 9. Состояние выполнения\проблемные вопросы - комментарий помеченный как решение
            const taskComments = allComments.filter(comment => comment.taskId === parseInt(task.id));
            const solutionComment = taskComments.find(comment => comment.isSolution);
            const solutionText = solutionComment ? solutionComment.content : '';

            // 10. Тип задачи - использовать реальный тип задачи
            const getTaskTypeDisplayForExcel = (taskType: any): string => {
                switch (taskType) {
                    case 'METHODOLOGIES':
                        return 'Методики';
                    case 'TESTING_PREPARATION':
                        return 'Подготовка и проведение испытаний';
                    case 'DEBUG_CHECK':
                        return 'Отладка\\проверка';
                    case 'MEETING':
                        return 'Совещание';
                    case 'OTHER':
                    default:
                        return 'Прочее';
                }
            };
            const taskType = getTaskTypeDisplayForExcel(task.taskType || 'OTHER');

            // 11. ГК
            const managementCompany = project?.client || 'Неизвестный ГК';

            // 12. Рабочая неделя - расчет рабочей недели
            const workWeek = calculateWorkWeek(task.deadline || null);

            // Создаем запись для каждого исполнителя или одну запись если нет исполнителей
            if (task.assignees && task.assignees.length > 0) {
                return task.assignees
                    .map(assignee => {
                        const user = departmentUsers.find(u => u.id === assignee.userId);
                        return user;
                    })
                    .filter(user => user !== undefined)
                    .map(user => ({
                        'Отдел': user.department?.name || task.creator?.department?.name || 'Неизвестный отдел',
                        'Проект': projectName,
                        'Ответственный от отдела КР': formatName(user.name),
                        'Наименование мероприятия': task.title,
                        'Дата принятия задачи': taskAcceptanceDate,
                        'Срок исполнения согласно плана проекта': projectEndDate,
                        'Срок исполнения': taskDeadline,
                        'Выполнено\\не выполнено': isCompleted,
                        'Состояние выполнения\\проблемные вопросы': solutionText,
                        'Тип задачи': taskType,
                        'ГК': managementCompany,
                        'Рабочая неделя': workWeek
                    }));
            } else if (task.assigneeId) {
                // Обработка старой системы с одним исполнителем
                const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
                const user = departmentUsers.find(u => u.id === assigneeId);
                if (user) {
                    return [{
                        'Отдел': user.department?.name || task.creator?.department?.name || 'Неизвестный отдел',
                        'Проект': projectName,
                        'Ответственный от отдела КР': formatName(user.name),
                        'Наименование мероприятия': task.title,
                        'Дата принятия задачи': taskAcceptanceDate,
                        'Срок исполнения согласно плана проекта': projectEndDate,
                        'Срок исполнения': taskDeadline,
                        'Выполнено\\не выполнено': isCompleted,
                        'Состояние выполнения\\проблемные вопросы': solutionText,
                        'Тип задачи': taskType,
                        'ГК': managementCompany,
                        'Рабочая неделя': workWeek
                    }];
                }
            }
            
            // Если нет исполнителей, используем отдел создателя
            return [{
                'Отдел': task.creator?.department?.name || 'Неизвестный отдел',
                'Проект': projectName,
                'Ответственный от отдела КР': 'Не назначен',
                'Наименование мероприятия': task.title,
                'Дата принятия задачи': taskAcceptanceDate,
                'Срок исполнения согласно плана проекта': projectEndDate,
                'Срок исполнения': taskDeadline,
                'Выполнено\\не выполнено': isCompleted,
                'Состояние выполнения\\проблемные вопросы': solutionText,
                'Тип задачи': taskType,
                'ГК': managementCompany,
                'Рабочая неделя': workWeek
            }];
        }).flat();
    }, [departmentTasks, allProjects, departmentUsers, currentUser, allComments]);

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
                { wch: 20 }, // Отдел
                { wch: 25 }, // Проект
                { wch: 25 }, // Ответственный от отдела КР
                { wch: 40 }, // Наименование мероприятия
                { wch: 18 }, // Дата принятия задачи
                { wch: 25 }, // Срок исполнения согласно плана проекта
                { wch: 18 }, // Срок исполнения
                { wch: 18 }, // Выполнено\не выполнено
                { wch: 50 }, // Состояние выполнения\проблемные вопросы
                { wch: 15 }, // Тип задачи
                { wch: 15 }, // ГК
                { wch: 30 }  // Рабочая неделя
            ];
            ws['!cols'] = colWidths;

            // Настраиваем перенос текста для колонки "Рабочая неделя" (колонка L)
            const range = XLSX.utils.decode_range(ws['!ref']!);
            for (let row = range.s.r; row <= range.e.r; row++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: 11 }); // колонка L (индекс 11)
                ws[cellAddress].s = {
                    alignment: {
                        wrapText: true,
                        vertical: 'top'
                    }
                };
            }

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

    if (compact) {
        return (
            <button
                onClick={handleExport}
                disabled={excelData.length === 0}
                className="hover:cursor-pointer hover:text-blue-400 font-medium p-2 transition-colors duration-200 flex items-center justify-center"
                title="Экспорт в Excel"
            >
                <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
            <button
                onClick={handleExport}
                disabled={excelData.length === 0}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors duration-200 border border-gray-200 dark:border-gray-600"
            >
                Экспорт в Excel
            </button>
        </div>
    );
}
import { Project, User } from ".";
import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Column } from '@/types';


export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'PROBLEM' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// Enum для TaskStatus для удобства использования
export const TaskStatus = {
  TODO: 'TODO' as const,
  IN_PROGRESS: 'IN_PROGRESS' as const,
  PROBLEM: 'PROBLEM' as const,
  COMPLETED: 'COMPLETED' as const,
  CANCELLED: 'CANCELLED' as const
} as const;
export type TaskPriorityDisplay = 'Низкий' | 'Средний' | 'Высокий';
export type TaskType = 'METHODOLOGIES' | 'TESTING_PREPARATION' | 'DEBUG_CHECK' | 'MEETING' | 'OTHER';
export type TaskTypeDisplay = 'Методики' | 'Подготовка и проведение испытаний' | 'Отладка\\проверка' | 'Совещание' | 'Прочее';

// Функции для преобразования типов задач
export const getTaskTypeDisplay = (taskType: TaskType | null | undefined): TaskTypeDisplay => {
    if (!taskType) return 'Прочее';
    
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

export const getTaskTypeFromDisplay = (display: TaskTypeDisplay | null | undefined): TaskType => {
    if (!display) return 'OTHER';
    
    switch (display) {
        case 'Методики':
            return 'METHODOLOGIES';
        case 'Подготовка и проведение испытаний':
            return 'TESTING_PREPARATION';
        case 'Отладка\\проверка':
            return 'DEBUG_CHECK';
        case 'Совещание':
            return 'MEETING';
        case 'Прочее':
        default:
            return 'OTHER';
    }
};

export const getAllTaskTypes = (): { value: TaskType; label: TaskTypeDisplay }[] => [
    { value: 'METHODOLOGIES', label: 'Методики' },
    { value: 'TESTING_PREPARATION', label: 'Подготовка и проведение испытаний' },
    { value: 'DEBUG_CHECK', label: 'Отладка\\проверка' },
    { value: 'MEETING', label: 'Совещание' },
    { value: 'OTHER', label: 'Прочее' }
];

import { IUser } from './user.types';

export interface TaskAssignee {
    id: number;
    taskId: number;
    userId: number;
    assignedAt: Date;
    user: IUser;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority | TaskPriorityDisplay;
    status: TaskStatus;
    projectId: number;
    project: Project;
    taskType: TaskType | TaskTypeDisplay;
    creatorId: number;
    creator: IUser; // Создатель задачи
    assigneeId?: string;
    assignee?: IUser;
    assignees?: TaskAssignee[]; // Множественные исполнители
    createdAt: Date;
    updatedAt: Date;
    deadline?: Date | string | null;
    order?: number;
}

export interface TasksTabProps {
    columns: Record<string, Column>;
    handleDeleteTask: (columnId: string, taskId: string) => void;
    onTaskUpdate: (taskId: string, updatedTask: Task) => void;
    onAddTask: (columnId: string, title: string, description?: string, priority?: TaskPriority, taskType?: TaskType, deadline?: string, assigneeIds?: number[]) => void;
    onUpdateColumnName: (columnId: string, newName: string) => void;
    onTaskMove?: (taskId: string, sourceColumnId: string, destinationColumnId: string, sourceIndex: number, destinationIndex: number) => void;
  }

export interface TaskForm {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    taskType: TaskType;
    projectId: number;
    deadline?: string | null;
    order?: number;
    assigneeIds?: number[]; // Новое поле для исполнителей
    creatorId?: number; // ID создателя задачи
} 

export interface TaskCardProps {
    item: Task;
    columnId: string;
    handleDeleteTask: (columnId: string, taskId: string) => void;
    snapshot: DraggableStateSnapshot;
    provided: DraggableProvided;
    onTaskUpdate: (taskId: string, updatedTask: Task) => void;
}

export interface TaskModalProps {
    visible: boolean;
    onClose: () => void;
    onCreate: () => void;
    newTask: {
        title: string;
        description: string;
        priority: 'Низкий' | 'Средний' | 'Высокий';
        taskType: TaskType;
        deadline?: Date | null;
        assigneeIds?: number[];
    };
    setNewTask: (task: {
        title: string;
        description: string;
        priority: 'Низкий' | 'Средний' | 'Высокий';
        taskType: TaskType;
        deadline?: Date | null;
        assigneeIds?: number[];
    }) => void;
    columns: Record<string, { name: string; items: Task[] }>;
    selectedColumn: string;
    setSelectedColumn: (col: string) => void;
  }
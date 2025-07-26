import { Project, User } from ".";
import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Column } from '@/types';


export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'PROBLEM' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskPriorityDisplay = 'Низкий' | 'Средний' | 'Высокий';

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
    assigneeId?: string;
    assignee?: User;
    assignees?: TaskAssignee[]; // Множественные исполнители
    createdAt: Date;
    updatedAt: Date;
    deadline?: Date;
    order?: number;
}

export interface TasksTabProps {
    columns: Record<string, Column>;
    handleDeleteTask: (columnId: string, taskId: string) => void;
    onTaskUpdate: (taskId: string, updatedTask: Task) => void;
    onAddTask: (columnId: string, title: string, description?: string, priority?: TaskPriority, deadline?: string, assigneeIds?: number[]) => void;
    onUpdateColumnName: (columnId: string, newName: string) => void;
    onTaskMove?: (taskId: string, sourceColumnId: string, destinationColumnId: string, sourceIndex: number, destinationIndex: number) => void;
  }

export interface TaskForm {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    projectId: number;
    deadline?: string | null;
    order?: number;
    assigneeIds?: number[]; // Новое поле для исполнителей
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
        deadline?: Date | null;
        assigneeIds?: number[];
    };
    setNewTask: (task: {
        title: string;
        description: string;
        priority: 'Низкий' | 'Средний' | 'Высокий';
        deadline?: Date | null;
        assigneeIds?: number[];
    }) => void;
    columns: Record<string, { name: string; items: Task[] }>;
    selectedColumn: string;
    setSelectedColumn: (col: string) => void;
  }
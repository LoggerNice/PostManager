import { IUser } from './user.types';
import { IProject as Project } from './project.types';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface CyclicTask {
    id: number;
    title: string;
    description?: string;
    dayOfWeek: DayOfWeek;
    deadline: string; // Время в формате HH:mm
    projectId: number;
    project: Project;
    assigneeIds: number[];
    assignees: IUser[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    creatorId: number;
    creator: IUser;
}

export interface CyclicTaskForm {
    title: string;
    description?: string;
    dayOfWeek: DayOfWeek;
    deadline: string; // Время в формате HH:mm
    projectId: number;
    assigneeIds: number[];
    isActive?: boolean;
}

export interface CreateCyclicTaskRequest {
    title: string;
    description?: string;
    dayOfWeek: DayOfWeek;
    deadline: string;
    projectId: number;
    assigneeIds: number[];
}

export interface UpdateCyclicTaskRequest {
    title?: string;
    description?: string;
    dayOfWeek?: DayOfWeek;
    deadline?: string;
    projectId?: number;
    assigneeIds?: number[];
    isActive?: boolean;
}

export const DAYS_OF_WEEK = [
    { value: 'MONDAY', label: 'Понедельник' },
    { value: 'TUESDAY', label: 'Вторник' },
    { value: 'WEDNESDAY', label: 'Среда' },
    { value: 'THURSDAY', label: 'Четверг' },
    { value: 'FRIDAY', label: 'Пятница' },
    { value: 'SATURDAY', label: 'Суббота' },
    { value: 'SUNDAY', label: 'Воскресенье' }
] as const;

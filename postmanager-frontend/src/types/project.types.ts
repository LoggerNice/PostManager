import { IUser } from './user.types';

export interface IProject {
    id: number;
    title: string;
    description?: string;
    client?: string;
    startDate?: string;
    endDate?: string;
    departmentIds: number[];
    userIds?: number[];
    users?: IUser[];
    createdAt: string;
    updatedAt: string;
}

export interface IProjectForm {
    title: string;
    description?: string;
    client?: string;
    startDate?: string;
    endDate?: string;
    departmentIds: number[];
    userIds?: number[];
} 
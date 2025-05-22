export * from './task.types';
export * from './project.types';
export * from './user.types';
export * from './department.types';
export * from './auth.types';
export * from './forms/auth.types';
export * from './forms/profile.types';

export interface Column {
    name: string;
    items: Task[];
} 
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'PROBLEM' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    projectId: number;
    deadline?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TaskForm {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    projectId: number;
    deadline?: string;
} 
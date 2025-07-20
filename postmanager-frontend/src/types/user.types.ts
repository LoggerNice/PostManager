export interface IUser {
    id: number;
    name: string;
    login?: string;
    role?: string;
    department?: {
        id: number;
        name: string;
    };
    departmentId?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface IUserUpdateData {
    name?: string;
    login?: string;
    departmentId?: number;
    currentPassword?: string;
    newPassword?: string;
} 
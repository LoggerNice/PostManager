export interface IUser {
    id: number;
    name: string;
    role?: string;
    department?: {
        id: number;
        name: string;
    };
}

export interface IUserUpdateData {
    name?: string;
    login?: string;
    departmentId?: number;
    currentPassword?: string;
    newPassword?: string;
} 
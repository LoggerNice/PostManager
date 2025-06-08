export interface IAuthResponse {
    token: string;
    id: number;
    name: string;
    login: string;
    role: string;
    departmentId: number;
    createdAt: string;
    updatedAt: string;
}

export interface ILoginData {
    login: string;
    password: string;
}

export interface IRegisterData {
    name: string;
    login: string;
    password: string;
    departmentId: number;
} 
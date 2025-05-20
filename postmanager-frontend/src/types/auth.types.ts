export interface IAuthResponse {
    token: string;
    user: {
        id: number;
        name: string;
        login: string;
        role: string;
    };
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
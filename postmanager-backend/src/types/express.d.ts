import { Request } from 'express';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                login: string;
                name: string;
                role: string;
                departmentId?: number;
            };
        }
    }
}
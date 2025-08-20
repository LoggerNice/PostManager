import { User } from '@prisma/client';

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

export {};

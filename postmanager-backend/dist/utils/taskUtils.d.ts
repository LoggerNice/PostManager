import { Prisma } from '@prisma/client';
export declare const getTaskOrderBy: () => Prisma.TaskOrderByWithRelationInput[];
export declare const getTasksWithPrioritySort: (prisma: any, options: {
    where?: Prisma.TaskWhereInput;
    include?: Prisma.TaskInclude;
}) => Promise<any>;

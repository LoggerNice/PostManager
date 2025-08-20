export interface IDepartment {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export interface IDepartmentWithRelations extends IDepartment {
    users?: Array<{
        id: number;
        name: string;
    }>;
    projects?: Array<{
        id: number;
        title: string;
    }>;
} 
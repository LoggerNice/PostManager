import { api } from './api';
import { IDepartment } from '@/types/department.types';

export const departmentApi = api.injectEndpoints({
    endpoints: (build) => ({
        getDepartments: build.query<IDepartment[], void>({
            query: () => 'departments',
            providesTags: ['Department']
        }),
        getDepartmentById: build.query<IDepartment, number>({
            query: (id) => `departments/${id}`,
            providesTags: (result, error, id) => [{ type: 'Department', id }]
        }),
        createDepartment: build.mutation<IDepartment, Partial<IDepartment>>({
            query: (department) => ({
                url: 'departments',
                method: 'POST',
                body: department
            }),
            invalidatesTags: ['Department']
        }),
        updateDepartment: build.mutation<IDepartment, { id: number; data: Partial<IDepartment> }>({
            query: ({ id, data }) => ({
                url: `departments/${id}`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'Department', id }]
        }),
        deleteDepartment: build.mutation<void, number>({
            query: (id) => ({
                url: `departments/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Department']
        })
    })
});

export const {
    useGetDepartmentsQuery,
    useGetDepartmentByIdQuery,
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
    useDeleteDepartmentMutation
} = departmentApi; 
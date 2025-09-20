import { api } from './api';
import { CyclicTask, CreateCyclicTaskRequest, UpdateCyclicTaskRequest } from '@/types/cyclicTask.types';

export const cyclicTaskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getCyclicTasks: build.query<CyclicTask[], void>({
            query: () => 'cyclic-tasks',
            providesTags: ['CyclicTask']
        }),
        getCyclicTaskById: build.query<CyclicTask, number>({
            query: (id) => `cyclic-tasks/${id}`,
            providesTags: (result, error, id) => [{ type: 'CyclicTask', id }]
        }),
        createCyclicTask: build.mutation<CyclicTask, CreateCyclicTaskRequest>({
            query: (task) => ({
                url: 'cyclic-tasks',
                method: 'POST',
                body: task
            }),
            invalidatesTags: ['CyclicTask']
        }),
        updateCyclicTask: build.mutation<CyclicTask, { id: number; data: UpdateCyclicTaskRequest }>({
            query: ({ id, data }) => ({
                url: `cyclic-tasks/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: (result, error, { id }) => [
                'CyclicTask',
                { type: 'CyclicTask', id }
            ]
        }),
        deleteCyclicTask: build.mutation<void, number>({
            query: (id) => ({
                url: `cyclic-tasks/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['CyclicTask']
        }),
        toggleCyclicTaskStatus: build.mutation<CyclicTask, { id: number; isActive: boolean }>({
            query: ({ id, isActive }) => ({
                url: `cyclic-tasks/${id}/toggle`,
                method: 'PATCH',
                body: { isActive }
            }),
            invalidatesTags: (result, error, { id }) => [
                'CyclicTask',
                { type: 'CyclicTask', id }
            ]
        }),
        executeCyclicTasks: build.mutation<{ message: string; timestamp: string }, void>({
            query: () => ({
                url: 'cyclic-tasks/execute',
                method: 'POST'
            })
        })
    })
});

export const {
    useGetCyclicTasksQuery,
    useGetCyclicTaskByIdQuery,
    useCreateCyclicTaskMutation,
    useUpdateCyclicTaskMutation,
    useDeleteCyclicTaskMutation,
    useToggleCyclicTaskStatusMutation,
    useExecuteCyclicTasksMutation
} = cyclicTaskApi;

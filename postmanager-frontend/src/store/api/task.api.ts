import { api } from './api';
import { Task, TaskForm } from '@/types/task.types';

export const taskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTasks: build.query<Task[], void>({
            query: () => 'tasks',
            providesTags: ['Task']
        }),
        getTaskById: build.query<Task, string>({
            query: (taskId) => `tasks/${taskId}`,
            providesTags: (result, error, taskId) => [{ type: 'Task', id: taskId }]
        }),
        createTask: build.mutation<Task, TaskForm>({
            query: (task) => ({
                url: 'tasks',
                method: 'POST',
                body: task
            }),
            invalidatesTags: ['Task']
        }),
        updateTask: build.mutation<Task, { taskId: string; task: Partial<TaskForm> }>({
            query: ({ taskId, task }) => ({
                url: `tasks/${taskId}`,
                method: 'PUT',
                body: task
            }),
            invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }]
        }),
        deleteTask: build.mutation<void, string>({
            query: (taskId) => ({
                url: `tasks/${taskId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Task']
        }),
        getTaskComments: build.query<any[], string>({
            query: (taskId) => `tasks/${taskId}/comments`,
            providesTags: (result, error, taskId) => [{ type: 'Task', id: taskId }]
        })
    })
});

export const {
    useGetTasksQuery,
    useGetTaskByIdQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useGetTaskCommentsQuery
} = taskApi; 
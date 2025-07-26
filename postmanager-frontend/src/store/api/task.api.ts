import { api } from './api';
import { Task, TaskForm } from '@/types/task.types';

export const taskApi = api.injectEndpoints({
    endpoints: (build) => ({
        getTasks: build.query<Task[], void>({
            query: () => 'tasks',
            providesTags: ['Task']
        }),
        getProjectTasks: build.query<Task[], number>({
            query: (projectId) => `projects/${projectId}/tasks`,
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
            invalidatesTags: ['Task', 'Project'] // Инвалидируем и задачи, и проекты
        }),
        updateTask: build.mutation<Task, { taskId: string; task: Partial<TaskForm> }>({
            query: ({ taskId, task }) => ({
                url: `tasks/${taskId}`,
                method: 'PUT',
                body: task
            }),
            invalidatesTags: ['Task', 'Project'] // Инвалидируем все задачи и проекты для real-time обновлений
        }),
        deleteTask: build.mutation<void, string>({
            query: (taskId) => ({
                url: `tasks/${taskId}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Task', 'Project'] // Инвалидируем все задачи и проекты для real-time обновлений
        }),
        getTaskComments: build.query<any[], string>({
            query: (taskId) => `tasks/${taskId}/comments`,
            providesTags: (result, error, taskId) => [{ type: 'Task', id: taskId }]
        }),
        updateTasksOrder: build.mutation<void, { columnId: string; orderedIds: string[] }>({
            query: ({ columnId, orderedIds }) => ({
                url: `tasks/order`,
                method: 'PUT',
                body: { columnId, orderedIds }
            }),
            invalidatesTags: ['Task', 'Project']
        }),
        // Эндпоинты для работы с исполнителями задач
        getTaskAssignees: build.query<any[], string>({
            query: (taskId) => `tasks/${taskId}/assignees`,
            providesTags: (result, error, taskId) => [{ type: 'Task', id: taskId }]
        }),
        addTaskAssignees: build.mutation<Task, { taskId: string; userIds: number[] }>({
            query: ({ taskId, userIds }) => ({
                url: `tasks/${taskId}/assignees`,
                method: 'POST',
                body: { userIds }
            }),
            invalidatesTags: ['Task', 'Project']
        }),
        updateTaskAssignees: build.mutation<Task, { taskId: string; userIds: number[] }>({
            query: ({ taskId, userIds }) => ({
                url: `tasks/${taskId}/assignees`,
                method: 'PUT',
                body: { userIds }
            }),
            invalidatesTags: ['Task', 'Project']
        }),
        removeTaskAssignees: build.mutation<Task, { taskId: string; userIds: number[] }>({
            query: ({ taskId, userIds }) => ({
                url: `tasks/${taskId}/assignees`,
                method: 'DELETE',
                body: { userIds }
            }),
            invalidatesTags: ['Task', 'Project']
        })
    })
});

export const {
    useGetTasksQuery,
    useGetTaskByIdQuery,
    useCreateTaskMutation,
    useUpdateTaskMutation,
    useDeleteTaskMutation,
    useGetTaskCommentsQuery,
    useGetProjectTasksQuery,
    useUpdateTasksOrderMutation,
    // Хуки для работы с исполнителями
    useGetTaskAssigneesQuery,
    useAddTaskAssigneesMutation,
    useUpdateTaskAssigneesMutation,
    useRemoveTaskAssigneesMutation
} = taskApi; 
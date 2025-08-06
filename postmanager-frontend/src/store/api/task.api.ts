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
        getUserTasks: build.query<Task[], number>({
            query: (userId) => `tasks/user/${userId}`,
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
            // Убираем автоматическую инвалидацию, используем WebSocket для обновлений
            // invalidatesTags: ['Task', 'Project']
        }),
        updateTask: build.mutation<Task, { taskId: string; task: Partial<TaskForm> }>({
            query: ({ taskId, task }) => ({
                url: `tasks/${taskId}`,
                method: 'PUT',
                body: task
            }),
            // Убираем автоматическую инвалидацию, используем WebSocket для обновлений
            // invalidatesTags: (result, error, { taskId }) => [
            //     'Task', 
            //     'Project',
            //     { type: 'Comment', id: `task-${taskId}` }
            // ]
        }),
        deleteTask: build.mutation<void, string>({
            query: (taskId) => ({
                url: `tasks/${taskId}`,
                method: 'DELETE'
            }),
            // Убираем автоматическую инвалидацию, используем WebSocket для обновлений
            // invalidatesTags: ['Task', 'Project']
        }),
        getTaskComments: build.query<any[], string>({
            query: (taskId) => `tasks/${taskId}/comments`,
            providesTags: (result, error, taskId) => [
                { type: 'Task', id: taskId },
                { type: 'Comment', id: `task-${taskId}` }
            ]
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
            invalidatesTags: (result, error, { taskId }) => [
                'Task', 
                'Project',
                { type: 'Comment', id: `task-${taskId}` }
            ]
        }),
        updateTaskAssignees: build.mutation<Task, { taskId: string; userIds: number[] }>({
            query: ({ taskId, userIds }) => ({
                url: `tasks/${taskId}/assignees`,
                method: 'PUT',
                body: { userIds }
            }),
            invalidatesTags: (result, error, { taskId }) => [
                'Task', 
                'Project',
                { type: 'Comment', id: `task-${taskId}` }
            ]
        }),
        removeTaskAssignees: build.mutation<Task, { taskId: string; userIds: number[] }>({
            query: ({ taskId, userIds }) => ({
                url: `tasks/${taskId}/assignees`,
                method: 'DELETE',
                body: { userIds }
            }),
            invalidatesTags: (result, error, { taskId }) => [
                'Task', 
                'Project',
                { type: 'Comment', id: `task-${taskId}` }
            ]
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
    useGetUserTasksQuery,
    useUpdateTasksOrderMutation,
    // Хуки для работы с исполнителями
    useGetTaskAssigneesQuery,
    useAddTaskAssigneesMutation,
    useUpdateTaskAssigneesMutation,
    useRemoveTaskAssigneesMutation
} = taskApi; 
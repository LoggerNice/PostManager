import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getCookie } from '@/utils/cookie';
import { getApiUrl } from '@/utils/networkConfig';

// Типы для тренажера
export interface TrainerTask {
  id: number;
  title: string;
  description: string;
  command: string;
  hint?: string;
  group?: string;
  groupId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainerTaskGroup {
  id: number;
  name: string;
  missions: TrainerTask[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainerEmployee {
  id: number;
  lastName: string;
  firstName: string;
  postLinkId?: string;
  departmentName?: string;
}

export interface TrainingResult {
  employeeId: number;
  sessionId: string;
  totalTasks: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export interface TrainerRating {
  id: number;
  employee: {
    id: number;
    lastName: string;
    firstName: string;
    departmentName?: string;
  };
  totalTasks: number;
  correctAnswers: number;
  incorrectAnswers: number;
  createdAt: string;
}

// API для работы с postmanager (основные операции с тренировками)
export const trainerApi = createApi({
  reducerPath: 'trainerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: getApiUrl() + '/',
    prepareHeaders: (headers) => {
      const token = getCookie('accessToken');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['TaskGroup', 'Mission', 'TrainingResult'],
  endpoints: (builder) => ({
    // Получение групп заданий
    getTaskGroups: builder.query<TrainerTaskGroup[], void>({
      query: () => '/task-groups',
      providesTags: ['TaskGroup'],
      transformResponse: (response: any[]) => {
        return (response || []).map(g => ({
          id: g.id,
          name: g.name,
          missions: (g.missions || []).map((m: any) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            command: m.command,
            hint: m.hint,
            group: g.name,
            groupId: g.id,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
          })),
          createdAt: g.createdAt,
          updatedAt: g.updatedAt
        }));
      }
    }),

    // Получение заданий
    getTasks: builder.query<TrainerTask[], void>({
      query: () => '/missions',
      providesTags: ['Mission'],
      transformResponse: (response: any[]) => {
        return (response || []).map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          command: m.command,
          hint: m.hint,
          group: m.group?.name,
          groupId: m.groupId,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt
        }));
      }
    }),

    // Сохранение результатов тренировки
    saveTrainingResult: builder.mutation<any, TrainingResult>({
      query: (result) => ({
        url: '/training-results',
        method: 'POST',
        body: result,
      }),
      invalidatesTags: ['TrainingResult'],
    }),

    // Получение рейтинга
    getRatings: builder.query<TrainerRating[], void>({
      query: () => '/training-results/ratings',
      providesTags: ['TrainingResult'],
      transformResponse: (response: any[]) => {
        return (response || []).map(rating => ({
          id: rating.id,
          employee: {
            id: rating.employee.id,
            lastName: rating.employee.name?.split(' ')[0] || rating.employee.login || '',
            firstName: rating.employee.name?.split(' ')[1] || '',
            departmentName: rating.employee.department?.name
          },
          totalTasks: rating.totalTasks,
          correctAnswers: rating.correctAnswers,
          incorrectAnswers: rating.incorrectAnswers,
          createdAt: rating.createdAt
        }));
      }
    }),

    // Создание задания (для админов)
    createTask: builder.mutation<TrainerTask, Omit<TrainerTask, 'id'>>({
      query: (task) => ({
        url: '/missions',
        method: 'POST',
        body: {
          title: task.title,
          description: task.description,
          command: task.command,
          hint: task.hint,
          groupId: task.groupId
        },
      }),
      invalidatesTags: ['Mission', 'TaskGroup'],
    }),

    // Обновление задания
    updateTask: builder.mutation<TrainerTask, TrainerTask>({
      query: (task) => ({
        url: `/missions/${task.id}`,
        method: 'PUT',
        body: {
          title: task.title,
          description: task.description,
          command: task.command,
          hint: task.hint,
          groupId: task.groupId
        },
      }),
      invalidatesTags: ['Mission', 'TaskGroup'],
    }),

    // Удаление задания
    deleteTask: builder.mutation<void, number>({
      query: (taskId) => ({
        url: `/missions/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Mission', 'TaskGroup'],
    }),

    // Создание группы заданий
    createTaskGroup: builder.mutation<TrainerTaskGroup, { name: string }>({
      query: (group) => ({
        url: '/task-groups',
        method: 'POST',
        body: group,
      }),
      invalidatesTags: ['TaskGroup'],
    }),

    // Получение результатов тренировок
    getTrainingResults: builder.query<any[], void>({
      query: () => '/training-results',
      providesTags: ['TrainingResult'],
    }),
  }),
});

export const {
  useGetTaskGroupsQuery,
  useGetTasksQuery,
  useSaveTrainingResultMutation,
  useGetRatingsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateTaskGroupMutation,
  useGetTrainingResultsQuery,
} = trainerApi;

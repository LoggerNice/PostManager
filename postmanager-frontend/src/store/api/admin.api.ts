import { api } from './api';
import { 
  AdminStats, 
  UserActivityData, 
  ProjectAnalytics, 
  DepartmentStats, 
  SystemSettings, 
  SystemLog,
  CreateUserFormData,
  EditUserFormData,
  CreateDepartmentFormData
} from '@/types/admin.types';
import { IUser } from '@/types/user.types';
import { IDepartment, IDepartmentWithRelations } from '@/types/department.types';

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Статистика
    getAdminStats: build.query<AdminStats, void>({
      query: () => 'admin/stats',
      providesTags: ['AdminStats']
    }),
    
    getUserActivity: build.query<UserActivityData[], void>({
      query: () => 'admin/user-activity',
      providesTags: ['UserActivity']
    }),
    
    getProjectAnalytics: build.query<ProjectAnalytics[], void>({
      query: () => 'admin/project-analytics',
      providesTags: ['ProjectAnalytics']
    }),
    
    getDepartmentStats: build.query<DepartmentStats[], void>({
      query: () => 'admin/department-stats',
      providesTags: ['DepartmentStats']
    }),
    
    // Управление пользователями
    getAllUsersAdmin: build.query<IUser[], void>({
      query: () => 'admin/users',
      providesTags: ['User']
    }),
    
    createUserAdmin: build.mutation<IUser, CreateUserFormData>({
      query: (userData) => ({
        url: 'admin/users',
        method: 'POST',
        body: userData
      }),
      invalidatesTags: ['User', 'AdminStats']
    }),
    
    updateUserAdmin: build.mutation<IUser, { id: number; data: EditUserFormData }>({
      query: ({ id, data }) => ({
        url: `admin/users/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['User', 'AdminStats']
    }),
    
    deleteUserAdmin: build.mutation<void, number>({
      query: (id) => ({
        url: `admin/users/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['User', 'AdminStats']
    }),
    
    // Управление отделами
    getAllDepartmentsAdmin: build.query<IDepartmentWithRelations[], void>({
      query: () => 'admin/departments',
      providesTags: ['Department']
    }),
    
    createDepartmentAdmin: build.mutation<IDepartment, CreateDepartmentFormData>({
      query: (departmentData) => ({
        url: 'admin/departments',
        method: 'POST',
        body: departmentData
      }),
      invalidatesTags: ['Department', 'AdminStats']
    }),
    
    updateDepartmentAdmin: build.mutation<IDepartment, { id: number; data: CreateDepartmentFormData }>({
      query: ({ id, data }) => ({
        url: `admin/departments/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['Department', 'AdminStats']
    }),
    
    deleteDepartmentAdmin: build.mutation<void, number>({
      query: (id) => ({
        url: `admin/departments/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Department', 'AdminStats']
    }),
    
    // Системные настройки
    getSystemSettings: build.query<SystemSettings, void>({
      query: () => 'admin/settings',
      providesTags: ['SystemSettings']
    }),
    
    updateSystemSettings: build.mutation<SystemSettings, Partial<SystemSettings>>({
      query: (settings) => ({
        url: 'admin/settings',
        method: 'PATCH',
        body: settings
      }),
      invalidatesTags: ['SystemSettings']
    }),
    
    // Логи системы
    getSystemLogs: build.query<SystemLog[], { page?: number; limit?: number; level?: string }>({
      query: (params) => ({
        url: 'admin/logs',
        params
      }),
      providesTags: ['SystemLogs']
    }),
    
    // Бекап данных
    createBackup: build.mutation<{ backupId: string; downloadUrl: string }, void>({
      query: () => ({
        url: 'admin/backup',
        method: 'POST'
      })
    }),
    
    // Очистка кэша
    clearCache: build.mutation<void, void>({
      query: () => ({
        url: 'admin/cache/clear',
        method: 'POST'
      }),
      invalidatesTags: ['AdminStats', 'UserActivity', 'ProjectAnalytics', 'DepartmentStats']
    })
  })
});

export const {
  useGetAdminStatsQuery,
  useGetUserActivityQuery,
  useGetProjectAnalyticsQuery,
  useGetDepartmentStatsQuery,
  useGetAllUsersAdminQuery,
  useCreateUserAdminMutation,
  useUpdateUserAdminMutation,
  useDeleteUserAdminMutation,
  useGetAllDepartmentsAdminQuery,
  useCreateDepartmentAdminMutation,
  useUpdateDepartmentAdminMutation,
  useDeleteDepartmentAdminMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetSystemLogsQuery,
  useCreateBackupMutation,
  useClearCacheMutation
} = adminApi;

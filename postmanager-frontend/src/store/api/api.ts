import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getCookie } from '@/utils/cookie';
import { getApiUrl } from '@/utils/networkConfig';

export const api = createApi({
    reducerPath: 'api',
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
    tagTypes: [
        'Project', 
        'Department', 
        'User', 
        'Task', 
        'Comment', 
        'CommentViewStats',
        'AdminStats',
        'UserActivity',
        'ProjectAnalytics',
        'DepartmentStats',
        'SystemSettings',
        'SystemLogs'
    ],
    endpoints: () => ({}),
}); 
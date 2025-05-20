import { api } from './api';
import { IUser, IUserUpdateData } from '@/types/user.types';

export const userApi = api.injectEndpoints({
    endpoints: (build) => ({
        getUsers: build.query<IUser[], void>({
            query: () => 'users',
            providesTags: ['User']
        }),
        getUserById: build.query<IUser, number>({
            query: (id) => `users/${id}`,
            providesTags: (result, error, id) => [{ type: 'User', id }]
        }),
        createUser: build.mutation<IUser, Partial<IUser>>({
            query: (user) => ({
                url: 'users',
                method: 'POST',
                body: user
            }),
            invalidatesTags: ['User']
        }),
        updateUser: build.mutation<IUser, { id: number; data: IUserUpdateData }>({
            query: ({ id, data }) => ({
                url: `users/${id}`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'User', id }]
        }),
        deleteUser: build.mutation<void, number>({
            query: (id) => ({
                url: `users/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['User']
        })
    })
});

export const {
    useGetUsersQuery,
    useGetUserByIdQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation
} = userApi; 
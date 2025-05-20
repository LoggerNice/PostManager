import { api } from './api';
import { IAuthResponse, ILoginData, IRegisterData } from '@/types/auth.types';

export const authApi = api.injectEndpoints({
    endpoints: (build) => ({
        login: build.mutation<IAuthResponse, ILoginData>({
            query: (data) => ({
                url: 'auth/login',
                method: 'POST',
                body: data
            })
        }),
        register: build.mutation<IAuthResponse, IRegisterData>({
            query: (data) => ({
                url: 'auth/register',
                method: 'POST',
                body: data
            })
        })
    })
});

export const {
    useLoginMutation,
    useRegisterMutation,
} = authApi; 
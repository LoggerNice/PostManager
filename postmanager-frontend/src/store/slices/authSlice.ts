import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IAuthResponse } from '@/types/auth.types';
import { setCookie, removeCookie } from '@/utils/cookie';

interface AuthState {
    user: Omit<IAuthResponse, 'token'> | null;
    token: string | null;
}

const initialState: AuthState = {
    user: null,
    token: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<IAuthResponse>) => {
            console.log('setCredentials payload:', action.payload);
            const { token, ...userData } = action.payload;
            state.user = userData;
            state.token = token;
            setCookie('accessToken', token);
            setCookie('userId', userData.id.toString());
            setCookie('userName', userData.name);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            removeCookie('accessToken');
            removeCookie('userId');
            removeCookie('userName');
        }
    }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer; 
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IAuthResponse } from '@/types/auth.types';
import { setCookie, removeCookie } from '@/utils/cookie';

interface AuthState {
    user: IAuthResponse['user'] | null;
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
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            setCookie('accessToken', token);
            setCookie('userId', user.id.toString());
            setCookie('userName', user.name);
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
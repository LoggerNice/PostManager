import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from '@/store/api/api';
import { trainerApi } from '@/store/api/trainer.api';
import authReducer from '@/store/slices/authSlice';
import taskReducer from '@/store/slices/taskSlice';

export const store = configureStore({
    reducer: {
        [api.reducerPath]: api.reducer,
        [trainerApi.reducerPath]: trainerApi.reducer,
        auth: authReducer,
        tasks: taskReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware, trainerApi.middleware)
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
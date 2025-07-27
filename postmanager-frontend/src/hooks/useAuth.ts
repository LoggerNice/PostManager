'use client';

import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { getCookie } from '@/utils/cookie';

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: { id: number; name: string; login: string; role: string; departmentId: number; createdAt: string; updatedAt: string } | null;
  token: string | null;
  userId: number | null;
  isLoading: boolean;
}

export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useAppDispatch();
  
  const authUser = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    // Проверяем, есть ли данные в Redux
    if (authUser && token) {
      setIsLoading(false);
      return;
    }

    // Если нет данных в Redux, пытаемся восстановить из cookies
    const cookieToken = getCookie('accessToken');
    const cookieUserId = getCookie('userId');
    const cookieUserName = getCookie('userName');
    const cookieUserRole = getCookie('userRole');

    if (cookieToken && cookieUserId && cookieUserName && cookieUserRole) {
      // Восстанавливаем состояние из cookies
      dispatch(setCredentials({
        token: cookieToken,
        user: {
          id: parseInt(cookieUserId),
          name: cookieUserName,
          login: '', // Будет загружено из API
          role: cookieUserRole, // Восстанавливаем роль из куки
          departmentId: 0, // Будет загружено из API
          createdAt: '',
          updatedAt: ''
        }
      }));
    }

    setIsLoading(false);
  }, [authUser, token, dispatch]);

  const userId = authUser?.id || (getCookie('userId') ? parseInt(getCookie('userId')!) : null);
  const accessToken = token || getCookie('accessToken');
  const isAuthenticated = !!(accessToken && userId);

  return {
    isAuthenticated,
    user: authUser,
    token: accessToken,
    userId,
    isLoading
  };
}
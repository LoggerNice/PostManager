'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useLoginMutation, useRegisterMutation } from '@/store/api/auth.api';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import { Button } from '@/components/ui/button/Button';
import { toast } from 'react-hot-toast';
import { useGetDepartmentsQuery } from '@/store/api/department.api';
import { IAuthForm } from '@/types/forms/auth.types';
import { setCookie } from '@/utils/cookie';

export default function Auth() {
    const [isLoginForm, setIsLoginForm] = useState(true);
    const router = useRouter();
    const dispatch = useAppDispatch();

    const [login, { isLoading: isLoginLoading }] = useLoginMutation();
    const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
    const { data: departments = [] } = useGetDepartmentsQuery();

    const {
        register: registerForm,
        handleSubmit,
        formState: { errors },
        watch,
        reset
    } = useForm<IAuthForm>({
        mode: 'onChange'
    });

    const password = watch('password');

    const onSubmit = async (data: IAuthForm) => {
        try {
            const response = isLoginForm
                ? await login({ login: data.login, password: data.password }).unwrap()
                : await register({
                      name: data.name!,
                      login: data.login,
                      password: data.password,
                      departmentId: data.departmentId!
                  }).unwrap();

            dispatch(setCredentials(response));
            
            setCookie('accessToken', response.token);
            setCookie('userId', response.user.id.toString());
            setCookie('userName', response.user.name);

            toast.success(isLoginForm ? 'Авторизация прошла успешно' : 'Регистрация прошла успешно');
            setIsLoginForm(true);
            reset();
            router.push('/');
        } catch (error: any) {
            toast.error(error.data?.message || 'Произошла ошибка');
        }
    };

    const departmentOptions = departments.map((dept) => ({
        value: dept.id,
        label: dept.name
    }));

    return (
        <div className="flex min-h-screen items-center justify-center">
            <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center">{isLoginForm ? 'Авторизация' : 'Регистрация'}</h1>
                
                <div className="space-y-4">
                    {!isLoginForm && (
                        <Input
                            label="Имя"
                            type="text"
                            placeholder="Введите имя"
                            {...registerForm('name', {required: 'Имя обязательно'})}
                            error={errors.name}
                        />
                    )}

                    <Input
                        label="Логин"
                        type="text"
                        placeholder="Введите логин"
                        {...registerForm('login', {
                            required: 'Логин обязателен',
                            minLength: {
                                value: 3,
                                message: 'Логин должен содержать минимум 3 символа'
                            }
                        })}
                        error={errors.login}
                    />
                    <Input
                        label="Пароль"
                        type="password"
                        placeholder="Введите пароль"
                        {...registerForm('password', {
                            required: 'Пароль обязателен',
                            minLength: {
                                value: 6,
                                message: 'Пароль должен содержать минимум 6 символов'
                            }
                        })}
                        error={errors.password}
                    />
                    
                    {!isLoginForm && (
                        <Input
                            label="Повторите пароль"
                            type="password"
                            placeholder="Введите пароль"
                            {...registerForm('confirmPassword', {
                                required: 'Пароль обязателен',
                                validate: value => value === password || 'Пароли не совпадают'
                            })}
                            error={errors.confirmPassword}
                        />
                    )}

                    {!isLoginForm && (
                        <Select
                            label="Отдел"
                            options={departmentOptions}
                            {...registerForm('departmentId', {required: 'Выберите отдел'})}
                            error={errors.departmentId}
                        />
                    )}
                </div>
                
                <div className="mt-10">
                    <Button 
                        type="submit"
                        disabled={isLoginLoading || isRegisterLoading}
                    >
                        {isLoginLoading || isRegisterLoading
                            ? 'Загрузка...'
                            : isLoginForm
                            ? 'Войти'
                            : 'Зарегистрироваться'}
                    </Button>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsLoginForm(!isLoginForm)}
                    >
                        {isLoginForm ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
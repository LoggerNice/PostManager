import { toast } from 'react-hot-toast';

export const useErrorHandler = () => {
    const handleError = (error: any) => {
        const message = error?.response?.data?.message || error?.message || 'Произошла ошибка';
        toast.error(message);
    };

    const handleSuccess = (message: string) => {
        toast.success(message);
    };

    return {
        handleError,
        handleSuccess,
    };
}; 
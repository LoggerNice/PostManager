import { toast } from 'react-hot-toast';

export const useErrorHandler = () => {
    const handleError = (error: unknown) => {
        let message = 'Произошла ошибка';
        
        if (error && typeof error === 'object') {
            if ('response' in error && error.response && typeof error.response === 'object' &&
                'data' in error.response && error.response.data && typeof error.response.data === 'object' &&
                'message' in error.response.data) {
                message = String(error.response.data.message);
            } else if ('message' in error) {
                message = String(error.message);
            }
        }
        
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
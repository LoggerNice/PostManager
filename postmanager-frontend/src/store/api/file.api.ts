import { api } from './api';

export const fileApi = api.injectEndpoints({
    endpoints: (build) => ({
        uploadFile: build.mutation<{
            message: string;
            file: {
                filename: string;
                originalname: string;
                size: number;
                mimetype: string;
                url: string;
            };
        }, FormData>({
            query: (formData) => ({
                url: 'upload/file',
                method: 'POST',
                body: formData,
                headers: {
                    // Не устанавливаем Content-Type, чтобы браузер сам установил с boundary
                }
            })
        }),
        deleteFile: build.mutation<{ message: string }, string>({
            query: (filename) => ({
                url: `upload/file/${filename}`,
                method: 'DELETE'
            })
        })
    })
});

export const {
    useUploadFileMutation,
    useDeleteFileMutation
} = fileApi; 
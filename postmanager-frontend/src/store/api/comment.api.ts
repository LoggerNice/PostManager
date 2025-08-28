import { api } from './api';
import { CommentViewStats } from '@/components/ui/CommentViewIndicator';

export const commentApi = api.injectEndpoints({
    endpoints: (build) => ({
        getComments: build.query<any[], { taskId?: number }>({
            query: (params) => ({
                url: 'comments',
                params
            })
        }),
        getCommentsByTask: build.query<any[], number>({
            query: (taskId) => `comments?taskId=${taskId}`,
            providesTags: (result, error, taskId) => 
              result 
                ? [
                    ...result.map(({ id }) => ({ type: 'Comment' as const, id })),
                    { type: 'Comment', id: `task-${taskId}` }
                  ]
                : [{ type: 'Comment', id: `task-${taskId}` }],
            pollingInterval: 5000,
        }),
        createComment: build.mutation<any, { content: string; taskId: number; authorId: number; fileUrl?: string; fileName?: string; fileSize?: number; isSolution?: boolean }>({
            query: (data) => ({
                url: 'comments',
                method: 'POST',
                body: data
            }),
            invalidatesTags: (result, error, { taskId }) => [
                { type: 'Comment', id: `task-${taskId}` },
                { type: 'Comment', id: 'LIST' },
                { type: 'CommentViewStats', id: 'LIST' }
            ],
            // Обновляем статистику просмотров после создания комментария
            async onQueryStarted({ taskId }, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // Принудительно обновляем статистику просмотров
                    dispatch(commentApi.util.invalidateTags([{ type: 'CommentViewStats', id: 'LIST' }]));
                } catch (error) {
                    console.error('Ошибка при обновлении статистики просмотров:', error);
                }
            },
        }),
        updateComment: build.mutation<any, { id: number; data: { content?: string; fileUrl?: string; fileName?: string; fileSize?: number } }>({
            query: ({ id, data }) => ({
                url: `comments/${id}`,
                method: 'PUT',
                body: data
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Comment', id },
                { type: 'Comment', id: 'LIST' }
            ],
        }),
        deleteComment: build.mutation<any, number>({
            query: (id) => ({
                url: `comments/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: (result, error, id) => [
                { type: 'Comment', id },
                { type: 'Comment', id: 'LIST' }
            ],
        }),
        markCommentAsViewed: build.mutation<any, { commentId: number; userId: number }>({
            query: ({ commentId, userId }) => ({
                url: `comments/${commentId}/view`,
                method: 'POST',
                body: { userId }
            }),
            invalidatesTags: (result, error, { commentId }) => [
                { type: 'CommentViewStats', id: commentId },
                { type: 'CommentViewStats', id: 'LIST' }
            ],
            // Обновляем статистику просмотров после отметки
            async onQueryStarted({ commentId }, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;
                    // Принудительно обновляем статистику просмотров
                    dispatch(commentApi.util.invalidateTags([{ type: 'CommentViewStats', id: 'LIST' }]));
                } catch (error) {
                    console.error('Ошибка при обновлении статистики просмотров:', error);
                }
            },
        }),
        getCommentViewStats: build.query<CommentViewStats[], { commentIds: number[] }>({
            query: ({ commentIds }) => ({
                url: `comments/view-stats`,
                params: { commentIds: commentIds.join(',') }
            }),
            providesTags: (result, error, { commentIds }) => 
                commentIds.map(id => ({ type: 'CommentViewStats', id }))
        }),
        markCommentAsSolution: build.mutation<any, { commentId: number; isSolution: boolean }>({
            query: ({ commentId, isSolution }) => ({
                url: `comments/${commentId}/solution`,
                method: 'PUT',
                body: { isSolution }
            }),
            invalidatesTags: (result, error, { commentId }) => {
                const comment = result;
                return [
                    { type: 'Comment', id: commentId },
                    { type: 'Comment', id: 'LIST' },
                    { type: 'Comment', id: `task-${comment?.taskId}` }
                ];
            }
        })
    })
});

export const {
    useGetCommentsQuery,
    useGetCommentsByTaskQuery,
    useCreateCommentMutation,
    useUpdateCommentMutation,
    useDeleteCommentMutation,
    useMarkCommentAsViewedMutation,
    useGetCommentViewStatsQuery,
    useMarkCommentAsSolutionMutation
} = commentApi; 
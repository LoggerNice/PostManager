import { api } from './api';
import { Comment, CreateCommentRequest, UpdateCommentRequest } from '@/types/comment.types';

export const commentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<Comment[], void>({
      query: () => 'comments',
    }),
    getCommentsByTask: builder.query<Comment[], number>({
      query: (taskId) => `comments?taskId=${taskId}`,
      providesTags: (result, error, taskId) => 
        result 
          ? [
              ...result.map(({ id }) => ({ type: 'Comment' as const, id })),
              { type: 'Comment', id: `task-${taskId}` }
            ]
          : [{ type: 'Comment', id: `task-${taskId}` }],
      // Автоматическое обновление каждые 5 секунд
      pollingInterval: 5000,
    }),
    createComment: builder.mutation<Comment, CreateCommentRequest>({
      query: (comment) => ({
        url: 'comments',
        method: 'POST',
        body: comment,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Comment', id: `task-${taskId}` },
        { type: 'Comment', id: 'LIST' }
      ],
      // Оптимистичное обновление
      async onQueryStarted({ taskId, content, authorId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          commentApi.util.updateQueryData('getCommentsByTask', taskId, (draft) => {
            const newComment = {
              id: Date.now(), // Временный ID
              content,
              taskId,
              authorId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              author: null // Будет заполнено после ответа сервера
            };
            draft.push(newComment);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    updateComment: builder.mutation<Comment, { id: number; data: UpdateCommentRequest }>({
      query: ({ id, data }) => ({
        url: `comments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Comment', id },
        { type: 'Comment', id: 'LIST' }
      ],
    }),
    deleteComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `comments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Comment', id },
        { type: 'Comment', id: 'LIST' }
      ],
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useGetCommentsByTaskQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentApi; 
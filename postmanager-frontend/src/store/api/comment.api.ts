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
              { type: 'Comment', id: 'LIST' }
            ]
          : [{ type: 'Comment', id: 'LIST' }],
    }),
    createComment: builder.mutation<Comment, CreateCommentRequest>({
      query: (comment) => ({
        url: 'comments',
        method: 'POST',
        body: comment,
      }),
      invalidatesTags: [{ type: 'Comment', id: 'LIST' }],
    }),
    updateComment: builder.mutation<Comment, { id: number; data: UpdateCommentRequest }>({
      query: ({ id, data }) => ({
        url: `comments/${id}`,
        method: 'PUT',
        body: data,
      }),
    }),
    deleteComment: builder.mutation<void, number>({
      query: (id) => ({
        url: `comments/${id}`,
        method: 'DELETE',
      }),
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
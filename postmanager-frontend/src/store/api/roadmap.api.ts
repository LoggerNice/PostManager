import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateRoadmapResponse,
  GetRoadmapResponse,
  ListRoadmapsResponse,
  RoadmapFileDto,
  RoadmapNodeDto,
} from '@/types/roadmap';

export const roadmapApi = createApi({
  reducerPath: 'roadmapApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/roadmap',
  }),
  tagTypes: ['Roadmap'],
  endpoints: (builder) => ({
    listRoadmaps: builder.query<ListRoadmapsResponse, void>({
      query: () => `/roadmaps`,
      providesTags: ['Roadmap'],
    }),
    createRoadmap: builder.mutation<CreateRoadmapResponse, { key?: string; title?: string }>({
      query: (body) => ({
        url: `/roadmaps`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Roadmap'],
    }),
    patchRoadmap: builder.mutation<CreateRoadmapResponse, { roadmapId: string; patch: { title?: string } }>({
      query: ({ roadmapId, patch }) => ({
        url: `/roadmaps/${encodeURIComponent(roadmapId)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Roadmap'],
    }),
    deleteRoadmap: builder.mutation<void, { roadmapId: string }>({
      query: ({ roadmapId }) => ({
        url: `/roadmaps/${encodeURIComponent(roadmapId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roadmap'],
    }),
    getRoadmap: builder.query<GetRoadmapResponse, { roadmapId: string }>({
      query: ({ roadmapId }) => `/roadmap/${encodeURIComponent(roadmapId)}`,
      providesTags: (_res, _err, arg) => [{ type: 'Roadmap', id: arg.roadmapId }],
    }),
    createNode: builder.mutation<RoadmapNodeDto, { roadmapId: string; parentId?: string | null; title?: string; x: number; y: number }>({
      query: ({ roadmapId, ...body }) => ({
        url: `/roadmap/${encodeURIComponent(roadmapId)}/nodes`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Roadmap', id: arg.roadmapId }],
    }),
    patchNode: builder.mutation<RoadmapNodeDto, { nodeId: string; patch: Partial<Pick<RoadmapNodeDto, 'title' | 'description' | 'x' | 'y' | 'parentId'>> }>({
      query: ({ nodeId, patch }) => ({
        url: `/nodes/${encodeURIComponent(nodeId)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Roadmap'],
    }),
    deleteNode: builder.mutation<void, { nodeId: string }>({
      query: ({ nodeId }) => ({
        url: `/nodes/${encodeURIComponent(nodeId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roadmap'],
    }),
    uploadFile: builder.mutation<RoadmapFileDto, { nodeId: string; file: File }>({
      query: ({ nodeId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: `/nodes/${encodeURIComponent(nodeId)}/files`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Roadmap'],
    }),
    deleteFile: builder.mutation<void, { fileId: string }>({
      query: ({ fileId }) => ({
        url: `/files/${encodeURIComponent(fileId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roadmap'],
    }),
  }),
});

export const {
  useListRoadmapsQuery,
  useCreateRoadmapMutation,
  usePatchRoadmapMutation,
  useDeleteRoadmapMutation,
  useGetRoadmapQuery,
  useCreateNodeMutation,
  usePatchNodeMutation,
  useDeleteNodeMutation,
  useUploadFileMutation,
  useDeleteFileMutation,
} = roadmapApi;


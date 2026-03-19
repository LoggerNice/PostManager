import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateRoadmapResponse,
  GetRoadmapResponse,
  ListRoadmapsResponse,
  RoadmapVersionResponse,
  RoadmapsListVersionResponse,
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
      providesTags: (res) =>
        res
          ? [
              ...res.roadmaps.map((r) => ({ type: 'Roadmap' as const, id: r.key })),
              // fallback tag to allow full refresh on create/delete
              { type: 'Roadmap' as const, id: 'LIST' },
            ]
          : [{ type: 'Roadmap' as const, id: 'LIST' }],
    }),
    createRoadmap: builder.mutation<CreateRoadmapResponse, { key?: string; title?: string }>({
      query: (body) => ({
        url: `/roadmaps`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Roadmap', id: 'LIST' }],
    }),
    patchRoadmap: builder.mutation<CreateRoadmapResponse, { roadmapId: string; patch: { title?: string } }>({
      query: ({ roadmapId, patch }) => ({
        url: `/roadmaps/${encodeURIComponent(roadmapId)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Roadmap', id: arg.roadmapId }],
    }),
    deleteRoadmap: builder.mutation<void, { roadmapId: string }>({
      query: ({ roadmapId }) => ({
        url: `/roadmaps/${encodeURIComponent(roadmapId)}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: 'Roadmap', id: arg.roadmapId }],
    }),
    getRoadmap: builder.query<GetRoadmapResponse, { roadmapId: string }>({
      query: ({ roadmapId }) => `/roadmap/${encodeURIComponent(roadmapId)}`,
      providesTags: (_res, _err, arg) => [{ type: 'Roadmap', id: arg.roadmapId }],
    }),
    getRoadmapVersion: builder.query<RoadmapVersionResponse, { roadmapId: string }>({
      query: ({ roadmapId }) => `/roadmap/${encodeURIComponent(roadmapId)}/version`,
      providesTags: (_res, _err, arg) => [{ type: 'Roadmap', id: `v:${arg.roadmapId}` }],
    }),
    getRoadmapsListVersion: builder.query<RoadmapsListVersionResponse, void>({
      query: () => `/roadmaps/version`,
      providesTags: [{ type: 'Roadmap', id: 'LIST_VERSION' }],
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
    linkNodeToRoadmap: builder.mutation<RoadmapNodeDto, { nodeId: string; linkedRoadmapKey: string | null }>({
      query: ({ nodeId, linkedRoadmapKey }) => ({
        url: `/nodes/${encodeURIComponent(nodeId)}/link`,
        method: 'PATCH',
        body: { linkedRoadmapKey },
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
  useGetRoadmapsListVersionQuery,
  useCreateRoadmapMutation,
  usePatchRoadmapMutation,
  useDeleteRoadmapMutation,
  useGetRoadmapQuery,
  useGetRoadmapVersionQuery,
  useLinkNodeToRoadmapMutation,
  useCreateNodeMutation,
  usePatchNodeMutation,
  useDeleteNodeMutation,
  useUploadFileMutation,
  useDeleteFileMutation,
} = roadmapApi;


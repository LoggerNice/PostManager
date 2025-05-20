import { api } from './api';
import { IProject, IProjectForm } from '@/types/project.types';

export const projectApi = api.injectEndpoints({
    endpoints: (build) => ({
        getProjects: build.query<IProject[], void>({
            query: () => ({
                url: 'projects',
                method: 'GET'
            }),
            providesTags: ['Project']
        }),
        getProjectById: build.query<IProject, number>({
            query: (id) => ({
                url: `projects/${id}`,
                method: 'GET'
            }),
            providesTags: ['Project']
        }),
        getUserProjects: build.query<IProject[], number>({
            query: (userId) => ({
                url: `projects/user/${userId}`,
                method: 'GET'
            }),
            providesTags: ['Project']
        }),
        createProject: build.mutation<IProject, IProjectForm>({
            query: (project) => ({
                url: 'projects',
                method: 'POST',
                body: project
            }),
            invalidatesTags: ['Project']
        }),
        updateProject: build.mutation<IProject, { id: number; project: IProjectForm }>({
            query: ({ id, project }) => ({
                url: `projects/${id}`,
                method: 'PUT',
                body: project
            }),
            invalidatesTags: ['Project']
        }),
        deleteProject: build.mutation<void, number>({
            query: (id) => ({
                url: `projects/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Project']
        })
    })
});

export const {
    useGetProjectsQuery,
    useGetProjectByIdQuery,
    useGetUserProjectsQuery,
    useCreateProjectMutation,
    useUpdateProjectMutation,
    useDeleteProjectMutation
} = projectApi; 
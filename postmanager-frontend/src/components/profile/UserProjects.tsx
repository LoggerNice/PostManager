'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useGetUserProjectsQuery } from '@/store/api/project.api';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge } from '@/components/ui';
import { FolderIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface UserProjectsProps {
  userId: number;
}

export default function UserProjects({ userId }: UserProjectsProps) {
  const router = useRouter();
  const { data: userProjects = [], isLoading, error } = useGetUserProjectsQuery(userId);

  const handleProjectClick = (projectId: number) => {
    router.push(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Мои проекты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Мои проекты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500">Ошибка при загрузке проектов</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!userProjects.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Мои проекты</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FolderIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Нет проектов</h3>
            <p className="text-gray-500 dark:text-gray-400">Вы пока не участвуете ни в одном проекте</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {userProjects.map((project) => {
        return (
          <Card 
            key={project.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => project.id && handleProjectClick(project.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {project.description}
                </p>
              )}
              
              <div className="space-y-2">
                {project.startDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Начало: {format(new Date(project.startDate), 'dd.MM.yyyy', { locale: ru })}</span>
                  </div>
                )}
                
                {project.endDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Окончание: {format(new Date(project.endDate), 'dd.MM.yyyy', { locale: ru })}</span>
                  </div>
                )}
                
                {project.users && project.users.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <UsersIcon className="w-4 h-4" />
                    <span>Участников: {project.users.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

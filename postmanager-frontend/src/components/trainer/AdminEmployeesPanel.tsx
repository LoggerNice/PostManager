import React from 'react';
import { UsersIcon, BuildingOfficeIcon, AcademicCapIcon } from '@heroicons/react/24/solid';
import { TRAINER_LABELS } from '@/constants/trainer';
import { AdminEmployeesPanelProps } from '@/types/trainer.types';
import { formatName } from '../charts/DepartmentTasksExcelExport';

export const AdminEmployeesPanel: React.FC<AdminEmployeesPanelProps> = ({
  users,
  departments,
  isLoadingUsers,
  className = ""
}) => {

  return (
    <div className={`h-full space-y-6 ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Сотрудники по отделам
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UsersIcon className="h-4 w-4" />
            <span>{users.length} чел.</span>
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Загрузка сотрудников...</span>
          </div>
        ) : (
          <div className="space-y-4 max-h-screen overflow-y-auto custom-scrollbar">
            {departments.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">Нет сотрудников</p>
              </div>
            ) : (
              departments.map((dept, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {dept.departmentName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <UsersIcon className="h-4 w-4" />
                          {dept.totalUsers}
                        </span>
                        <span className="flex items-center gap-1">
                          <AcademicCapIcon className="h-4 w-4" />
                          {dept.totalTrainingResults}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {dept.users.map((user) => (
                        <div key={user.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {formatName(user.name)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {user.trainingResults?.length || 0} тренировок
                              </div>
                              {user.trainingResults && user.trainingResults.length > 0 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  Последняя: {new Date(user.trainingResults[user.trainingResults.length - 1].completedAt).toLocaleDateString('ru-RU')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Отдел "Без отдела" */}
            {users.filter(u => !u.department).length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Без отдела
                      </h3>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {users.filter(u => !u.department).length} чел.
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {users.filter(u => !u.department).map((user) => (
                    <div key={user.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Логин: {user.login}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {user.trainingResults?.length || 0} тренировок
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

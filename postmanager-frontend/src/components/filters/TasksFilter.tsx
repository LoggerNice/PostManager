'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  TasksFilterConfig, 
  TasksFilterProps, 
  FilterOption
} from '@/types/filter.types';
import { TaskPriority } from '@/types/task.types';
import { DateInput } from '@/components/ui';
import { CustomMultiSelect } from '@/components/ui';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { formatName } from '../charts/DepartmentTasksExcelExport';

// Константы для приоритетов
const PRIORITY_OPTIONS: FilterOption<TaskPriority>[] = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' }
];

// Константы для сортировки
const SORT_OPTIONS: FilterOption<string>[] = [
  { value: 'priority', label: 'По приоритету' },
  { value: 'assignee', label: 'По исполнителю' },
  { value: 'deadline', label: 'По сроку' },
  { value: 'createdAt', label: 'По дате создания' },
  { value: 'title', label: 'По названию' }
];

const SORT_ORDER_OPTIONS: FilterOption<string>[] = [
  { value: 'asc', label: 'По возрастанию' },
  { value: 'desc', label: 'По убыванию' }
];

export default function TasksFilter({
  filters,
  onFiltersChange,
  availableDepartments = [],
  availableUsers = [],
  availableProjects = [],
  context = 'project',
  projectParticipants = [],
  showDepartmentFilter = true,
  showAssigneeFilter = true,
  showDateFilter = true,
  showPriorityFilter = true,
  showProjectFilter = false,
  showSortFilter = true,
  searchPlaceholder = 'Поиск по названию задачи...',
  className = ''
}: TasksFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Преобразуем отделы в опции для MultiSelect
  const departmentOptions = useMemo(() => 
    availableDepartments.map(dept => ({
      value: dept.id,
      label: dept.name
    })), [availableDepartments]
  );

  // Преобразуем пользователей в опции для MultiSelect
  // Если это проект - показываем только участников проекта
  // Если это "мои задачи" - показываем всех пользователей, но поле неактивно
  const userOptions = useMemo(() => {
    let users = availableUsers;
    
    if (context === 'project' && projectParticipants.length > 0) {
      users = projectParticipants;
    }
    
    return users.map(user => ({
      value: user.id,
      label: formatName(user.name)
    }));
  }, [availableUsers, context, projectParticipants]);

  // Преобразуем проекты в опции для MultiSelect
  const projectOptions = useMemo(() => 
    availableProjects.map(project => ({
      value: project.id,
      label: project.title
    })), [availableProjects]
  );

  // Определяем, должно ли поле участников быть активным
  const isAssigneeFilterActive = useMemo(() => {
    return context !== 'my-tasks';
  }, [context]);

  // Очищаем фильтр участников, если он стал неактивным
  React.useEffect(() => {
    if (!isAssigneeFilterActive && filters.assignees && filters.assignees.length > 0) {
      onFiltersChange({
        ...filters,
        assignees: []
      });
    }
  }, [isAssigneeFilterActive, filters.assignees, filters, onFiltersChange]);

  // Обработчики изменений
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchQuery: event.target.value
    });
  }, [filters, onFiltersChange]);

  const handleDepartmentsChange = useCallback((selectedIds: number[]) => {
    const selectedDepartments = availableDepartments.filter(dept => selectedIds.includes(dept.id));
    onFiltersChange({
      ...filters,
      departments: selectedDepartments || []
    });
  }, [filters, onFiltersChange, availableDepartments]);

  const handlePrioritiesChange = useCallback((selectedPriorities: string[]) => {
    onFiltersChange({
      ...filters,
      priorities: (selectedPriorities as TaskPriority[]) || []
    });
  }, [filters, onFiltersChange]);

  const handleProjectsChange = useCallback((selectedIds: number[]) => {
    const selectedProjects = availableProjects.filter(project => selectedIds.includes(project.id));
    onFiltersChange({
      ...filters,
      projects: selectedProjects || []
    });
  }, [filters, onFiltersChange, availableProjects]);

  const handleAssigneesChange = useCallback((selectedIds: number[]) => {
    const selectedUsers = availableUsers.filter(user => selectedIds.includes(user.id));
    onFiltersChange({
      ...filters,
      assignees: selectedUsers || []
    });
  }, [filters, onFiltersChange, availableUsers]);

  const handleStartDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value + 'T00:00:00') : null;
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        startDate: date
      }
    });
  }, [filters, onFiltersChange]);

  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value + 'T23:59:59') : null;
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        endDate: date
      }
    });
  }, [filters, onFiltersChange]);

  const handleSortByChange = useCallback((sortBy: string) => {
    onFiltersChange({
      ...filters,
      sortBy: sortBy as 'priority' | 'assignee' | 'deadline' | 'createdAt' | 'title'
    });
  }, [filters, onFiltersChange]);

  const handleSortOrderChange = useCallback((sortOrder: string) => {
    onFiltersChange({
      ...filters,
      sortOrder: sortOrder as 'asc' | 'desc'
    });
  }, [filters, onFiltersChange]);

  // Очистка всех фильтров
  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      searchQuery: '',
      departments: [],
      priorities: [],
      assignees: [],
      projects: [],
      sortBy: 'priority',
      sortOrder: 'desc',
      dateRange: {
        startDate: null,
        endDate: null
      }
    });
  }, [onFiltersChange]);

  // Проверяем, есть ли активные фильтры
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.length > 0 ||
      (filters.departments && filters.departments.length > 0) ||
      (filters.priorities && filters.priorities.length > 0) ||
      (isAssigneeFilterActive && filters.assignees && filters.assignees.length > 0) ||
      (filters.projects && filters.projects.length > 0) ||
      filters.dateRange.startDate !== null ||
      filters.dateRange.endDate !== null ||
      filters.sortBy !== 'priority' ||
      filters.sortOrder !== 'desc'
    );
  }, [filters, isAssigneeFilterActive]);

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-hidden ${className}`}>
      {/* Заголовок и поиск */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        {/* Поле поиска */}
        <div className="flex-1 w-full sm:w-auto min-w-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={filters.searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-500 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
          {/* Кнопка расширения фильтров */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors whitespace-nowrap"
          >
            <FunnelIcon className="h-4 w-4" />
            Фильтры
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full h-2 w-2"></span>
            )}
          </button>

          {/* Кнопка очистки фильтров */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors whitespace-nowrap"
            >
              <XMarkIcon className="h-4 w-4" />
              Очистить
            </button>
          )}
        </div>
      </div>

      {/* Расширенные фильтры */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          {/* Фильтр по отделам */}
          {showDepartmentFilter && departmentOptions.length > 0 && (
            <div className="min-w-0">
              <CustomMultiSelect
                label="Отделы"
                name="departments"
                options={departmentOptions}
                value={(filters.departments || []).map(dept => dept.id)}
                onChange={handleDepartmentsChange}
                placeholder="Выберите отделы..."
                searchPlaceholder="Поиск отделов..."
                noOptionsMessage="Отделы не найдены"
              />
            </div>
          )}

          {/* Фильтр по приоритету */}
          {showPriorityFilter && (
            <div className="min-w-0">
              <CustomMultiSelect
                label="Приоритет"
                name="priorities"
                options={PRIORITY_OPTIONS.map(p => ({ value: p.value as any, label: p.label }))}
                value={(filters.priorities || []) as any[]}
                onChange={handlePrioritiesChange as any}
                placeholder="Выберите приоритеты..."
                searchPlaceholder="Поиск приоритетов..."
                noOptionsMessage="Приоритеты не найдены"
              />
            </div>
          )}

          {/* Фильтр по проектам */}
          {showProjectFilter && projectOptions.length > 0 && (
            <div className="min-w-0">
              <CustomMultiSelect
                label="Проекты"
                name="projects"
                options={projectOptions}
                value={(filters.projects || []).map(project => project.id)}
                onChange={handleProjectsChange}
                placeholder="Выберите проекты..."
                searchPlaceholder="Поиск проектов..."
                noOptionsMessage="Проекты не найдены"
              />
            </div>
          )}

          {/* Фильтр по участникам */}
          {showAssigneeFilter && (
            <div className="min-w-0">
              <CustomMultiSelect
                label={'Участники'}
                name="assignees"
                options={userOptions}
                value={(filters.assignees || []).map(user => user.id)}
                onChange={handleAssigneesChange}
                placeholder={context === 'my-tasks' ? 'Недоступно' : 'Выберите участников...'}
                searchPlaceholder="Поиск участников..."
                noOptionsMessage="Участники не найдены"
                disabled={context === 'my-tasks' || !isAssigneeFilterActive}
              />
              {context === 'my-tasks' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Фильтр по участникам недоступен на этой странице
                </p>
              )}
            </div>
          )}

                     {/* Фильтр по дате */}
           {showDateFilter && (
             <div className="min-w-0 space-y-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Период задач
               </label>
               <div className="flex gap-2">
                 <DateInput
                   placeholder="От"
                   value={filters.dateRange.startDate ? format(filters.dateRange.startDate, 'yyyy-MM-dd') : ''}
                   onChange={handleStartDateChange}
                   className="flex-1 min-w-0 hover:border-blue-400"
                 />
                 <DateInput
                   placeholder="До"
                   value={filters.dateRange.endDate ? format(filters.dateRange.endDate, 'yyyy-MM-dd') : ''}
                   onChange={handleEndDateChange}
                   className="flex-1 min-w-0 hover:border-blue-400" 
                 />
               </div>
             </div>
           )}

           {/* Фильтр сортировки */}
           {showSortFilter && (
             <div className="min-w-0 space-y-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                 Сортировка
               </label>
               <div className="flex gap-2">
                 <select
                   value={filters.sortBy || 'priority'}
                   onChange={(e) => handleSortByChange(e.target.value)}
                   className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                 >
                   {SORT_OPTIONS.map(option => (
                     <option key={option.value} value={option.value}>
                       {option.label}
                     </option>
                   ))}
                 </select>
                 <select
                   value={filters.sortOrder || 'desc'}
                   onChange={(e) => handleSortOrderChange(e.target.value)}
                   className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                 >
                   {SORT_ORDER_OPTIONS.map(option => (
                     <option key={option.value} value={option.value}>
                       {option.label}
                     </option>
                   ))}
                 </select>
               </div>
             </div>
           )}
        </div>
      )}

      {/* Активные фильтры (теги) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {filters.searchQuery && (
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
              Поиск: "{filters.searchQuery}"
              <button
                onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
                className="hover:text-blue-600 dark:hover:text-blue-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          )}
          
                     {filters.departments && filters.departments.map(dept => (
            <div key={dept.id} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
              {dept.name}
              <button
                                 onClick={() => handleDepartmentsChange((filters.departments || []).filter(d => d.id !== dept.id).map(d => d.id))}
                className="hover:text-green-600 dark:hover:text-green-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
                     {filters.priorities && filters.priorities.map(priority => (
            <div key={priority} className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
              {PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority}
              <button
                                 onClick={() => handlePrioritiesChange((filters.priorities || []).filter(p => p !== priority))}
                className="hover:text-orange-600 dark:hover:text-orange-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
                     {/* Теги проектов */}
                       {filters.projects && filters.projects.map(project => (
             <div key={project.id} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
               {project.title}
               <button
                                   onClick={() => handleProjectsChange((filters.projects || []).filter(p => p.id !== project.id).map(p => p.id))}
                 className="hover:text-indigo-600 dark:hover:text-indigo-300"
               >
                 <XMarkIcon className="h-3 w-3" />
               </button>
             </div>
           ))}
           
           {/* Теги участников - показываем только если фильтр активен */}
                       {isAssigneeFilterActive && filters.assignees && filters.assignees.map(user => (
             <div key={user.id} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
               {formatName(user.name)}
               <button
                 onClick={() => handleAssigneesChange((filters.assignees || []).filter(u => u.id !== user.id).map(u => u.id))}
                 className="hover:text-purple-600 dark:hover:text-purple-300"
               >
                 <XMarkIcon className="h-3 w-3" />
               </button>
             </div>
           ))}
          
          {filters.dateRange.startDate && (
            <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
              От {format(filters.dateRange.startDate, 'dd.MM.yyyy')}
              <button
                onClick={() => onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, startDate: null } })}
                className="hover:text-pink-600 dark:hover:text-pink-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          )}
          
                     {filters.dateRange.endDate && (
             <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
               До {format(filters.dateRange.endDate, 'dd.MM.yyyy')}
               <button
                 onClick={() => onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, endDate: null } })}
                 className="hover:text-pink-600 dark:hover:text-pink-300"
               >
                 <XMarkIcon className="h-3 w-3" />
               </button>
             </div>
           )}

           {/* Теги сортировки */}
           {(filters.sortBy !== 'priority' || filters.sortOrder !== 'desc') && (
             <div className="bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
               {SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label} ({SORT_ORDER_OPTIONS.find(o => o.value === filters.sortOrder)?.label})
               <button
                 onClick={() => onFiltersChange({ ...filters, sortBy: 'priority', sortOrder: 'desc' })}
                 className="hover:text-teal-600 dark:hover:text-teal-300"
               >
                 <XMarkIcon className="h-3 w-3" />
               </button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}

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

const PRIORITY_OPTIONS: FilterOption<TaskPriority>[] = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' }
];

const SORT_OPTIONS: FilterOption<string>[] = [
  { value: 'priority', label: 'По приоритету' },
  { value: 'deadline', label: 'По сроку' },
  { value: 'createdAt', label: 'По дате создания' }
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
  searchPlaceholder = 'Поиск задач...',
  className = ''
}: TasksFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const departmentOptions = useMemo(() => 
    availableDepartments.map(dept => ({
      value: dept.id,
      label: dept.name
    })), [availableDepartments]
  );
  
  const userOptions = useMemo(() => {
    const users = context === 'project' && projectParticipants.length > 0 
      ? projectParticipants 
      : availableUsers;
    
    return users.map(user => ({
      value: user.id,
      label: formatName(user.name)
    }));
  }, [availableUsers, context, projectParticipants]);

  const projectOptions = useMemo(() => 
    availableProjects.map(project => ({
      value: project.id,
      label: project.title
    })), [availableProjects]
  );

  const isAssigneeFilterActive = useMemo(() => context !== 'my-tasks', [context]);

  React.useEffect(() => {
    if (!isAssigneeFilterActive && filters.assignees?.length > 0) {
      onFiltersChange({ ...filters, assignees: [] });
    }
  }, [isAssigneeFilterActive, filters.assignees, onFiltersChange]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchQuery: event.target.value });
  }, [filters, onFiltersChange]);

  const handleDepartmentsChange = useCallback((selectedIds: number[]) => {
    const selectedDepartments = availableDepartments.filter(dept => selectedIds.includes(dept.id));
    onFiltersChange({ ...filters, departments: selectedDepartments });
  }, [filters, onFiltersChange, availableDepartments]);

  const handlePrioritiesChange = useCallback((selectedPriorities: string[]) => {
    onFiltersChange({ ...filters, priorities: selectedPriorities as TaskPriority[] });
  }, [filters, onFiltersChange]);

  const handleProjectsChange = useCallback((selectedIds: number[]) => {
    const selectedProjects = availableProjects.filter(project => selectedIds.includes(project.id));
    onFiltersChange({ ...filters, projects: selectedProjects });
  }, [filters, onFiltersChange, availableProjects]);

  const handleAssigneesChange = useCallback((selectedIds: number[]) => {
    const selectedUsers = availableUsers.filter(user => selectedIds.includes(user.id));
    onFiltersChange({ ...filters, assignees: selectedUsers });
  }, [filters, onFiltersChange, availableUsers]);

  const handleStartDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value + 'T00:00:00') : null;
    onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, startDate: date } });
  }, [filters, onFiltersChange]);

  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value + 'T23:59:59') : null;
    onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, endDate: date } });
  }, [filters, onFiltersChange]);

  const handleSortByChange = useCallback((sortBy: string) => {
    onFiltersChange({ ...filters, sortBy: sortBy as 'priority' | 'deadline' | 'createdAt' });
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      searchQuery: '',
      departments: [],
      priorities: [],
      assignees: [],
      projects: [],
      sortBy: 'priority',
      sortOrder: 'desc',
      dateRange: { startDate: null, endDate: null }
    });
  }, [onFiltersChange]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.length > 0 ||
      filters.departments?.length > 0 ||
      filters.priorities?.length > 0 ||
      (isAssigneeFilterActive && filters.assignees?.length > 0) ||
      filters.projects?.length > 0 ||
      filters.dateRange.startDate !== null ||
      filters.dateRange.endDate !== null ||
      filters.sortBy !== 'priority' ||
      filters.sortOrder !== 'desc'
    );
  }, [filters, isAssigneeFilterActive]);

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={filters.searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <FunnelIcon className="h-4 w-4" />
            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="p-1.5 text-sm text-red-600 dark:text-red-400"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {showDepartmentFilter && departmentOptions.length > 0 && (
            <CustomMultiSelect
              name="departments"
              label="Отделы"
              options={departmentOptions}
              value={filters.departments?.map(d => d.id) || []}
              onChange={handleDepartmentsChange}
              placeholder="Выбрать..."
            />
          )}

          {showPriorityFilter && (
            <CustomMultiSelect
              name="priorities"
              label="Приоритет"
              options={PRIORITY_OPTIONS.map(p => ({ value: p.value as any, label: p.label }))}
              value={filters.priorities as any[] || []}
              onChange={handlePrioritiesChange as any}
              placeholder="Выбрать..."
            />
          )}

          {showProjectFilter && projectOptions.length > 0 && (
            <CustomMultiSelect
              name="projects"
              label="Проекты"
              options={projectOptions}
              value={filters.projects?.map(p => p.id) || []}
              onChange={handleProjectsChange}
              placeholder="Выбрать..."
            />
          )}

          {showAssigneeFilter && (
            <CustomMultiSelect
              name="assignees"
              label="Исполнители"
              options={userOptions}
              value={filters.assignees?.map(u => u.id) || []}
              onChange={handleAssigneesChange}
              placeholder={context === 'my-tasks' ? 'Недоступно' : 'Выбрать...'}
              disabled={context === 'my-tasks' || !isAssigneeFilterActive}
            />
          )}

          {showDateFilter && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Даты</label>
              <div className="flex gap-1">
                <DateInput
                  placeholder="От"
                  value={filters.dateRange.startDate ? format(filters.dateRange.startDate, 'yyyy-MM-dd') : ''}
                  onChange={handleStartDateChange}
                  className="flex-1 text-sm"
                />
                <DateInput
                  placeholder="До"
                  value={filters.dateRange.endDate ? format(filters.dateRange.endDate, 'yyyy-MM-dd') : ''}
                  onChange={handleEndDateChange}
                  className="flex-1 text-sm"
                />
              </div>
            </div>
          )}

          {showSortFilter && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Сортировка</label>
              <select
                value={filters.sortBy || 'priority'}
                onChange={(e) => handleSortByChange(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          {filters.searchQuery && (
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs flex items-center">
              "{filters.searchQuery}"
              <button onClick={() => onFiltersChange({ ...filters, searchQuery: '' })} className="ml-1">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.departments?.map(dept => (
            <div key={dept.id} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full text-xs flex items-center">
              {dept.name}
              <button onClick={() => handleDepartmentsChange((filters.departments || []).filter(d => d.id !== dept.id).map(d => d.id))} className="ml-1">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {filters.priorities?.map(priority => (
            <div key={priority} className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full text-xs flex items-center">
              {PRIORITY_OPTIONS.find(p => p.value === priority)?.label}
              <button onClick={() => handlePrioritiesChange((filters.priorities || []).filter(p => p !== priority))} className="ml-1">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {isAssigneeFilterActive && filters.assignees?.map(user => (
            <div key={user.id} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full text-xs flex items-center">
              {formatName(user.name)}
              <button onClick={() => handleAssigneesChange((filters.assignees || []).filter(u => u.id !== user.id).map(u => u.id))} className="ml-1">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {filters.projects?.map(project => (
            <div key={project.id} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full text-xs flex items-center">
              {project.title}
              <button onClick={() => handleProjectsChange((filters.projects || []).filter(p => p.id !== project.id).map(p => p.id))} className="ml-1">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {filters.dateRange.startDate && (
            <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 px-2 py-0.5 rounded-full text-xs flex items-center">
              От {format(filters.dateRange.startDate, 'dd.MM.yyyy')}
              <button onClick={() => onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, startDate: null } })} className="ml-1">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          )}
          
          {filters.dateRange.endDate && (
            <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 px-2 py-0.5 rounded-full text-xs flex items-center">
              До {format(filters.dateRange.endDate, 'dd.MM.yyyy')}
              <button onClick={() => onFiltersChange({ ...filters, dateRange: { ...filters.dateRange, endDate: null } })} className="ml-1">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
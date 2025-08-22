'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  TasksFilterConfig, 
  TasksFilterProps, 
  FilterOption
} from '@/types/filter.types';
import { TaskPriority } from '@/types/task.types';
import Input from '@/components/ui/Input';
import { MultiSelect } from '@/components/ui/multi-select/MultiSelect';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

// Константы для приоритетов
const PRIORITY_OPTIONS: FilterOption<TaskPriority>[] = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' }
];

export default function TasksFilter({
  filters,
  onFiltersChange,
  availableDepartments = [],
  availableUsers = [],
  showDepartmentFilter = true,
  showAssigneeFilter = true,
  showDateFilter = true,
  showPriorityFilter = true,
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
  const userOptions = useMemo(() => 
    availableUsers.map(user => ({
      value: user.id,
      label: `${user.name}${user.department ? ` (${user.department.name})` : ''}`
    })), [availableUsers]
  );

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
      departments: selectedDepartments
    });
  }, [filters, onFiltersChange, availableDepartments]);

  const handlePrioritiesChange = useCallback((selectedPriorities: string[]) => {
    onFiltersChange({
      ...filters,
      priorities: selectedPriorities as TaskPriority[]
    });
  }, [filters, onFiltersChange]);

  const handleAssigneesChange = useCallback((selectedIds: number[]) => {
    const selectedUsers = availableUsers.filter(user => selectedIds.includes(user.id));
    onFiltersChange({
      ...filters,
      assignees: selectedUsers
    });
  }, [filters, onFiltersChange, availableUsers]);

  const handleStartDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value) : null;
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        startDate: date
      }
    });
  }, [filters, onFiltersChange]);

  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value ? new Date(event.target.value) : null;
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        endDate: date
      }
    });
  }, [filters, onFiltersChange]);

  // Очистка всех фильтров
  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      searchQuery: '',
      departments: [],
      priorities: [],
      assignees: [],
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
      filters.departments.length > 0 ||
      filters.priorities.length > 0 ||
      filters.assignees.length > 0 ||
      filters.dateRange.startDate !== null ||
      filters.dateRange.endDate !== null
    );
  }, [filters]);

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Заголовок и поиск */}
      <div className="flex items-center gap-4">
        {/* Поле поиска */}
        <div className="flex-1 relative">
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

        {/* Кнопка расширения фильтров */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
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
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Очистить
          </button>
        )}
      </div>

      {/* Расширенные фильтры */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          {/* Фильтр по отделам */}
          {showDepartmentFilter && departmentOptions.length > 0 && (
            <div>
              <MultiSelect
                label="Отделы"
                name="departments"
                options={departmentOptions}
                value={filters.departments.map(dept => dept.id)}
                onChange={handleDepartmentsChange}
                placeholder="Выберите отделы..."
              />
            </div>
          )}

          {/* Фильтр по приоритету */}
          {showPriorityFilter && (
            <div>
              <MultiSelect
                label="Приоритет"
                name="priorities"
                options={PRIORITY_OPTIONS.map(p => ({ value: p.value as any, label: p.label }))}
                value={filters.priorities as any[]}
                onChange={handlePrioritiesChange as any}
                placeholder="Выберите приоритеты..."
              />
            </div>
          )}

          {/* Фильтр по участникам */}
          {showAssigneeFilter && userOptions.length > 0 && (
            <div>
              <MultiSelect
                label="Участники"
                name="assignees"
                options={userOptions}
                value={filters.assignees.map(user => user.id)}
                onChange={handleAssigneesChange}
                placeholder="Выберите участников..."
              />
            </div>
          )}

          {/* Фильтр по дате */}
          {showDateFilter && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Период задач
              </label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  placeholder="От"
                  value={filters.dateRange.startDate ? format(filters.dateRange.startDate, 'yyyy-MM-dd') : ''}
                  onChange={handleStartDateChange}
                />
                <Input
                  type="date"
                  placeholder="До"
                  value={filters.dateRange.endDate ? format(filters.dateRange.endDate, 'yyyy-MM-dd') : ''}
                  onChange={handleEndDateChange}
                />
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
          
          {filters.departments.map(dept => (
            <div key={dept.id} className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
              {dept.name}
              <button
                onClick={() => handleDepartmentsChange(filters.departments.filter(d => d.id !== dept.id).map(d => d.id))}
                className="hover:text-green-600 dark:hover:text-green-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {filters.priorities.map(priority => (
            <div key={priority} className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
              {PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority}
              <button
                onClick={() => handlePrioritiesChange(filters.priorities.filter(p => p !== priority))}
                className="hover:text-orange-600 dark:hover:text-orange-300"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
          
          {filters.assignees.map(user => (
            <div key={user.id} className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full text-sm flex items-center gap-1">
              {user.name}
              <button
                onClick={() => handleAssigneesChange(filters.assignees.filter(u => u.id !== user.id).map(u => u.id))}
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
        </div>
      )}
    </div>
  );
}

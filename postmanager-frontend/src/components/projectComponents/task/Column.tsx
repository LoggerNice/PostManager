'use client';

import { useState } from 'react';
import { Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import VirtualizedTaskList from './VirtualizedTaskList';
import TaskModal from './TaskModal';
import { Column as ColumnType } from '../../../types';
import { Task, TaskPriority, TaskType } from '@/types/task.types';
import { PlusIcon } from '@heroicons/react/24/outline';

interface ColumnProps {
  columnId: string;
  column: ColumnType;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
  onCreateTask?: (columnId: string, title: string, description?: string, priority?: TaskPriority, taskType?: TaskType, deadline?: string, assigneeIds?: number[]) => void;
  showProjectTitle?: boolean;
}

export default function Column({ 
  columnId, 
  column, 
  handleDeleteTask, 
  onTaskUpdate, 
  onCreateTask,
  showProjectTitle = false 
}: ColumnProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Низкий' as 'Низкий' | 'Средний' | 'Высокий',
    taskType: 'OTHER' as TaskType,
    deadline: null as Date | null,
    assigneeIds: [] as number[]
  });

  const handleCreateTask = async () => {
    if (!onCreateTask) return;
    
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      await onCreateTask(
        columnId,
        newTask.title,
        newTask.description,
        priorityMap[newTask.priority],
        newTask.taskType,
        newTask.deadline ? newTask.deadline.toISOString() : undefined,
        newTask.assigneeIds
      );

      // Сброс формы
      setNewTask({
        title: '',
        description: '',
        priority: 'Низкий',
        taskType: 'OTHER',
        deadline: null,
        assigneeIds: []
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex-1 shadow-lg border border-zinc-800 h-[calc(100vh-300px)] flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">
          {column.name} <span className="text-blue-500 pl-2">{column.items.length}</span>
        </h2>
        {onCreateTask && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors duration-200"
            title="Добавить задачу"
          >
            <PlusIcon className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>
      <Droppable droppableId={columnId}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <VirtualizedTaskList
            columnId={columnId}
            items={column.items as unknown as Task[]}
            provided={provided}
            snapshot={snapshot}
            onDelete={handleDeleteTask}
            onTaskUpdate={onTaskUpdate}
            showProjectTitle={showProjectTitle}
            itemSize={132}
          />
        )}
      </Droppable>

      {/* Модальное окно создания задачи */}
      {showCreateModal && (
        <TaskModal
          visible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setNewTask({
              title: '',
              description: '',
              priority: 'Низкий',
              taskType: 'OTHER',
              deadline: null,
              assigneeIds: []
            });
          }}
          onCreate={handleCreateTask}
          newTask={newTask}
          setNewTask={(task) => {
            setNewTask({
              title: task.title,
              description: task.description,
              priority: task.priority,
              taskType: task.taskType,
              deadline: task.deadline || null,
              assigneeIds: task.assigneeIds || []
            });
          }}
          columns={{}}
          selectedColumn=""
          setSelectedColumn={() => {}}
        />
      )}
    </div>
  );
} 
'use client';

import { Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Column as ColumnType } from '../../../types';
import { Task, TaskPriority, TaskType } from '@/types/task.types';
import { useState } from 'react';
import { format } from 'date-fns';
import TaskModal from './TaskModal';

interface ColumnProps {
  columnId: string;
  column: ColumnType;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
  onAddTask: (columnId: string, title: string, description?: string, priority?: TaskPriority, taskType?: any, deadline?: string, assigneeIds?: number[]) => void;
  onUpdateColumnName: (columnId: string, newName: string) => void;
  showProjectTitle?: boolean;
  showAddButton?: boolean;
}

export default function Column({ columnId, column, handleDeleteTask, onTaskUpdate, onAddTask, onUpdateColumnName, showProjectTitle = false, showAddButton = true }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(column.name);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'Низкий' as 'Низкий' | 'Средний' | 'Высокий',
    taskType: 'OTHER' as any,
    deadline: null as Date | null,
    assigneeIds: [] as number[]
  });

  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
    setEditingTitle(column.name);
  };

  const handleTitleSave = () => {
    if (editingTitle.trim()) {
      onUpdateColumnName(columnId, editingTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditingTitle(column.name);
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleAddTaskClick = () => {
    setShowCreateModal(true);
    setNewTaskData({
      title: '',
      description: '',
      priority: 'Низкий',
      taskType: 'OTHER' as any,
      deadline: null,
      assigneeIds: []
    });
  };

  const handleTaskCreate = () => {
    if (newTaskData.title.trim()) {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };
      
      const taskTypeMap: Record<string, any> = {
        'OTHER': 'OTHER',
        'METHODOLOGIES': 'METHODOLOGIES',
        'TESTING_PREPARATION': 'TESTING_PREPARATION',
        'DEBUG_CHECK': 'DEBUG_CHECK',
        'MEETING': 'MEETING'
      };
      
              const deadlineString = newTaskData.deadline ? format(newTaskData.deadline, 'yyyy-MM-dd HH:mm:ss') : undefined;
      
      onAddTask(
        columnId, 
        newTaskData.title.trim(),
        newTaskData.description.trim(),
        priorityMap[newTaskData.priority],
        taskTypeMap[newTaskData.taskType] || 'OTHER',
        deadlineString,
        newTaskData.assigneeIds
      );
      setNewTaskData({
        title: '',
        description: '',
        priority: 'Низкий',
        taskType: 'OTHER' as any,
        deadline: null,
        assigneeIds: []
      });
    }
    setShowCreateModal(false);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex-1 shadow-lg border border-zinc-800 h-[calc(100vh-300px)] flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        {isEditingTitle ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyPress}
            className="bg-gray-700 text-white px-2 py-1 rounded text-lg font-semibold border border-gray-600 focus:border-blue-400 focus:outline-none"
            autoFocus
          />
        ) : (
          <h2 
            className="text-lg font-semibold cursor-pointer hover:bg-gray-700 px-2 py-1 rounded"
            onDoubleClick={handleTitleDoubleClick}
            title="Двойной клик для редактирования"
          >
            {column.name} <span className="text-blue-500 pl-2">{column.items.length}</span>
          </h2>
        )}
        {columnId !== 'COMPLETED' && columnId !== 'PROBLEM' && showAddButton !== false && (
          <button
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-2xl"
            onClick={handleAddTaskClick}
            title="Добавить задачу в этот столбец"
          >+
          </button>
        )}
      </div>
      <Droppable droppableId={columnId}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-2 flex-1 overflow-y-auto custom-scrollbar ${
              snapshot.isDraggingOver ? 'bg-gray-700 bg-opacity-50 rounded-lg' : ''
            }`}
          >
            {column.items.map((item, idx) => (
              <Draggable key={`${columnId}-${item.id}-${idx}`} draggableId={String(item.id)} index={idx}>
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <TaskCard
                    item={item}
                    columnId={columnId}
                    handleDeleteTask={handleDeleteTask}
                    onTaskUpdate={onTaskUpdate}
                    provided={provided}
                    snapshot={snapshot}
                    showProjectTitle={showProjectTitle}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <TaskModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleTaskCreate}
        newTask={newTaskData}
        setNewTask={(task) => {
          setNewTaskData({
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
    </div>
  );
} 
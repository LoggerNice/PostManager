'use client';

import { Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Column as ColumnType } from '../../../types';
import { Task } from '@/types/task.types';
import { useState } from 'react';

interface ColumnProps {
  columnId: string;
  column: ColumnType;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
  onAddTask: (columnId: string, title: string) => void;
  onUpdateColumnName: (columnId: string, newName: string) => void;
}

export default function Column({ columnId, column, handleDeleteTask, onTaskUpdate, onAddTask, onUpdateColumnName }: ColumnProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(column.name);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

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
    setIsCreatingTask(true);
    setNewTaskTitle('');
  };

  const handleTaskCreate = () => {
    if (newTaskTitle.trim()) {
      onAddTask(columnId, newTaskTitle.trim());
      setNewTaskTitle('');
    }
    setIsCreatingTask(false);
  };

  const handleTaskCancel = () => {
    setNewTaskTitle('');
    setIsCreatingTask(false);
  };

  const handleTaskKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTaskCreate();
    } else if (e.key === 'Escape') {
      handleTaskCancel();
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 flex-1 shadow-lg border border-zinc-800 min-h-[calc(100vh-300px)] flex flex-col">
      <div className="flex justify-between items-center mb-4">
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
        <button
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-2xl"
          onClick={handleAddTaskClick}
          title="Добавить задачу в этот столбец"
        >+
        </button>
      </div>
      <Droppable droppableId={columnId}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-2 flex-1 overflow-y-auto min-h-[200px] ${
              snapshot.isDraggingOver ? 'bg-gray-700 bg-opacity-50 rounded-lg' : ''
            }`}
          >
            {column.items.map((item, idx) => (
              <Draggable key={item.id} draggableId={String(item.id)} index={idx}>
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <TaskCard
                    item={item}
                    columnId={columnId}
                    handleDeleteTask={handleDeleteTask}
                    onTaskUpdate={onTaskUpdate}
                    provided={provided}
                    snapshot={snapshot}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {isCreatingTask && (
              <div className="bg-gray-900 rounded-lg p-4 shadow border-2 border-gray-700">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onBlur={handleTaskCreate}
                  onKeyDown={handleTaskKeyPress}
                  placeholder="Введите название задачи..."
                  className="w-full bg-gray-700 text-white px-2 py-1 rounded text-[14px] font-semibold border border-gray-600 focus:border-blue-400 focus:outline-none"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
} 
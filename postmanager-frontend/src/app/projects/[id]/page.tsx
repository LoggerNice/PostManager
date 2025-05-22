'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetProjectByIdQuery } from '@/store/api/project.api';
import { useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '@/store/api/task.api';
import { Task } from '@/types/task.types';
import { Column as ColumnType } from '@/types';
import { TaskStatus, TaskPriority, TaskForm } from '@/types/task.types';
import TaskModal from '@/components/task/TaskModal';
import EditTaskModal from '@/components/task/EditTaskModal';
import ProjectHeader from '../../../components/projectComponents/ProjectHeader';
import ProjectTabs from '../../../components/projectComponents/ProjectTabs';
import TasksTab from '../../../components/projectComponents/TasksTab';
import TimelineTab from '../../../components/projectComponents/TimelineTab';
import CalendarTab from '../../../components/projectComponents/CalendarTab';

const initialColumns: Record<string, ColumnType> = {
  IN_PROGRESS: {
    name: "В процессе",
    items: [],
  },
  PROBLEM: {
    name: "Проблема",
    items: [],
  },
  COMPLETED: {
    name: "Выполнено",
    items: [],
  },
};

export default function ProjectPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const { data: project, isLoading, error } = useGetProjectByIdQuery(projectId);
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [activeTab, setActiveTab] = useState('timeline');
  const [columns, setColumns] = useState(initialColumns);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: "", 
    description: "", 
    priority: "Низкий" as "Низкий" | "Средний" | "Высокий",
    deadline: undefined as string | undefined
  });
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<keyof typeof columns>("IN_PROGRESS");

  if (isLoading) return <div className="text-white">Загрузка...</div>;
  if (error) return <div className="text-white">Ошибка при загрузке проекта</div>;
  if (!project) return <div className="text-white">Проект не найден</div>;

  const users = project.users || [];

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId) {
      const column = columns[source.droppableId];
      const copiedItems = [...column.items];
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...column,
          items: copiedItems,
        },
      });
    } else {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removed);
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destColumn,
          items: destItems,
        },
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      const taskData: TaskForm = {
        title: newTask.title,
        description: newTask.description,
        priority: priorityMap[newTask.priority],
        status: selectedColumn as TaskStatus,
        projectId: projectId,
        deadline: newTask.deadline || undefined
      };
      
      const result = await createTask(taskData).unwrap();
      
      setColumns(prevColumns => ({
        ...prevColumns,
        [selectedColumn]: {
          ...prevColumns[selectedColumn],
          items: [...prevColumns[selectedColumn].items, result]
        }
      }));
      
      setShowModal(false);
      setNewTask({ title: "", description: "", priority: "Низкий", deadline: undefined });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !editingTask.task.title.trim()) return;
    
    try {
      const result = await updateTask({
        taskId: editingTask.task.id,
        task: {
          ...editingTask.task,
          deadline: editingTask.task.deadline || undefined
        }
      }).unwrap();
      
      setColumns(prevColumns => {
        const column = prevColumns[editingTask.columnId];
        const updatedItems = column.items.map(item => 
          item.id === editingTask.task.id ? result : item
        );
        
        return {
          ...prevColumns,
          [editingTask.columnId]: {
            ...column,
            items: updatedItems
          }
        };
      });
      
      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (columnId: string, taskId: string) => {
    try {
      await deleteTask(taskId).unwrap();
      
      setColumns(prevColumns => {
        const column = prevColumns[columnId];
        const updatedItems = column.items.filter(item => item.id !== taskId);
        
        return {
          ...prevColumns,
          [columnId]: {
            ...column,
            items: updatedItems
          }
        };
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const startEditing = (task: Task, columnId: string) => {
    setEditingTask({ task, columnId });
    setShowEditModal(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return (
          <TasksTab
            columns={columns}
            onDragEnd={onDragEnd}
            startEditing={startEditing}
            handleDeleteTask={handleDeleteTask}
            onAddTask={(columnId: keyof typeof columns) => {
              setShowModal(true);
              setSelectedColumn(columnId);
            }}
          />
        );
      case 'timeline':
        return <TimelineTab users={users} />;
      case 'calendar':
        return <CalendarTab />;
      default:
        return null;
    }
  };

  return (  
    <div className="min-h-screen bg-gray-900 text-white">
      <ProjectHeader
        title={project.title}
        description={project.description ?? ''}
        users={users}
      />
      <ProjectTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {renderTabContent()}
      <TaskModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateTask}
        newTask={newTask}
        setNewTask={setNewTask}
        columns={columns}
        selectedColumn={selectedColumn}
        setSelectedColumn={setSelectedColumn}
      />
      <EditTaskModal
        visible={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingTask(null); }}
        onSave={handleEditTask}
        editingTask={editingTask}
        setEditingTask={setEditingTask}
      />
    </div>
  );
} 
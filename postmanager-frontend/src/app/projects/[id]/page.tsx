'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useGetProjectByIdQuery } from '@/store/api/project.api';
import { useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useGetProjectTasksQuery } from '@/store/api/task.api';
import { Task } from '@/types/task.types';
import { Column as ColumnType } from '@/types';
import { TaskStatus, TaskPriority, TaskPriorityDisplay, TaskForm } from '@/types/task.types';
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
  const { data: projectTasks } = useGetProjectTasksQuery(projectId);
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [activeTab, setActiveTab] = useState('tasks');
  const [columns, setColumns] = useState(initialColumns);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: "", 
    description: "", 
    priority: "Низкий" as "Низкий" | "Средний" | "Высокий"
  });
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<keyof typeof columns>("IN_PROGRESS");

  // Reset columns when project changes
  useEffect(() => {
    setColumns(initialColumns);
  }, [projectId]);

  const priorityMapToEnglish: Record<string, TaskPriority> = {
    'Низкий': 'LOW',
    'Средний': 'MEDIUM',
    'Высокий': 'HIGH'
  };

  const priorityMapToRussian: Record<TaskPriority, string> = {
    'LOW': 'Низкий',
    'MEDIUM': 'Средний',
    'HIGH': 'Высокий'
  };

  useEffect(() => {
    if (projectTasks) {
      // Создаем новые колонки с пустыми массивами
      const newColumns = {
        IN_PROGRESS: { ...initialColumns.IN_PROGRESS, items: [] as Task[] },
        PROBLEM: { ...initialColumns.PROBLEM, items: [] as Task[] },
        COMPLETED: { ...initialColumns.COMPLETED, items: [] as Task[] }
      };
      
      // Распределяем задачи по колонкам
      projectTasks.forEach((task: Task) => {
        const status = task.status as keyof typeof newColumns;
        if (status in newColumns) {
          // Convert priority from English to Russian for display
          const taskWithRussianPriority = {
            ...task,
            priority: priorityMapToRussian[task.priority as TaskPriority] as TaskPriorityDisplay
          } as Task;
          newColumns[status].items.push(taskWithRussianPriority);
        }
      });
      
      setColumns(newColumns);
    }
  }, [projectTasks]);

  if (isLoading) return <div className="text-white">Загрузка...</div>;
  if (error) return <div className="text-white">Ошибка при загрузке проекта</div>;
  if (!project) return <div className="text-white">Проект не найден</div>;

  const users = project.users || [];

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination } = result;
    
    // If dropped in the same column, just reorder
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
      // If dropped in a different column, update both UI and server
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      
      // Update UI immediately
      setColumns({
        ...columns,
        [source.droppableId]: {
          ...sourceColumn,
          items: sourceItems,
        },
        [destination.droppableId]: {
          ...destColumn,
          items: [...destItems, removed],
        },
      });

      try {
        // Update task status on server
        const priorityMap: Record<string, TaskPriority> = {
          'Низкий': 'LOW',
          'Средний': 'MEDIUM',
          'Высокий': 'HIGH'
        };

        await updateTask({
          taskId: removed.id,
          task: {
            ...removed,
            status: destination.droppableId as TaskStatus,
            priority: priorityMap[removed.priority as keyof typeof priorityMap]
          }
        }).unwrap();
      } catch (error) {
        console.error('Failed to update task status:', error);
        // Revert UI changes if server update fails
        setColumns(columns);
      }
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    
    try {
      const taskData: TaskForm = {
        title: newTask.title,
        description: newTask.description,
        priority: priorityMapToEnglish[newTask.priority],
        status: selectedColumn as TaskStatus,
        projectId: projectId
      };
      
      const result = await createTask(taskData).unwrap();
      
      // Convert priority to Russian for display
      const resultWithRussianPriority = {
        ...result,
        priority: priorityMapToRussian[result.priority as TaskPriority]
      };
      
      setColumns(prevColumns => ({
        ...prevColumns,
        [selectedColumn]: {
          ...prevColumns[selectedColumn],
          items: [...prevColumns[selectedColumn].items, resultWithRussianPriority]
        }
      }));
      
      setShowModal(false);
      setNewTask({ title: "", description: "", priority: "Низкий" });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleEditTask = async () => {
    if (!editingTask || !editingTask.task.title.trim()) return;
    
    try {
      // Если изменилась только дата, автоматически сохраняем
      const isOnlyDeadlineChanged = 
        editingTask.task.title === columns[editingTask.columnId].items.find(item => item.id === editingTask.task.id)?.title &&
        editingTask.task.description === columns[editingTask.columnId].items.find(item => item.id === editingTask.task.id)?.description &&
        editingTask.task.priority === columns[editingTask.columnId].items.find(item => item.id === editingTask.task.id)?.priority;

      const result = await updateTask({
        taskId: editingTask.task.id,
        task: {
          ...editingTask.task,
          priority: priorityMapToEnglish[editingTask.task.priority as keyof typeof priorityMapToEnglish],
          deadline: editingTask.task.deadline || undefined
        }
      }).unwrap();
      
      // Convert priority to Russian for display
      const resultWithRussianPriority = {
        ...result,
        priority: priorityMapToRussian[result.priority as TaskPriority]
      };
      
      setColumns(prevColumns => {
        const column = prevColumns[editingTask.columnId];
        const updatedItems = column.items.map(item => 
          item.id === editingTask.task.id ? resultWithRussianPriority : item
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
      
      setColumns(prevColumns => ({
        ...prevColumns,
        [columnId]: {
          ...prevColumns[columnId],
          items: prevColumns[columnId].items.filter(item => item.id !== taskId)
        }
      }));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const startEditing = (task: Task, columnId: string) => {
    setEditingTask({ task, columnId });
    setShowEditModal(true);
  };

  const handleTaskUpdate = (taskId: string, updatedTask: Task) => {
    setColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      Object.keys(newColumns).forEach(columnId => {
        newColumns[columnId] = {
          ...newColumns[columnId],
          items: newColumns[columnId].items.map(task => 
            task.id === taskId ? updatedTask : task
          )
        };
      });
      return newColumns;
    });
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
            onTaskUpdate={handleTaskUpdate}
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
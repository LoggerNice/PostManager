'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useGetProjectByIdQuery } from '@/store/api/project.api';
import { Task, Column as ColumnType } from '@/types';
import TaskModal from '@/components/task/TaskModal';
import EditTaskModal from '@/components/task/EditTaskModal';
import ProjectHeader from '../../../components/projectComponents/ProjectHeader';
import ProjectTabs from '../../../components/projectComponents/ProjectTabs';
import TasksTab from '../../../components/projectComponents/TasksTab';
import TimelineTab from '../../../components/projectComponents/TimelineTab';
import CalendarTab from '../../../components/projectComponents/CalendarTab';

const initialColumns: Record<string, ColumnType> = {
  inprogress: {
    name: "В процессе",
    items: [],
  },
  problematic: {
    name: "Проблема",
    items: [],
  },
  done: {
    name: "Выполнено",
    items: [],
  },
};

export default function ProjectPage() {
  const params = useParams();
  const projectId = Number(params.id);
  const { data: project, isLoading, error } = useGetProjectByIdQuery(projectId);
  const [activeTab, setActiveTab] = useState('timeline');
  const [columns, setColumns] = useState(initialColumns);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "Низкий" as "Низкий" | "Средний" | "Высокий" });
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<keyof typeof columns>("inprogress");

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

  const handleCreateTask = () => {
    if (!newTask.title.trim()) return;
    setColumns({
      ...columns,
      [selectedColumn]: {
        ...columns[selectedColumn],
        items: [
          ...columns[selectedColumn].items,
          { id: Date.now().toString(), ...newTask },
        ],
      },
    });
    setShowModal(false);
    setNewTask({ title: "", description: "", priority: "Низкий" });
  };

  const handleEditTask = () => {
    if (!editingTask || !editingTask.task.title.trim()) return;
    
    setColumns(prevColumns => {
      const column = prevColumns[editingTask.columnId];
      const updatedItems = column.items.map(item => 
        item.id === editingTask.task.id ? editingTask.task : item
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
  };

  const handleDeleteTask = (columnId: string, taskId: string) => {
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
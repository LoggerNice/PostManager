"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from "@hello-pangea/dnd";
import Column from "../components/task/Column";
import TaskModal from "../components/task/TaskModal";
import EditTaskModal from "../components/task/EditTaskModal";
import { Task, Column as ColumnType } from "../types";

// Тип колонки
interface Column {
  name: string;
  items: Task[];
}

// Тип всех колонок
type Columns = Record<string, Column>;

const initialColumns: Columns = {
  inprogress: {
    name: "В процессе",
    items: [
      { id: "3", title: "Верстка страницы", description: "Сделать главную страницу", priority: "Высокий" },
    ],
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

function getPriorityColor(priority?: string) {
  switch (priority) {
    case "Высокий":
      return "border-red-500";
    case "Средний":
      return "border-yellow-500";
    default:
      return "border-zinc-700";
  }
}

export default function Home() {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "Низкий" as "Низкий" | "Средний" | "Высокий" });
  const [editingTask, setEditingTask] = useState<{ task: Task; columnId: string } | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<keyof Columns>("inprogress");

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId) {
      // Перемещение внутри одной колонки
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
      // Перемещение между колонками
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

  return (
    <div className="min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Задачи</h1>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {Object.entries(columns).map(([columnId, column]) => (
            <Column
              key={columnId}
              columnId={columnId}
              column={column}
              startEditing={startEditing}
              handleDeleteTask={handleDeleteTask}
              onAddTask={() => { setShowModal(true); setSelectedColumn(columnId as keyof typeof columns); }}
            />
          ))}
        </div>
      </DragDropContext>
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

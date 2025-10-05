'use client';

import { memo, useCallback, useMemo, useEffect, useRef, useState } from 'react';
import * as ReactWindow from 'react-window';
import { Draggable, DraggableProvided, DraggableStateSnapshot, DroppableProvided, DroppableStateSnapshot } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Task } from '@/types/task.types';

// Lightweight AutoSizer to avoid extra deps
function AutoSizer({ children }: { children: (size: { height: number; width: number }) => React.ReactElement }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ height: number; width: number }>({ height: 0, width: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => setSize({ height: node.clientHeight, width: node.clientWidth });
    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      {size.height > 0 && size.width > 0 ? children(size) : null}
    </div>
  );
}

interface VirtualizedTaskListProps {
  columnId: string;
  items: Task[];
  heightClassName?: string;
  provided: DroppableProvided;
  snapshot: DroppableStateSnapshot;
  onDelete: (columnId: string, taskId: string) => void;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
  showProjectTitle?: boolean;
  itemSize?: number;
}

// react-window item renderer
const Row = memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: any }) => {
  const {
    columnId,
    items,
    onDelete,
    onTaskUpdate,
    showProjectTitle
  } = data as {
    columnId: string;
    items: Task[];
    onDelete: (columnId: string, taskId: string) => void;
    onTaskUpdate: (taskId: string, updatedTask: Task) => void;
    showProjectTitle?: boolean;
  };

  const item = items[index];

  return (
    <div style={style} className="px-0 py-1">
      <Draggable key={`${columnId}-${item.id}-${index}`} draggableId={String(item.id)} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <TaskCard
            item={item}
            columnId={columnId}
            handleDeleteTask={onDelete}
            onTaskUpdate={onTaskUpdate}
            provided={provided}
            snapshot={snapshot}
            showProjectTitle={showProjectTitle}
          />
        )}
      </Draggable>
    </div>
  );
});
Row.displayName = 'Row';

export default function VirtualizedTaskList({
  columnId,
  items,
  provided,
  snapshot,
  onDelete,
  onTaskUpdate,
  showProjectTitle = false,
  itemSize = 128
}: VirtualizedTaskListProps) {
  const RWList: any = (ReactWindow as any)?.FixedSizeList;
  const itemData = useMemo(
    () => ({ columnId, items, onDelete, onTaskUpdate, showProjectTitle }),
    [columnId, items, onDelete, onTaskUpdate, showProjectTitle]
  );

  const itemKey = useCallback((index: number) => `${columnId}-${items[index]?.id}-${index}`, [columnId, items]);

  // Fallback to non-virtualized rendering if RWList is not available
  if (!RWList) {
    return (
      <div
        {...provided.droppableProps}
        ref={provided.innerRef}
        className={`flex-1 overflow-y-auto custom-scrollbar ${snapshot.isDraggingOver ? 'bg-gray-700 bg-opacity-50 rounded-lg' : ''}`}
      >
        {items.map((item, idx) => (
          <div key={`${columnId}-${item.id}-${idx}`} className="py-1">
            <Draggable draggableId={String(item.id)} index={idx}>
              {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                <TaskCard
                  item={item}
                  columnId={columnId}
                  handleDeleteTask={onDelete}
                  onTaskUpdate={onTaskUpdate}
                  provided={provided}
                  snapshot={snapshot}
                  showProjectTitle={showProjectTitle}
                />
              )}
            </Draggable>
          </div>
        ))}
        {provided.placeholder}
      </div>
    );
  }

  return (
    <div
      {...provided.droppableProps}
      ref={provided.innerRef}
      className={`flex-1 overflow-y-auto custom-scrollbar ${snapshot.isDraggingOver ? 'bg-gray-700 bg-opacity-50 rounded-lg' : ''}`}
    >
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => (
          <RWList
            height={height}
            width={width}
            itemCount={items.length}
            itemSize={itemSize}
            itemData={itemData}
            itemKey={itemKey}
          >
            {Row as any}
          </RWList>
        )}
      </AutoSizer>
      {provided.placeholder}
    </div>
  );
}


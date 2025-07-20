'use client';

import { useRef } from 'react';
import {
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface TaskMenuProps {
  onEditPriority: () => void;
  onAddDate: () => void;
  onDelete: () => void;
  menuHeight: number;
  ellipsisRef: React.RefObject<HTMLButtonElement>;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
  setMenuPosition: (pos: { top: number; left: number } | null) => void;
  setMenuDirection: (dir: 'down' | 'up') => void;
  menuPosition: { top: number; left: number } | null;
}

export default function TaskMenu({
  onEditPriority,
  onAddDate,
  onDelete,
  menuHeight,
  ellipsisRef,
  showMenu,
  setShowMenu,
  setMenuPosition,
  setMenuDirection,
  menuPosition
}: TaskMenuProps) {
  return (
    <div className="relative">
      <button
        ref={ellipsisRef}
        onClick={e => {
          e.stopPropagation();
          if (ellipsisRef.current) {
            const rect = ellipsisRef.current.getBoundingClientRect();
            if (rect.bottom + menuHeight > window.innerHeight) {
              setMenuPosition({
                top: rect.top - menuHeight,
                left: rect.right - 160
              });
              setMenuDirection('up');
            } else {
              setMenuPosition({
                top: rect.bottom,
                left: rect.right - 160
              });
              setMenuDirection('down');
            }
          }
          setShowMenu(!showMenu);
        }}
        className="text-gray-400 hover:text-white z-10"
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>
      {showMenu && menuPosition && (
        <div
          className="fixed bg-gray-900 rounded-xl shadow-lg border border-gray-800 z-50"
          style={{ top: menuPosition.top, left: menuPosition.left, minWidth: 160 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onEditPriority();
              setShowMenu(false);
              setMenuPosition(null);
            }}
            className="w-full px-4 py-2 pt-3 text-left text-[12px] text-gray-300 hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
          >
            <ExclamationTriangleIcon className="w-4 h-4" />
            Изменить приоритет
          </button>
          <button
            onClick={() => {
              onAddDate();
              setShowMenu(false);
              setMenuPosition(null);
            }}
            className="w-full px-4 py-2 text-left text-[12px] text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Добавить дату
          </button>
          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
              setMenuPosition(null);
            }}
            className="w-full px-4 py-2 pb-3 text-left text-[12px] text-red-400 hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Удалить
          </button>
        </div>
      )}
    </div>
  );
} 
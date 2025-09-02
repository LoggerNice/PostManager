'use client';

import { useRef, useEffect } from 'react';
import {
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface TaskMenuProps {
  onEditPriority: () => void;
  onAddDate: () => void;
  onAddTime: () => void;
  onDelete: () => void;
  onEdit: () => void;
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
  onAddTime,
  onDelete,
  onEdit,
  menuHeight,
  ellipsisRef,
  showMenu,
  setShowMenu,
  setMenuPosition,
  setMenuDirection,
  menuPosition
}: TaskMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ellipsisRef.current &&
        !ellipsisRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
        setMenuPosition(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, ellipsisRef, setShowMenu, setMenuPosition]);

  return (
    <div className="relative pt-1" onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()}>
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
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
        className="text-gray-400 hover:text-white z-10"
      >
        <EllipsisVerticalIcon className="w-5 h-5" />
      </button>
      {showMenu && menuPosition && (
        <div
          ref={menuRef}
          className="fixed bg-gray-900 rounded-xl shadow-lg border border-gray-800 z-50"
          style={{ top: menuPosition.top, left: menuPosition.left, minWidth: 160 }}
          onClick={e => e.stopPropagation()}
          onMouseEnter={(e) => e.stopPropagation()}
          onMouseLeave={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onEdit();
              setShowMenu(false);
              setMenuPosition(null);
            }}
            className="w-full px-4 py-2 pt-3 text-left text-[12px] text-gray-300 hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
          >
            <span className="w-4 h-4 inline-block">✏️</span>
            Редактировать
          </button>
          <button
            onClick={() => {
              onEditPriority();
              setShowMenu(false);
              setMenuPosition(null);
            }}
            className="w-full px-4 py-2 text-left text-[12px] text-gray-300 hover:bg-gray-700 flex items-center gap-2"
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
            Указать срок
          </button>
          <button
            onClick={() => {
              onAddTime();
              setShowMenu(false);
              setMenuPosition(null);
            }}
            className="w-full px-4 py-2 pb-3 text-left text-[12px] text-gray-300 hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
          >
            <ClockIcon className="w-4 h-4" />
            Указать время
          </button>
          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
              setMenuPosition(null);
            }}
            className="w-full px-4 py-2 text-left text-[12px] text-red-400 hover:bg-gray-700 flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Удалить
          </button>
        </div>
      )}
    </div>
  );
} 
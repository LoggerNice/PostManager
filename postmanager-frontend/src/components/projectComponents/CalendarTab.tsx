"use client";

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import type { EventMountArg, EventContentArg } from '@fullcalendar/core';

import { useGetProjectTasksQuery } from '@/store/api/task.api';
import type { Task, TaskAssignee } from '@/types/task.types';
import type { IUser } from '@/types/user.types';
import { formatName } from '../charts/DepartmentTasksExcelExport';

type CalendarTabProps = {
  projectId: number;
  tasks?: Task[]; // Если переданы задачи из вкладки "Задачи" — используем их
};

// FullCalendar компонент нужно загружать динамически (без SSR)
const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false });

export default function CalendarTab({ projectId, tasks }: CalendarTabProps) {
  const { data: projectTasks = [], isLoading, error } = useGetProjectTasksQuery(projectId, {
    // Если задачи переданы сверху, минимизируем запросы
    pollingInterval: tasks ? 0 : 5000,
    refetchOnFocus: !tasks,
    refetchOnReconnect: !tasks
  });

  const events = useMemo(() => {
    const toISODate = (d?: Date | string | null): string | null => {
      if (!d) return null;
      try {
        if (typeof d === 'string') {
          // Обрезаем время, оставляем YYYY-MM-DD
          return d.split('T')[0];
        }
        // Date -> YYYY-MM-DD
        return d.toISOString().split('T')[0];
      } catch {
        return null;
      }
    };

    const sourceTasks: Task[] = (Array.isArray(tasks) && tasks.length > 0)
      ? tasks
      : (projectTasks as Task[]);

    return (sourceTasks as Task[])
      .filter(t => !!t.deadline)
      .map(t => ({
        id: String(t.id),
        title: t.title,
        start: toISODate(t.deadline)!,
        allDay: true,
        extendedProps: {
          status: t.status,
          priority: t.priority,
          projectId: t.projectId,
          assignees: t.assignees || [],
          assignee: t.assignee,
        },
      }));
  }, [tasks, projectTasks]);

  // Управление навигацией и видом оставим стандартному тулбару FullCalendar и стилизуем его ниже

  return (
    <div className="px-8 py-8">
      <div className="bg-gray-800 rounded-xl p-4 md:p-6 shadow border border-gray-700">
        {isLoading && <div className="text-gray-300">Загрузка календаря...</div>}
        {error && <div className="text-red-400">Ошибка загрузки задач</div>}

        {!isLoading && !error && (
          <>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height="auto"
              locales={[ruLocale]}
              locale="ru"
              firstDay={1}
              headerToolbar={{ left: 'prev,today,next', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
              buttonText={{ today: 'Сегодня', month: 'Месяц', week: 'Неделя' }}
              events={events}
              eventDisplay="block"
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
              eventClassNames={(arg) => {
                const classes = ['modern-event', 'rounded-md'];
                // Фон прозрачный, вся окраска через border в eventDidMount
                return classes;
              }}
              eventDidMount={(info: EventMountArg) => {
                const el = info.el as HTMLElement;
                const priorityRaw = String(info.event.extendedProps['priority'] || '').toUpperCase();
                // hex цвета по приоритетам в соответствии с карточками задач
                // Высокий — красный, Средний — желтый, Низкий — без выделения
                if (priorityRaw === 'HIGH' || priorityRaw === 'ВЫСОКИЙ') {
                  el.style.borderColor = '#EF4444'; // red-500
                  el.style.borderStyle = 'solid';
                  el.style.borderWidth = '3px';
                  // Полупрозрачный фон через 8-значный hex
                  el.style.backgroundColor = '#EF444420';
                } else if (priorityRaw === 'MEDIUM' || priorityRaw === 'СРЕДНИЙ') {
                  el.style.borderColor = '#F59E0B'; // yellow-500
                  el.style.borderStyle = 'solid';
                  el.style.borderWidth = '3px';
                  el.style.backgroundColor = '#F59E0B20';
                } else {
                  // Низкий — без выделения
                  el.style.borderColor = 'transparent';
                  el.style.borderWidth = '0px';
                  el.style.backgroundColor = 'bg-blue-500/10';
                }
                el.style.backdropFilter = 'blur(4px)';
                el.style.borderRadius = '3px';
              }}
              eventContent={(arg: EventContentArg) => {
                const esc = (s: string) => s
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;');
                
                const title = esc(arg.event.title || '');
                const assignees = arg.event.extendedProps['assignees'] as TaskAssignee[] | undefined;
                const assignee = arg.event.extendedProps['assignee'] as IUser | undefined;
                
                // Формируем список ответственных
                let assigneesHtml = '';
                if (assignees && assignees.length > 0) {
                  const assigneeNames = assignees.map(a => formatName(a.user?.name) || 'Неизвестно').slice(0, 2); // Показываем максимум 2
                  assigneesHtml = `<div class="text-xs text-gray-300 mt-1">👥 ${assigneeNames.join(', ')}${assignees.length > 2 ? '...' : ''}</div>`;
                } else if (assignee) {
                  assigneesHtml = `<div class="text-xs text-gray-300 mt-1">👤 ${assignee.name || 'Неизвестно'}</div>`;
                }
                
                return {
                  html: `<div class="fc-event-title-container px-2 py-1">
                    <div class="text-white font-medium truncate">${title}</div>
                    ${assigneesHtml}
                  </div>`
                };
              }}
              eventClick={(info) => {
                const taskId = info.event.id;
              }}
              dayMaxEvents={3}
            />

                         <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-300">
               <div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{backgroundColor: '#EF4444'}}/> Высокий приоритет</div>
               <div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{backgroundColor: '#F59E0B'}}/> Средний приоритет</div>
               <div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border border-gray-500"/> Низкий приоритет</div>
             </div>
          </>
        )}

        {!isLoading && !error && events.length === 0 && (
          <div className="text-gray-400 text-sm mt-3">Задачи с дедлайном не найдены</div>
        )}
      </div>
      <style jsx global>{`
        .fc {
          --fc-page-bg-color: transparent;
          --fc-neutral-bg-color: rgba(255,255,255,0.03);
          --fc-border-color: rgba(255,255,255,0.08);
          --fc-text-color: rgba(255,255,255,0.85);
          --fc-event-text-color: rgba(255,255,255,0.95);
          --fc-today-bg-color: rgba(59,130,246,0.12);
        }
        .fc .fc-toolbar.fc-header-toolbar {
          margin-bottom: 12px;
        }
        .fc .fc-toolbar-chunk {
          display: flex; align-items: center; gap: 8px;
        }
        .fc .fc-button {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.9);
          border-radius: 10px;
          padding: 6px 10px;
          text-transform: none;
        }
        .fc .fc-button:hover { background: rgba(255,255,255,0.1); }
        .fc .fc-button-primary:disabled { background: rgba(255,255,255,0.06); opacity: .7; }
        .fc .fc-toolbar-title { color: rgba(255,255,255,0.95); font-weight: 700; font-size: 1.125rem; }
        .fc .fc-daygrid-day-frame { padding: 6px; }
        .fc .fc-daygrid-day-top { align-items: center; }
        .fc .fc-daygrid-day-number { color: rgba(255,255,255,0.7); font-weight: 600; }
        .fc .fc-col-header-cell-cushion { color: rgba(255,255,255,0.6); font-weight: 500; padding: 8px 0; }
        .fc .fc-scrollgrid, .fc .fc-daygrid-day, .fc .fc-col-header-cell { border-color: rgba(255,255,255,0.08); }
        .fc .modern-event { overflow: hidden; backdrop-filter: blur(4px); }
        .fc .modern-event:hover { filter: brightness(1.05); }
        .fc .fc-daygrid-event { margin: 2px 6px; }
      `}</style>
    </div>
  );
} 
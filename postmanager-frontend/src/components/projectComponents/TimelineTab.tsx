import { IUser } from '@/types/user.types';
import { useState } from 'react';
import { ChartBarIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { useTimelineData } from '../timeline/useTimelineData';
import TimelineGraph from '../timeline/TimelineGraph';
import TimelineTable from '../timeline/TimelineTable';
import { ProjectStage, TimelineTabProps } from '@/types/project.types';

type ViewMode = 'graph' | 'table';

export default function TimelineTab({ users }: TimelineTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [stages] = useState<ProjectStage[]>([
    {
      id: 1,
      name: 'ТП',
      startDate: new Date(2024, 2, 5),
      endDate: new Date(2024, 2, 20),
      color: 'bg-gray-900',
      icon: '📋',
      progress: 100
    },
    {
      id: 2,
      name: 'РКД',
      startDate: new Date(2024, 2, 18),
      endDate: new Date(2024, 3, 5),
      color: 'bg-gray-900',
      icon: '📝',
      progress: 20
    },
    {
      id: 3,
      name: 'ОО',
      startDate: new Date(2024, 3, 1),
      endDate: new Date(2024, 3, 20),
      color: 'bg-gray-900',
      icon: '👥',
      progress: 30
    },
    {
      id: 4,
      name: 'ПИ',
      startDate: new Date(2024, 3, 15),
      endDate: new Date(2024, 4, 5),
      color: 'bg-gray-900',
      icon: '🔍',
      progress: 0
    },
    {
      id: 5,
      name: 'ГИ',
      startDate: new Date(2024, 4, 1),
      endDate: new Date(2024, 4, 20),
      color: 'bg-gray-900',
      icon: '✅',
      progress: 0
    },
    {
      id: 6,
      name: 'Передача',
      startDate: new Date(2024, 4, 15),
      endDate: new Date(2024, 5, 5),
      color: 'bg-gray-900',
      icon: '🚀',
      progress: 0
    }
  ]);

  const { timelineRange, dates, months } = useTimelineData(stages);

  const isGraphView = viewMode === 'graph';
  const isTableView = viewMode === 'table';

  return (
    <div className="px-8 py-8">
      <div className="flex justify-between items-center mb-4 bg-gray-800 rounded-lg py-2 px-4">
        <h2 className="text-lg font-medium text-gray-200">Этапы проекта</h2>
        <div className="inline-flex rounded-lg bg-gray-700 p-1">
          <button
            onClick={() => setViewMode('graph')}
            className={`p-2 rounded-l-md transition-colors ${
              isGraphView
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="График"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>
          <div className="w-px bg-gray-600" />
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-r-md transition-colors ${
              isTableView
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Таблица"
          >
            <TableCellsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {isGraphView ? (
        <TimelineGraph stages={stages} timelineRange={timelineRange} dates={dates} months={months} />
      ) : (
        <TimelineTable stages={stages} />
      )}
    </div>
  );
} 
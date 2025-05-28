import React from 'react';
import { format, differenceInDays } from 'date-fns';

interface ProjectStage {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
  icon: string;
  progress: number;
}

interface TimelineTableProps {
  stages: ProjectStage[];
}

export default function TimelineTable({
  stages,
}: TimelineTableProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow border border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
              <th className="pb-3 font-medium">Этап</th>
              <th className="pb-3 font-medium">Начало</th>
              <th className="pb-3 font-medium">Окончание</th>
              <th className="pb-3 font-medium">Длительность</th>
              <th className="pb-3 font-medium">Прогресс</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((stage) => {
              const duration = differenceInDays(stage.endDate, stage.startDate);
              return (
                <tr key={stage.id} className="text-sm border-b border-gray-700/50 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span>{stage.icon}</span>
                      <span className="text-gray-200">{stage.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-400">{format(stage.startDate, 'd.MM.yyyy')}</td>
                  <td className="py-3 text-gray-400">{format(stage.endDate, 'd.MM.yyyy')}</td>
                  <td className="py-3 text-gray-400">{duration} дн.</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gray-900 rounded-full"
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                      <span className="text-gray-400">{stage.progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
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

interface TimelineStagesProps {
  stages: ProjectStage[];
  timelineRange: { start: Date; end: Date; totalDays: number };
  dates: Date[];
}

export default function TimelineStages({
  stages,
  timelineRange,
  dates,
}: TimelineStagesProps) {

    // Вычисляем позицию и ширину для каждого этапа
    const getStagePosition = (stage: ProjectStage) => {
        const startOffset = differenceInDays(stage.startDate, timelineRange.start);
        const duration = differenceInDays(stage.endDate, stage.startDate);
        
        return {
          left: `${(startOffset / timelineRange.totalDays) * 100}%`,
          width: `${(duration / timelineRange.totalDays) * 100}%`
        };
      };

  return (
    <div className="space-y-3 relative z-10">
      {/* Grid lines for stages */}
      {dates.map((date, i) => {
        const position = (differenceInDays(date, timelineRange.start) / timelineRange.totalDays) * 100;
        const isMonthBoundary = date.getDate() === 1 || date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
         const isToday = date.toDateString() === new Date().toDateString();
        return (
          <div
            key={`grid-line-${i}`}
            className={`absolute top-0 bottom-0 w-px ${
               isToday ? 'bg-blue-500' : // Сегодня
               isMonthBoundary ? 'bg-gray-600' : // Граница месяца
               'bg-gray-700' // Остальные линии (пятницы, этапы)
            }`}
            style={{ left: `${position}%` }}
          />
        );
      })}
      {stages.map((stage) => {
        const position = getStagePosition(stage);
        return (
          <div key={stage.id} className="flex items-center h-8 relative">
            {/* Gantt bar */}
            <div 
              className="absolute h-full rounded-full flex items-center px-3"
              style={{
                left: position.left,
                width: position.width,
                minWidth: '100px'
              }}
            >
              {/* Background bar */}
              <div className="absolute inset-0 bg-gray-700 rounded-full" />
              
              {/* Progress bar */}
              <div 
                className="absolute inset-0 bg-gray-900 rounded-full"
                style={{ width: `${stage.progress}%` }}
              />
              
              {/* Stage content */}
              <div className="relative z-10 flex items-center w-full">
                <span className="text-sm text-gray-200">{stage.name}</span>
                <span className="ml-3 text-xs text-gray-400 flex items-center gap-1 whitespace-nowrap">
                  <span>{stage.progress}%</span>
                </span>
                <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
                  <span>{format(stage.startDate, 'd.MM')}</span>
                  <span>-</span>
                  <span>{format(stage.endDate, 'd.MM')}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 
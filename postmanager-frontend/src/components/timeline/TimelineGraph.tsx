
import TimelineHeader from './TimelineHeader';
import TimelineStages from './TimelineStages';

interface ProjectStage {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
  icon: string;
  progress: number;
}

interface TimelineGraphProps {
  stages: ProjectStage[];
  timelineRange: { start: Date; end: Date; totalDays: number };
  dates: Date[];
  months: Date[];
}

export default function TimelineGraph({
  stages,
  timelineRange,
  dates,
  months,
}: TimelineGraphProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow border border-gray-800">
      {/* Timeline grid */}
      <div className="relative w-full">
        {/* Timeline header */}
        <TimelineHeader timelineRange={timelineRange} dates={dates} months={months} />

        {/* Stages */}
        <TimelineStages stages={stages} timelineRange={timelineRange} dates={dates} />
      </div>
    </div>
  );
} 
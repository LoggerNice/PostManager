import { ClipboardDocumentListIcon, ChartBarIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const TABS = [
  { key: 'tasks', label: 'Задачи', icon: ClipboardDocumentListIcon },
  { key: 'timeline', label: 'Этапы', icon: ChartBarIcon },
  { key: 'calendar', label: 'Календарь', icon: CalendarDaysIcon }
];

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  return (
    <div className="flex items-center gap-8 px-8 border-b border-gray-800">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <div 
            key={tab.key} 
            className="relative py-3 cursor-pointer flex items-center gap-2"
            onClick={() => onTabChange(tab.key)}
          >
            <Icon className={`w-5 h-5 ${tab.key === activeTab ? 'text-white' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${tab.key === activeTab ? 'text-white' : 'text-gray-400'}`}>{tab.label}</span>
            {tab.key === activeTab && (
              <span className="absolute left-0 right-0 -bottom-1 h-[2px] mb-[3px] bg-blue-500 rounded-full"></span>
            )}
          </div>
        );
      })}
    </div>
  );
} 
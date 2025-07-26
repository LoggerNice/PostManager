import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'status_change' | 'comment' | 'file_upload' | 'assignee_change';
  user: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

interface TaskActivityProps {
  taskId: string;
}

export default function TaskActivity({ taskId }: TaskActivityProps) {
  // Здесь можно добавить реальные данные активности из API
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'status_change',
      user: 'Иван Петров',
      description: 'изменил статус задачи с "К выполнению" на "В работе"',
      timestamp: new Date(),
      icon: '✓',
      color: 'bg-green-500'
    },
    {
      id: '2',
      type: 'comment',
      user: 'Мария Сидорова',
      description: 'добавила комментарий',
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 минут назад
      icon: '💬',
      color: 'bg-blue-500'
    },
    {
      id: '3',
      type: 'file_upload',
      user: 'Петр Иванов',
      description: 'загрузил файл "Дизайн-макет.pdf"',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // вчера
      icon: '📎',
      color: 'bg-purple-500'
    }
  ];

  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const groups: Record<string, ActivityItem[]> = {};
    
    activities.forEach(activity => {
      const date = format(activity.timestamp, 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    
    return groups;
  };

  const getDateLabel = (date: string) => {
    const today = new Date();
    const activityDate = new Date(date);
    const diffTime = Math.abs(today.getTime() - activityDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Сегодня';
    if (diffDays === 2) return 'Вчера';
    return format(activityDate, 'dd MMMM yyyy', { locale: ru });
  };

  const groupedActivities = groupActivitiesByDate(mockActivities);

  return (
    <div className="space-y-4">
      {Object.entries(groupedActivities).map(([date, activities]) => (
        <div key={date}>
          <div className="text-sm text-gray-400 mb-3">{getDateLabel(date)}</div>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center text-white text-xs flex-shrink-0`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">
                    <span className="font-medium">{activity.user}</span> {activity.description}
                  </p>
                  <span className="text-gray-400 text-xs">
                    {format(activity.timestamp, 'HH:mm', { locale: ru })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 
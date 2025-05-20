export interface Task {
  id: string;
  title: string;
  description: string;
  priority?: 'Низкий' | 'Средний' | 'Высокий';
}

export interface Column {
  name: string;
  items: Task[];
} 
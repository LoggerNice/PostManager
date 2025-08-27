export default function GanttLegend() {
    return (
        <div className="mt-4 ml-8">
            <div className="flex justify-start flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Выполнено</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Просрочено</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">До дедлайна ≤ 2 дня</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">Обычные задачи</span>
                </div>
            </div>
        </div>
    );
}

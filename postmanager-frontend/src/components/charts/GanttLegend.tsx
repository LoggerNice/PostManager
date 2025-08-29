export default function GanttLegend() {
    return (
        <div className="mt-4 px-4">
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                {/* Статусы задач */}
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Завершено</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Просрочено</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Срочно</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <span>В работе</span>
                </div>
                
                {/* Пояснения о пунктирных линиях */}
                <div className="flex items-center gap-2 ml-4">
                    <div className="w-4 h-1 bg-gray-400 rounded border border-dashed border-gray-400"></div>
                    <span>Перенос задач</span>
                </div>
            </div>
        </div>
    );
}

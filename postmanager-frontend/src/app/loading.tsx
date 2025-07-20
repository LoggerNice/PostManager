export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Загрузка...
        </p>
      </div>
    </div>
  );
}
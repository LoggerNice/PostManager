import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { RoadmapFileDto, RoadmapNodeDto } from '@/types/roadmap';

type Props = {
  node: RoadmapNodeDto | null;
  files: RoadmapFileDto[];
  onChangeTitle: (next: string) => void;
  onChangeDescription: (next: string) => void;
  onUploadFile: (file: File) => void;
  onDeleteFile: (fileId: string) => void;
  onCreateTabFromNode: () => void;
  onDeleteNode: () => void;
};

export default function RoadmapDetailsPanel({
  node,
  files,
  onChangeTitle,
  onChangeDescription,
  onUploadFile,
  onDeleteFile,
  onCreateTabFromNode,
  onDeleteNode,
}: Props) {
  const isOpen = Boolean(node);

  return (
    <aside
      className={`border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[360px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-2 pointer-events-none border-l-0'
      }`}
    >
      <div className={`p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Детали</h2>

        {node && (
          <div className="mt-4 space-y-4">
            <Card>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Наименование блока</div>
                  <Input value={node.title} onChange={(e) => onChangeTitle(e.target.value)} placeholder="Введите текст" maxLength={100}/>
                </div>

                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Описание</div>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    placeholder="Введите описание"
                    value={node.description ?? ''}
                    onChange={(e) => onChangeDescription(e.target.value)}
                  />
                </div>

                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Файлы</div>
                  <div className="mt-2 space-y-2">
                    <label className="inline-flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onUploadFile(file);
                            e.target.value = '';
                          }
                        }}
                      />
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
                        <PlusIcon className="h-3 w-3" />
                        <span>Прикрепить файл</span>
                      </span>
                    </label>

                    {files.length ? (
                      <div className="space-y-1">
                        {files.map((f) => (
                          <div key={f.id} className="flex items-center justify-between gap-2 text-xs">
                            <a
                              className="flex-1 text-blue-600 hover:underline break-all"
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {f.originalName}
                            </a>
                            <button
                              type="button"
                              title="Удалить файл"
                              onClick={() => onDeleteFile(f.id)}
                              className="h-7 w-7 flex items-center justify-center rounded-lg border border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Нет файлов</div>
                    )}
                  </div>

                </div>

                <div className="pt-2 flex flex-1 items-center gap-2">
                  <Button
                    size="sm"
                    title="Создать вкладку из блока"
                    onClick={onCreateTabFromNode}
                    className="h-8 w-8 p-0 rounded-lg border border-gray-500 flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 bg-transparent"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </Button>
                  <Button
                    size="sm"
                    title="Удалить блок"
                    onClick={onDeleteNode}
                    className="h-8 w-8 p-0 rounded-lg border border-gray-500 flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 bg-transparent"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </aside>
  );
}


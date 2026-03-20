'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
  type ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Button from '@/components/ui/Button';
import RoadmapNode from '@/components/roadmap/RoadmapNode';
import RoadmapDetailsPanel from '@/components/roadmap/RoadmapDetailsPanel';
import {
  useCreateNodeMutation,
  useCreateRoadmapMutation,
  useDeleteNodeMutation,
  useDeleteRoadmapMutation,
  useGetRoadmapQuery,
  useGetRoadmapsListVersionQuery,
  useGetRoadmapVersionQuery,
  useListRoadmapsQuery,
  useLinkNodeToRoadmapMutation,
  usePatchNodeMutation,
  usePatchRoadmapMutation,
  useUploadFileMutation,
  useDeleteFileMutation,
} from '@/store/api/roadmap.api';
import type { RoadmapDto, RoadmapFileDto, RoadmapNodeDto } from '@/types/roadmap';
import {
  pickHandlesByGeometry,
  toFlowNode,
  toParentEdges,
  type EdgeHandleStore,
  type RoadmapFlowEdge,
  type RoadmapFlowNode,
} from '@/types/roadmapFlow';

const DEFAULT_ROADMAP_KEY = 'default';
const SNAP_DISTANCE = 15;

function groupFilesByNodeId(files: RoadmapFileDto[]): Record<string, RoadmapFileDto[]> {
  const map: Record<string, RoadmapFileDto[]> = {};
  for (const f of files) {
    (map[f.nodeId] ??= []).push(f);
  }
  return map;
}

export default function RoadmapView() {
  const [activeRoadmapKey, setActiveRoadmapKey] = useState<string>(DEFAULT_ROADMAP_KEY);
  const roadmapId = activeRoadmapKey;
  const rf = useRef<ReactFlowInstance | null>(null);
  const connectStartRef = useRef<{ nodeId: string; handleType: 'source' | 'target'; handleId?: string } | null>(null);
  const edgeHandleStoreRef = useRef<EdgeHandleStore>({});
  const edgeStoreKey = useMemo(() => `roadmap:edgeHandles:${roadmapId}`, [roadmapId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(edgeStoreKey);
      edgeHandleStoreRef.current = raw ? (JSON.parse(raw) as EdgeHandleStore) : {};
    } catch {
      edgeHandleStoreRef.current = {};
    }
  }, [edgeStoreKey]);

  const persistEdgeHandleStore = useCallback(() => {
    try {
      localStorage.setItem(edgeStoreKey, JSON.stringify(edgeHandleStoreRef.current));
    } catch {
      // ignore
    }
  }, [edgeStoreKey]);

  const pruneEdgeHandleStore = useCallback(
    (dtos: RoadmapNodeDto[]) => {
      const validNodeIds = new Set(dtos.map((n) => n.id));
      const validEdgeIds = new Set(
        dtos.filter((n) => n.parentId).map((n) => `e:${n.parentId as string}:${n.id}`)
      );

      let changed = false;
      for (const edgeId of Object.keys(edgeHandleStoreRef.current)) {
        if (validEdgeIds.has(edgeId)) continue;
        // extra safety: if edgeId references missing nodes
        const parts = edgeId.split(':');
        const source = parts.length >= 3 ? parts[1] : null;
        const target = parts.length >= 3 ? parts[2] : null;
        if (!source || !target || !validNodeIds.has(source) || !validNodeIds.has(target) || !validEdgeIds.has(edgeId)) {
          delete edgeHandleStoreRef.current[edgeId];
          changed = true;
        }
      }

      if (changed) persistEdgeHandleStore();
    },
    [persistEdgeHandleStore]
  );

  // Fallback на случай, если endpoint "version" недоступен/не отдает изменения.
  // Тогда делаем реже full polling, чтобы синхронизация между клиентами не ломалась.
  const [roadmapVersionFailed, setRoadmapVersionFailed] = useState(false);
  const [roadmapsListVersionFailed, setRoadmapsListVersionFailed] = useState(false);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetRoadmapQuery(
    { roadmapId },
    {
      pollingInterval: roadmapVersionFailed ? 30000 : undefined,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const { data: versionData, isError: isRoadmapVersionError } = useGetRoadmapVersionQuery(
    { roadmapId },
    {
      pollingInterval: 10000,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      skip: !roadmapId,
    }
  );

  const { data: listData, refetch: refetchRoadmaps } = useListRoadmapsQuery(undefined, {
    pollingInterval: roadmapsListVersionFailed ? 30000 : undefined,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const { data: roadmapsListVersionData, isError: isRoadmapsListVersionError } = useGetRoadmapsListVersionQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [createNode] = useCreateNodeMutation();
  const [createRoadmap, { isLoading: creatingRoadmap }] = useCreateRoadmapMutation();
  const [patchNode] = usePatchNodeMutation();
  const [linkNodeToRoadmap] = useLinkNodeToRoadmapMutation();
  const [deleteNode] = useDeleteNodeMutation();
  const [patchRoadmap] = usePatchRoadmapMutation();
  const [deleteRoadmap] = useDeleteRoadmapMutation();
  const [uploadFile] = useUploadFileMutation();
  const [deleteFile] = useDeleteFileMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fileMap = useMemo(() => groupFilesByNodeId(data?.files ?? []), [data?.files]);

  const [nodes, setNodes] = useState<RoadmapFlowNode[]>([]);
  const [edges, setEdges] = useState<RoadmapFlowEdge[]>([]);
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRoadmapVersionRef = useRef<string | null>(null);
  const lastFullRefetchAtRef = useRef<number>(0);
  const lastRoadmapsListVersionRef = useRef<string | null>(null);
  const lastRoadmapsListRefetchAtRef = useRef<number>(0);

  useEffect(() => {
    lastRoadmapVersionRef.current = null;
    lastFullRefetchAtRef.current = 0;
    lastRoadmapsListVersionRef.current = null;
    lastRoadmapsListRefetchAtRef.current = 0;
    setRoadmapVersionFailed(false);
    setRoadmapsListVersionFailed(false);
  }, [roadmapId]);

  useEffect(() => {
    if (isRoadmapVersionError) setRoadmapVersionFailed(true);
  }, [isRoadmapVersionError]);

  useEffect(() => {
    if (isRoadmapsListVersionError) setRoadmapsListVersionFailed(true);
  }, [isRoadmapsListVersionError]);

  useEffect(() => {
    const nextVersion = versionData?.version;
    if (!nextVersion) return;

    // Первая версия приходит после initial GET — не делаем лишний refetch.
    if (lastRoadmapVersionRef.current === null) {
      lastRoadmapVersionRef.current = nextVersion;
      return;
    }

    if (nextVersion === lastRoadmapVersionRef.current) return;
    lastRoadmapVersionRef.current = nextVersion;

    // Если пользователь прямо сейчас дебаунсит изменения title/description,
    // то мы не перетрем серверными данными его локальный ввод.
    const isDebouncing = Boolean(titleDebounceRef.current || descDebounceRef.current);
    if (isDebouncing) return;

    // Порог, чтобы при серии быстрых изменений не дергать сервер слишком часто.
    const now = Date.now();
    if (now - lastFullRefetchAtRef.current < 3000) return;
    lastFullRefetchAtRef.current = now;

    refetch();
  }, [refetch, versionData?.version]);

  useEffect(() => {
    const nextVersion = roadmapsListVersionData?.version;
    if (!nextVersion) return;

    if (lastRoadmapsListVersionRef.current === null) {
      lastRoadmapsListVersionRef.current = nextVersion;
      return;
    }

    if (nextVersion === lastRoadmapsListVersionRef.current) return;
    lastRoadmapsListVersionRef.current = nextVersion;

    const now = Date.now();
    if (now - lastRoadmapsListRefetchAtRef.current < 5000) return;
    lastRoadmapsListRefetchAtRef.current = now;

    refetchRoadmaps();
  }, [refetchRoadmaps, roadmapsListVersionData?.version]);

  useEffect(() => {
    const dtos = data?.nodes ?? [];
    setNodes(dtos.map((dto) => toFlowNode(dto, fileMap[dto.id] ?? [], false)));
    pruneEdgeHandleStore(dtos);
    setEdges(toParentEdges(dtos, edgeHandleStoreRef.current));
  }, [data?.nodes, fileMap, pruneEdgeHandleStore]);

  const displayNodes = useMemo<RoadmapFlowNode[]>(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          selected: n.id === selectedId,
          linkRoadmapKey: n.data.dto.linkedRoadmapKey ?? undefined,
          onOpenLinkedRoadmap: (key: string) => setActiveRoadmapKey(key),
        },
      })),
    [nodes, selectedId, activeRoadmapKey]
  );

  const nodeTypes = useMemo<NodeTypes>(() => ({ roadmapNode: RoadmapNode }), []);

  const selected = useMemo<RoadmapNodeDto | null>(() => {
    if (!selectedId) return null;
    return nodes.find((n) => n.id === selectedId)?.data.dto ?? null;
  }, [nodes, selectedId]);

  const selectedFiles = useMemo<RoadmapFileDto[]>(() => {
    if (!selectedId) return [];
    return fileMap[selectedId] ?? [];
  }, [fileMap, selectedId]);

  const onPaneClick = useCallback(() => setSelectedId(null), []);

  const onNodeClick = useCallback((_e: unknown, node: { id: string }) => {
    setSelectedId(node.id);
  }, []);

  const tabs = useMemo<RoadmapDto[]>(() => listData?.roadmaps ?? [], [listData?.roadmaps]);
  const activeRoadmap = useMemo(() => tabs.find((t) => t.key === activeRoadmapKey) ?? null, [tabs, activeRoadmapKey]);

  const onCreateTabFromSelected = useCallback(async () => {
    if (!selected) return;

    const resp = await createRoadmap({ title: selected.title }).unwrap();
    const key = resp.roadmap.key;

    // Оптимистично показываем ссылку в этом клиенте
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selected.id
          ? {
              ...n,
              data: {
                ...n.data,
                dto: {
                  ...n.data.dto,
                  linkedRoadmapKey: key,
                },
              },
            }
          : n
      )
    );

    // Для временных узлов (id вида `temp-*`) связь в БД выставить невозможно.
    if (!selected.id.startsWith('temp-')) {
      await linkNodeToRoadmap({ nodeId: selected.id, linkedRoadmapKey: key }).unwrap();
    }
    setActiveRoadmapKey(key);
  }, [createRoadmap, linkNodeToRoadmap, selected]);

  const onRenameActiveRoadmap = useCallback(async () => {
    if (!activeRoadmap) return;
    const next = window.prompt('Новое название схемы', activeRoadmap.title);
    if (!next) return;

    await patchRoadmap({ roadmapId: activeRoadmap.key, patch: { title: next } }).unwrap();
  }, [activeRoadmap, patchRoadmap]);

  const onDeleteActiveRoadmap = useCallback(async () => {
    if (!activeRoadmap) return;
    if (!window.confirm(`Удалить схему "${activeRoadmap.title}"?`)) return;

    await deleteRoadmap({ roadmapId: activeRoadmap.key }).unwrap();
    if (activeRoadmap.key === activeRoadmapKey) {
      const fallback = tabs.find((t) => t.key !== activeRoadmap.key);
      setActiveRoadmapKey(fallback?.key ?? DEFAULT_ROADMAP_KEY);
      setSelectedId(null);
    }
  }, [activeRoadmap, activeRoadmapKey, deleteRoadmap, tabs]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds) as RoadmapFlowNode[]);
    },
    []
  );

  const onAddRoot = useCallback(async () => {
    const view = rf.current?.getViewport();
    const centerX = view ? -view.x / view.zoom : 0;
    const centerY = view ? -view.y / view.zoom : 0;

    // Оптимистично добавляем локальный узел
    const tempId = `temp-${Date.now()}`;
    setNodes((prev) => [
      ...prev,
      {
        id: tempId,
        type: 'roadmapNode',
        position: { x: centerX, y: centerY },
        data: {
          dto: {
            id: tempId,
            roadmapId,
            parentId: null,
            title: 'Введите текст',
            description: null,
            x: centerX,
            y: centerY,
              linkedRoadmapKey: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          files: [],
          selected: true,
        },
      },
    ]);
    setSelectedId(tempId);

    await createNode({ roadmapId, x: centerX, y: centerY, parentId: null, title: 'Введите текст' }).unwrap();
  }, [createNode, roadmapId]);

  const onConnect = useCallback(
    async (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      if (conn.source === conn.target) {
        return;
      }

      const edgeId = `e:${conn.source}:${conn.target}`;
      edgeHandleStoreRef.current[edgeId] = {
        sourceHandle: (conn.sourceHandle as any) ?? undefined,
        targetHandle: (conn.targetHandle as any) ?? undefined,
      };
      persistEdgeHandleStore();

      // у одного блока может быть только один parentId -> убираем предыдущую связь на этот target
      setEdges((prev) => prev.filter((e) => e.target !== conn.target));

      // Оптимистично добавляем линию
      setEdges((eds) =>
        addEdge(
          {
            id: edgeId,
            ...conn,
            animated: false,
            style: { strokeWidth: 1 },
          },
          eds
        )
      );

      await patchNode({ nodeId: conn.target, patch: { parentId: conn.source } }).unwrap();
    },
    [patchNode, persistEdgeHandleStore]
  );

  const onConnectStart = useCallback(
    (_e: unknown, params: { nodeId?: string | null; handleType?: 'source' | 'target' | null; handleId?: string | null }) => {
      if (!params.nodeId || params.handleType !== 'source') return;

      const domHandleId =
        ((_e as { target?: EventTarget | null })?.target as HTMLElement | null)?.getAttribute?.('data-handleid') ?? undefined;
      const handleId = params.handleId ?? domHandleId ?? undefined;

      connectStartRef.current = { nodeId: params.nodeId, handleType: 'source', handleId };
    },
    []
  );

  const onConnectEnd = useCallback(
    async (event: MouseEvent | TouchEvent) => {
      const start = connectStartRef.current;
      connectStartRef.current = null;
      if (!start || start.handleType !== 'source') return;

      const target = event.target as HTMLElement | null;
      if (!target || !target.closest('.react-flow__pane')) return;
      if (!rf.current) return;

      const pos =
        'clientX' in event
          ? { x: event.clientX, y: event.clientY }
          : { x: event.touches[0]?.clientX ?? 0, y: event.touches[0]?.clientY ?? 0 };

      const flowPos = rf.current.project(pos);
      const sourceNode = nodes.find((n) => n.id === start.nodeId);

      const picked =
        sourceNode ? pickHandlesByGeometry({ x: sourceNode.position.x, y: sourceNode.position.y }, { x: flowPos.x, y: flowPos.y }) : null;

      // Если найден handle для соединения с существующим блоком — не создаем новый блок
      if (picked?.targetHandle) {
        return;
      }

      const tempId = `temp-${Date.now()}`;

      // Оптимистично создаём новый блок и линию
      setNodes((prev) => [
        ...prev,
        {
          id: tempId,
          type: 'roadmapNode',
          position: { x: flowPos.x, y: flowPos.y },
          data: {
            dto: {
              id: tempId,
              roadmapId,
              parentId: start.nodeId,
              title: 'Введите текст',
              description: null,
              x: flowPos.x,
              y: flowPos.y,
              linkedRoadmapKey: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            files: [],
            selected: false,
          },
        },
      ]);

      setEdges((eds) =>
        addEdge(
          {
            id: `e:${start.nodeId}:${tempId}`,
            source: start.nodeId,
            target: tempId,
            sourceHandle: (start.handleId ?? picked?.sourceHandle) as string | undefined,
            targetHandle: picked?.targetHandle,
            animated: false,
            style: { strokeWidth: 1 },
          },
          eds
        )
      );

      // сохраняем handle'ы, чтобы связь не "переклеилась" после рефетча
      edgeHandleStoreRef.current[`e:${start.nodeId}:${tempId}`] = {
        sourceHandle: (start.handleId as any) ?? picked?.sourceHandle,
        targetHandle: picked?.targetHandle,
      };
      persistEdgeHandleStore();

      await createNode({ roadmapId, x: flowPos.x, y: flowPos.y, parentId: start.nodeId, title: 'Введите текст' }).unwrap();
    },
    [createNode, nodes, persistEdgeHandleStore, roadmapId]
  );

  const onNodeDragStop = useCallback(
    async (_e: unknown, node: { id: string; position: { x: number; y: number } }) => {
      let { x, y } = node.position;

      const current = nodes.find((n) => n.id === node.id);
      const others = nodes.filter((n) => n.id !== node.id);

      if (current) {
        // Привязываем к ближайшим координатам соседних блоков
        for (const other of others) {
          if (Math.abs(other.position.x - x) <= SNAP_DISTANCE) {
            x = other.position.x;
          }
          if (Math.abs(other.position.y - y) <= SNAP_DISTANCE) {
            y = other.position.y;
          }
        }
      }

      // Обновляем локальное состояние до "прилепленных" координат
      setNodes((prev) =>
        prev.map((n) =>
          n.id === node.id
            ? {
                ...n,
                position: { x, y },
                data: {
                  ...n.data,
                  dto: {
                    ...n.data.dto,
                    x,
                    y,
                  },
                },
              }
            : n
        )
      );

      await patchNode({ nodeId: node.id, patch: { x, y } }).unwrap();
    },
    [nodes, patchNode]
  );

  const onChangeTitle = useCallback(
    (next: string) => {
      if (!selected) return;

      // Оптимистично обновляем локальное состояние
      setNodes((prev) =>
        prev.map((n) =>
          n.id === selected.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  dto: {
                    ...n.data.dto,
                    title: next,
                  },
                },
              }
            : n
        )
      );

      if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
      titleDebounceRef.current = setTimeout(async () => {
        await patchNode({ nodeId: selected.id, patch: { title: next } }).unwrap();
      }, 500);
    },
    [patchNode, selected]
  );

  const onChangeDescription = useCallback(
    (next: string) => {
      if (!selected) return;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === selected.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  dto: {
                    ...n.data.dto,
                    description: next,
                  },
                },
              }
            : n
        )
      );

      if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
      descDebounceRef.current = setTimeout(async () => {
        await patchNode({ nodeId: selected.id, patch: { description: next } }).unwrap();
      }, 600);
    },
    [patchNode, selected]
  );

  const onDeleteSelected = useCallback(async () => {
    if (!selected) return;

    // Оптимистично удаляем узел и его связи
    setNodes((prev) => prev.filter((n) => n.id !== selected.id));
    setEdges((prev) => prev.filter((e) => e.source !== selected.id && e.target !== selected.id));
    setSelectedId(null);

    await deleteNode({ nodeId: selected.id }).unwrap();
  }, [deleteNode, selected]);

  const onUploadFileForSelected = useCallback(
    async (file: File) => {
      if (!selected) return;
      await uploadFile({ nodeId: selected.id, file }).unwrap();
    },
    [selected, uploadFile]
  );

  const onDeleteFileForSelected = useCallback(
    async (fileId: string) => {
      await deleteFile({ fileId }).unwrap();
    },
    [deleteFile]
  );

  const onEdgeClick = useCallback(
    async (_e: unknown, edge: Edge) => {
      // Оптимистично убираем связь
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));

      delete edgeHandleStoreRef.current[edge.id];
      persistEdgeHandleStore();

      await patchNode({ nodeId: edge.target, patch: { parentId: null } }).unwrap();
    },
    [patchNode, persistEdgeHandleStore]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      // Пока используем только наш onEdgeClick для удаления, здесь можно просто применить изменения
      setEdges((eds) => {
        let next = eds;
        for (const c of changes) {
          if (c.type === 'remove') {
            next = next.filter((e) => e.id !== c.id);
          }
        }
        return next;
      });
    },
    [setEdges]
  );

  const loadingLabel = isLoading ? 'Загрузка...' : isFetching ? 'Обновление...' : '';

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 backdrop-blur shrink-0">
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                t.key === activeRoadmapKey
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800'
              }`}
              onClick={() => {
                setSelectedId(null);
                setActiveRoadmapKey(t.key);
              }}
            >
              {t.title}
            </button>
          ))}

          <div className="flex-1" />
          {activeRoadmap && (
            <>
              <Button
                variant="ghost"
                size="sm"
                title="Переименовать схему"
                onClick={onRenameActiveRoadmap}
                className="h-8 w-8 p-0 rounded-lg border border-gray-800 flex items-center justify-center"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Удалить схему"
                onClick={onDeleteActiveRoadmap}
                className="h-8 w-8 p-0 rounded-lg border border-gray-800 flex items-center justify-center"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            title="Новая вкладка"
            loading={creatingRoadmap}
            onClick={async () => {
              const resp = await createRoadmap({ title: 'Новая схема' }).unwrap();
              setSelectedId(null);
              setActiveRoadmapKey(resp.roadmap.key);
            }}
            className="h-8 w-8 p-0 rounded-lg border border-gray-800 flex items-center justify-center"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 relative">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <Button variant="primary" onClick={onAddRoot}>
              +
            </Button>
            {loadingLabel ? <div className="text-xs text-gray-500 dark:text-gray-400">{loadingLabel}</div> : null}
          </div>

          <ReactFlow
            nodes={displayNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            onInit={(instance) => {
              rf.current = instance;
            }}
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            isValidConnection={(c) => Boolean(c.source && c.target && c.source !== c.target)}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeClick={onEdgeClick}
            nodesDraggable
            onNodeDragStop={onNodeDragStop}
            nodesConnectable
            onConnect={onConnect}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        <RoadmapDetailsPanel
          node={selected}
          files={selectedFiles}
          onChangeTitle={onChangeTitle}
          onChangeDescription={onChangeDescription}
          onUploadFile={onUploadFileForSelected}
          onDeleteFile={onDeleteFileForSelected}
          onCreateTabFromNode={onCreateTabFromSelected}
          onDeleteNode={onDeleteSelected}
        />
      </div>
    </div>
  );
}

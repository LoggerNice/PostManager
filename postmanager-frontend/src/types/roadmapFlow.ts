import type { Edge, Node } from 'reactflow';
import type { RoadmapFileDto, RoadmapNodeDto } from '@/types/roadmap';

export type RoadmapNodeData = {
  dto: RoadmapNodeDto;
  files: RoadmapFileDto[];
  selected: boolean;
  linkRoadmapKey?: string;
  onOpenLinkedRoadmap?: (key: string) => void;
};

export type RoadmapFlowNode = Node<RoadmapNodeData, 'roadmapNode'>;
export type RoadmapFlowEdge = Edge;

export type RoadmapHandleId =
  | 'left-source'
  | 'left-target'
  | 'right-source'
  | 'right-target'
  | 'top-source'
  | 'top-target'
  | 'bottom-source'
  | 'bottom-target';

export type EdgeHandleStore = Record<
  string,
  {
    sourceHandle?: RoadmapHandleId;
    targetHandle?: RoadmapHandleId;
  }
>;

export function pickHandlesByGeometry(parent: { x: number; y: number }, child: { x: number; y: number }): {
  sourceHandle: RoadmapHandleId;
  targetHandle: RoadmapHandleId;
} {
  const dx = child.x - parent.x;
  const dy = child.y - parent.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    // горизонталь
    if (dx >= 0) return { sourceHandle: 'right-source', targetHandle: 'left-target' };
    return { sourceHandle: 'left-source', targetHandle: 'right-target' };
  }

  // вертикаль
  if (dy >= 0) return { sourceHandle: 'bottom-source', targetHandle: 'top-target' };
  return { sourceHandle: 'top-source', targetHandle: 'bottom-target' };
}

export function toFlowNode(dto: RoadmapNodeDto, files: RoadmapFileDto[], selected: boolean): RoadmapFlowNode {
  return {
    id: dto.id,
    type: 'roadmapNode',
    position: { x: dto.x, y: dto.y },
    data: { dto, files, selected },
  };
}

export function toParentEdges(nodes: RoadmapNodeDto[], handleStore?: EdgeHandleStore): RoadmapFlowEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n] as const));

  return nodes
    .filter((n) => Boolean(n.parentId))
    .map((n) => {
      const parent = byId.get(n.parentId as string);

      let sourceHandle: RoadmapHandleId | undefined;
      let targetHandle: RoadmapHandleId | undefined;

      const edgeId = `e:${n.parentId}:${n.id}`;
      const stored = handleStore?.[edgeId];

      if (stored?.sourceHandle || stored?.targetHandle) {
        sourceHandle = stored.sourceHandle;
        targetHandle = stored.targetHandle;
      } else if (parent) {
        // fallback для старых данных без сохранённых handle'ов
        const picked = pickHandlesByGeometry({ x: parent.x, y: parent.y }, { x: n.x, y: n.y });
        sourceHandle = picked.sourceHandle;
        targetHandle = picked.targetHandle;
      }

      // Если не нашли parent — пусть ReactFlow выберет дефолтный handle
      return {
        id: edgeId,
        source: n.parentId as string,
        target: n.id,
        sourceHandle,
        targetHandle,
        selectable: true,
        deletable: false,
        animated: false,
        style: { strokeWidth: 1 },
      };
    });
}


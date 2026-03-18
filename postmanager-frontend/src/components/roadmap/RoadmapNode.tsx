import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

import Card from '@/components/ui/Card';
import type { RoadmapNodeData } from '@/types/roadmapFlow';

function RoadmapNode({ data }: NodeProps<RoadmapNodeData>) {
  const isLinked = Boolean(data.linkRoadmapKey && data.onOpenLinkedRoadmap);

  return (
    <div className={data.selected ? 'ring-2 ring-blue-500 rounded-lg relative group' : 'relative group'}>
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
        isConnectableStart={false}
        isConnectableEnd
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
        isConnectableStart
        isConnectableEnd={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
        isConnectableStart
        isConnectableEnd={false}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
        isConnectableStart={false}
        isConnectableEnd
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
        isConnectableStart={false}
        isConnectableEnd
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
        isConnectableStart
        isConnectableEnd={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
        isConnectableStart
        isConnectableEnd={false}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-2 !h-2 !bg-gray-400 dark:!bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto"
        isConnectableStart={false}
        isConnectableEnd
      />
      <Card>
        <div className="min-w-[160px] max-w-[260px]">
          {isLinked ? (
            <button
              type="button"
              className="text-left w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline break-words"
              onClick={(e) => {
                e.stopPropagation();
                data.onOpenLinkedRoadmap?.(data.linkRoadmapKey as string);
              }}
            >
              {data.dto.title}
            </button>
          ) : (
            <div className="text-sm font-medium text-gray-900 dark:text-white break-words">{data.dto.title}</div>
          )}
          {data.dto.description ? (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-3 break-words">
              {data.dto.description}
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

export default memo(RoadmapNode);


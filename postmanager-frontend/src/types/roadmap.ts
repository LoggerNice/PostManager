export type RoadmapDto = {
  id: string;
  key: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type RoadmapNodeDto = {
  id: string;
  roadmapId: string;
  parentId: string | null;
  title: string;
  description: string | null;
  x: number;
  y: number;
  createdAt: string;
  updatedAt: string;
};

export type RoadmapFileDto = {
  id: string;
  nodeId: string;
  originalName: string;
  storedName: string;
  mime: string;
  size: number;
  url: string;
  createdAt: string;
};

export type GetRoadmapResponse = {
  roadmap: RoadmapDto;
  nodes: RoadmapNodeDto[];
  files: RoadmapFileDto[];
};

export type ListRoadmapsResponse = {
  roadmaps: RoadmapDto[];
};

export type CreateRoadmapResponse = {
  roadmap: RoadmapDto;
};


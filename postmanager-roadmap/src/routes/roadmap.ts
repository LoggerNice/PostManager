import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createRoadmap, deleteRoadmap, getRoadmapByKey, getRoadmapVersion, getRoadmapsListVersion, listRoadmaps, patchRoadmap } from '../controllers/roadmapController.js';
import { createNode } from '../controllers/nodeController.js';

export const roadmapRouter = Router();

roadmapRouter.get('/roadmaps', asyncHandler(listRoadmaps));
roadmapRouter.get('/roadmaps/version', asyncHandler(getRoadmapsListVersion));
roadmapRouter.post('/roadmaps', asyncHandler(createRoadmap));
roadmapRouter.patch('/roadmaps/:roadmapId', asyncHandler(patchRoadmap));
roadmapRouter.delete('/roadmaps/:roadmapId', asyncHandler(deleteRoadmap));
roadmapRouter.get('/roadmap/:roadmapId', asyncHandler(getRoadmapByKey));
roadmapRouter.get('/roadmap/:roadmapId/version', asyncHandler(getRoadmapVersion));
roadmapRouter.post('/roadmap/:roadmapId/nodes', asyncHandler(createNode));


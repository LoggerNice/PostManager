import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { deleteNode, linkNodeToRoadmap, patchNode } from '../controllers/nodeController.js';

export const nodesRouter = Router();

nodesRouter.patch('/nodes/:nodeId', asyncHandler(patchNode));
nodesRouter.patch('/nodes/:nodeId/link', asyncHandler(linkNodeToRoadmap));
nodesRouter.delete('/nodes/:nodeId', asyncHandler(deleteNode));


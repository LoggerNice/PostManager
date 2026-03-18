import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { deleteNode, patchNode } from '../controllers/nodeController.js';

export const nodesRouter = Router();

nodesRouter.patch('/nodes/:nodeId', asyncHandler(patchNode));
nodesRouter.delete('/nodes/:nodeId', asyncHandler(deleteNode));


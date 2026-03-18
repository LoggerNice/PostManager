import { Router } from 'express';
import { healthRouter } from './health.js';
import { roadmapRouter } from './roadmap.js';
import { nodesRouter } from './nodes.js';
import { filesRouter } from './files.js';

export const router = Router();

router.use(healthRouter);
router.use(roadmapRouter);
router.use(nodesRouter);
router.use(filesRouter);


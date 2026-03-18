import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const healthRouter = Router();

healthRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  })
);


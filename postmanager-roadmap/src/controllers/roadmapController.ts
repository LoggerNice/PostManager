import { z } from 'zod';
import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import crypto from 'crypto';

const roadmapKeySchema = z.object({
  roadmapId: z.string().min(1),
});

const createRoadmapBodySchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9-_]*$/i, 'Key must be url-safe')
    .optional(),
  title: z.string().trim().min(1).max(200).optional(),
});

const patchRoadmapBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
});

export async function getRoadmapByKey(req: Request, res: Response) {
  const { roadmapId } = roadmapKeySchema.parse(req.params);

  const roadmap = await prisma.roadmap.findUnique({
    where: { key: roadmapId },
    select: { id: true, key: true, title: true, createdAt: true, updatedAt: true },
  });

  if (!roadmap) {
    return res.status(404).json({ error: 'NotFound', message: 'Roadmap not found' });
  }

  const nodes = await prisma.roadmapNode.findMany({
    where: { roadmapId: roadmap.id },
    orderBy: { createdAt: 'asc' },
  });

  const files = await prisma.roadmapFile.findMany({
    where: { node: { roadmapId: roadmap.id } },
    orderBy: { createdAt: 'asc' },
  });

  return res.json({ roadmap, nodes, files });
}

export async function listRoadmaps(_req: Request, res: Response) {
  const roadmaps = await prisma.roadmap.findMany({
    select: { id: true, key: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  return res.json({ roadmaps });
}

export async function getRoadmapsListVersion(_req: Request, res: Response) {
  const [count, maxUpdatedAt] = await Promise.all([
    prisma.roadmap.count(),
    prisma.roadmap.findFirst({
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const version = `${count}|${maxUpdatedAt?.updatedAt.getTime() ?? 0}`;
  return res.json({ version });
}

export async function createRoadmap(req: Request, res: Response) {
  const body = createRoadmapBodySchema.parse(req.body);

  const key = body.key ?? `rm-${crypto.randomUUID().slice(0, 8)}`;
  const title = body.title ?? 'Roadmap';

  const existing = await prisma.roadmap.findUnique({
    where: { key },
    select: { id: true },
  });
  if (existing) {
    return res.status(409).json({ error: 'AlreadyExists', message: 'Roadmap key already exists' });
  }

  const roadmap = await prisma.roadmap.create({
    data: { key, title },
    select: { id: true, key: true, title: true, createdAt: true, updatedAt: true },
  });

  return res.status(201).json({ roadmap });
}

export async function patchRoadmap(req: Request, res: Response) {
  const { roadmapId } = roadmapKeySchema.parse(req.params);
  const body = patchRoadmapBodySchema.parse(req.body);

  const roadmap = await prisma.roadmap.update({
    where: { key: roadmapId },
    data: {
      ...(body.title ? { title: body.title } : {}),
    },
    select: { id: true, key: true, title: true, createdAt: true, updatedAt: true },
  });

  return res.json({ roadmap });
}

export async function deleteRoadmap(req: Request, res: Response) {
  const { roadmapId } = roadmapKeySchema.parse(req.params);

  await prisma.roadmap.delete({
    where: { key: roadmapId },
  });

  return res.status(204).send();
}

export async function getRoadmapVersion(req: Request, res: Response) {
  const { roadmapId } = roadmapKeySchema.parse(req.params);

  const roadmap = await prisma.roadmap.findUnique({
    where: { key: roadmapId },
    select: { id: true, updatedAt: true },
  });

  if (!roadmap) {
    return res.status(404).json({ error: 'NotFound', message: 'Roadmap not found' });
  }

  const [nodesCount, nodesMaxUpdatedAt, filesCount, filesMaxCreatedAt] = await Promise.all([
    prisma.roadmapNode.count({ where: { roadmapId: roadmap.id } }),
    prisma.roadmapNode.findFirst({
      where: { roadmapId: roadmap.id },
      select: { updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.roadmapFile.count({ where: { node: { roadmapId: roadmap.id } } }),
    prisma.roadmapFile.findFirst({
      where: { node: { roadmapId: roadmap.id } },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  // Version only needs to change when server state changes.
  // We avoid returning the full roadmap payload for cheap polling.
  const version = [
    roadmap.updatedAt.getTime(),
    nodesCount,
    nodesMaxUpdatedAt?.updatedAt ? nodesMaxUpdatedAt.updatedAt.getTime() : 0,
    filesCount,
    filesMaxCreatedAt?.createdAt ? filesMaxCreatedAt.createdAt.getTime() : 0,
  ].join('|');

  return res.json({ version });
}


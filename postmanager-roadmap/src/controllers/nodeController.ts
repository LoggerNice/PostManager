import { z } from 'zod';
import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { env } from '../utils/env.js';
import { resolveRoadmapFilePath } from '../utils/uploads.js';

const createNodeParamsSchema = z.object({
  roadmapId: z.string().min(1),
});

const createNodeBodySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  x: z.number().finite(),
  y: z.number().finite(),
});

export async function createNode(req: Request, res: Response) {
  const { roadmapId } = createNodeParamsSchema.parse(req.params);
  const body = createNodeBodySchema.parse(req.body);

  const roadmap = await prisma.roadmap.findUnique({
    where: { key: roadmapId },
    select: { id: true },
  });

  if (!roadmap) {
    return res.status(404).json({ error: 'NotFound', message: 'Roadmap not found' });
  }

  if (body.parentId) {
    const parent = await prisma.roadmapNode.findFirst({
      where: { id: body.parentId, roadmapId: roadmap.id },
      select: { id: true },
    });
    if (!parent) {
      return res.status(400).json({ error: 'InvalidParent', message: 'Parent node not found in roadmap' });
    }
  }

  const node = await prisma.roadmapNode.create({
    data: {
      roadmapId: roadmap.id,
      parentId: body.parentId ?? null,
      title: body.title ?? undefined,
      x: body.x,
      y: body.y,
    },
  });

  return res.status(201).json(node);
}

const patchNodeParamsSchema = z.object({
  nodeId: z.string().uuid(),
});

const patchNodeBodySchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  x: z.number().finite().optional(),
  y: z.number().finite().optional(),
});

export async function patchNode(req: Request, res: Response) {
  const { nodeId } = patchNodeParamsSchema.parse(req.params);
  const body = patchNodeBodySchema.parse(req.body);

  const existing = await prisma.roadmapNode.findUnique({
    where: { id: nodeId },
    select: { id: true, roadmapId: true },
  });

  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Node not found' });
  }

  if (body.parentId !== undefined && body.parentId !== null) {
    if (body.parentId === nodeId) {
      return res.status(400).json({ error: 'InvalidParent', message: 'Node cannot be its own parent' });
    }

    const parent = await prisma.roadmapNode.findFirst({
      where: { id: body.parentId, roadmapId: existing.roadmapId },
      select: { id: true, parentId: true },
    });
    if (!parent) {
      return res.status(400).json({ error: 'InvalidParent', message: 'Parent node not found in roadmap' });
    }
  }

  const node = await prisma.roadmapNode.update({
    where: { id: nodeId },
    data: {
      parentId: body.parentId,
      title: body.title,
      description: body.description,
      x: body.x,
      y: body.y,
    },
  });

  return res.json(node);
}

const linkedRoadmapKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-_]*$/i, 'Key must be url-safe');

const linkNodeToRoadmapBodySchema = z.object({
  linkedRoadmapKey: linkedRoadmapKeySchema.nullable(),
});

export async function linkNodeToRoadmap(req: Request, res: Response) {
  const { nodeId } = patchNodeParamsSchema.parse(req.params);
  const body = linkNodeToRoadmapBodySchema.parse(req.body);

  const existing = await prisma.roadmapNode.findUnique({
    where: { id: nodeId },
    select: { id: true },
  });

  if (!existing) {
    return res.status(404).json({ error: 'NotFound', message: 'Node not found' });
  }

  if (body.linkedRoadmapKey !== null) {
    const roadmap = await prisma.roadmap.findUnique({
      where: { key: body.linkedRoadmapKey },
      select: { id: true },
    });

    if (!roadmap) {
      return res.status(400).json({ error: 'InvalidRoadmapKey', message: 'Linked roadmap not found' });
    }
  }

  const updated = await prisma.roadmapNode.update({
    where: { id: nodeId },
    data: { linkedRoadmapKey: body.linkedRoadmapKey },
  });

  return res.json(updated);
}

async function collectSubtreeNodeIds(rootId: string): Promise<string[]> {
  const ids: string[] = [];
  const queue: string[] = [rootId];

  while (queue.length) {
    const current = queue.shift();
    if (!current) break;
    ids.push(current);

    const children = await prisma.roadmapNode.findMany({
      where: { parentId: current },
      select: { id: true },
    });
    for (const c of children) queue.push(c.id);
  }

  return ids;
}

export async function deleteNode(req: Request, res: Response) {
  const { nodeId } = patchNodeParamsSchema.parse(req.params);

  const existing = await prisma.roadmapNode.findUnique({
    where: { id: nodeId },
    select: { id: true },
  });

  if (!existing) {
    return res.status(204).send();
  }

  const ids = await collectSubtreeNodeIds(nodeId);

  const files = await prisma.roadmapFile.findMany({
    where: { nodeId: { in: ids } },
    select: { storedName: true },
  });

  const uploadsRoot = path.resolve(process.cwd(), env.UPLOADS_DIR);

  await prisma.roadmapNode.deleteMany({
    where: { id: { in: ids } },
  });

  for (const f of files) {
    const fp = resolveRoadmapFilePath(uploadsRoot, f.storedName);
    try {
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    } catch {
      // ignore
    }
  }

  return res.status(204).send();
}


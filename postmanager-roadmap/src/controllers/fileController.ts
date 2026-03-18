import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { env } from '../utils/env.js';
import { resolveRoadmapFilePath } from '../utils/uploads.js';

const nodeIdParamsSchema = z.object({
  nodeId: z.string().uuid(),
});

const fileIdParamsSchema = z.object({
  fileId: z.string().uuid(),
});

export async function createFileForNode(req: Request, res: Response) {
  const { nodeId } = nodeIdParamsSchema.parse(req.params);

  if (!req.file) {
    return res.status(400).json({ error: 'BadRequest', message: 'File not provided' });
  }

  const node = await prisma.roadmapNode.findUnique({
    where: { id: nodeId },
    select: { id: true },
  });

  if (!node) {
    return res.status(404).json({ error: 'NotFound', message: 'Node not found' });
  }

  const storedName = req.file.filename;
  const url = `/uploads/roadmap/${storedName}`;

  const created = await prisma.roadmapFile.create({
    data: {
      nodeId,
      originalName: req.file.originalname,
      storedName,
      mime: req.file.mimetype,
      size: req.file.size,
      url,
    },
  });

  return res.status(201).json(created);
}

export async function getFileMeta(req: Request, res: Response) {
  const { fileId } = fileIdParamsSchema.parse(req.params);

  const file = await prisma.roadmapFile.findUnique({ where: { id: fileId } });
  if (!file) return res.status(404).json({ error: 'NotFound', message: 'File not found' });
  return res.json(file);
}

export async function downloadFile(req: Request, res: Response) {
  const { fileId } = fileIdParamsSchema.parse(req.params);

  const file = await prisma.roadmapFile.findUnique({ where: { id: fileId } });
  if (!file) return res.status(404).json({ error: 'NotFound', message: 'File not found' });

  const uploadsRoot = path.resolve(process.cwd(), env.UPLOADS_DIR);
  const filePath = resolveRoadmapFilePath(uploadsRoot, file.storedName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'NotFound', message: 'File missing on disk' });
  }

  res.setHeader('Content-Type', file.mime);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  return res.sendFile(filePath);
}

export async function deleteFile(req: Request, res: Response) {
  const { fileId } = fileIdParamsSchema.parse(req.params);

  const file = await prisma.roadmapFile.findUnique({ where: { id: fileId } });
  if (!file) return res.status(204).send();

  const uploadsRoot = path.resolve(process.cwd(), env.UPLOADS_DIR);
  const filePath = resolveRoadmapFilePath(uploadsRoot, file.storedName);

  await prisma.roadmapFile.delete({ where: { id: fileId } });

  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }

  return res.status(204).send();
}


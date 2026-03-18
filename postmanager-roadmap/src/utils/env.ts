import { z } from 'zod';

const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 3050))
    .refine((v) => Number.isFinite(v) && v > 0 && v < 65536, 'Invalid PORT'),
  DATABASE_URL: z.string().min(1),
  UPLOADS_DIR: z.string().optional().default('uploads'),
  FRONTEND_ORIGIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);


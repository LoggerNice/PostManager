import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './utils/env.js';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN ? [env.FRONTEND_ORIGIN] : true,
    credentials: false,
  })
);

app.use(express.json({ limit: '2mb' }));

const uploadsDir = path.resolve(__dirname, '..', env.UPLOADS_DIR);
app.use('/uploads', express.static(uploadsDir));

app.use(router);

app.use(errorHandler);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`postmanager-roadmap listening on :${env.PORT}`);
});


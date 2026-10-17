import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import { prisma } from './lib/prisma.ts';
import { HttpError } from './lib/http.ts';
import { authRouter } from './routes/auth.ts';
import { itemsRouter } from './routes/items.ts';
import { reportsRouter } from './routes/reports.ts';
import { transactionsRouter } from './routes/transactions.ts';

const app = express();
const port = Number(process.env.API_PORT ?? 3001);

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gudangflow-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/items', itemsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/reports', reportsRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint API tidak ditemukan.' });
});

// Pada mode produksi, Express sekaligus menyajikan hasil build frontend (dist/).
const distDir = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }

  console.error('[api-error]', error);
  const message = error instanceof Error ? error.message : 'Terjadi kesalahan pada server.';
  res.status(500).json({ message });
};

app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`\n  GudangFlow API siap di http://localhost:${port}`);
  console.log(`  Health check: http://localhost:${port}/api/health\n`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\nMenerima ${signal}, menutup server...`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// URL database dipakai oleh Prisma CLI (db push / migrate / studio).
// Disimpan di prisma.config.ts karena Prisma ORM v7 tidak lagi menerima
// properti `url` di dalam file schema.prisma.
const rawUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const relativePath = rawUrl.replace(/^file:/, '');
const absolutePath = path.isAbsolute(relativePath)
  ? relativePath
  : path.join(import.meta.dirname, relativePath);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: `file:${absolutePath.split(path.sep).join('/')}`,
  },
});

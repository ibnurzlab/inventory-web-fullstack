import 'dotenv/config';
import path from 'node:path';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.ts';

/**
 * Prisma ORM v7 tidak lagi membaca properti `url` dari schema.prisma.
 * Koneksi database diberikan lewat driver adapter (better-sqlite3).
 * Di sini URL dari .env diubah menjadi path absolut supaya tidak
 * bergantung pada direktori kerja saat server dijalankan.
 */
function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  const relativePath = raw.replace(/^file:/, '');
  const absolutePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.resolve(process.cwd(), relativePath);

  return `file:${absolutePath.split(path.sep).join('/')}`;
}

const adapter = new PrismaBetterSqlite3({ url: resolveDatabaseUrl() });

export const prisma = new PrismaClient({ adapter });

import { Router } from 'express';
import type { Prisma } from '../generated/prisma/client.ts';
import { prisma } from '../lib/prisma.ts';
import { HttpError, asyncHandler, optionalString } from '../lib/http.ts';
import { requireAuth, requireRole } from '../lib/auth.ts';
import { firstIssue, itemSchema } from '../lib/validate.ts';
import { buildItemsTemplateWorkbook, buildItemsWorkbook, parseItemsWorkbook } from '../lib/excel.ts';

export const itemsRouter = Router();

// Seluruh endpoint barang wajib login.
itemsRouter.use(requireAuth);

itemsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const keyword = optionalString(req.query.q);
    const category = optionalString(req.query.category);

    const where: Prisma.ItemWhereInput = {};
    if (category) where.category = category;
    if (keyword) {
      where.OR = [
        { code: { contains: keyword } },
        { name: { contains: keyword } },
        { category: { contains: keyword } },
      ];
    }

    const items = await prisma.item.findMany({ where, orderBy: { code: 'asc' } });
    res.json({ items });
  })
);

itemsRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.item.findMany({
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' },
    });
    res.json({ categories: rows.map((row) => row.category) });
  })
);

itemsRouter.get(
  '/export',
  asyncHandler(async (_req, res) => {
    const items = await prisma.item.findMany({ orderBy: { code: 'asc' } });
    const buffer = await buildItemsWorkbook(items);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="data-barang-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buffer);
  })
);

itemsRouter.get(
  '/template',
  asyncHandler(async (_req, res) => {
    const buffer = await buildItemsTemplateWorkbook();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="template-import-barang.xlsx"');
    res.send(buffer);
  })
);

itemsRouter.post(
  '/import',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const raw: unknown = req.body?.dataBase64;
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      throw new HttpError(400, 'File Excel tidak ditemukan pada permintaan.');
    }

    const buffer = Buffer.from(raw.replace(/^data:[^;]+;base64,/, ''), 'base64');
    const rows = await parseItemsWorkbook(buffer);

    if (rows.length === 0) {
      throw new HttpError(400, 'Tidak ada baris data yang bisa dibaca dari file tersebut.');
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      const code = row.code.trim().toUpperCase();
      const name = row.name.trim();

      if (!code || !name) {
        errors.push(`Baris ${index + 2}: kode dan nama barang wajib diisi.`);
        continue;
      }

      const payload = {
        name,
        category: row.category || 'Umum',
        unit: row.unit || 'Pcs',
        stock: Math.max(0, Math.trunc(row.stock)),
        minStock: Math.max(0, Math.trunc(row.minStock)),
      };

      const existing = await prisma.item.findUnique({ where: { code } });
      if (existing) {
        await prisma.item.update({ where: { code }, data: payload });
        updated += 1;
      } else {
        await prisma.item.create({ data: { code, ...payload } });
        created += 1;
      }
    }

    res.json({
      total: rows.length,
      created,
      updated,
      failed: errors.length,
      errors: errors.slice(0, 20),
    });
  })
);

itemsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = itemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: firstIssue(parsed.error) });
      return;
    }

    const code = parsed.data.code.toUpperCase();
    const existing = await prisma.item.findUnique({ where: { code } });
    if (existing) throw new HttpError(409, `Kode barang "${code}" sudah terdaftar.`);

    const item = await prisma.item.create({
      data: {
        code,
        name: parsed.data.name,
        category: parsed.data.category || 'Umum',
        unit: parsed.data.unit || 'Pcs',
        stock: parsed.data.stock,
        minStock: parsed.data.minStock,
      },
    });

    res.status(201).json({ item });
  })
);

itemsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const parsed = itemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: firstIssue(parsed.error) });
      return;
    }

    const target = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!target) throw new HttpError(404, 'Barang tidak ditemukan.');

    const code = parsed.data.code.toUpperCase();
    const conflict = await prisma.item.findFirst({ where: { code, id: { not: target.id } } });
    if (conflict) throw new HttpError(409, `Kode barang "${code}" sudah digunakan barang lain.`);

    const item = await prisma.item.update({
      where: { id: target.id },
      data: {
        code,
        name: parsed.data.name,
        category: parsed.data.category || 'Umum',
        unit: parsed.data.unit || 'Pcs',
        stock: parsed.data.stock,
        minStock: parsed.data.minStock,
      },
    });

    res.json({ item });
  })
);

itemsRouter.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const target = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!target) throw new HttpError(404, 'Barang tidak ditemukan.');

    await prisma.item.delete({ where: { id: target.id } });
    res.json({ message: `Barang "${target.name}" berhasil dihapus.` });
  })
);

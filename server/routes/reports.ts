import { Router } from 'express';
import { prisma } from '../lib/prisma.ts';
import { asyncHandler, optionalString, toBoundedInt } from '../lib/http.ts';
import { requireAuth } from '../lib/auth.ts';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

reportsRouter.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const [items, totalTransactions, inAggregate, outAggregate] = await Promise.all([
      prisma.item.findMany({ select: { stock: true, minStock: true } }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({ where: { type: 'IN' }, _sum: { quantity: true } }),
      prisma.transaction.aggregate({ where: { type: 'OUT' }, _sum: { quantity: true } }),
    ]);

    const lowStockItems = items.filter((item) => item.stock <= item.minStock).length;
    const totalStock = items.reduce((acc, item) => acc + item.stock, 0);

    res.json({
      totalItems: items.length,
      totalStock,
      lowStockItems,
      totalTransactions,
      totalIn: inAggregate._sum.quantity ?? 0,
      totalOut: outAggregate._sum.quantity ?? 0,
    });
  })
);

reportsRouter.get(
  '/trend',
  asyncHandler(async (req, res) => {
    const days = toBoundedInt(req.query.days, 30, 7, 180);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const grouped = await prisma.transaction.groupBy({
      by: ['date', 'type'],
      where: { date: { gte: toDateKey(start) } },
      _sum: { quantity: true },
    });

    const buckets = new Map<string, { date: string; masuk: number; keluar: number }>();
    for (let index = 0; index < days; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = toDateKey(day);
      buckets.set(key, { date: key, masuk: 0, keluar: 0 });
    }

    grouped.forEach((row) => {
      const bucket = buckets.get(row.date);
      if (!bucket) return;
      if (row.type === 'IN') bucket.masuk = row._sum.quantity ?? 0;
      else bucket.keluar = row._sum.quantity ?? 0;
    });

    res.json({ trend: Array.from(buckets.values()) });
  })
);

reportsRouter.get(
  '/top-items',
  asyncHandler(async (req, res) => {
    const limit = toBoundedInt(req.query.limit, 5, 1, 25);
    const direction = optionalString(req.query.direction) === 'IN' ? 'IN' : 'OUT';

    const grouped = await prisma.transaction.groupBy({
      by: ['itemId', 'itemCode', 'itemName', 'unit'],
      where: { type: direction },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    res.json({
      direction,
      items: grouped.map((row) => ({
        itemId: row.itemId,
        code: row.itemCode,
        name: row.itemName,
        unit: row.unit,
        total: row._sum.quantity ?? 0,
      })),
    });
  })
);

reportsRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const items = await prisma.item.findMany({
      select: { category: true, stock: true, minStock: true },
    });

    const buckets = new Map<string, { category: string; itemCount: number; totalStock: number; lowStock: number }>();

    items.forEach((item) => {
      const bucket =
        buckets.get(item.category) ?? { category: item.category, itemCount: 0, totalStock: 0, lowStock: 0 };
      bucket.itemCount += 1;
      bucket.totalStock += item.stock;
      if (item.stock <= item.minStock) bucket.lowStock += 1;
      buckets.set(item.category, bucket);
    });

    res.json({
      categories: Array.from(buckets.values()).sort((a, b) => b.totalStock - a.totalStock),
    });
  })
);

reportsRouter.get(
  '/low-stock',
  asyncHandler(async (_req, res) => {
    const items = await prisma.item.findMany({ orderBy: { stock: 'asc' } });
    res.json({ items: items.filter((item) => item.stock <= item.minStock) });
  })
);

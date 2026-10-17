import { Router } from 'express';
import type { Prisma } from '../generated/prisma/client.ts';
import { prisma } from '../lib/prisma.ts';
import { HttpError, asyncHandler, optionalString, toBoundedInt } from '../lib/http.ts';
import { requireAuth } from '../lib/auth.ts';
import { firstIssue, transactionSchema } from '../lib/validate.ts';
import { buildTransactionsWorkbook, type TransactionRow } from '../lib/excel.ts';
import { buildNotaPdf, buildTransactionReportPdf, formatDateID } from '../lib/pdf.ts';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

function buildWhere(query: Record<string, unknown>): Prisma.TransactionWhereInput {
  const keyword = optionalString(query.q);
  const type = optionalString(query.type);
  const start = optionalString(query.start);
  const end = optionalString(query.end);

  const where: Prisma.TransactionWhereInput = {};

  if (type === 'IN' || type === 'OUT') where.type = type;

  if (start || end) {
    const dateFilter: Prisma.StringFilter = {};
    if (start) dateFilter.gte = start;
    if (end) dateFilter.lte = end;
    where.date = dateFilter;
  }

  if (keyword) {
    where.OR = [
      { itemCode: { contains: keyword } },
      { itemName: { contains: keyword } },
      { partner: { contains: keyword } },
      { notes: { contains: keyword } },
    ];
  }

  return where;
}

function describePeriod(start?: string, end?: string): string {
  if (start && end) return `${formatDateID(start)} s/d ${formatDateID(end)}`;
  if (start) return `Sejak ${formatDateID(start)}`;
  if (end) return `Sampai ${formatDateID(end)}`;
  return 'Seluruh periode';
}

async function loadTransactions(query: Record<string, unknown>): Promise<TransactionRow[]> {
  const rows = await prisma.transaction.findMany({
    where: buildWhere(query),
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: { createdBy: { select: { name: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    itemCode: row.itemCode,
    itemName: row.itemName,
    unit: row.unit,
    quantity: row.quantity,
    date: row.date,
    partner: row.partner,
    notes: row.notes,
    createdByName: row.createdBy?.name ?? null,
  }));
}

transactionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const limit = toBoundedInt(req.query.limit, 500, 1, 5000);

    const rows = await prisma.transaction.findMany({
      where: buildWhere(req.query as Record<string, unknown>),
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: { createdBy: { select: { id: true, name: true } } },
    });

    const total = await prisma.transaction.count({ where: buildWhere(req.query as Record<string, unknown>) });

    res.json({ transactions: rows, total });
  })
);

transactionsRouter.get(
  '/export',
  asyncHandler(async (req, res) => {
    const rows = await loadTransactions(req.query as Record<string, unknown>);
    if (rows.length === 0) throw new HttpError(404, 'Tidak ada transaksi untuk diekspor.');

    const buffer = await buildTransactionsWorkbook(rows);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="riwayat-transaksi-${new Date().toISOString().slice(0, 10)}.xlsx"`);
    res.send(buffer);
  })
);

transactionsRouter.get(
  '/report.pdf',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, unknown>;
    const rows = await loadTransactions(query);

    const buffer = await buildTransactionReportPdf(rows, {
      period: describePeriod(optionalString(query.start), optionalString(query.end)),
      type: optionalString(query.type) === 'IN' ? 'Barang Masuk' : optionalString(query.type) === 'OUT' ? 'Barang Keluar' : 'Semua jenis',
      keyword: optionalString(query.q),
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="laporan-inventory-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.send(buffer);
  })
);

transactionsRouter.get(
  '/:id/nota.pdf',
  asyncHandler(async (req, res) => {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { createdBy: { select: { name: true } }, item: { select: { stock: true } } },
    });
    if (!transaction) throw new HttpError(404, 'Transaksi tidak ditemukan.');

    const buffer = await buildNotaPdf({
      id: transaction.id,
      type: transaction.type,
      itemCode: transaction.itemCode,
      itemName: transaction.itemName,
      unit: transaction.unit,
      quantity: transaction.quantity,
      date: transaction.date,
      partner: transaction.partner,
      notes: transaction.notes,
      createdByName: transaction.createdBy?.name ?? null,
      stockAfter: transaction.item?.stock,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="nota-${transaction.id}.pdf"`);
    res.send(buffer);
  })
);

transactionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: firstIssue(parsed.error) });
      return;
    }

    const { type, itemId, quantity, date, partner, notes } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } });
      if (!item) throw new HttpError(404, 'Barang tidak ditemukan.');

      if (type === 'OUT' && quantity > item.stock) {
        throw new HttpError(
          400,
          `Stok tidak mencukupi. Stok tersedia hanya ${item.stock} ${item.unit}, diminta ${quantity} ${item.unit}.`
        );
      }

      const newStock = type === 'IN' ? item.stock + quantity : item.stock - quantity;

      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: { stock: newStock },
      });

      const transaction = await tx.transaction.create({
        data: {
          type,
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          unit: item.unit,
          quantity,
          date,
          partner,
          notes,
          createdById: req.user?.id ?? null,
        },
      });

      return { transaction, item: updatedItem };
    });

    res.status(201).json(result);
  })
);

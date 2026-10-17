import 'dotenv/config';
import { prisma } from '../server/lib/prisma.ts';
import { hashPassword } from '../server/lib/auth.ts';

interface SeedItem {
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
}

interface SeedTransaction {
  code: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  partner: string;
  notes: string;
}

const SEED_ITEMS: SeedItem[] = [
  { code: 'BRG-101', name: 'Kabel UTP Cat6 305m', category: 'Kabel & Jaringan', unit: 'Roll', stock: 4, minStock: 8 },
  { code: 'BRG-102', name: 'Router Gigabit Wireless AC1200', category: 'Elektronik & Jaringan', unit: 'Unit', stock: 24, minStock: 10 },
  { code: 'BRG-103', name: 'Kertas HVS A4 80gsm (Box 5 Rim)', category: 'Alat Tulis Kantor (ATK)', unit: 'Box', stock: 3, minStock: 5 },
  { code: 'BRG-104', name: 'Kardus Packing Double Wall 40x30x20', category: 'Packaging & Kemasan', unit: 'Pcs', stock: 120, minStock: 50 },
  { code: 'BRG-105', name: 'Lakban Bening 2 Inch 100 Yard', category: 'Packaging & Kemasan', unit: 'Roll', stock: 6, minStock: 15 },
  { code: 'BRG-106', name: 'Baut Hexagonal M8 x 25mm Stainless', category: 'Sparepart & Hardware', unit: 'Pcs', stock: 350, minStock: 100 },
  { code: 'BRG-107', name: 'Sarung Tangan Kerja Safety Palm Fit', category: 'Perlengkapan K3', unit: 'Pasang', stock: 18, minStock: 25 },
  { code: 'BRG-108', name: 'Toner Cartridge Laser Hitam 85A', category: 'Alat Tulis Kantor (ATK)', unit: 'Unit', stock: 7, minStock: 5 },
];

const SEED_TRANSACTIONS: SeedTransaction[] = [
  { code: 'BRG-102', type: 'IN', quantity: 15, date: '2026-03-11', partner: 'PT Surya Citra Komputindo', notes: 'Penerimaan PO #PO-2026-089' },
  { code: 'BRG-101', type: 'OUT', quantity: 4, date: '2026-03-12', partner: 'Divisi Instalasi Jaringan Cabang', notes: 'Pengadaan proyek server room lantai 2' },
  { code: 'BRG-104', type: 'IN', quantity: 100, date: '2026-03-14', partner: 'CV Mitra Box Kemas Mandiri', notes: 'Restock berkala packaging e-commerce' },
  { code: 'BRG-105', type: 'OUT', quantity: 12, date: '2026-03-15', partner: 'Divisi Ekspedisi Gudang B', notes: 'Kebutuhan packing pesanan mingguan' },
  { code: 'BRG-107', type: 'OUT', quantity: 10, date: '2026-03-16', partner: 'Tim Maintenance Mesin', notes: 'APD bulanan operator gudang' },
  { code: 'BRG-108', type: 'IN', quantity: 5, date: '2026-03-16', partner: 'PT Sumber Office Prima', notes: 'Pengiriman PO #PO-2026-102' },
];

async function main(): Promise<void> {
  console.log('Menjalankan seed GudangFlow...');

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrator Gudang',
      role: 'ADMIN',
      passwordHash: await hashPassword('admin123'),
    },
  });

  await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      name: 'Staf Gudang',
      role: 'STAFF',
      passwordHash: await hashPassword('staff123'),
    },
  });

  const itemCount = await prisma.item.count();
  if (itemCount > 0) {
    console.log(`Data barang sudah ada (${itemCount} baris) - seed data contoh dilewati.`);
    console.log('Selesai.');
    return;
  }

  for (const item of SEED_ITEMS) {
    await prisma.item.create({ data: item });
  }

  for (const trx of SEED_TRANSACTIONS) {
    const item = await prisma.item.findUnique({ where: { code: trx.code } });
    if (!item) continue;

    await prisma.transaction.create({
      data: {
        type: trx.type,
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        unit: item.unit,
        quantity: trx.quantity,
        date: trx.date,
        partner: trx.partner,
        notes: trx.notes,
        createdById: admin.id,
      },
    });
  }

  console.log(`Berhasil membuat ${SEED_ITEMS.length} barang dan ${SEED_TRANSACTIONS.length} transaksi contoh.`);
  console.log('\nAkun demo:');
  console.log('  ADMIN -> username: admin | password: admin123');
  console.log('  STAFF -> username: staff | password: staff123');
  console.log('Selesai.');
}

main()
  .catch((error) => {
    console.error('Seed gagal:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });

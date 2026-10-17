import ExcelJS from 'exceljs';

export interface ItemRow {
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
}

export interface TransactionRow {
  id: string;
  type: string;
  itemCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  date: string;
  partner: string;
  notes: string;
  createdByName?: string | null;
}

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF312E81' },
};

function styleHeader(sheet: ExcelJS.Worksheet, columnCount: number): void {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  header.fill = HEADER_FILL;
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.height = 24;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnCount } };
}

/** Mengubah nilai cell ExcelJS menjadi string yang bersih. */
function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  if (typeof value === 'object') {
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('').trim();
    }
    if ('text' in value && typeof value.text === 'string') return value.text.trim();
    if ('result' in value) return cellToString(value.result as ExcelJS.CellValue);
    if ('hyperlink' in value && typeof value.hyperlink === 'string') return value.hyperlink.trim();
  }

  return String(value).trim();
}

function cellToNumber(value: ExcelJS.CellValue): number {
  const raw = cellToString(value).replace(/\s/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function buildItemsWorkbook(items: ItemRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GudangFlow';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Data Barang');
  sheet.columns = [
    { header: 'Kode Barang', key: 'code', width: 18 },
    { header: 'Nama Barang', key: 'name', width: 44 },
    { header: 'Kategori', key: 'category', width: 28 },
    { header: 'Satuan', key: 'unit', width: 12 },
    { header: 'Stok', key: 'stock', width: 12 },
    { header: 'Stok Minimum', key: 'minStock', width: 16 },
  ];
  styleHeader(sheet, 6);

  items.forEach((item) => {
    const row = sheet.addRow({
      code: item.code,
      name: item.name,
      category: item.category,
      unit: item.unit,
      stock: item.stock,
      minStock: item.minStock,
    });
    row.getCell('stock').numFmt = '#,##0';
    row.getCell('minStock').numFmt = '#,##0';
  });

  sheet.getColumn('stock').alignment = { horizontal: 'right' };
  sheet.getColumn('minStock').alignment = { horizontal: 'right' };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildItemsTemplateWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GudangFlow';
  const sheet = workbook.addWorksheet('Data Barang');

  sheet.columns = [
    { header: 'Kode Barang', key: 'code', width: 18 },
    { header: 'Nama Barang', key: 'name', width: 44 },
    { header: 'Kategori', key: 'category', width: 28 },
    { header: 'Satuan', key: 'unit', width: 12 },
    { header: 'Stok', key: 'stock', width: 12 },
    { header: 'Stok Minimum', key: 'minStock', width: 16 },
  ];
  styleHeader(sheet, 6);

  sheet.addRow({
    code: 'BRG-201',
    name: 'Contoh: Kabel UTP Cat6 305m',
    category: 'Kabel & Jaringan',
    unit: 'Roll',
    stock: 10,
    minStock: 3,
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function buildTransactionsWorkbook(transactions: TransactionRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GudangFlow';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Riwayat Transaksi');
  sheet.columns = [
    { header: 'Tanggal', key: 'date', width: 14 },
    { header: 'Jenis', key: 'type', width: 16 },
    { header: 'Kode Barang', key: 'itemCode', width: 16 },
    { header: 'Nama Barang', key: 'itemName', width: 40 },
    { header: 'Jumlah', key: 'quantity', width: 12 },
    { header: 'Satuan', key: 'unit', width: 10 },
    { header: 'Pemasok / Tujuan', key: 'partner', width: 32 },
    { header: 'Catatan', key: 'notes', width: 34 },
    { header: 'Dicatat Oleh', key: 'createdByName', width: 20 },
  ];
  styleHeader(sheet, 9);

  transactions.forEach((trx) => {
    const row = sheet.addRow({
      date: trx.date,
      type: trx.type === 'IN' ? 'Barang Masuk' : 'Barang Keluar',
      itemCode: trx.itemCode,
      itemName: trx.itemName,
      quantity: trx.type === 'IN' ? trx.quantity : -trx.quantity,
      unit: trx.unit,
      partner: trx.partner,
      notes: trx.notes || '-',
      createdByName: trx.createdByName || '-',
    });
    row.getCell('quantity').numFmt = '#,##0';
  });

  sheet.getColumn('quantity').alignment = { horizontal: 'right' };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function parseItemsWorkbook(buffer: Buffer): Promise<ItemRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error('File Excel tidak memiliki sheet apa pun.');
  }

  const rows: ItemRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const code = cellToString(row.getCell(1).value);
    const name = cellToString(row.getCell(2).value);
    if (!code && !name) return;

    rows.push({
      code,
      name,
      category: cellToString(row.getCell(3).value) || 'Umum',
      unit: cellToString(row.getCell(4).value) || 'Pcs',
      stock: cellToNumber(row.getCell(5).value),
      minStock: cellToNumber(row.getCell(6).value),
    });
  });

  return rows;
}

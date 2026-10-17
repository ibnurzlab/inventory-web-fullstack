import PDFDocument from 'pdfkit';
import type { TransactionRow } from './excel.ts';

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
}

export interface NotaData extends TransactionRow {
  stockAfter?: number;
}

export function getCompanyInfo(): CompanyInfo {
  return {
    name: process.env.COMPANY_NAME ?? 'GudangFlow Warehouse',
    address: process.env.COMPANY_ADDRESS ?? 'Jl. Industri Raya No. 1, Blok C, Jakarta',
    phone: process.env.COMPANY_PHONE ?? '(021) 5550-1234',
  };
}

const PAGE_LEFT = 45;
const PAGE_RIGHT = 550;
const CONTENT_WIDTH = PAGE_RIGHT - PAGE_LEFT;

export function formatDateID(value: string): string {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const index = Number(month) - 1;
  return `${Number(day)} ${bulan[index] ?? month} ${year}`;
}

function renderPdf(build: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: PAGE_LEFT,
      bufferPages: true,
      info: { Title: 'GudangFlow', Author: getCompanyInfo().name },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      build(doc);
      doc.end();
    } catch (error) {
      reject(error as Error);
    }
  });
}

function drawLetterhead(doc: PDFKit.PDFDocument, title: string, subtitle?: string): void {
  const company = getCompanyInfo();

  doc.font('Helvetica-Bold').fontSize(17).fillColor('#111827').text(company.name, { align: 'center' });
  doc.font('Helvetica').fontSize(9).fillColor('#4b5563');
  doc.text(company.address, { align: 'center' });
  doc.text(`Telp. ${company.phone}`, { align: 'center' });
  doc.moveDown(0.8);

  doc
    .moveTo(PAGE_LEFT, doc.y)
    .lineTo(PAGE_RIGHT, doc.y)
    .lineWidth(1.2)
    .strokeColor('#111827')
    .stroke();

  doc.moveDown(1.1);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text(title, { align: 'center' });
  if (subtitle) {
    doc.font('Helvetica').fontSize(9.5).fillColor('#4b5563').text(subtitle, { align: 'center' });
  }
  doc.moveDown(1.4);
  doc.fillColor('#111827');
}

function drawKeyValueRows(
  doc: PDFKit.PDFDocument,
  rows: Array<[string, string]>,
  options: { startY?: number; labelWidth?: number } = {}
): void {
  const labelWidth = options.labelWidth ?? 130;
  let y = options.startY ?? doc.y;

  rows.forEach(([label, value]) => {
    doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text(label, PAGE_LEFT, y, {
      width: labelWidth,
      continued: false,
    });
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(': ' + value, PAGE_LEFT + labelWidth, y, {
      width: CONTENT_WIDTH - labelWidth,
    });
    y = Math.max(doc.y, y + 15);
  });

  doc.y = y;
}

interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

function drawTable(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  rows: string[][],
  startY?: number
): void {
  const rowHeight = 22;
  let y = startY ?? doc.y;
  const totalWidth = columns.reduce((acc, col) => acc + col.width, 0);
  const scale = CONTENT_WIDTH / totalWidth;
  const widths = columns.map((col) => col.width * scale);

  // Header
  doc.rect(PAGE_LEFT, y, CONTENT_WIDTH, rowHeight).fill('#e5e7eb');
  doc.fillColor('#111827').font('Helvetica-Bold').fontSize(9);

  let x = PAGE_LEFT;
  columns.forEach((col, index) => {
    doc.text(col.header, x + 5, y + 7, {
      width: widths[index] - 10,
      align: col.align ?? 'left',
    });
    x += widths[index];
  });

  y += rowHeight;
  doc.font('Helvetica').fontSize(9);

  rows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 1) {
      doc.rect(PAGE_LEFT, y, CONTENT_WIDTH, rowHeight).fill('#f9fafb');
    }

    x = PAGE_LEFT;
    row.forEach((cell, index) => {
      doc.fillColor('#111827').text(cell, x + 5, y + 7, {
        width: widths[index] - 10,
        align: columns[index].align ?? 'left',
        lineBreak: false,
      });
      x += widths[index];
    });

    y += rowHeight;

    if (y > 760) {
      doc.addPage();
      y = PAGE_LEFT + 10;
      doc.font('Helvetica').fontSize(9);
    }
  });

  doc
    .moveTo(PAGE_LEFT, y)
    .lineTo(PAGE_RIGHT, y)
    .lineWidth(1)
    .strokeColor('#9ca3af')
    .stroke();

  doc.y = y + 10;
}

function drawSignatureBlock(doc: PDFKit.PDFDocument, leftLabel: string, rightLabel: string): void {
  const y = Math.max(doc.y + 30, 640);
  doc.font('Helvetica').fontSize(10).fillColor('#374151');

  doc.text(leftLabel, PAGE_LEFT, y, { width: CONTENT_WIDTH / 2 - 20, align: 'center' });
  doc.text(rightLabel, PAGE_LEFT + CONTENT_WIDTH / 2 + 20, y, {
    width: CONTENT_WIDTH / 2 - 20,
    align: 'center',
  });

  doc.text('(...................................)', PAGE_LEFT, y + 70, {
    width: CONTENT_WIDTH / 2 - 20,
    align: 'center',
  });
  doc.text('(...................................)', PAGE_LEFT + CONTENT_WIDTH / 2 + 20, y + 70, {
    width: CONTENT_WIDTH / 2 - 20,
    align: 'center',
  });
}

/** Membuat dokumen bukti penerimaan / surat jalan untuk satu transaksi. */
export function buildNotaPdf(data: NotaData): Promise<Buffer> {
  return renderPdf((doc) => {
    const isIn = data.type === 'IN';
    const title = isIn ? 'BUKTI PENERIMAAN BARANG' : 'SURAT JALAN PENGELUARAN BARANG';
    const prefix = isIn ? 'BPB' : 'SJ';
    const number = `${prefix}/${data.date.replace(/-/g, '')}/${data.id.slice(-6).toUpperCase()}`;

    drawLetterhead(doc, title, `Nomor: ${number}`);

    drawKeyValueRows(doc, [
      ['Tanggal', formatDateID(data.date)],
      [isIn ? 'Pemasok' : 'Tujuan / Penerima', data.partner],
      ['Dicatat oleh', data.createdByName || '-'],
    ]);

    doc.moveDown(1);

    drawTable(
      doc,
      [
        { header: 'Kode Barang', width: 100 },
        { header: 'Nama Barang', width: 240 },
        { header: 'Jumlah', width: 70, align: 'right' },
        { header: 'Satuan', width: 60, align: 'center' },
      ],
      [[data.itemCode, data.itemName, data.quantity.toLocaleString('id-ID'), data.unit]]
    );

    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Catatan / Referensi');
    doc.font('Helvetica').fontSize(9.5).fillColor('#374151').text(data.notes || '-', { width: CONTENT_WIDTH });

    if (typeof data.stockAfter === 'number') {
      doc.moveDown(0.6);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#111827')
        .text(`Stok barang saat ini: ${data.stockAfter.toLocaleString('id-ID')} ${data.unit}`);
    }

    drawSignatureBlock(
      doc,
      isIn ? 'Diserahkan oleh (Pemasok)' : 'Diserahkan oleh (Gudang)',
      isIn ? 'Diterima oleh (Gudang)' : 'Diterima oleh (Penerima)'
    );
  });
}

/** Membuat laporan PDF berisi daftar transaksi. */
export function buildTransactionReportPdf(
  transactions: TransactionRow[],
  filters: { period: string; type: string; keyword?: string }
): Promise<Buffer> {
  return renderPdf((doc) => {
    drawLetterhead(doc, 'LAPORAN MUTASI STOK BARANG', `Dicetak: ${new Date().toLocaleString('id-ID')}`);

    drawKeyValueRows(doc, [
      ['Periode', filters.period],
      ['Jenis Mutasi', filters.type],
      ['Kata Kunci', filters.keyword || '-'],
      ['Jumlah Baris', `${transactions.length} transaksi`],
    ]);

    doc.moveDown(1);

    const totalIn = transactions
      .filter((trx) => trx.type === 'IN')
      .reduce((acc, trx) => acc + trx.quantity, 0);
    const totalOut = transactions
      .filter((trx) => trx.type === 'OUT')
      .reduce((acc, trx) => acc + trx.quantity, 0);

    drawTable(
      doc,
      [
        { header: 'Tanggal', width: 78 },
        { header: 'Jenis', width: 70 },
        { header: 'Kode', width: 76 },
        { header: 'Nama Barang', width: 170 },
        { header: 'Jumlah', width: 62, align: 'right' },
        { header: 'Pemasok / Tujuan', width: 140 },
      ],
      transactions.slice(0, 400).map((trx) => [
        formatDateID(trx.date),
        trx.type === 'IN' ? 'Masuk' : 'Keluar',
        trx.itemCode,
        trx.itemName,
        `${trx.type === 'IN' ? '+' : '-'}${trx.quantity.toLocaleString('id-ID')} ${trx.unit}`,
        trx.partner,
      ])
    );

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827');
    doc.text(`Total barang masuk: +${totalIn.toLocaleString('id-ID')}`);
    doc.text(`Total barang keluar: -${totalOut.toLocaleString('id-ID')}`);
    doc.text(`Selisih bersih: ${(totalIn - totalOut).toLocaleString('id-ID')}`);

    if (transactions.length > 400) {
      doc.moveDown(0.6);
      doc
        .font('Helvetica-Oblique')
        .fontSize(8.5)
        .fillColor('#6b7280')
        .text('Catatan: laporan ini hanya menampilkan 400 transaksi pertama. Persempit filter untuk hasil lengkap.');
    }

    // Nomor halaman
    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page += 1) {
      doc.switchToPage(page);
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#9ca3af')
        .text(
          `Halaman ${page + 1} dari ${range.count}`,
          PAGE_LEFT,
          800,
          { width: CONTENT_WIDTH, align: 'center' }
        );
    }
  });
}

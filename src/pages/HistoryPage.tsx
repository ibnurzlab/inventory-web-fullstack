import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  RotateCcw,
  Printer,
  FileText,
  Loader2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatDateID, formatNumberID } from '../lib/format';
import { TransactionType, TransactionFilters } from '../types/inventory';

export const HistoryPage: React.FC = () => {
  const { transactions, exportTransactions, printReport, printNota, loading } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | TransactionType>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState<'excel' | 'pdf' | string | null>(null);

  const serverFilters: TransactionFilters = useMemo(
    () => ({
      q: searchQuery.trim() || undefined,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      start: startDate || undefined,
      end: endDate || undefined,
    }),
    [searchQuery, typeFilter, startDate, endDate]
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((trx) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        trx.itemCode.toLowerCase().includes(q) ||
        trx.itemName.toLowerCase().includes(q) ||
        trx.partner.toLowerCase().includes(q) ||
        (trx.notes && trx.notes.toLowerCase().includes(q));

      const matchesType = typeFilter === 'ALL' || trx.type === typeFilter;

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && trx.date >= startDate;
      if (endDate) matchesDate = matchesDate && trx.date <= endDate;

      return matchesQuery && matchesType && matchesDate;
    });
  }, [transactions, searchQuery, typeFilter, startDate, endDate]);

  const summary = useMemo(() => {
    let totalInQty = 0;
    let totalOutQty = 0;

    filteredTransactions.forEach((trx) => {
      if (trx.type === 'IN') totalInQty += Number(trx.quantity);
      else totalOutQty += Number(trx.quantity);
    });

    return {
      totalCount: filteredTransactions.length,
      inCount: filteredTransactions.filter((trx) => trx.type === 'IN').length,
      outCount: filteredTransactions.filter((trx) => trx.type === 'OUT').length,
      totalInQty,
      totalOutQty,
    };
  }, [filteredTransactions]);

  const handleResetFilter = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleExportExcel = async () => {
    setBusy('excel');
    await exportTransactions(serverFilters);
    setBusy(null);
  };

  const handlePrintReport = async () => {
    setBusy('pdf');
    await printReport(serverFilters);
    setBusy(null);
  };

  const handlePrintNota = async (id: string) => {
    setBusy(id);
    await printNota(id);
    setBusy(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <History className="w-5 h-5" />
            </span>
            <span>Riwayat Transaksi Inventory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log lengkap pergerakan stok barang masuk (inbound) dan barang keluar (outbound) secara kronologis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => void handleExportExcel()}
            disabled={filteredTransactions.length === 0 || busy !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
          >
            {busy === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
            <span>Ekspor Excel</span>
          </button>
          <button
            onClick={() => void handlePrintReport()}
            disabled={busy !== null}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
          >
            {busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>Cetak Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Mini Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Transaksi</p>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {summary.totalCount} <span className="text-xs font-normal text-slate-500">kali mutasi</span>
          </p>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Akumulasi Barang Masuk</p>
          <p className="text-xl font-bold text-emerald-800 font-mono tabular-nums mt-1">
            +{formatNumberID(summary.totalInQty)}{' '}
            <span className="text-xs font-normal text-emerald-700">({summary.inCount} transaksi)</span>
          </p>
        </div>
        <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 shadow-2xs">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">Akumulasi Barang Keluar</p>
          <p className="text-xl font-bold text-blue-800 font-mono tabular-nums mt-1">
            -{formatNumberID(summary.totalOutQty)}{' '}
            <span className="text-xs font-normal text-blue-700">({summary.outCount} transaksi)</span>
          </p>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode, nama barang, supplier/tujuan..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter('IN')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                typeFilter === 'IN' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTypeFilter('OUT')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                typeFilter === 'OUT' ? 'bg-blue-600 text-white shadow-2xs' : 'text-blue-800 hover:text-blue-900'
              }`}
            >
              Keluar
            </button>
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs font-mono focus:outline-none"
                title="Tanggal Mulai"
              />
            </div>
            <span className="text-slate-400 text-xs">s/d</span>
            <div className="flex-1 flex items-center gap-1.5 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs font-mono focus:outline-none"
                title="Tanggal Akhir"
              />
            </div>
          </div>

          <div className="md:col-span-1 flex items-center">
            <button
              onClick={handleResetFilter}
              className="w-full h-full py-2 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1"
              title="Reset seluruh filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="md:hidden">Reset</span>
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3 h-3" />
          Filter di atas juga dipakai saat mengekspor Excel atau mencetak laporan PDF.
        </p>
      </div>

      {/* Main Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">Tidak ada transaksi yang cocok</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau ubah rentang tanggal yang dipilih.
              </p>
              {(searchQuery || typeFilter !== 'ALL' || startDate || endDate) && (
                <button
                  onClick={handleResetFilter}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Jenis Transaksi</th>
                  <th className="py-3 px-4">Kode &amp; Nama Barang</th>
                  <th className="py-3 px-4 text-right">Jumlah Mutasi</th>
                  <th className="py-3 px-4">Pemasok / Tujuan</th>
                  <th className="py-3 px-4">Catatan / Referensi</th>
                  <th className="py-3 px-4 text-center">Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((trx) => {
                  const isIn = trx.type === 'IN';
                  return (
                    <tr key={trx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-600">
                        {formatDateID(trx.date)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isIn ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-600 rotate-180" />
                            Barang Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                            Barang Keluar
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{trx.itemName}</p>
                        <span className="font-mono text-xs text-slate-400">{trx.itemCode}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono tabular-nums font-bold">
                        <span className={isIn ? 'text-emerald-700 text-sm' : 'text-blue-700 text-sm'}>
                          {isIn ? '+' : '-'}
                          {formatNumberID(trx.quantity)}{' '}
                          <span className="text-xs font-normal text-slate-500">{trx.unit}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-800 font-medium">{trx.partner}</td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">{trx.notes || '-'}</td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => void handlePrintNota(trx.id)}
                          disabled={busy !== null}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                          title={isIn ? 'Cetak bukti penerimaan' : 'Cetak surat jalan'}
                        >
                          {busy === trx.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                          )}
                          <span className="hidden sm:inline">{isIn ? 'Bukti' : 'Surat Jalan'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-semibold text-slate-800">{filteredTransactions.length}</span> transaksi dari{' '}
            <span className="font-semibold text-slate-800">{transactions.length}</span> catatan terbaru
            {loading ? ' (memuat...)' : ''}
          </div>
          <div className="text-slate-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Data tersimpan di database server (SQLite).
          </div>
        </div>
      </div>
    </div>
  );
};

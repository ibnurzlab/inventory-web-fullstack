import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowUpFromDot,
  CheckCircle,
  Building,
  Calendar,
  Package,
  History,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatDateID, todayISO } from '../lib/format';

export const StockOutPage: React.FC = () => {
  const { items, recordStockOut, transactions } = useInventory();
  const [searchParams] = useSearchParams();

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [date, setDate] = useState<string>(todayISO());
  const [quantity, setQuantity] = useState<number | string>('');
  const [partner, setPartner] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pre-select item if itemId query param is provided
  useEffect(() => {
    const paramItemId = searchParams.get('itemId');
    if (paramItemId && items.some((i) => i.id === paramItemId)) {
      setSelectedItemId(paramItemId);
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [searchParams, items, selectedItemId]);

  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || null;
  }, [items, selectedItemId]);

  // Recent 5 Outbound transactions
  const recentOutbound = useMemo(() => {
    return transactions.filter((t) => t.type === 'OUT').slice(0, 5);
  }, [transactions]);

  const parsedQty = Number(quantity) || 0;
  const currentStock = selectedItem ? Number(selectedItem.stock) : 0;
  const minStock = selectedItem ? Number(selectedItem.minStock) : 0;
  const projectedStock = currentStock - parsedQty;
  const isOverStock = selectedItem ? parsedQty > currentStock : false;
  const willBeLowStock = selectedItem ? !isOverStock && projectedStock <= minStock : false;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!selectedItemId) {
      errs.itemId = 'Pilih barang yang akan dikeluarkan.';
    }

    if (!quantity || isNaN(parsedQty) || parsedQty <= 0) {
      errs.quantity = 'Jumlah barang keluar harus angka lebih besar dari 0.';
    } else if (selectedItem && parsedQty > currentStock) {
      errs.quantity = `Stok tidak mencukupi! Tersedia hanya ${currentStock} ${selectedItem.unit}.`;
    }

    if (!partner.trim()) {
      errs.partner = 'Tujuan, divisi, atau nama penerima wajib diisi.';
    }

    if (!date) {
      errs.date = 'Tanggal pengeluaran barang wajib diisi.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const res = await recordStockOut({
      itemId: selectedItemId,
      quantity: parsedQty,
      date,
      partner: partner.trim(),
      notes: notes.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      setSubmittedSuccess(true);
      setQuantity('');
      setNotes('');
      setTimeout(() => setSubmittedSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <ArrowUpFromDot className="w-5 h-5" />
            </span>
            <span>Pencatatan Barang Keluar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Catat pengeluaran barang untuk kebutuhan divisi, proyek, atau customer. Sistem otomatis memvalidasi stok.
          </p>
        </div>
        <Link
          to="/barang"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <span>Periksa Katalog Barang</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Form Input (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Formulir Pengeluaran Barang
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tanggal & Tujuan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Tanggal Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                    errors.date ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.date && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Tujuan / Divisi / Penerima <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  placeholder="Contoh: Divisi Maintenance Mesin"
                  className={`w-full px-3 py-2 text-sm rounded-lg border ${
                    errors.partner ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.partner && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.partner}
                  </p>
                )}
              </div>
            </div>

            {/* Pilih Barang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                Pilih Barang yang Dikeluarkan <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-white ${
                  errors.itemId ? 'border-rose-300' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                {items.length === 0 && <option value="">Belum ada data barang</option>}
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    [{it.code}] {it.name} (Stok Tersedia: {it.stock} {it.unit})
                  </option>
                ))}
              </select>
              {errors.itemId && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.itemId}
                </p>
              )}
            </div>

            {/* Jumlah Keluar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Jumlah Barang Keluar ({selectedItem?.unit || 'Qty'}) <span className="text-rose-500">*</span>
                </label>
                {selectedItem && (
                  <span className="text-xs font-mono text-slate-500">
                    Maksimal tersedia:{' '}
                    <strong className="text-slate-900">{selectedItem.stock} {selectedItem.unit}</strong>
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                step="1"
                max={selectedItem ? selectedItem.stock : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Masukkan kuantitas keluar"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono tabular-nums ${
                  isOverStock || errors.quantity
                    ? 'border-rose-400 bg-rose-50/40 text-rose-900'
                    : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />

              {/* Real-time Over-stock Warning Alert */}
              {isOverStock && (
                <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-800">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Permintaan Melebihi Stok Gudang!</p>
                    <p className="mt-0.5">
                      Stok saat ini hanya <span className="font-mono font-bold">{currentStock} {selectedItem?.unit}</span>, namun Anda meminta <span className="font-mono font-bold">{parsedQty} {selectedItem?.unit}</span>. Transaksi akan ditolak oleh sistem.
                    </p>
                  </div>
                </div>
              )}

              {errors.quantity && !isOverStock && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.quantity}
                </p>
              )}
            </div>

            {/* Catatan / Referensi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Alasan Pengeluaran (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Permintaan internal / Surat Perintah Kerja No #SPK-44"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={items.length === 0 || isOverStock || currentStock <= 0 || submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpFromDot className="w-4 h-4" />}
                <span>{submitting ? 'Menyimpan...' : 'Simpan Barang Keluar'}</span>
              </button>
            </div>
          </form>

          {submittedSuccess && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-800">
              <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Pengeluaran barang berhasil dicatat dan stok gudang berkurang.</span>
            </div>
          )}
        </div>

        {/* Right Side: Stock Simulation & Outbound History (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stock Simulation Preview */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Kalkulasi Sisa Stok
            </h3>

            {selectedItem ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Kode Barang</span>
                    <span className="font-mono font-semibold text-slate-900">
                      {selectedItem.code}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Nama Barang</span>
                    <span className="font-semibold text-slate-900 text-right truncate max-w-[200px]">
                      {selectedItem.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Batas Minimum Stok</span>
                    <span className="font-mono text-slate-700">
                      {selectedItem.minStock} {selectedItem.unit}
                    </span>
                  </div>
                </div>

                {/* Calculation box */}
                <div
                  className={`border rounded-xl p-4 space-y-2.5 text-xs ${
                    isOverStock
                      ? 'border-rose-200 bg-rose-50/50'
                      : willBeLowStock
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-blue-100 bg-blue-50/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Stok Saat Ini:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {currentStock} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-blue-700 font-semibold">
                    <span>Jumlah Keluar (-):</span>
                    <span className="font-mono font-bold tabular-nums">
                      -{parsedQty} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-900">Estimasi Sisa Stok:</span>
                    <span
                      className={`font-mono font-bold tabular-nums text-base ${
                        isOverStock
                          ? 'text-rose-600'
                          : willBeLowStock
                          ? 'text-amber-700'
                          : 'text-blue-700'
                      }`}
                    >
                      {isOverStock ? 'Minus (Ditolak)' : `${projectedStock} ${selectedItem.unit}`}
                    </span>
                  </div>
                </div>

                {/* Proactive Low-Stock Notice if projected stock reaches threshold */}
                {willBeLowStock && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Peringatan: Stok Akan Menipis</p>
                      <p className="text-[11px] mt-0.5">
                        Setelah transaksi ini, sisa stok ({projectedStock} {selectedItem.unit}) akan berada di bawah/pada batas minimum ({minStock} {selectedItem.unit}).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Pilih barang untuk melihat kalkulasi sisa stok.
              </div>
            )}
          </div>

          {/* 5 Outbound transactions summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Pengeluaran Terakhir</span>
              </h3>
              <Link to="/riwayat" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
                Lihat Semua
              </Link>
            </div>

            {recentOutbound.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada transaksi pengeluaran barang.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentOutbound.map((trx) => (
                  <div key={trx.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-[170px]">
                        {trx.itemName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {trx.partner} · {formatDateID(trx.date)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-blue-700 tabular-nums">
                      -{trx.quantity} {trx.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

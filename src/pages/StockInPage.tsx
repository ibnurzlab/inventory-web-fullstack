import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowDownToDot,
  CheckCircle,
  Truck,
  Calendar,
  Package,
  PlusCircle,
  History,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatDateID, todayISO } from '../lib/format';

export const StockInPage: React.FC = () => {
  const { items, recordStockIn, transactions } = useInventory();
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

  // Recent 5 Inbound transactions
  const recentInbound = useMemo(() => {
    return transactions.filter((t) => t.type === 'IN').slice(0, 5);
  }, [transactions]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!selectedItemId) {
      errs.itemId = 'Pilih barang yang akan ditambah stoknya.';
    }

    const qty = Number(quantity);
    if (!quantity || isNaN(qty) || qty <= 0) {
      errs.quantity = 'Jumlah barang masuk harus angka lebih besar dari 0.';
    }

    if (!partner.trim()) {
      errs.partner = 'Nama supplier atau pemasok wajib diisi.';
    }

    if (!date) {
      errs.date = 'Tanggal transaksi wajib diisi.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const res = await recordStockIn({
      itemId: selectedItemId,
      quantity: Number(quantity),
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

  const parsedQty = Number(quantity) || 0;
  const projectedStock = selectedItem ? Number(selectedItem.stock) + parsedQty : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <ArrowDownToDot className="w-5 h-5" />
            </span>
            <span>Pencatatan Barang Masuk</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Input kedatangan stok dari supplier / vendor. Stok fisik barang akan bertambah secara otomatis.
          </p>
        </div>
        <Link
          to="/barang?action=new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-slate-500" />
          <span>Barang Baru Belum Ada?</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Input Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
            Formulir Penerimaan Barang
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tanggal & Pemasok */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Tanggal Penerimaan <span className="text-rose-500">*</span>
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
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Supplier / Pemasok <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  placeholder="Contoh: PT Surya Citra Komputindo"
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
                Pilih Barang <span className="text-rose-500">*</span>
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
                    [{it.code}] {it.name} (Stok Saat Ini: {it.stock} {it.unit})
                  </option>
                ))}
              </select>
              {errors.itemId && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.itemId}
                </p>
              )}
            </div>

            {/* Jumlah Masuk */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Barang Masuk ({selectedItem?.unit || 'Qty'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Masukkan kuantitas masuk (contoh: 20)"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono tabular-nums ${
                  errors.quantity ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
              {errors.quantity && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.quantity}
                </p>
              )}
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Nomor Dokumen (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: No Surat Jalan / PO #PO-2026-99"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={items.length === 0 || submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToDot className="w-4 h-4" />}
                <span>{submitting ? 'Menyimpan...' : 'Simpan Barang Masuk'}</span>
              </button>
            </div>
          </form>

          {submittedSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Transaksi berhasil disimpan dan stok gudang telah diperbarui.</span>
            </div>
          )}
        </div>

        {/* Right Side: Live Calculation & Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Simulation Preview Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Proyeksi Akumulasi Stok
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
                    <span className="text-slate-500">Kategori</span>
                    <span className="text-slate-700">{selectedItem.category}</span>
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="border border-emerald-100 bg-emerald-50/50 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Stok Saat Ini:</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {selectedItem.stock} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Jumlah Masuk (+):</span>
                    <span className="font-mono font-bold tabular-nums">
                      +{parsedQty} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-900">Total Stok Akhir:</span>
                    <span className="font-mono font-bold text-emerald-700 tabular-nums text-base">
                      {projectedStock} {selectedItem.unit}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Perubahan kuantitas langsung berdampak pada seluruh laporan inventory dan dashboard secara seketika.
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                Pilih barang untuk melihat proyeksi stok.
              </div>
            )}
          </div>

          {/* 5 Inbound transactions summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Penerimaan Terakhir</span>
              </h3>
              <Link to="/riwayat" className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
                Lihat Semua
              </Link>
            </div>

            {recentInbound.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada transaksi barang masuk.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentInbound.map((trx) => (
                  <div key={trx.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-900 truncate max-w-[170px]">
                        {trx.itemName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {trx.partner} · {formatDateID(trx.date)}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 tabular-nums">
                      +{trx.quantity} {trx.unit}
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

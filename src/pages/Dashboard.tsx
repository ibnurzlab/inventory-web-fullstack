import React from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Layers,
  AlertTriangle,
  ArrowDownToDot,
  ArrowUpFromDot,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  History,
  CheckCircle,
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { WorkflowGuide } from '../components/dashboard/WorkflowGuide';
import { InlineLoader } from '../components/ui/InlineLoader';
import { formatDateID } from '../lib/format';

export const Dashboard: React.FC = () => {
  const {
    items,
    lowStockItems,
    totalItemsCount,
    totalStockCount,
    recentTransactions,
    loading,
  } = useInventory();

  if (loading && items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <InlineLoader label="Memuat ringkasan gudang..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Ringkasan Inventory Gudang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau pergerakan stok, ketersediaan barang, dan peringatan restock secara langsung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/barang"
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            Lihat Semua Barang
          </Link>
          <Link
            to="/barang-masuk"
            className="px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            Catat Stok Masuk
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Jenis Barang */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Jenis Barang
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalItemsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">Item terdaftar dalam katalog</p>
          </div>
        </div>

        {/* Card 2: Total Akumulasi Stok */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Fisik Stok
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalStockCount.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-slate-500 mt-1">Akumulasi kuantitas seluruh barang</p>
          </div>
        </div>

        {/* Card 3: Barang Stok Menipis */}
        <div
          className={`border rounded-xl p-5 shadow-2xs flex flex-col justify-between ${
            lowStockItems.length > 0
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                lowStockItems.length > 0 ? 'text-amber-800' : 'text-slate-400'
              }`}
            >
              Stok Menipis
            </span>
            <div
              className={`p-2 rounded-lg ${
                lowStockItems.length > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-bold font-mono tabular-nums ${
                lowStockItems.length > 0 ? 'text-amber-900' : 'text-slate-900'
              }`}
            >
              {lowStockItems.length}
            </div>
            <p
              className={`text-xs mt-1 ${
                lowStockItems.length > 0 ? 'text-amber-800 font-medium' : 'text-slate-500'
              }`}
            >
              {lowStockItems.length > 0
                ? 'Item berada pada/di bawah batas minimum!'
                : 'Semua barang dalam batas aman'}
            </p>
          </div>
        </div>

        {/* Card 4: Status Operasional */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Transaksi Terdata
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {recentTransactions.length > 0 ? 'Aktif' : '0'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Audit mutasi inbound & outbound</p>
          </div>
        </div>
      </div>

      {/* Alur Pengguna (Workflow Guide) */}
      <WorkflowGuide />

      {/* 2-Column Section: Low Stock Warnings & Recent 5 Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Barang Stok Menipis */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                Peringatan Stok Menipis
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {lowStockItems.length} Item
            </span>
          </div>

          <div className="p-4 sm:p-5 flex-1 flex flex-col">
            {lowStockItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 px-4">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-800">Semua Stok Aman</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Tidak ada barang yang berada di bawah stok minimum saat ini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 mb-2">
                  Barang berikut memerlukan pengadaan (restock) segera untuk mencegah kekosongan stok gudang:
                </p>
                <div className="divide-y divide-slate-100">
                  {lowStockItems.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {item.code}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500 truncate">{item.category}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate mt-0.5">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <span className="text-rose-600 font-semibold font-mono tabular-nums">
                            Stok: {item.stock} {item.unit}
                          </span>
                          <span className="text-slate-400 font-normal">/</span>
                          <span className="text-slate-500 font-mono tabular-nums">
                            Min: {item.minStock} {item.unit}
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/barang-masuk?itemId=${item.id}`}
                        className="shrink-0 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                        title="Restock barang ini"
                      >
                        <ArrowDownToDot className="w-3.5 h-3.5" />
                        <span>Restock</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/barang"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <span>Kelola Seluruh Master Barang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column (7 Cols): 5 Transaksi Terakhir */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                <History className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">
                5 Transaksi Terakhir
              </h2>
            </div>
            <Link
              to="/riwayat"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Belum ada transaksi tercatat. Mulai dengan mencatat barang masuk atau keluar.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="py-2.5 px-4">Jenis</th>
                    <th className="py-2.5 px-4">Barang</th>
                    <th className="py-2.5 px-4 text-right">Jumlah</th>
                    <th className="py-2.5 px-4">Pemasok / Tujuan</th>
                    <th className="py-2.5 px-4">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTransactions.map((trx) => {
                    const isIn = trx.type === 'IN';
                    return (
                      <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isIn ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <TrendingDown className="w-3 h-3 text-emerald-600 rotate-180" />
                              Masuk
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                              <TrendingUp className="w-3 h-3 text-blue-600" />
                              Keluar
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                            {trx.itemName}
                          </p>
                          <span className="font-mono text-[11px] text-slate-400">
                            {trx.itemCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap font-mono tabular-nums font-semibold">
                          <span className={isIn ? 'text-emerald-700' : 'text-blue-700'}>
                            {isIn ? '+' : '-'}{trx.quantity} {trx.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 truncate max-w-[160px]">
                          {trx.partner}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono">
                          {formatDateID(trx.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowDownToDot,
  ArrowUpFromDot,
  Boxes,
  FileSpreadsheet,
  Upload,
  Download,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Item } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { ItemModal } from '../components/items/ItemModal';
import { InlineLoader } from '../components/ui/InlineLoader';
import { formatNumberID } from '../lib/format';

export const ItemsPage: React.FC = () => {
  const { items, deleteItem, importItems, exportItems, downloadItemTemplate, loading } = useInventory();
  const { isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'LOW' | 'SAFE'>('ALL');
  const [busy, setBusy] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Check URL query param e.g. ?action=new
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setEditingItem(null);
      setModalOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

      const isLow = Number(item.stock) <= Number(item.minStock);
      const matchesStock =
        stockStatusFilter === 'ALL' ||
        (stockStatusFilter === 'LOW' && isLow) ||
        (stockStatusFilter === 'SAFE' && !isLow);

      return matchesQuery && matchesCategory && matchesStock;
    });
  }, [items, searchQuery, selectedCategory, stockStatusFilter]);

  const handleAddNew = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (item: Item) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus "${item.name}" (${item.code})?\nSeluruh riwayat transaksi barang ini juga akan terhapus.`
    );
    if (!confirmed) return;

    setBusy(true);
    await deleteItem(item.id);
    setBusy(false);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    await importItems(file);
    setBusy(false);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setStockStatusFilter('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Data Master Barang</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data katalog barang, satuan, stok aktual, serta batas minimum persediaan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={() => void downloadItemTemplate()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            title="Unduh template Excel untuk import"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            <span>Template</span>
          </button>

          <button
            onClick={() => void exportItems()}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor Excel</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleImportClick}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-60 rounded-lg shadow-2xs transition-colors"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>Import Excel</span>
            </button>
          )}

          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-900">
          <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
          <p className="leading-relaxed">
            <span className="font-semibold">Import Excel:</span> gunakan tombol <span className="font-semibold">Template</span>{' '}
            untuk mengunduh format yang benar. Barang dengan kode yang sudah ada akan <span className="font-semibold">diperbarui</span>,
            sedangkan kode baru akan <span className="font-semibold">ditambahkan</span>.
          </p>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan kode, nama barang, atau kategori..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">Semua Kategori ({categories.length})</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setStockStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              stockStatusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({items.length})
          </button>
          <button
            onClick={() => setStockStatusFilter('LOW')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              stockStatusFilter === 'LOW' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-800 hover:text-amber-900'
            }`}
          >
            Menipis
          </button>
          <button
            onClick={() => setStockStatusFilter('SAFE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              stockStatusFilter === 'SAFE' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:text-emerald-900'
            }`}
          >
            Aman
          </button>
        </div>
      </div>

      {/* Main Items Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          {loading && items.length === 0 ? (
            <InlineLoader label="Memuat data barang..." />
          ) : filteredItems.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">Tidak ada data barang yang cocok</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau ubah filter kategori dan status stok.
              </p>
              {(searchQuery || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL') && (
                <button
                  onClick={resetFilters}
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
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Satuan</th>
                  <th className="py-3 px-4 text-right">Stok Aktual</th>
                  <th className="py-3 px-4 text-right">Stok Min.</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Mutasi Cepat</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = Number(item.stock) <= Number(item.minStock);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${isLow ? 'bg-amber-50/20' : ''}`}>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-slate-900">{item.code}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{item.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">{item.category}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{item.unit}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold">
                        <span className={`text-sm ${isLow ? 'text-amber-800' : 'text-slate-900'}`}>
                          {formatNumberID(item.stock)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-500">
                        {formatNumberID(item.minStock)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-md">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Stok Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <Link
                            to={`/barang-masuk?itemId=${item.id}`}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Catat Stok Masuk"
                          >
                            <ArrowDownToDot className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/barang-keluar?itemId=${item.id}`}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Catat Stok Keluar"
                          >
                            <ArrowUpFromDot className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Ubah Data"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleDelete(item)}
                            disabled={!isAdmin || busy}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                            title={isAdmin ? 'Hapus Barang' : 'Hanya Administrator yang dapat menghapus barang'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
            Menampilkan <span className="font-semibold text-slate-800">{filteredItems.length}</span> dari{' '}
            <span className="font-semibold text-slate-800">{items.length}</span> total barang
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Stok Aman
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Stok Menipis (≤ Batas Min)
            </span>
          </div>
        </div>
      </div>

      <ItemModal isOpen={modalOpen} onClose={() => setModalOpen(false)} itemToEdit={editingItem} />
    </div>
  );
};

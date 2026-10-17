import React, { useState, useEffect } from 'react';
import { Item } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: Item | null;
}

const COMMON_CATEGORIES = [
  'Elektronik & Jaringan',
  'Alat Tulis Kantor (ATK)',
  'Packaging & Kemasan',
  'Sparepart & Hardware',
  'Perlengkapan K3',
  'Bahan Baku',
  'Peralatan Kebersihan',
];

const COMMON_UNITS = ['Pcs', 'Box', 'Roll', 'Unit', 'Rim', 'Kg', 'Pasang', 'Meter', 'Pack'];

export const ItemModal: React.FC<ItemModalProps> = ({ isOpen, onClose, itemToEdit }) => {
  const { addItem, updateItem } = useInventory();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState(COMMON_UNITS[0]);
  const [customUnit, setCustomUnit] = useState('');
  const [stock, setStock] = useState<number | string>(0);
  const [minStock, setMinStock] = useState<number | string>(5);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setCode(itemToEdit.code);
      setName(itemToEdit.name);
      if (COMMON_CATEGORIES.includes(itemToEdit.category)) {
        setCategory(itemToEdit.category);
        setCustomCategory('');
      } else {
        setCategory('Lainnya');
        setCustomCategory(itemToEdit.category);
      }

      if (COMMON_UNITS.includes(itemToEdit.unit)) {
        setUnit(itemToEdit.unit);
        setCustomUnit('');
      } else {
        setUnit('Lainnya');
        setCustomUnit(itemToEdit.unit);
      }

      setStock(itemToEdit.stock);
      setMinStock(itemToEdit.minStock);
    } else {
      // Default reset for new item
      setCode('');
      setName('');
      setCategory(COMMON_CATEGORIES[0]);
      setCustomCategory('');
      setUnit(COMMON_UNITS[0]);
      setCustomUnit('');
      setStock(0);
      setMinStock(5);
    }
    setErrors({});
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Kode barang wajib diisi.';
    }

    if (!name.trim()) {
      newErrors.name = 'Nama barang wajib diisi.';
    }

    const finalCategory = category === 'Lainnya' ? customCategory.trim() : category;
    if (!finalCategory) {
      newErrors.category = 'Kategori barang wajib dipilih/diisi.';
    }

    const finalUnit = unit === 'Lainnya' ? customUnit.trim() : unit;
    if (!finalUnit) {
      newErrors.unit = 'Satuan barang wajib ditentukan.';
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      newErrors.stock = 'Stok tidak boleh bernilai negatif.';
    }

    const numMinStock = Number(minStock);
    if (isNaN(numMinStock) || numMinStock < 0) {
      newErrors.minStock = 'Batas stok minimum tidak boleh negatif.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalCategory = category === 'Lainnya' ? customCategory.trim() : category;
    const finalUnit = unit === 'Lainnya' ? customUnit.trim() : unit;

    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: finalCategory,
      unit: finalUnit,
      stock: Number(stock),
      minStock: Number(minStock),
    };

    setSaving(true);
    let result;
    if (itemToEdit) {
      result = await updateItem(itemToEdit.id, payload);
    } else {
      result = await addItem(payload);
    }
    setSaving(false);

    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {itemToEdit ? 'Ubah Data Barang' : 'Tambah Barang Baru'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {itemToEdit
                ? `Perbarui informasi untuk ${itemToEdit.code}`
                : 'Daftarkan item logistik baru ke master inventory'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Kode & Nama */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kode Barang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="BRG-109"
                className={`w-full px-3 py-2 text-sm rounded-lg border font-mono ${
                  errors.code ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase`}
              />
              {errors.code && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.code}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Barang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Lakban Coklat 2 Inch"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>
          </div>

          {/* Kategori & Satuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Lainnya">+ Kategori Lainnya...</option>
              </select>
              {category === 'Lainnya' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Ketik nama kategori..."
                  className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Satuan Ukuran <span className="text-rose-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
                <option value="Lainnya">+ Satuan Lainnya...</option>
              </select>
              {unit === 'Lainnya' && (
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="Ketik nama satuan..."
                  className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>
          </div>

          {/* Stok Saat Ini & Batas Minimum Stok */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {itemToEdit ? 'Stok Fisik Saat Ini' : 'Stok Awal'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Jumlah stok awal dalam gudang saat barang ini dicatat.
              </p>
              {errors.stock && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.stock}
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Batas Stok Minimum <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-amber-300 bg-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-amber-800/80 mt-1">
                Sistem memberi peringatan jika stok ≤ angka ini.
              </p>
              {errors.minStock && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.minStock}
                </p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : itemToEdit ? 'Simpan Perubahan' : 'Simpan Barang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

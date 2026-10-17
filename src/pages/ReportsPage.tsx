import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Layers,
  Printer,
  TrendingDown,
  TrendingUp,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useInventory } from '../context/InventoryContext';
import { InlineLoader } from '../components/ui/InlineLoader';
import { formatDateShortID, formatNumberID } from '../lib/format';
import type { CategoryStat, ReportSummary, TopItem, TrendPoint } from '../types/inventory';

const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

const ChartTooltip: React.FC<{ active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-slate-900 mb-1">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="text-slate-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}:</span>
          <span className="font-mono font-semibold text-slate-900">{formatNumberID(Number(entry.value ?? 0))}</span>
        </p>
      ))}
    </div>
  );
};

export const ReportsPage: React.FC = () => {
  const { notify, printReport, lowStockItems } = useInventory();

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [direction, setDirection] = useState<'IN' | 'OUT'>('OUT');
  const [printing, setPrinting] = useState(false);

  const loadData = useCallback(
    async (selectedDays: number, selectedDirection: 'IN' | 'OUT') => {
      setLoading(true);
      try {
        const [summaryResult, trendResult, topResult, categoriesResult] = await Promise.all([
          api.reportSummary(),
          api.reportTrend(selectedDays),
          api.reportTopItems(6, selectedDirection),
          api.reportCategories(),
        ]);

        setSummary(summaryResult);
        setTrend(trendResult.trend);
        setTopItems(topResult.items);
        setCategories(categoriesResult.categories);
      } catch (error) {
        notify('error', 'Gagal Memuat Laporan', error instanceof Error ? error.message : 'Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    void loadData(days, direction);
  }, [days, direction, loadData]);

  const trendChartData = useMemo(
    () =>
      trend.map((point) => ({
        label: formatDateShortID(point.date),
        Masuk: point.masuk,
        Keluar: point.keluar,
      })),
    [trend]
  );

  const topChartData = useMemo(
    () =>
      topItems.map((item) => ({
        label: item.name.length > 22 ? `${item.name.slice(0, 22)}...` : item.name,
        fullName: item.name,
        Jumlah: item.total,
      })),
    [topItems]
  );

  const pieData = useMemo(
    () => categories.slice(0, 8).map((entry) => ({ name: entry.category, value: entry.totalStock })),
    [categories]
  );

  const handlePrint = async () => {
    setPrinting(true);
    await printReport({});
    setPrinting(false);
  };

  if (loading && !summary) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs">
        <InlineLoader label="Menghitung laporan..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <span>Laporan &amp; Analitik</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ringkasan performa inventory: tren mutasi stok, barang paling aktif, dan komposisi per kategori.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {[7, 30, 90].map((option) => (
              <button
                key={option}
                onClick={() => setDays(option)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  days === option ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {option} hari
              </button>
            ))}
          </div>
          <button
            onClick={() => void handlePrint()}
            disabled={printing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg shadow-2xs transition-colors"
          >
            {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Jenis Barang</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatNumberID(summary?.totalItems ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Item terdaftar dalam katalog</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Fisik Stok</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatNumberID(summary?.totalStock ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Akumulasi kuantitas seluruh barang</p>
        </div>

        <div
          className={`border rounded-xl p-5 shadow-2xs ${
            (summary?.lowStockItems ?? 0) > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                (summary?.lowStockItems ?? 0) > 0 ? 'text-amber-800' : 'text-slate-400'
              }`}
            >
              Stok Menipis
            </span>
            <div
              className={`p-2 rounded-lg ${
                (summary?.lowStockItems ?? 0) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold font-mono tabular-nums ${
              (summary?.lowStockItems ?? 0) > 0 ? 'text-amber-900' : 'text-slate-900'
            }`}
          >
            {formatNumberID(summary?.lowStockItems ?? 0)}
          </div>
          <p className={`text-xs mt-1 ${(summary?.lowStockItems ?? 0) > 0 ? 'text-amber-800 font-medium' : 'text-slate-500'}`}>
            {(summary?.lowStockItems ?? 0) > 0 ? 'Perlu segera di-restock' : 'Semua barang dalam batas aman'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Mutasi</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatNumberID(summary?.totalTransactions ?? 0)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">+{formatNumberID(summary?.totalIn ?? 0)}</span> masuk ·{' '}
            <span className="text-blue-700 font-semibold">-{formatNumberID(summary?.totalOut ?? 0)}</span> keluar
          </p>
        </div>
      </div>

      {/* Trend + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tren Mutasi Stok</h2>
              <p className="text-xs text-slate-500 mt-0.5">Perbandingan barang masuk dan keluar, {days} hari terakhir</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Masuk
              </span>
              <span className="inline-flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Keluar
              </span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradKeluar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Masuk"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradMasuk)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="Keluar"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#gradKeluar)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Komposisi Stok per Kategori</h2>
            <p className="text-xs text-slate-500 mt-0.5">Proporsi kuantitas stok saat ini</p>
          </div>

          {pieData.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">Belum ada data kategori.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) =>
                      value.length > 20 ? `${value.slice(0, 20)}...` : value
                    }
                    wrapperStyle={{ fontSize: 11, color: '#64748b' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top items + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Barang Paling Aktif</h2>
              <p className="text-xs text-slate-500 mt-0.5">6 barang dengan volume mutasi terbesar</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              <button
                onClick={() => setDirection('OUT')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  direction === 'OUT' ? 'bg-blue-600 text-white shadow-2xs' : 'text-blue-800 hover:text-blue-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Keluar
              </button>
              <button
                onClick={() => setDirection('IN')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  direction === 'IN' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-800 hover:text-emerald-900'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 rotate-180" />
                Masuk
              </button>
            </div>
          </div>

          {topChartData.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">Belum ada data transaksi untuk dianalisis.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Jumlah" fill={direction === 'IN' ? '#10b981' : '#3b82f6'} radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-700 rounded-md">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900">Perlu Restock</h2>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {lowStockItems.length} Item
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-80">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-400 py-12 text-center">Semua stok dalam batas aman.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        <span className="font-mono">{item.code}</span> · {item.category}
                      </p>
                      <p className="text-xs mt-0.5">
                        <span className="text-rose-600 font-semibold font-mono">
                          {formatNumberID(item.stock)} {item.unit}
                        </span>
                        <span className="text-slate-400"> / min </span>
                        <span className="text-slate-500 font-mono">
                          {formatNumberID(item.minStock)} {item.unit}
                        </span>
                      </p>
                    </div>
                    <Link
                      to={`/barang-masuk?itemId=${item.id}`}
                      className="shrink-0 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    >
                      Restock
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/barang"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
            >
              <span>Kelola Master Barang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

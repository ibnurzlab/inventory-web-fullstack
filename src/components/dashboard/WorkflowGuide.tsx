import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ArrowDownToDot, ArrowUpFromDot, History, ArrowRight } from 'lucide-react';

export const WorkflowGuide: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Tambah Data Barang',
      desc: 'Daftarkan barang baru beserta kode, kategori, satuan, dan batas minimum stok.',
      linkTo: '/barang?action=new',
      actionText: 'Kelola Barang',
      icon: PlusCircle,
      accent: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      step: '02',
      title: 'Catat Barang Masuk',
      desc: 'Input stok masuk dari pemasok/supplier. Sistem otomatis menambah jumlah stok fisik.',
      linkTo: '/barang-masuk',
      actionText: 'Catat Masuk',
      icon: ArrowDownToDot,
      accent: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      step: '03',
      title: 'Catat Barang Keluar',
      desc: 'Keluarkan barang ke divisi/tujuan. Sistem memvalidasi dan menolak bila stok tidak cukup.',
      linkTo: '/barang-keluar',
      actionText: 'Catat Keluar',
      icon: ArrowUpFromDot,
      accent: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      step: '04',
      title: 'Pantau & Riwayat',
      desc: 'Pantau stok yang menipis di Dashboard dan audit seluruh riwayat mutasi transaksi.',
      linkTo: '/riwayat',
      actionText: 'Lihat Riwayat',
      icon: History,
      accent: 'text-amber-600 bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-8 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Alur Operasional Gudang
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Panduan 4 langkah mudah mencatat mutasi dan menjaga akurasi inventory gudang
          </p>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Langkah Mandiri Staf Gudang
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="relative p-4 rounded-lg border border-slate-150 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    {item.step}
                  </span>
                  <div className={`p-2 rounded-lg border ${item.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>

              <Link
                to={item.linkTo}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors pt-2 border-t border-slate-200/60"
              >
                <span>{item.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

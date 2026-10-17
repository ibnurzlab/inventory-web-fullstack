import React from 'react';
import { Loader2, Warehouse } from 'lucide-react';

interface FullPageLoaderProps {
  message?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({ message = 'Memuat data...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-600">
      <div className="flex items-center gap-2.5 text-slate-900">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <Warehouse className="w-5 h-5" />
        </div>
        <span className="font-bold tracking-tight">GudangFlow</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
};

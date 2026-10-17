import React from 'react';
import { Warehouse, Loader2 } from 'lucide-react';

export const InlineLoader: React.FC<{ label?: string }> = ({ label = 'Memuat...' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>{label}</span>
  </div>
);

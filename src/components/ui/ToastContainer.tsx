import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useInventory();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {notifications.map((notif) => {
        let borderClass = 'border-slate-200';
        let bgClass = 'bg-white';
        let icon = <Info className="w-5 h-5 text-sky-600 shrink-0" />;

        if (notif.type === 'success') {
          borderClass = 'border-emerald-200';
          bgClass = 'bg-emerald-50/95';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (notif.type === 'error') {
          borderClass = 'border-rose-200';
          bgClass = 'bg-rose-50/95';
          icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
        } else if (notif.type === 'warning') {
          borderClass = 'border-amber-200';
          bgClass = 'bg-amber-50/95';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
        }

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-200 ${bgClass} ${borderClass}`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{icon}</div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-slate-900">{notif.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notif.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

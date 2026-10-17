import React, { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, PlusCircle, ArrowDownToDot, ArrowUpFromDot, ChevronDown, LogOut, UserCog, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return { title: 'Dashboard Gudang', crumb: 'Ringkasan Aktivitas' };
      case '/barang':
        return { title: 'Data Master Barang', crumb: 'Katalog & Stok' };
      case '/barang-masuk':
        return { title: 'Pencatatan Barang Masuk', crumb: 'Inbound Warehouse' };
      case '/barang-keluar':
        return { title: 'Pencatatan Barang Keluar', crumb: 'Outbound Warehouse' };
      case '/riwayat':
        return { title: 'Riwayat Transaksi', crumb: 'Audit Log & Ekspor' };
      case '/laporan':
        return { title: 'Laporan & Analitik', crumb: 'Insight Inventory' };
      case '/pengguna':
        return { title: 'Manajemen Pengguna', crumb: 'Hak Akses & Akun' };
      case '/profil':
        return { title: 'Profil Saya', crumb: 'Keamanan Akun' };
      default:
        return { title: 'GudangFlow', crumb: 'Manajemen Inventory' };
    }
  };

  const current = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none shrink-0"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
          <span className="font-semibold text-slate-900 text-sm sm:text-base tracking-tight truncate">
            {current.title}
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span className="hidden sm:inline text-slate-500 font-medium truncate">{current.crumb}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link
          to="/barang-masuk"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <ArrowDownToDot className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Catat</span> Masuk
        </Link>
        <Link
          to="/barang-keluar"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
        >
          <ArrowUpFromDot className="w-4 h-4 text-blue-600" />
          <span className="hidden sm:inline">Catat</span> Keluar
        </Link>
        <Link
          to="/barang?action=new"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Barang
        </Link>

        {/* Menu pengguna */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {(user?.name ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <span className="hidden lg:block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
              {user?.name ?? '-'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">@{user?.username}</p>
                <span
                  className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                    isAdmin
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="w-3 h-3" /> : null}
                  {isAdmin ? 'Administrator' : 'Staf Gudang'}
                </span>
              </div>
              <Link
                to="/profil"
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserCog className="w-4 h-4 text-slate-400" />
                Profil & Ganti Password
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

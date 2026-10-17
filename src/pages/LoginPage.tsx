import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Loader2, Lock, LogIn, User as UserIcon, Warehouse, ShieldCheck, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: 'ADMIN' | 'STAFF') => {
    setUsername(role === 'ADMIN' ? 'admin' : 'staff');
    setPassword(role === 'ADMIN' ? 'admin123' : 'staff123');
    setError('');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      {/* Panel kiri: branding */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-900 text-slate-200 p-12 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-lg text-white leading-tight tracking-tight">GudangFlow</p>
            <p className="text-xs text-slate-400">Sistem Manajemen Inventory Gudang</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold text-white leading-snug tracking-tight">
            Kelola stok gudang dengan data yang selalu akurat.
          </h1>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed">
            Pencatatan barang masuk dan keluar, peringatan stok menipis, laporan analitik, hingga cetak surat jalan —
            semuanya dalam satu aplikasi terpusat.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Stok tersimpan di database, bukan lagi di browser',
              'Hak akses terpisah untuk Admin dan Staf Gudang',
              'Laporan Excel & PDF siap cetak',
            ].map((line) => (
              <div key={line} className="flex items-start gap-2.5 text-sm text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} GudangFlow</p>
      </div>

      {/* Panel kanan: form login */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight">GudangFlow</p>
              <p className="text-xs text-slate-500">Inventory Management</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Masuk ke akun Anda</h2>
          <p className="text-sm text-slate-500 mt-1.5">Gunakan akun yang terdaftar untuk mengakses dashboard gudang.</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{submitting ? 'Memproses...' : 'Masuk'}</span>
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl border border-slate-200 bg-white">
            <p className="text-xs font-semibold text-slate-700 mb-2.5">Akun demo (hasil seed)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('ADMIN')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('STAFF')}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <UserCog className="w-3.5 h-3.5" />
                Staf
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
              Admin: <span className="font-mono">admin / admin123</span>
              <br />
              Staf: <span className="font-mono">staff / staff123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

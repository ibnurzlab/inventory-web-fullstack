import React, { useState } from 'react';
import { KeyRound, Loader2, ShieldCheck, UserCog, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { formatDateTimeID } from '../lib/format';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { notify } = useInventory();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Semua kolom password wajib diisi.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    setSaving(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      notify('success', 'Password Diperbarui', 'Password akun Anda berhasil diganti.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengganti password.';
      setError(message);
      notify('error', 'Gagal Ganti Password', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <UserIcon className="w-5 h-5" />
          </span>
          <span>Profil &amp; Keamanan Akun</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Informasi akun yang sedang aktif dan pengaturan password Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs h-fit">
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
              {(user?.name ?? '?').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 font-mono truncate">@{user?.username}</p>
              <span
                className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  isAdmin
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <UserCog className="w-3 h-3" />}
                {isAdmin ? 'Administrator' : 'Staf Gudang'}
              </span>
            </div>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Username</dt>
              <dd className="font-mono font-semibold text-slate-900">{user?.username}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Hak akses</dt>
              <dd className="font-semibold text-slate-900">
                {isAdmin ? 'Kelola barang, pengguna & laporan' : 'Catat mutasi stok & lihat laporan'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Status akun</dt>
              <dd className="font-semibold text-emerald-700">Aktif</dd>
            </div>
            {user?.createdAt && (
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Dibuat pada</dt>
                <dd className="text-slate-700">{formatDateTimeID(user.createdAt)}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-800 mb-1">Catatan hak akses</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <span className="font-semibold">Administrator</span>: tambah/ubah/hapus barang, import Excel, kelola
                pengguna.
              </li>
              <li>
                <span className="font-semibold">Staf Gudang</span>: catat barang masuk/keluar, lihat laporan, dan cetak
                dokumen.
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" />
            Ganti Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password Saat Ini</label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password Baru</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="minimal 6 karakter"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Password Baru</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ulangi password baru"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{saving ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

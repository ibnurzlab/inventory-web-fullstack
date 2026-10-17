import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  UserCog,
  Trash2,
  KeyRound,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useInventory } from '../context/InventoryContext';
import { InlineLoader } from '../components/ui/InlineLoader';
import { formatDateID } from '../lib/format';
import type { User } from '../types/inventory';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { notify } = useInventory();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.listUsers();
      setUsers(result.users);
    } catch (error) {
      notify('error', 'Gagal Memuat Pengguna', error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!username.trim() || !name.trim() || !password) {
      setFormError('Username, nama lengkap, dan password wajib diisi.');
      return;
    }

    setCreating(true);
    try {
      await api.createUser({ username: username.trim(), name: name.trim(), password, role });
      notify('success', 'Pengguna Dibuat', `Akun "${username.trim()}" berhasil ditambahkan.`);
      setUsername('');
      setName('');
      setPassword('');
      setRole('STAFF');
      await loadUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal membuat pengguna.';
      setFormError(message);
      notify('error', 'Gagal Membuat Pengguna', message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (target: User) => {
    setBusyId(target.id);
    try {
      await api.updateUser(target.id, { active: !target.active });
      notify('info', 'Status Diperbarui', `Akun "${target.username}" ${target.active ? 'dinonaktifkan' : 'diaktifkan'}.`);
      await loadUsers();
    } catch (error) {
      notify('error', 'Gagal Memperbarui', error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeRole = async (target: User, nextRole: 'ADMIN' | 'STAFF') => {
    setBusyId(target.id);
    try {
      await api.updateUser(target.id, { role: nextRole });
      notify('info', 'Peran Diperbarui', `Peran "${target.username}" kini ${nextRole === 'ADMIN' ? 'Administrator' : 'Staf Gudang'}.`);
      await loadUsers();
    } catch (error) {
      notify('error', 'Gagal Memperbarui', error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (target: User) => {
    const nextPassword = window.prompt(`Masukkan password baru untuk "${target.username}" (minimal 6 karakter):`);
    if (nextPassword === null) return;

    if (nextPassword.length < 6) {
      notify('error', 'Password Terlalu Pendek', 'Password minimal 6 karakter.');
      return;
    }

    setBusyId(target.id);
    try {
      await api.updateUser(target.id, { password: nextPassword });
      notify('success', 'Password Direset', `Password "${target.username}" berhasil diperbarui.`);
    } catch (error) {
      notify('error', 'Gagal Reset Password', error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (target: User) => {
    const confirmed = window.confirm(`Hapus akun "${target.username}"? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;

    setBusyId(target.id);
    try {
      await api.deleteUser(target.id);
      notify('info', 'Pengguna Dihapus', `Akun "${target.username}" telah dihapus.`);
      await loadUsers();
    } catch (error) {
      notify('error', 'Gagal Menghapus', error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </span>
          <span>Manajemen Pengguna</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Kelola akun dan hak akses. Administrator dapat mengubah data barang dan pengguna, staf hanya mencatat mutasi stok.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form tambah pengguna */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs h-fit">
          <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            Tambah Pengguna Baru
          </h2>

          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: budi.gudang"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Budi Santoso"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="minimal 6 karakter"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Peran</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'STAFF')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="STAFF">Staf Gudang (STAFF)</option>
                <option value="ADMIN">Administrator (ADMIN)</option>
              </select>
            </div>

            {formError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>{creating ? 'Menyimpan...' : 'Simpan Pengguna'}</span>
            </button>
          </form>
        </div>

        {/* Daftar pengguna */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Daftar Akun</h2>
            <span className="text-xs text-slate-500">{users.length} pengguna</span>
          </div>

          {loading && users.length === 0 ? (
            <InlineLoader label="Memuat daftar pengguna..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Dibuat</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((entry) => {
                    const isSelf = entry.id === currentUser?.id;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                              {entry.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {entry.name}
                                {isSelf && <span className="ml-1.5 text-[11px] font-normal text-indigo-600">(Anda)</span>}
                              </p>
                              <p className="text-xs text-slate-500 font-mono truncate">@{entry.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <select
                            value={entry.role}
                            onChange={(e) => void handleChangeRole(entry, e.target.value as 'ADMIN' | 'STAFF')}
                            disabled={isSelf || busyId === entry.id}
                            className="px-2 py-1 text-xs rounded-md border border-slate-300 bg-white disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="ADMIN">Administrator</option>
                            <option value="STAFF">Staf Gudang</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4">
                          {entry.active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                              <XCircle className="w-3.5 h-3.5 text-slate-500" />
                              Nonaktif
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateID(entry.createdAt.slice(0, 10))}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <button
                              onClick={() => void handleResetPassword(entry)}
                              disabled={busyId === entry.id}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-40 rounded-md transition-colors"
                              title="Reset password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => void handleToggleActive(entry)}
                              disabled={isSelf || busyId === entry.id}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                              title={entry.active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                            >
                              {entry.active ? <UserCog className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => void handleDelete(entry)}
                              disabled={isSelf || busyId === entry.id}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-md transition-colors"
                              title="Hapus akun"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

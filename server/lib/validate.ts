import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

export const itemSchema = z.object({
  code: z.string().trim().min(1, 'Kode barang wajib diisi.'),
  name: z.string().trim().min(1, 'Nama barang wajib diisi.'),
  category: z.string().trim().default('Umum'),
  unit: z.string().trim().default('Pcs'),
  stock: z.coerce.number().int('Stok harus bilangan bulat.').min(0, 'Stok tidak boleh negatif.'),
  minStock: z
    .coerce.number()
    .int('Stok minimum harus bilangan bulat.')
    .min(0, 'Stok minimum tidak boleh negatif.'),
});

export const transactionSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  itemId: z.string().min(1, 'Barang wajib dipilih.'),
  quantity: z.coerce
    .number()
    .int('Jumlah harus bilangan bulat.')
    .positive('Jumlah harus lebih besar dari 0.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD.'),
  partner: z.string().trim().min(1, 'Pemasok / tujuan wajib diisi.'),
  notes: z.string().trim().default(''),
});

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter.')
    .max(32, 'Username maksimal 32 karakter.')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username hanya boleh huruf, angka, titik, underscore, dan strip.'),
  name: z.string().trim().min(1, 'Nama lengkap wajib diisi.'),
  password: z.string().min(6, 'Password minimal 6 karakter.'),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).optional(),
  password: z.string().min(6, 'Password minimal 6 karakter.').optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  active: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi.'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter.'),
});

/** Mengambil pesan error pertama dari hasil validasi Zod. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Data yang dikirim tidak valid.';
}

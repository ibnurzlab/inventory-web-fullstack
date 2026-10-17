import { Router } from 'express';
import { prisma } from '../lib/prisma.ts';
import { HttpError, asyncHandler } from '../lib/http.ts';
import {
  comparePassword,
  hashPassword,
  requireAuth,
  requireRole,
  signToken,
  type AuthUser,
  type Role,
} from '../lib/auth.ts';
import { changePasswordSchema, createUserSchema, firstIssue, loginSchema, updateUserSchema } from '../lib/validate.ts';

export const authRouter = Router();

interface UserLike {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: Date;
}

function toPublicUser(user: UserLike) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: firstIssue(parsed.error) });
      return;
    }

    const username = parsed.data.username.toLowerCase();
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.active) {
      res.status(401).json({ message: 'Username atau password salah.' });
      return;
    }

    const isValid = await comparePassword(parsed.data.password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ message: 'Username atau password salah.' });
      return;
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role as Role,
    };

    res.json({ token: signToken(authUser), user: toPublicUser(user) });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(404, 'Pengguna tidak ditemukan.');
    res.json({ user: toPublicUser(user) });
  })
);

authRouter.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: firstIssue(parsed.error) });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(404, 'Pengguna tidak ditemukan.');

    const isValid = await comparePassword(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) throw new HttpError(400, 'Password saat ini tidak sesuai.');

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
    });

    res.json({ message: 'Password berhasil diperbarui.' });
  })
);

authRouter.get(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ users: users.map(toPublicUser) });
  })
);

authRouter.post(
  '/users',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: firstIssue(parsed.error) });
      return;
    }

    const username = parsed.data.username.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new HttpError(409, `Username "${username}" sudah digunakan.`);

    const user = await prisma.user.create({
      data: {
        username,
        name: parsed.data.name,
        role: parsed.data.role,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });

    res.status(201).json({ user: toPublicUser(user) });
  })
);

authRouter.put(
  '/users/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: firstIssue(parsed.error) });
      return;
    }

    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw new HttpError(404, 'Pengguna tidak ditemukan.');

    const data: {
      name?: string;
      role?: string;
      active?: boolean;
      passwordHash?: string;
    } = {};

    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.role !== undefined) data.role = parsed.data.role;
    if (parsed.data.active !== undefined) data.active = parsed.data.active;
    if (parsed.data.password !== undefined) data.passwordHash = await hashPassword(parsed.data.password);

    if (data.role !== undefined && target.id === req.user!.id && data.role !== 'ADMIN') {
      throw new HttpError(400, 'Anda tidak dapat menurunkan peran akun Anda sendiri.');
    }

    if (data.active === false && target.id === req.user!.id) {
      throw new HttpError(400, 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
    }

    const user = await prisma.user.update({ where: { id: target.id }, data });
    res.json({ user: toPublicUser(user) });
  })
);

authRouter.delete(
  '/users/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) throw new HttpError(404, 'Pengguna tidak ditemukan.');
    if (target.id === req.user!.id) throw new HttpError(400, 'Anda tidak dapat menghapus akun Anda sendiri.');

    await prisma.user.delete({ where: { id: target.id } });
    res.json({ message: `Pengguna "${target.username}" berhasil dihapus.` });
  })
);

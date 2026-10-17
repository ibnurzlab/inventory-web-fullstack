import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type Role = 'ADMIN' | 'STAFF';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET: string = process.env.JWT_SECRET ?? 'gudangflow-dev-secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN ?? '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser): string {
  const options = { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions;
  return jwt.sign(
    { sub: user.id, username: user.username, name: user.name, role: user.role },
    JWT_SECRET,
    options
  );
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;

  if (!token) {
    res.status(401).json({ message: 'Sesi tidak ditemukan. Silakan login kembali.' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    req.user = {
      id: String(payload.sub ?? ''),
      username: String(payload.username ?? ''),
      name: String(payload.name ?? ''),
      role: (payload.role as Role) ?? 'STAFF',
    };
    next();
  } catch {
    res.status(401).json({ message: 'Sesi sudah tidak valid. Silakan login kembali.' });
  }
};

export function requireRole(...roles: Role[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      res.status(403).json({ message: 'Anda tidak memiliki hak akses untuk aksi ini.' });
      return;
    }
    next();
  };
}

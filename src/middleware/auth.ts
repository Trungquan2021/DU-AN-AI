import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';

const SESSION_SECRET = process.env.SESSION_SECRET || 'bluespace-community-secret-key-2026';

export interface AuthTokenPayload {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AuthRequest extends Request {
  user?: AuthTokenPayload;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, key] = parts;
  const derivedBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  if (derivedBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(derivedBuffer, keyBuffer);
}

export function signSessionToken(payload: AuthTokenPayload): string {
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14 days
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  return `local.${data}.${signature}`;
}

export function verifySessionToken(token: string): AuthTokenPayload | null {
  if (!token.startsWith('local.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(data)
    .digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return {
      uid: parsed.uid,
      email: parsed.email,
      name: parsed.name,
      picture: parsed.picture,
    };
  } catch {
    return null;
  }
}

export async function verifyAnyToken(token: string): Promise<AuthTokenPayload | null> {
  if (!token) return null;
  if (token.startsWith('local.')) {
    return verifySessionToken(token);
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@bluespace.vn`,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  const verified = await verifyAnyToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  req.user = verified;
  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const verified = await verifyAnyToken(token);
    if (verified) {
      req.user = verified;
    }
  }
  next();
};

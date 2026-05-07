import jwt from 'jsonwebtoken';
import { prisma } from '../app';
import crypto from 'crypto';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

/** Generates a short-lived JWT access token (15 minutes). */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

/** Generates and persists a long-lived refresh token (7 days). */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  await prisma.refreshToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
};

/** Verifies an access token and returns its payload. */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
};

/** Verifies and rotates a refresh token — old token is deleted, new pair issued. */
export const rotateRefreshToken = async (
  oldToken: string
): Promise<{ accessToken: string; refreshToken: string; payload: TokenPayload }> => {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: { select: { id: true, email: true, role: true, isActive: true } } },
  });

  if (!stored || stored.expiresAt < new Date()) {
    // Invalidate all tokens for this user if token is expired/invalid (security measure)
    if (stored) {
      await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });
    }
    throw new Error('Invalid or expired refresh token');
  }

  if (!stored.user.isActive) {
    throw new Error('User account is deactivated');
  }

  // Delete the old token (rotation)
  await prisma.refreshToken.delete({ where: { token: oldToken } });

  const payload: TokenPayload = {
    id: stored.user.id,
    email: stored.user.email,
    role: stored.user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(stored.userId);

  return { accessToken, refreshToken, payload };
};

/** Invalidates a specific refresh token on logout. */
export const invalidateRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

/** Signs a JWT refresh token string for cookie (wraps raw token). */
export const signRefreshTokenCookie = (token: string): string => {
  return jwt.sign({ token }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

/** Verifies the refresh token cookie and extracts the raw token. */
export const verifyRefreshTokenCookie = (cookie: string): string => {
  const payload = jwt.verify(cookie, REFRESH_TOKEN_SECRET) as { token: string };
  return payload.token;
};

import bcrypt from 'bcrypt';
import { prisma } from '../app';
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  invalidateRefreshToken,
  TokenPayload,
} from '../utils/jwt';
import { createError } from '../middlewares/errorHandler.middleware';
import { z } from 'zod';

const BCRYPT_ROUNDS = 12;

// ─── Validation Schemas ───────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

// ─── Auth Service ─────────────────────────────────────────────────────────────

/**
 * Registers a new user. Throws if email already exists.
 */
export const registerUser = async (data: z.infer<typeof registerSchema>) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    throw createError('Email already in use', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, createdAt: true },
  });

  // Create empty cart for the user
  await prisma.cart.create({ data: { userId: user.id } });

  const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(user.id);

  return { user, accessToken, refreshToken };
};

/**
 * Authenticates a user with email and password.
 */
export const loginUser = async (data: z.infer<typeof loginSchema>) => {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user || !user.isActive) {
    throw createError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(user.id);

  const { passwordHash: _, ...safeUser } = user;

  return { user: safeUser, accessToken, refreshToken };
};

/**
 * Rotates the refresh token and issues a new access + refresh pair.
 */
export const refreshTokens = async (token: string) => {
  return rotateRefreshToken(token);
};

/**
 * Invalidates the refresh token on logout.
 */
export const logoutUser = async (token: string) => {
  await invalidateRefreshToken(token);
};

/**
 * Returns the authenticated user's profile.
 */
export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      addresses: true,
    },
  });

  if (!user) throw createError('User not found', 404);
  return user;
};

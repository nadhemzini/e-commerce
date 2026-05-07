import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  registerSchema,
  loginSchema,
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  getMe,
} from '../services/auth.service';
import { verifyRefreshTokenCookie, signRefreshTokenCookie } from '../utils/jwt';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/** POST /api/auth/register */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await registerUser(data);

    res.cookie('refreshToken', signRefreshTokenCookie(refreshToken), COOKIE_OPTIONS);
    res.status(201).json({ success: true, data: { user, accessToken } });
  } catch (error) {
    next(error);
  }
};

/** POST /api/auth/login */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await loginUser(data);

    res.cookie('refreshToken', signRefreshTokenCookie(refreshToken), COOKIE_OPTIONS);
    res.json({ success: true, data: { user, accessToken } });
  } catch (error) {
    next(error);
  }
};

/** POST /api/auth/refresh */
export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cookieToken = req.cookies?.refreshToken;
    if (!cookieToken) {
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }

    const rawToken = verifyRefreshTokenCookie(cookieToken);
    const { accessToken, refreshToken } = await refreshTokens(rawToken);

    res.cookie('refreshToken', signRefreshTokenCookie(refreshToken), COOKIE_OPTIONS);
    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

/** POST /api/auth/logout */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cookieToken = req.cookies?.refreshToken;
    if (cookieToken) {
      try {
        const rawToken = verifyRefreshTokenCookie(cookieToken);
        await logoutUser(rawToken);
      } catch {
        // Ignore token verification errors on logout
      }
    }

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

/** GET /api/auth/me */
export const me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getMe(req.user!.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

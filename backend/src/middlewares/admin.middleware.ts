import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Verifies that the authenticated user has the ADMIN role.
 * Must be used after authMiddleware.
 */
export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }

  next();
};

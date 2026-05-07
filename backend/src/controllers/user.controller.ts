import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../app';
import { createError } from '../middlewares/errorHandler.middleware';

/** GET /api/users [ADMIN] */
export const listUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true,
        _count: { select: { orders: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/** GET /api/users/:id [ADMIN] */
export const getUserDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, createdAt: true,
        orders: { orderBy: { createdAt: 'desc' }, take: 5 },
        _count: { select: { orders: true, reviews: true } },
      },
    });
    if (!user) throw createError('User not found', 404);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/users/:id/status [ADMIN] */
export const toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Prevent admin from deactivating themselves
    if (req.params.id === req.user!.id) {
      throw createError('Cannot deactivate your own account', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) throw createError('User not found', 404);

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, isActive: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

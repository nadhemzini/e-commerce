import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../app';
import { createError } from '../middlewares/errorHandler.middleware';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  parentId: z.string().cuid().optional(),
});

/** GET /api/categories */
export const listCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
      where: { parentId: null }, // Root categories only
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

/** GET /api/categories/:slug */
export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        children: true,
        parent: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });
    if (!category) throw createError('Category not found', 404);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

/** POST /api/categories [ADMIN] */
export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/categories/:id [ADMIN] */
export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createCategorySchema.partial().parse(req.body);
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

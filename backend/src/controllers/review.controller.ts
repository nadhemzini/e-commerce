import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../app';
import { createError } from '../middlewares/errorHandler.middleware';
import { z } from 'zod';

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000).optional(),
});

/** GET /api/reviews/product/:productId */
export const getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.productId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

/** POST /api/reviews/product/:productId [AUTH] */
export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createReviewSchema.parse(req.body);
    const { productId } = req.params;
    const userId = req.user!.id;

    // Check product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw createError('Product not found', 404);

    // Create or update review (upsert)
    const review = await prisma.review.upsert({
      where: { userId_productId: { userId, productId } },
      update: data,
      create: { userId, productId, ...data },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Recalculate product average rating
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        averageRating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/reviews/:id [AUTH] */
export const deleteReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) throw createError('Review not found', 404);
    if (review.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw createError('Not authorized to delete this review', 403);
    }

    await prisma.review.delete({ where: { id: req.params.id } });

    // Recalculate average rating
    const stats = await prisma.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        averageRating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

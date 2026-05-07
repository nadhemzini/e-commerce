import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../app';
import { createError } from '../middlewares/errorHandler.middleware';
import { z } from 'zod';

const addToWishlistSchema = z.object({
  productId: z.string().cuid(),
});

/** Ensure wishlist exists for user */
const ensureWishlist = async (userId: string) => {
  return prisma.wishlist.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

/** GET /api/wishlist [AUTH] */
export const getWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: true, price: true, compareAtPrice: true, averageRating: true },
            },
          },
        },
      },
    });
    res.json({ success: true, data: wishlist || { items: [] } });
  } catch (error) {
    next(error);
  }
};

/** POST /api/wishlist [AUTH] */
export const addToWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = addToWishlistSchema.parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw createError('Product not found', 404);

    const wishlist = await ensureWishlist(req.user!.id);

    await prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
      update: {},
      create: { wishlistId: wishlist.id, productId },
    });

    res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/wishlist/:productId [AUTH] */
export const removeFromWishlist = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user!.id } });
    if (!wishlist) {
      res.json({ success: true, message: 'Product not in wishlist' });
      return;
    }

    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId: req.params.productId },
    });

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    next(error);
  }
};

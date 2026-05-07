import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../app';
import { createError } from '../middlewares/errorHandler.middleware';
import { z } from 'zod';

const addItemSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().min(1).max(99),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

/** Ensure cart exists for user. */
const ensureCart = async (userId: string) => {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
};

/** GET /api/cart [AUTH] */
export const getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: true, price: true, stock: true },
            },
            variant: { select: { id: true, options: true, price: true, stock: true } },
          },
        },
      },
    });

    if (!cart) {
      res.json({ success: true, data: { items: [], total: 0 } });
      return;
    }

    const total = cart.items.reduce((sum, item) => {
      const price = item.variant?.price ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);

    res.json({ success: true, data: { ...cart, total } });
  } catch (error) {
    next(error);
  }
};

/** POST /api/cart/items [AUTH] */
export const addItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, variantId, quantity } = addItemSchema.parse(req.body);
    const userId = req.user!.id;

    // Check product stock
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw createError('Product not found', 404);

    const cart = await ensureCart(userId);

    // Upsert cart item
    await prisma.cartItem.upsert({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null as unknown as string,
        },
      },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, variantId, quantity },
    });

    res.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/cart/items/:itemId [AUTH] */
export const updateItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = updateItemSchema.parse(req.body);
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (!cart) throw createError('Cart not found', 404);

    const item = await prisma.cartItem.findFirst({
      where: { id: req.params.itemId, cartId: cart.id },
    });
    if (!item) throw createError('Cart item not found', 404);

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
    }

    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/cart/items/:itemId [AUTH] */
export const removeItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (!cart) throw createError('Cart not found', 404);

    await prisma.cartItem.deleteMany({
      where: { id: req.params.itemId, cartId: cart.id },
    });

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/cart [AUTH] */
export const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

import { prisma } from '../app';
import { createError } from '../middlewares/errorHandler.middleware';
import { createPaymentIntent } from '../utils/stripe';
import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().length(2),
  }),
  shippingMethod: z.enum(['standard', 'express', 'overnight']).default('standard'),
  notes: z.string().optional(),
});

const SHIPPING_COSTS: Record<string, number> = {
  standard: 4.99,
  express: 9.99,
  overnight: 19.99,
};

// ─── Order Service ────────────────────────────────────────────────────────────

/** Returns all orders for a given user. */
export const getUserOrders = async (userId: string) => {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/** Returns the detail of a single order (user must own it). */
export const getOrderById = async (id: string, userId: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, images: true, slug: true } },
        },
      },
    },
  });

  if (!order) throw createError('Order not found', 404);
  if (order.userId !== userId) throw createError('Access denied', 403);

  return order;
};

/**
 * Creates a new order from the user's cart.
 * Also creates a Stripe PaymentIntent and returns the clientSecret.
 */
export const createOrder = async (
  userId: string,
  data: z.infer<typeof createOrderSchema>
) => {
  // Fetch cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, price: true, stock: true } },
          variant: { select: { id: true, price: true, stock: true } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    throw createError('Cart is empty', 400);
  }

  // Validate stock availability
  for (const item of cart.items) {
    const effectiveStock = item.variant ? item.variant.stock : item.product.stock;
    if (effectiveStock < item.quantity) {
      throw createError(
        `Insufficient stock for product: ${item.product.name}`,
        400
      );
    }
  }

  const shippingCost = SHIPPING_COSTS[data.shippingMethod];
  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);
  const total = subtotal + shippingCost;

  // Create Stripe PaymentIntent
  const paymentIntent = await createPaymentIntent(total, 'eur', {
    userId,
    orderDescription: `Order for ${cart.items.length} item(s)`,
  });

  // Create order in DB (in a transaction)
  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        userId,
        status: 'PENDING',
        subtotal,
        shippingCost,
        total,
        shippingMethod: data.shippingMethod,
        shippingAddress: data.shippingAddress,
        stripePaymentIntentId: paymentIntent.id,
        notes: data.notes,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.variant?.price ?? item.product.price,
          })),
        },
      },
      include: { items: true },
    });

    // Decrement stock
    for (const item of cart.items) {
      if (item.variantId) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
      }
    }

    // Clear the cart
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  return { order, clientSecret: paymentIntent.client_secret };
};

/**
 * Confirms an order after successful Stripe payment.
 * Called by the webhook handler.
 */
export const confirmOrder = async (stripePaymentIntentId: string) => {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId },
  });

  if (!order) return null;

  return prisma.order.update({
    where: { stripePaymentIntentId },
    data: { status: 'CONFIRMED' },
  });
};

// ─── Admin Order Operations ───────────────────────────────────────────────────

/** Returns all orders for admin view. */
export const getAllOrders = async (status?: string) => {
  return prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      items: { include: { product: { select: { name: true, images: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/** Updates the status of an order (admin only). */
export const updateOrderStatus = async (id: string, status: string) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw createError('Order not found', 404);

  return prisma.order.update({
    where: { id },
    data: { status: status as never },
  });
};

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  createOrderSchema,
  getUserOrders,
  getOrderById,
  createOrder,
  getAllOrders,
  updateOrderStatus,
} from '../services/order.service';
import { z } from 'zod';

/** GET /api/orders [AUTH] */
export const listUserOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await getUserOrders(req.user!.id);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

/** GET /api/orders/:id [AUTH] */
export const getUserOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await getOrderById(req.params.id, req.user!.id);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/** POST /api/orders [AUTH] */
export const placeOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createOrderSchema.parse(req.body);
    const result = await createOrder(req.user!.id, data);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/** GET /api/orders/admin/all [ADMIN] */
export const listAllOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const orders = await getAllOrders(status);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

/** PUT /api/orders/admin/:id/status [ADMIN] */
export const patchOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    }).parse(req.body);
    const order = await updateOrderStatus(req.params.id, status);
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

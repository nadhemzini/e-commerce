import { Router } from 'express';
import { listUserOrders, getUserOrder, placeOrder, listAllOrders, patchOrderStatus } from '../controllers/order.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', listUserOrders);
router.get('/admin/all', adminMiddleware, listAllOrders);
router.put('/admin/:id/status', adminMiddleware, patchOrderStatus);
router.get('/:id', getUserOrder);
router.post('/', placeOrder);

export default router;

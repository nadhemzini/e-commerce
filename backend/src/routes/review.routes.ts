import { Router } from 'express';
import { getProductReviews, createReview, deleteReview } from '../controllers/review.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', authMiddleware, createReview);
router.delete('/:id', authMiddleware, deleteReview);

export default router;

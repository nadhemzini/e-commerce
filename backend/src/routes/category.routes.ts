import { Router } from 'express';
import { listCategories, getCategoryBySlug, createCategory, updateCategory } from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

router.get('/', listCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', authMiddleware, adminMiddleware, createCategory);
router.put('/:id', authMiddleware, adminMiddleware, updateCategory);

export default router;

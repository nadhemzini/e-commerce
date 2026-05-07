import { Router } from 'express';
import multer from 'multer';
import {
  listProducts, autocomplete, getProduct, getRelated,
  createNewProduct, updateExistingProduct, deleteExistingProduct, uploadProductImages,
} from '../controllers/product.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', listProducts);
router.get('/search/autocomplete', autocomplete);
router.get('/:id', getProduct);
router.get('/:id/related', getRelated);
router.post('/', authMiddleware, adminMiddleware, createNewProduct);
router.put('/:id', authMiddleware, adminMiddleware, updateExistingProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteExistingProduct);
router.post('/:id/images', authMiddleware, adminMiddleware, upload.array('images', 5), uploadProductImages);

export default router;

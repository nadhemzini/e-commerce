import { Router } from 'express';
import { listUsers, getUserDetail, toggleUserStatus } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

router.use(authMiddleware, adminMiddleware);
router.get('/', listUsers);
router.get('/:id', getUserDetail);
router.put('/:id/status', toggleUserStatus);

export default router;

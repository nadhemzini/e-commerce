import { Router } from 'express';
import { stripeWebhook } from '../controllers/payment.controller';

const router = Router();

// /api/payments/webhook — raw body is set in app.ts for this route
router.post('/webhook', stripeWebhook);

export default router;

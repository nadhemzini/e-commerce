import { Request, Response, NextFunction } from 'express';
import { constructStripeEvent } from '../utils/stripe';
import { confirmOrder } from '../services/order.service';
import { logger } from '../middlewares/requestLogger.middleware';

/** POST /api/payments/webhook */
export const stripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({ success: false, message: 'Missing stripe signature' });
      return;
    }

    // req.body is raw Buffer here (set in app.ts for this route)
    const event = constructStripeEvent(req.body as Buffer, signature);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await confirmOrder(paymentIntent.id);
        logger.info(`Payment succeeded for PaymentIntent: ${paymentIntent.id}`);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        logger.warn(`Payment failed for PaymentIntent: ${paymentIntent.id}`);
        // Could trigger email notification here
        break;
      }
      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    // Always respond 200 to acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook error:', error);
    next(error);
  }
};

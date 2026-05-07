import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

/** Stripe client singleton configured for test mode. */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * Creates a Stripe PaymentIntent for the given amount (in cents).
 */
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'eur',
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent> => {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    automatic_payment_methods: { enabled: true },
    metadata,
  });
};

/**
 * Verifies a Stripe webhook signature and returns the event.
 * Throws if the signature is invalid.
 */
export const constructStripeEvent = (
  payload: Buffer | string,
  signature: string
): Stripe.Event => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
};

export type { Stripe };

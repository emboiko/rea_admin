import Stripe from 'stripe';
import { HttpError } from '@/server/lib/http';

let stripeClient;

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, 'Card payments are not configured yet.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

export const stripeAdapter = {
  isConfigured: () => {
    return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  },
  createCheckoutSession: async ({ amountCents, householdId, receiptSecret, appUrl }) => {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded_page',
      mode: 'payment',
      client_reference_id: String(householdId),
      return_url: `${appUrl}/pay/receipt/${receiptSecret}?session_id={CHECKOUT_SESSION_ID}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: {
              name: 'Redfield Estates dues',
            },
          },
        },
      ],
      metadata: {
        householdId: String(householdId),
        receiptSecret,
        amountCents: String(amountCents),
      },
    });
    if (!session.client_secret) {
      throw new HttpError(502, 'Stripe did not return a payment form.');
    }
    return {
      id: session.id,
      clientSecret: session.client_secret,
    };
  },
  constructWebhookEvent: (rawBody, signature) => {
    const stripe = getStripe();
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new HttpError(500, 'STRIPE_WEBHOOK_SECRET is not configured.');
    }
    if (!signature) {
      throw new HttpError(400, 'Missing Stripe signature.');
    }
    try {
      return stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch {
      throw new HttpError(400, 'Stripe signature could not be verified.');
    }
  },
};

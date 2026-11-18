import { handleRoute } from '@/server/lib/http';
import { applyStripeEvent } from '@/server/lib/statements/checkout';
import { stripeAdapter } from '@/server/services/stripe/stripeAdapter';

export const POST = handleRoute(async (request) => {
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  const event = stripeAdapter.constructWebhookEvent(rawBody, signature);
  await applyStripeEvent(event);
  return Response.json({ received: true });
});

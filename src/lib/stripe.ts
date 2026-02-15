import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28' as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return _stripe;
}

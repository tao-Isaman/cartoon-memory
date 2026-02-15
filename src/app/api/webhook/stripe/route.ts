import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { addCredits } from '@/lib/credits';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type === 'credits' && session.payment_status === 'paid') {
      const supabase = getSupabaseServiceClient();
      try {
        await addCredits(
          supabase,
          session.metadata.user_id,
          parseInt(session.metadata.credits),
          session.metadata.package_id,
          session.id,
          session.payment_intent as string
        );
      } catch (err) {
        console.error('Failed to add credits:', err);
      }
    }
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.error('Async payment failed for session:', session.id);
  }

  return NextResponse.json({ received: true });
}

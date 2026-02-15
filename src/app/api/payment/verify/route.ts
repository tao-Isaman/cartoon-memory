import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSupabaseRouteClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { addCredits } from '@/lib/credits';

export async function POST(request: Request) {
  const { sessionId, type } = await request.json();

  if (!sessionId || type !== 'credits') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        status: session.payment_status,
      });
    }

    if (session.metadata?.type === 'credits') {
      const serviceClient = getSupabaseServiceClient();
      const result = await addCredits(
        serviceClient,
        session.metadata.user_id,
        parseInt(session.metadata.credits),
        session.metadata.package_id,
        session.id,
        session.payment_intent as string
      );

      return NextResponse.json({
        success: true,
        credits: parseInt(session.metadata.credits),
        newBalance: result.newBalance,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown type' });
  } catch (err) {
    console.error('Payment verification error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

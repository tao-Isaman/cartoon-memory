import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getPackageById } from '@/lib/credits';
import { getSupabaseRouteClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const { packageId, userId } = await request.json();

  if (!packageId || !userId) {
    return NextResponse.json({ error: 'packageId and userId required' }, { status: 400 });
  }

  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get package
  const serviceClient = getSupabaseServiceClient();
  const pkg = await getPackageById(serviceClient, packageId);
  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const session = await getStripe().checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'thb',
          product_data: {
            name: pkg.name,
            description: `${pkg.credits} เครดิตสำหรับสร้างรูปการ์ตูน`,
          },
          unit_amount: pkg.priceSatang,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    payment_method_types: ['card', 'promptpay'],
    metadata: {
      type: 'credits',
      package_id: packageId,
      user_id: userId,
      credits: pkg.credits.toString(),
    },
    success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=credits`,
    cancel_url: `${appUrl}/payment/cancel`,
  });

  return NextResponse.json({ url: session.url });
}

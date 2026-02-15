import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase-server';
import { getUserCreditBalance } from '@/lib/credits';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const balance = await getUserCreditBalance(supabase, userId);
  return NextResponse.json({ balance });
}

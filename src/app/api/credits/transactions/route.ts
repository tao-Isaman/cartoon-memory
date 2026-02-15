import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase-server';
import { getCreditTransactions } from '@/lib/credits';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await getCreditTransactions(supabase, userId, limit, offset);
  return NextResponse.json(result);
}

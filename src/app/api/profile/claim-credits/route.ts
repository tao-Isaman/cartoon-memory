import { NextResponse } from 'next/server';
import { getSupabaseRouteClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { grantProfileCredits } from '@/lib/profile';

export async function POST(request: Request) {
  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service client for cross-table operations
  const serviceClient = getSupabaseServiceClient();
  const result = await grantProfileCredits(serviceClient, userId);

  return NextResponse.json(result);
}

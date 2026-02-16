import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase-server';
import { isAdminEmail } from '@/lib/admin';

export async function GET() {
  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ isAdmin: false });
  }
  return NextResponse.json({ isAdmin: isAdminEmail(user.email) });
}

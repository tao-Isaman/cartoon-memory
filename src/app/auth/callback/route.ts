import { NextResponse } from 'next/server';
import { getSupabaseRouteClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await getSupabaseRouteClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const userId = data.session.user.id;

      // Check if user has a profile
      const serviceClient = getSupabaseServiceClient();
      const { data: profile } = await serviceClient
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!profile) {
        return NextResponse.redirect(new URL('/onboarding', origin));
      }

      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', request.url));
}

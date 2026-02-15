import { NextResponse } from 'next/server';
import { getSupabaseRouteClient } from '@/lib/supabase-server';
import { getUserProfile, upsertUserProfile, isProfileComplete } from '@/lib/profile';

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

  const profile = await getUserProfile(supabase, userId);
  return NextResponse.json({
    profile,
    isComplete: isProfileComplete(profile),
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, ...profileData } = body;

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await upsertUserProfile(supabase, userId, profileData);
  if (!profile) {
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }

  return NextResponse.json({
    profile,
    isComplete: isProfileComplete(profile),
  });
}

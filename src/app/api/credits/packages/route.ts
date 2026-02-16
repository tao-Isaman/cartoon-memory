import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getActivePackages } from '@/lib/credits';

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const packages = await getActivePackages(supabase);
  return NextResponse.json({ packages }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}

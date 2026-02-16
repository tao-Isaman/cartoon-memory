import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getSupabaseServiceClient();

  const [usersResult, generationsResult, creditsResult, templateUsageResult] = await Promise.all([
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('cartoon_generations').select('id', { count: 'exact', head: true }),
    supabase.from('user_credits').select('total_used'),
    supabase.from('cartoon_generations')
      .select('template_name')
      .eq('status', 'completed'),
  ]);

  const totalUsers = usersResult.count ?? 0;
  const totalGenerations = generationsResult.count ?? 0;
  const totalCreditsUsed = (creditsResult.data ?? []).reduce((sum, row) => sum + (row.total_used ?? 0), 0);

  const templateCounts: Record<string, number> = {};
  (templateUsageResult.data ?? []).forEach(row => {
    const name = row.template_name ?? 'unknown';
    templateCounts[name] = (templateCounts[name] ?? 0) + 1;
  });

  return NextResponse.json({
    totalUsers,
    totalGenerations,
    totalCreditsUsed,
    templateUsage: templateCounts,
  });
}

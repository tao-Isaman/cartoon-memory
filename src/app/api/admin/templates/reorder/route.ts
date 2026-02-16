import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function PUT(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { order } = await request.json();

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: 'order must be an array' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const updates = order.map(({ id, sort_order }: { id: string; sort_order: number }) =>
    supabase.from('templates').update({ sort_order }).eq('id', id)
  );

  await Promise.all(updates);

  return NextResponse.json({ success: true });
}

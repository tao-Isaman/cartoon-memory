import { NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('templates')
    .select('id, slug, name, image_url, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const templates = (data ?? []).map(t => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    imageUrl: t.image_url,
    sortOrder: t.sort_order,
  }));

  return NextResponse.json({ templates });
}

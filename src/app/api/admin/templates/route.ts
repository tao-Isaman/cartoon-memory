import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data });
}

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { slug, name, filename, storage_path, image_url } = body;

  if (!slug || !name || !filename || !storage_path || !image_url) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  const { data: maxRow } = await supabase
    .from('templates')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from('templates')
    .insert({ slug, name, filename, storage_path, image_url, sort_order: nextOrder })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

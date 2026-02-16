import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const slug = formData.get('slug') as string | null;

  if (!file || !slug) {
    return NextResponse.json({ error: 'file and slug required' }, { status: 400 });
  }

  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `templates/${slug}.${ext}`;

  const supabase = getSupabaseServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from('templates')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from('templates')
    .getPublicUrl(storagePath);

  return NextResponse.json({
    storagePath,
    imageUrl: urlData.publicUrl,
    filename: `${slug}.${ext}`,
  });
}

import { NextResponse } from 'next/server';
import { getSupabaseRouteClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const { generationId } = await request.json();

  if (!generationId) {
    return NextResponse.json({ error: 'generationId required' }, { status: 400 });
  }

  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceClient = getSupabaseServiceClient();

  // Get generation record (verify ownership)
  const { data: generation } = await serviceClient
    .from('cartoon_generations')
    .select('*')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single();

  if (!generation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete storage files
  if (generation.original_image_url) {
    const originalPath = extractStoragePath(generation.original_image_url);
    if (originalPath) {
      await serviceClient.storage.from('cartoon-images').remove([originalPath]);
    }
  }

  if (generation.cartoon_image_url) {
    const resultPath = extractStoragePath(generation.cartoon_image_url);
    if (resultPath) {
      await serviceClient.storage.from('cartoon-images').remove([resultPath]);
    }
  }

  // Delete DB record
  await serviceClient
    .from('cartoon_generations')
    .delete()
    .eq('id', generationId);

  return NextResponse.json({ success: true });
}

function extractStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/cartoon-images\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

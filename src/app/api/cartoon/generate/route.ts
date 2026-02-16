import { NextResponse } from 'next/server';
import { getSupabaseRouteClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { deductCreditsForCartoon, refundCreditsForCartoon, saveCartoonGeneration } from '@/lib/cartoon';
import { getUserCreditBalance } from '@/lib/credits';
import { generateCartoonImage } from '@/lib/openai';

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const serviceClient = getSupabaseServiceClient();

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const templateId = formData.get('templateId') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Resolve template from DB
  let templateQuery = serviceClient
    .from('templates')
    .select('id, slug, name, filename, image_url, prompt')
    .eq('is_active', true);

  if (templateId) {
    templateQuery = templateQuery.eq('id', templateId);
  } else {
    templateQuery = templateQuery.order('sort_order', { ascending: true }).limit(1);
  }

  const { data: templateRow } = await templateQuery.single();

  if (!templateRow) {
    return NextResponse.json({ error: 'No template available' }, { status: 400 });
  }

  // Validate file
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'ไฟล์ต้องมีขนาดไม่เกิน 10MB' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ JPG, PNG, WebP' }, { status: 400 });
  }

  // Deduct credits
  const deductResult = await deductCreditsForCartoon(serviceClient, userId);
  if (!deductResult.success) {
    const balance = await getUserCreditBalance(serviceClient, userId);
    return NextResponse.json(
      { error: deductResult.error, balance },
      { status: 400 }
    );
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const userImageBuffer = Buffer.from(arrayBuffer);

    // Generate cartoon
    const b64Result = await generateCartoonImage(userImageBuffer, templateRow.image_url, templateRow.filename, templateRow.prompt);

    // Upload original
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const originalPath = `originals/${userId}/${timestamp}-${random}.webp`;

    await serviceClient.storage
      .from('cartoon-images')
      .upload(originalPath, userImageBuffer, {
        contentType: file.type,
      });

    const { data: originalUrlData } = serviceClient.storage
      .from('cartoon-images')
      .getPublicUrl(originalPath);

    // Upload result
    const resultBuffer = Buffer.from(b64Result, 'base64');
    const resultPath = `results/${userId}/${timestamp}-${random}.png`;

    await serviceClient.storage
      .from('cartoon-images')
      .upload(resultPath, resultBuffer, {
        contentType: 'image/png',
      });

    const { data: resultUrlData } = serviceClient.storage
      .from('cartoon-images')
      .getPublicUrl(resultPath);

    // Save generation record
    const generation = await saveCartoonGeneration(serviceClient, {
      userId,
      originalImageUrl: originalUrlData.publicUrl,
      cartoonImageUrl: resultUrlData.publicUrl,
      prompt: 'Cartoon style transfer',
      templateName: templateRow.slug,
      status: 'completed',
    });

    return NextResponse.json({
      success: true,
      generation,
      newBalance: deductResult.newBalance,
    });
  } catch (err) {
    console.error('Cartoon generation failed:', err);

    // Refund credits
    await refundCreditsForCartoon(serviceClient, userId);

    // Save failed record
    await saveCartoonGeneration(serviceClient, {
      userId,
      status: 'failed',
    });

    const balance = await getUserCreditBalance(serviceClient, userId);

    return NextResponse.json(
      { error: 'การสร้างรูปการ์ตูนล้มเหลว กรุณาลองอีกครั้ง', refunded: true, balance },
      { status: 500 }
    );
  }
}

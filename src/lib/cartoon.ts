import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { CartoonGeneration } from '@/types/cartoon';
import { CARTOON_CREDIT_COST } from './constants';
import { getUserCreditBalance, ensureUserCreditsRow } from './credits';

type GenRow = Database['public']['Tables']['cartoon_generations']['Row'];

function mapGenRow(row: GenRow): CartoonGeneration {
  return {
    id: row.id,
    userId: row.user_id,
    originalImageUrl: row.original_image_url,
    cartoonImageUrl: row.cartoon_image_url,
    creditsUsed: row.credits_used,
    prompt: row.prompt,
    templateName: row.template_name,
    status: row.status as CartoonGeneration['status'],
    createdAt: row.created_at,
  };
}

export async function deductCreditsForCartoon(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  await ensureUserCreditsRow(supabase, userId);

  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance, total_used')
    .eq('user_id', userId)
    .single();

  const currentBalance = credits?.balance ?? 0;
  const currentTotalUsed = credits?.total_used ?? 0;

  if (currentBalance < CARTOON_CREDIT_COST) {
    return { success: false, error: 'insufficient_credits' };
  }

  const newBalance = currentBalance - CARTOON_CREDIT_COST;
  const newTotalUsed = currentTotalUsed + CARTOON_CREDIT_COST;

  // Optimistic lock: WHERE balance = currentBalance
  const { data: updated, error } = await supabase
    .from('user_credits')
    .update({ balance: newBalance, total_used: newTotalUsed })
    .eq('user_id', userId)
    .eq('balance', currentBalance)
    .select()
    .single();

  if (error || !updated) {
    return { success: false, error: 'concurrent_modification' };
  }

  // Record transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'use',
    amount: -CARTOON_CREDIT_COST,
    balance_after: newBalance,
    description: 'สร้างรูปการ์ตูน',
  });

  return { success: true, newBalance };
}

export async function refundCreditsForCartoon(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance, total_used')
    .eq('user_id', userId)
    .single();

  const currentBalance = credits?.balance ?? 0;
  const currentTotalUsed = credits?.total_used ?? 0;
  const newBalance = currentBalance + CARTOON_CREDIT_COST;
  const newTotalUsed = Math.max(0, currentTotalUsed - CARTOON_CREDIT_COST);

  await supabase
    .from('user_credits')
    .update({ balance: newBalance, total_used: newTotalUsed })
    .eq('user_id', userId);

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'refund',
    amount: CARTOON_CREDIT_COST,
    balance_after: newBalance,
    description: 'คืนเครดิต - สร้างรูปไม่สำเร็จ',
  });
}

export async function saveCartoonGeneration(
  supabase: SupabaseClient<Database>,
  data: {
    userId: string;
    originalImageUrl?: string | null;
    cartoonImageUrl?: string | null;
    creditsUsed?: number;
    prompt?: string | null;
    templateName?: string | null;
    status: 'pending' | 'completed' | 'failed';
  }
): Promise<CartoonGeneration | null> {
  const { data: result, error } = await supabase
    .from('cartoon_generations')
    .insert({
      user_id: data.userId,
      original_image_url: data.originalImageUrl ?? null,
      cartoon_image_url: data.cartoonImageUrl ?? null,
      credits_used: data.creditsUsed ?? CARTOON_CREDIT_COST,
      prompt: data.prompt ?? null,
      template_name: data.templateName ?? null,
      status: data.status,
    })
    .select()
    .single();

  if (error || !result) return null;
  return mapGenRow(result);
}

export async function getUserCartoonGenerations(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 9,
  offset: number = 0
): Promise<{ generations: CartoonGeneration[]; total: number }> {
  const { data, error, count } = await supabase
    .from('cartoon_generations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return { generations: [], total: 0 };
  return {
    generations: data.map(mapGenRow),
    total: count ?? 0,
  };
}

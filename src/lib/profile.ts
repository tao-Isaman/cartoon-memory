import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { UserProfile } from '@/types/profile';
import { PROFILE_COMPLETION_CREDITS } from './constants';

type DbRow = Database['public']['Tables']['user_profiles']['Row'];

function mapRowToProfile(row: DbRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    phone: row.phone,
    birthday: row.birthday,
    gender: row.gender as UserProfile['gender'],
    job: row.job,
    relationshipStatus: row.relationship_status as UserProfile['relationshipStatus'],
    occasionType: row.occasion_type as UserProfile['occasionType'],
    profileCreditsClaimed: row.profile_credits_claimed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return mapRowToProfile(data);
}

export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(
    profile.phone &&
    profile.birthday &&
    profile.gender &&
    profile.job &&
    profile.relationshipStatus &&
    profile.occasionType
  );
}

export async function upsertUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: {
    phone?: string | null;
    birthday?: string | null;
    gender?: string | null;
    job?: string | null;
    relationshipStatus?: string | null;
    occasionType?: string | null;
  }
): Promise<UserProfile | null> {
  const { data: result, error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        phone: data.phone,
        birthday: data.birthday,
        gender: data.gender,
        job: data.job,
        relationship_status: data.relationshipStatus,
        occasion_type: data.occasionType,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error || !result) return null;
  return mapRowToProfile(result);
}

export async function grantProfileCredits(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{
  success: boolean;
  alreadyClaimed?: boolean;
  newBalance?: number;
  error?: string;
}> {
  // Optimistic lock: only update if not already claimed
  const { data: updated, error: updateError } = await supabase
    .from('user_profiles')
    .update({ profile_credits_claimed: true })
    .eq('user_id', userId)
    .eq('profile_credits_claimed', false)
    .select()
    .single();

  if (updateError || !updated) {
    return { success: true, alreadyClaimed: true };
  }

  // Get current balance
  const { data: credits } = await supabase
    .from('user_credits')
    .select('balance, total_used')
    .eq('user_id', userId)
    .single();

  const currentBalance = credits?.balance ?? 0;
  const newBalance = currentBalance + PROFILE_COMPLETION_CREDITS;

  // Ensure user_credits row exists and update balance
  if (!credits) {
    await supabase.from('user_credits').insert({
      user_id: userId,
      balance: PROFILE_COMPLETION_CREDITS,
      total_used: 0,
    });
  } else {
    await supabase
      .from('user_credits')
      .update({ balance: newBalance })
      .eq('user_id', userId);
  }

  // Record transaction
  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'purchase',
    amount: PROFILE_COMPLETION_CREDITS,
    balance_after: newBalance,
    description: 'โบนัสกรอกโปรไฟล์ครบ',
  });

  return { success: true, newBalance };
}

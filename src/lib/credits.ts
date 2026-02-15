import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { CreditPackage, CreditTransaction } from '@/types/credits';

type PkgRow = Database['public']['Tables']['credit_packages']['Row'];
type TxRow = Database['public']['Tables']['credit_transactions']['Row'];

function mapPkgRow(row: PkgRow): CreditPackage {
  return {
    id: row.id,
    name: row.name,
    credits: row.credits,
    priceTHB: row.price_thb,
    priceSatang: row.price_satang,
    discountPercent: row.discount_percent,
    isPopular: row.is_popular,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTxRow(row: TxRow): CreditTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as CreditTransaction['type'],
    amount: row.amount,
    balanceAfter: row.balance_after,
    packageId: row.package_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    memoryId: row.memory_id,
    description: row.description,
    createdAt: row.created_at,
  };
}

export async function getActivePackages(
  supabase: SupabaseClient<Database>
): Promise<CreditPackage[]> {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data) return [];
  return data.map(mapPkgRow);
}

export async function getPackageById(
  supabase: SupabaseClient<Database>,
  packageId: string
): Promise<CreditPackage | null> {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', packageId)
    .single();

  if (error || !data) return null;
  return mapPkgRow(data);
}

export async function getUserCreditBalance(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from('user_credits')
    .select('balance')
    .eq('user_id', userId)
    .single();

  return data?.balance ?? 0;
}

export async function ensureUserCreditsRow(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  await supabase
    .from('user_credits')
    .upsert(
      { user_id: userId, balance: 0, total_used: 0 },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
}

export async function addCredits(
  supabase: SupabaseClient<Database>,
  userId: string,
  credits: number,
  packageId: string,
  stripeSessionId: string,
  stripePaymentIntentId: string
): Promise<{ success: boolean; newBalance: number }> {
  // Idempotency check
  const { data: existingTx } = await supabase
    .from('credit_transactions')
    .select('id')
    .eq('stripe_checkout_session_id', stripeSessionId)
    .limit(1);

  const currentBalance = await getUserCreditBalance(supabase, userId);

  if (existingTx && existingTx.length > 0) {
    return { success: true, newBalance: currentBalance };
  }

  await ensureUserCreditsRow(supabase, userId);

  const newBalance = currentBalance + credits;

  await supabase
    .from('user_credits')
    .update({ balance: newBalance })
    .eq('user_id', userId);

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'purchase',
    amount: credits,
    balance_after: newBalance,
    package_id: packageId,
    stripe_checkout_session_id: stripeSessionId,
    stripe_payment_intent_id: stripePaymentIntentId,
    description: `ซื้อ ${credits} เครดิต`,
  });

  return { success: true, newBalance };
}

export async function getCreditTransactions(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ transactions: CreditTransaction[]; total: number }> {
  const { data, error, count } = await supabase
    .from('credit_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return { transactions: [], total: 0 };
  return {
    transactions: data.map(mapTxRow),
    total: count ?? 0,
  };
}

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { ensureUserCreditsRow, getUserCreditBalance } from '@/lib/credits';

export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { email, amount, description } = body as {
    email?: string;
    amount?: number;
    description?: string;
  };

  if (!email || !amount || amount <= 0) {
    return NextResponse.json({ error: 'email and positive amount required' }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();

  // Find user by email
  let userId: string | null = null;
  let page = 1;
  while (!userId) {
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });
    if (listError || !listData?.users?.length) break;

    const found = listData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (found) {
      userId = found.id;
      break;
    }
    if (listData.users.length < 100) break;
    page++;
  }

  if (!userId) {
    return NextResponse.json({ error: 'ไม่พบผู้ใช้ที่มีอีเมลนี้' }, { status: 404 });
  }

  await ensureUserCreditsRow(supabase, userId);

  const currentBalance = await getUserCreditBalance(supabase, userId);
  const newBalance = currentBalance + amount;

  await supabase
    .from('user_credits')
    .update({ balance: newBalance })
    .eq('user_id', userId);

  await supabase.from('credit_transactions').insert({
    user_id: userId,
    type: 'purchase',
    amount,
    balance_after: newBalance,
    description: description || `แอดมินเพิ่มเครดิต ${amount}`,
  });

  return NextResponse.json({
    success: true,
    userId,
    email,
    previousBalance: currentBalance,
    newBalance,
  });
}

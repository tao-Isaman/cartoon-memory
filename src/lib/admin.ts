import { getSupabaseRouteClient } from '@/lib/supabase-server';

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export async function getAdminUser() {
  const supabase = await getSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  if (!isAdminEmail(user.email)) return null;
  return user;
}

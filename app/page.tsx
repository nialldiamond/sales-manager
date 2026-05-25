import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Check if profile exists
  const { data: profile } = await supabase
    .from('account_manager_profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/settings');

  redirect('/dashboard');
}

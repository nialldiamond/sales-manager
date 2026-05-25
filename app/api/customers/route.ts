import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { listCustomers } from '@/lib/evox';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const account_manager = sp.get('account_manager');
  const from_id = sp.get('from_id');
  const company = sp.get('company');
  const limit = sp.get('limit');

  try {
    const data = await listCustomers({
      account_manager: account_manager ? Number(account_manager) : undefined,
      from_id: from_id ? Number(from_id) : undefined,
      company: company ?? undefined,
      limit: limit ? Number(limit) : 50,
    });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
